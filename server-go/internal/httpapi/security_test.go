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

func testServer(t *testing.T) (*httptest.Server, *db.DB) {
	t.Helper()
	dir := t.TempDir()
	public := filepath.Join(dir, "public")
	if err := os.MkdirAll(filepath.Join(public, "assets"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(public, "index.html"), []byte("<html>spa-index</html>"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(public, "assets", "app.js"), []byte("console.log('bundle')"), 0644); err != nil {
		t.Fatal(err)
	}
	uploads := filepath.Join(dir, "uploads")
	apks := filepath.Join(dir, "apks")
	if err := os.MkdirAll(uploads, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(apks, 0755); err != nil {
		t.Fatal(err)
	}
	database, err := db.Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { database.Close() })
	cfg := &config.Config{
		JWTSecret:  "test-jwt-secret",
		PublicDir:  public,
		UploadsDir: uploads,
		APKsDir:    apks,
		DataDir:    dir,
		DBPath:     filepath.Join(dir, "test.db"),
	}
	return httptest.NewServer(NewRouter(cfg, database)), database
}

func register(t *testing.T, srv *httptest.Server, username string) (token, userID string) {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"username": username, "password": "secret"})
	res, err := http.Post(srv.URL+"/api/auth/register", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != 201 {
		raw, _ := io.ReadAll(res.Body)
		t.Fatalf("register %s: %d %s", username, res.StatusCode, raw)
	}
	var out struct {
		Token string `json:"token"`
		User  struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	return out.Token, out.User.ID
}

func doJSON(t *testing.T, method, url, token string, payload any) *http.Response {
	t.Helper()
	var body io.Reader
	if payload != nil {
		raw, err := json.Marshal(payload)
		if err != nil {
			t.Fatal(err)
		}
		body = bytes.NewReader(raw)
	}
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return res
}

func decodeJSON(t *testing.T, res *http.Response, dest any) {
	t.Helper()
	defer res.Body.Close()
	if err := json.NewDecoder(res.Body).Decode(dest); err != nil {
		t.Fatal(err)
	}
}

func createVehicle(t *testing.T, srv *httptest.Server, token string) string {
	t.Helper()
	res := doJSON(t, http.MethodPost, srv.URL+"/api/vehicles", token, map[string]any{
		"name": "Civic", "make": "Honda", "model": "Civic", "year": 2020,
	})
	var veh map[string]any
	decodeJSON(t, res, &veh)
	if res.StatusCode != 201 {
		t.Fatalf("create vehicle: %d %#v", res.StatusCode, veh)
	}
	return text(veh["id"])
}

func TestServePublicAssetsNotIndexHTML(t *testing.T) {
	srv, _ := testServer(t)
	defer srv.Close()

	res, err := http.Get(srv.URL + "/assets/app.js")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 {
		t.Fatalf("status %d", res.StatusCode)
	}
	if !strings.Contains(string(raw), "console.log('bundle')") {
		t.Fatalf("expected JS bundle, got %q", raw)
	}
	if strings.Contains(string(raw), "spa-index") {
		t.Fatal("JS URL was served as index.html")
	}

	res, err = http.Get(srv.URL + "/missing-route")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	raw, _ = io.ReadAll(res.Body)
	if !strings.Contains(string(raw), "spa-index") {
		t.Fatalf("SPA fallback should serve index.html, got %q", raw)
	}
}

func TestUnauthenticatedDataRoutesRejected(t *testing.T) {
	srv, _ := testServer(t)
	defer srv.Close()

	cases := []struct{ method, path string }{
		{http.MethodGet, "/api/vehicles"},
		{http.MethodPost, "/api/vehicles"},
		{http.MethodGet, "/api/stats/export"},
		{http.MethodPost, "/api/upload"},
		{http.MethodDelete, "/api/vehicles/veh_does_not_exist"},
	}
	for _, c := range cases {
		res := doJSON(t, c.method, srv.URL+c.path, "", map[string]any{"name": "x"})
		res.Body.Close()
		if res.StatusCode != http.StatusUnauthorized {
			t.Fatalf("%s %s: got %d, want 401", c.method, c.path, res.StatusCode)
		}
	}

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, _ := w.CreateFormFile("apk", "evil.apk")
	_, _ = part.Write([]byte("not-an-apk"))
	_ = w.WriteField("version", "9.9.9")
	_ = w.WriteField("version_code", "99999")
	w.Close()
	req, _ := http.NewRequest(http.MethodPost, srv.URL+"/api/app/upload-release", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauthenticated APK upload: got %d, want 401", res.StatusCode)
	}
}

func TestVehicleIsolationAndScopedExport(t *testing.T) {
	srv, _ := testServer(t)
	defer srv.Close()

	tokenA, _ := register(t, srv, "alice")
	tokenB, _ := register(t, srv, "bob")
	aliceVeh := createVehicle(t, srv, tokenA)
	bobVeh := createVehicle(t, srv, tokenB)

	res := doJSON(t, http.MethodGet, srv.URL+"/api/vehicles/"+aliceVeh, tokenB, nil)
	res.Body.Close()
	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("bob GET alice vehicle: got %d, want 404", res.StatusCode)
	}

	res = doJSON(t, http.MethodDelete, srv.URL+"/api/vehicles/"+aliceVeh, tokenB, nil)
	res.Body.Close()
	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("bob DELETE alice vehicle: got %d, want 404", res.StatusCode)
	}

	res = doJSON(t, http.MethodGet, srv.URL+"/api/stats/export", tokenB, nil)
	var exported map[string]any
	decodeJSON(t, res, &exported)
	if res.StatusCode != 200 {
		t.Fatalf("export status %d", res.StatusCode)
	}
	vehicles, _ := exported["vehicles"].([]any)
	for _, v := range vehicles {
		m := v.(map[string]any)
		if text(m["id"]) == aliceVeh {
			t.Fatal("export leaked another user's vehicle")
		}
	}
	if len(vehicles) != 1 || text(vehicles[0].(map[string]any)["id"]) != bobVeh {
		t.Fatalf("bob export vehicles = %#v", vehicles)
	}

	res = doJSON(t, http.MethodGet, srv.URL+"/api/vehicles/"+aliceVeh, tokenA, nil)
	res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatalf("alice should still own her vehicle, got %d", res.StatusCode)
	}
}

func TestHealthAndAuthStayPublic(t *testing.T) {
	srv, _ := testServer(t)
	defer srv.Close()
	res, err := http.Get(srv.URL + "/api/health")
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatalf("health: %d", res.StatusCode)
	}
	res, err = http.Get(srv.URL + "/api/app/version")
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatalf("app version: %d", res.StatusCode)
	}
}
