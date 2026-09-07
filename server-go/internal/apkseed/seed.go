package apkseed

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/eklier101/apexdrive/internal/db"
	"github.com/eklier101/apexdrive/internal/apkembed"
)

const defaultBundledDir = "/app/bundled-apk"
const defaultGitHubRepo = "eklier101/apexdrive"

type releaseMeta struct {
	Version      string `json:"version"`
	VersionCode  int    `json:"version_code"`
	ReleaseNotes string `json:"release_notes"`
	APKFilename  string `json:"apk_filename"`
}

// EnsureLatest makes sure data/apks has a downloadable APK registered in app_releases.
// Order: image-bundled APK, then GitHub Releases (if enabled).
func EnsureLatest(database *db.DB, apksDir string) {
	if err := os.MkdirAll(apksDir, 0o755); err != nil {
		log.Printf("apkseed: mkdir apks: %v", err)
		return
	}
	currentCode := latestVersionCode(database)

	bundledDir := strings.TrimSpace(os.Getenv("APK_BUNDLED_DIR"))
	if bundledDir == "" {
		bundledDir = defaultBundledDir
	}
	if meta, src, ok := loadBundled(bundledDir); ok {
		if meta.VersionCode >= currentCode {
			if err := installAPK(database, apksDir, src, meta); err != nil {
				log.Printf("apkseed: bundled install failed: %v", err)
			} else {
				log.Printf("apkseed: seeded bundled APK v%s (code %d)", meta.Version, meta.VersionCode)
				currentCode = meta.VersionCode
			}
		}
	}

	if envTruthy(os.Getenv("APK_AUTO_FETCH"), true) {
		repo := strings.TrimSpace(os.Getenv("APK_GITHUB_REPO"))
		if repo == "" {
			repo = defaultGitHubRepo
		}
		meta, body, err := fetchGitHubLatest(repo)
		if err != nil {
			if currentCode <= 1 {
				log.Printf("apkseed: github fetch skipped: %v", err)
			}
			return
		}
		if meta.VersionCode > currentCode {
			tmp := filepath.Join(apksDir, ".download-"+meta.APKFilename)
			if err := os.WriteFile(tmp, body, 0o644); err != nil {
				log.Printf("apkseed: write download: %v", err)
				return
			}
			if err := installAPK(database, apksDir, tmp, meta); err != nil {
				_ = os.Remove(tmp)
				log.Printf("apkseed: github install failed: %v", err)
				return
			}
			_ = os.Remove(tmp)
			log.Printf("apkseed: seeded GitHub APK v%s (code %d) from %s", meta.Version, meta.VersionCode, repo)
		}
	}
}

func latestVersionCode(database *db.DB) int {
	row, err := database.QueryOne(`SELECT version_code FROM app_releases ORDER BY version_code DESC LIMIT 1`)
	if err != nil || row == nil {
		return 0
	}
	switch v := row["version_code"].(type) {
	case int64:
		return int(v)
	case int:
		return v
	case float64:
		return int(v)
	case string:
		n, _ := strconv.Atoi(v)
		return n
	default:
		return 0
	}
}

func loadBundled(dir string) (releaseMeta, string, bool) {
	metaPath := filepath.Join(dir, "release.json")
	apkLatest := filepath.Join(dir, "apexdrive_latest.apk")
	b, err := os.ReadFile(metaPath)
	if err != nil {
		// Fall back to any versioned apk in the bundle dir
		matches, _ := filepath.Glob(filepath.Join(dir, "apexdrive_v*.apk"))
		if len(matches) == 0 {
			if st, err := os.Stat(apkLatest); err == nil && st.Size() > 0 {
				return releaseMeta{Version: "1.0.0", VersionCode: 1, ReleaseNotes: "Bundled APK", APKFilename: "apexdrive_latest.apk"}, apkLatest, true
			}
			return releaseMeta{}, "", false
		}
		src := matches[0]
		base := filepath.Base(src)
		ver := strings.TrimSuffix(strings.TrimPrefix(base, "apexdrive_v"), ".apk")
		code := versionCodeFromSemver(ver)
		return releaseMeta{Version: ver, VersionCode: code, ReleaseNotes: "Bundled APK", APKFilename: "apexdrive_latest.apk"}, src, true
	}
	var meta releaseMeta
	if err := json.Unmarshal(b, &meta); err != nil {
		return releaseMeta{}, "", false
	}
	if meta.APKFilename == "" {
		meta.APKFilename = "apexdrive_latest.apk"
	}
	if meta.VersionCode <= 0 && meta.Version != "" {
		meta.VersionCode = versionCodeFromSemver(meta.Version)
	}
	src := filepath.Join(dir, meta.APKFilename)
	if st, err := os.Stat(src); err != nil || st.Size() == 0 {
		src = apkLatest
		if st, err := os.Stat(src); err != nil || st.Size() == 0 {
			return releaseMeta{}, "", false
		}
		meta.APKFilename = "apexdrive_latest.apk"
	}
	return meta, src, true
}

