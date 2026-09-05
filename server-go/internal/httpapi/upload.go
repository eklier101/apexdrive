package httpapi

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

var cleanImage = regexp.MustCompile(`[^a-zA-Z0-9_-]`)

var allowedImageExts = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

func (a *API) uploadRoutes(r chi.Router) {
	r.Post("/upload", a.uploadImage)
}

func (a *API) uploadImage(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 25<<20)
	if err := r.ParseMultipartForm(25 << 20); err != nil {
		writeError(w, 400, err)
		return
	}
	src, h, err := r.FormFile("file")
	if err != nil {
		writeError(w, 400, "No image file uploaded")
		return
	}
	defer src.Close()

	claimed := strings.ToLower(filepath.Ext(h.Filename))
	if claimed != "" && !allowedImageExts[claimed] {
		writeError(w, 400, "Only JPEG, PNG, GIF, and WebP images are allowed")
		return
	}

	ext, body, err := sniffImage(src)
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if claimed != "" && !imageExtCompatible(claimed, ext) {
		writeError(w, 400, "File content does not match the image extension")
		return
	}

	stem := h.Filename
	if claimed != "" {
		stem = h.Filename[:len(h.Filename)-len(filepath.Ext(h.Filename))]
	}
	base := cleanImage.ReplaceAllString(stem, "_")
	if base == "" {
		base = "upload"
	}
	name := fmt.Sprintf("img_%d_%s%s", time.Now().UnixMilli(), base, ext)
	dstPath := filepath.Join(a.cfg.UploadsDir, name)
	if err := os.MkdirAll(a.cfg.UploadsDir, 0755); err != nil {
		writeError(w, 500, err)
		return
	}
	dst, err := os.Create(dstPath)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	size, copyErr := io.Copy(dst, body)
	closeErr := dst.Close()
	if copyErr != nil || closeErr != nil {
		_ = os.Remove(dstPath)
		if copyErr != nil {
			writeError(w, 500, copyErr)
		} else {
			writeError(w, 500, closeErr)
		}
		return
	}
	writeJSON(w, 200, map[string]any{"url": "/uploads/" + name, "filename": name, "size": size})
}

func (a *API) serveUpload(w http.ResponseWriter, r *http.Request) {
	name := filepath.Base(chi.URLParam(r, "*"))
	if name == "." || name == "/" || name == "" || strings.Contains(name, "..") {
		http.NotFound(w, r)
		return
	}
	if !allowedImageExts[strings.ToLower(filepath.Ext(name))] {
		http.NotFound(w, r)
		return
	}
	path := filepath.Join(a.cfg.UploadsDir, name)
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, path)
}

func imageExtCompatible(claimed, sniffed string) bool {
	if claimed == sniffed {
		return true
	}
	return (claimed == ".jpg" && sniffed == ".jpeg") || (claimed == ".jpeg" && sniffed == ".jpg")
}

func sniffImage(r io.Reader) (string, io.Reader, error) {
	head := make([]byte, 12)
	n, err := io.ReadFull(r, head)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return "", nil, err
	}
	head = head[:n]
	ext := imageExtFromMagic(head)
	if ext == "" {
		return "", nil, fmt.Errorf("file is not a JPEG, PNG, GIF, or WebP image")
	}
	return ext, io.MultiReader(bytes.NewReader(head), r), nil
}

func imageExtFromMagic(b []byte) string {
	if len(b) >= 3 && b[0] == 0xff && b[1] == 0xd8 && b[2] == 0xff {
		return ".jpg"
	}
	if len(b) >= 8 && bytes.Equal(b[:8], []byte{0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a}) {
		return ".png"
	}
	if bytes.HasPrefix(b, []byte("GIF87a")) || bytes.HasPrefix(b, []byte("GIF89a")) {
		return ".gif"
	}
	if len(b) >= 12 && bytes.Equal(b[:4], []byte("RIFF")) && bytes.Equal(b[8:12], []byte("WEBP")) {
		return ".webp"
	}
	return ""
}
