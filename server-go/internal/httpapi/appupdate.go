package httpapi

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/eklier101/apexdrive/internal/apkembed"
	"github.com/eklier101/apexdrive/internal/db"
	"github.com/go-chi/chi/v5"
)

func (a *API) appUpdateRoutes(r chi.Router) {
	r.Route("/app", func(r chi.Router) {
		r.Get("/version", a.appVersion)
		r.Get("/releases", a.releases)
		r.Get("/download-latest", a.downloadLatest)
		r.Get("/download/{id}", a.downloadRelease)
		r.Get("/server-config", a.serverConfig)
		r.Post("/upload-release", a.uploadRelease)
	})
}

func (a *API) latestRelease() (map[string]any, error) {
	row, err := a.db.QueryOne(`SELECT * FROM app_releases ORDER BY version_code DESC,release_date DESC LIMIT 1`)
	if err != nil {
		return nil, err
	}
	if row != nil {
		return row, nil
	}
	prefer := []string{"apexdrive_latest.apk", "vehicle-tracker-latest.apk"}
	for _, name := range prefer {
		path := filepath.Join(a.cfg.APKsDir, name)
		if st, err := os.Stat(path); err == nil {
			return map[string]any{
				"id":            "rel_default",
				"version":       "1.0.0",
				"version_code":  int64(1),
				"release_notes": "Latest packaged APK",
				"apk_filename":  name,
				"apk_size":      st.Size(),
				"release_date":  st.ModTime().UTC().Format(time.RFC3339Nano),
			}, nil
		}
	}
	files, _ := filepath.Glob(filepath.Join(a.cfg.APKsDir, "*.apk"))
	if len(files) == 0 {
		return nil, nil
	}
	best := files[0]
	bestT := time.Time{}
	for _, f := range files {
		if st, err := os.Stat(f); err == nil && st.ModTime().After(bestT) {
			best, bestT = f, st.ModTime()
		}
	}
	st, _ := os.Stat(best)
	return map[string]any{
		"id":            "rel_default",
		"version":       "1.0.0",
		"version_code":  int64(1),
		"release_notes": "Latest packaged APK",
		"apk_filename":  filepath.Base(best),
		"apk_size":      st.Size(),
		"release_date":  st.ModTime().UTC().Format(time.RFC3339Nano),
	}, nil
}

func (a *API) requestOrigin(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	return apkembed.PublicOrigin(scheme, r.Host, r.Header.Get("X-Forwarded-Proto"), r.Header.Get("X-Forwarded-Host"))
}

func (a *API) serverConfig(w http.ResponseWriter, r *http.Request) {
	origin := a.requestOrigin(r)
	writeJSON(w, 200, map[string]any{
		"url":            origin,
		"configure_link": fmt.Sprintf("apexdrive://configure?url=%s", origin),
	})
}

func (a *API) appVersion(w http.ResponseWriter, r *http.Request) {
	row, err := a.latestRelease()
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if row == nil {
		writeJSON(w, 200, map[string]any{"available": false, "version": "1.0.0", "version_code": 1, "message": "No APK release uploaded yet"})
		return
	}
	out := map[string]any{"available": true, "download_url": "/api/app/download-latest"}
	for _, k := range []string{"id", "version", "version_code", "release_notes", "apk_size", "release_date"} {
		out[k] = row[k]
	}
	writeJSON(w, 200, out)
}

func (a *API) releases(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.Query(`SELECT * FROM app_releases ORDER BY version_code DESC,release_date DESC`)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	for _, x := range rows {
		x["download_url"] = "/api/app/download/" + text(x["id"])
	}
	writeJSON(w, 200, rows)
}

func (a *API) downloadLatest(w http.ResponseWriter, r *http.Request) {
	row, err := a.latestRelease()
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if row == nil {
		writeError(w, 404, "No APK release found on server")
		return
	}
	a.sendAPK(w, r, row)
}

func (a *API) downloadRelease(w http.ResponseWriter, r *http.Request) {
	row, err := a.db.QueryOne(`SELECT * FROM app_releases WHERE id=?`, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if row == nil {
		writeError(w, 404, "Release not found")
		return
	}
	a.sendAPK(w, r, row)
}

func (a *API) sendAPK(w http.ResponseWriter, r *http.Request, row map[string]any) {
	path := filepath.Join(a.cfg.APKsDir, filepath.Base(text(row["apk_filename"])))
	if _, err := os.Stat(path); err != nil {
		writeError(w, 404, "APK file not found on disk")
		return
	}

	origin := a.requestOrigin(r)
	filename := fmt.Sprintf("apexdrive_v%s.apk", text(row["version"]))
	w.Header().Set("Content-Type", "application/vnd.android.package-archive")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	if origin != "" {
		w.Header().Set("X-ApexDrive-Server", origin)
	}

	// Serve the release APK as built/signed. Download-time inject+resign was producing
	// installable-looking but invalid packages ("App not installed" on device).
	// Server URL is baked into server-bootstrap.json at APK build time, or set on login.
	http.ServeFile(w, r, path)
}

var cleanFile = regexp.MustCompile(`[^a-zA-Z0-9._-]`)

func (a *API) uploadRelease(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 150<<20)
	if err := r.ParseMultipartForm(150 << 20); err != nil {
		writeError(w, 400, err)
		return
	}
	file, h, err := r.FormFile("apk")
	if err != nil {
		writeError(w, 400, "No APK file uploaded")
		return
	}
	defer file.Close()
	if !strings.HasSuffix(strings.ToLower(h.Filename), ".apk") {
		writeError(w, 400, "Only .apk files are supported")
		return
	}
	name := fmt.Sprintf("app-%d-%s", time.Now().UnixMilli(), cleanFile.ReplaceAllString(h.Filename, "_"))
	path := filepath.Join(a.cfg.APKsDir, name)
	dst, err := os.Create(path)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	size, copyErr := io.Copy(dst, file)
	closeErr := dst.Close()
	if copyErr != nil || closeErr != nil {
		os.Remove(path)
		if copyErr != nil {
			writeError(w, 500, copyErr)
		} else {
			writeError(w, 500, closeErr)
		}
		return
	}
	version, code := r.FormValue("version"), r.FormValue("version_code")
	if version == "" || code == "" {
		os.Remove(path)
		writeError(w, 400, "version and version_code are required")
		return
	}
	versionCode, err := strconv.Atoi(code)
	if err != nil {
		os.Remove(path)
		writeError(w, 400, "version_code must be a number")
		return
	}
	notes := r.FormValue("release_notes")
	if notes == "" {
		notes = "Bug fixes and performance improvements"
	}
	id := db.NewID("rel")
	_, err = a.db.Exec(`INSERT INTO app_releases(id,version,version_code,release_notes,apk_filename,apk_size,release_date) VALUES(?,?,?,?,?,?,datetime('now'))`, id, version, versionCode, notes, name, size)
	if err != nil {
		os.Remove(path)
		writeError(w, 500, err)
		return
	}
	row, _ := a.db.QueryOne(`SELECT * FROM app_releases WHERE id=?`, id)
	row["download_url"] = "/api/app/download/" + id
	writeJSON(w, 201, row)
}