func installAPK(database *db.DB, apksDir, src string, meta releaseMeta) error {
	if meta.Version == "" || meta.VersionCode <= 0 {
		return fmt.Errorf("invalid release metadata")
	}
	if err := apkembed.ValidateAPKFile(src); err != nil {
		return fmt.Errorf("reject invalid APK: %w", err)
	}
	destName := fmt.Sprintf("apexdrive_v%s.apk", meta.Version)
	dest := filepath.Join(apksDir, destName)
	latest := filepath.Join(apksDir, "apexdrive_latest.apk")
	if err := copyFile(src, dest); err != nil {
		return err
	}
	if err := copyFile(src, latest); err != nil {
		return err
	}
	st, err := os.Stat(dest)
	if err != nil {
		return err
	}
	notes := meta.ReleaseNotes
	if notes == "" {
		notes = "Bundled release"
	}
	existing, err := database.QueryOne(`SELECT id FROM app_releases WHERE version_code=?`, meta.VersionCode)
	if err != nil {
		return err
	}
	if existing != nil {
		_, err = database.Exec(
			`UPDATE app_releases SET version=?, release_notes=?, apk_filename=?, apk_size=?, release_date=datetime('now') WHERE version_code=?`,
			meta.Version, notes, destName, st.Size(), meta.VersionCode,
		)
		return err
	}
	id := db.NewID("rel")
	_, err = database.Exec(
		`INSERT INTO app_releases(id,version,version_code,release_notes,apk_filename,apk_size,release_date) VALUES(?,?,?,?,?,?,datetime('now'))`,
		id, meta.Version, meta.VersionCode, notes, destName, st.Size(),
	)
	return err
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	tmp := dst + ".tmp"
	out, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(out, in)
	closeErr := out.Close()
	if copyErr != nil {
		_ = os.Remove(tmp)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(tmp)
		return closeErr
	}
	return os.Rename(tmp, dst)
}

func fetchGitHubLatest(repo string) (releaseMeta, []byte, error) {
	api := fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", repo)
	req, err := http.NewRequest(http.MethodGet, api, nil)
	if err != nil {
		return releaseMeta{}, nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "apexdrive-apkseed")
	client := &http.Client{Timeout: 45 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return releaseMeta{}, nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		body, _ := io.ReadAll(io.LimitReader(res.Body, 512))
		return releaseMeta{}, nil, fmt.Errorf("github api %s: %s", res.Status, string(body))
	}
	var payload struct {
		TagName string `json:"tag_name"`
		Body    string `json:"body"`
		Assets  []struct {
			Name               string `json:"name"`
			BrowserDownloadURL string `json:"browser_download_url"`
			Size               int64  `json:"size"`
		} `json:"assets"`
	}
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		return releaseMeta{}, nil, err
	}
	ver := strings.TrimPrefix(payload.TagName, "v")
	if ver == "" {
		return releaseMeta{}, nil, fmt.Errorf("release missing tag")
	}
	var url string
	prefer := []string{
		fmt.Sprintf("apexdrive_v%s.apk", ver),
		"apexdrive_latest.apk",
	}
	for _, name := range prefer {
		for _, a := range payload.Assets {
			if a.Name == name && a.BrowserDownloadURL != "" {
				url = a.BrowserDownloadURL
				break
			}
		}
		if url != "" {
			break
		}
	}
	if url == "" {
		for _, a := range payload.Assets {
			if strings.HasSuffix(strings.ToLower(a.Name), ".apk") && a.BrowserDownloadURL != "" {
				url = a.BrowserDownloadURL
				break
			}
		}
	}
	if url == "" {
		return releaseMeta{}, nil, fmt.Errorf("no APK asset on latest release")
	}
	apkRes, err := client.Get(url)
	if err != nil {
		return releaseMeta{}, nil, err
	}
	defer apkRes.Body.Close()
	if apkRes.StatusCode != 200 {
		return releaseMeta{}, nil, fmt.Errorf("apk download %s", apkRes.Status)
	}
	body, err := io.ReadAll(io.LimitReader(apkRes.Body, 200<<20))
	if err != nil {
		return releaseMeta{}, nil, err
	}
	if len(body) < 1000 {
		return releaseMeta{}, nil, fmt.Errorf("apk download too small")
	}
	notes := strings.TrimSpace(payload.Body)
	if notes == "" {
		notes = "From GitHub Releases"
	}
	if len(notes) > 500 {
		notes = notes[:500]
	}
	return releaseMeta{
		Version:      ver,
		VersionCode:  versionCodeFromSemver(ver),
		ReleaseNotes: notes,
		APKFilename:  fmt.Sprintf("apexdrive_v%s.apk", ver),
	}, body, nil
}

var semverRe = regexp.MustCompile(`^(\d+)\.(\d+)\.(\d+)`)

func versionCodeFromSemver(v string) int {
	m := semverRe.FindStringSubmatch(strings.TrimSpace(v))
	if m == nil {
		return 1
	}
	maj, _ := strconv.Atoi(m[1])
	min, _ := strconv.Atoi(m[2])
	pat, _ := strconv.Atoi(m[3])
	return maj*10000 + min*100 + pat
}

func envTruthy(v string, def bool) bool {
	if strings.TrimSpace(v) == "" {
		return def
	}
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "0", "false", "no", "off":
		return false
	default:
		return true
	}
}
