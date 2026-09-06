package apkembed

import (
	"archive/zip"
	"fmt"
	"os"
	"strings"
)

// ValidateAPKFile checks that path looks like a signed Android package
// (ZIP container with AndroidManifest.xml and META-INF signature material).
// This catches truncated downloads, JSON error bodies saved as .apk, and unsigned ZIPs.
func ValidateAPKFile(path string) error {
	st, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("apk missing: %w", err)
	}
	if st.Size() < 50_000 {
		return fmt.Errorf("apk too small (%d bytes) — likely corrupt or not an APK", st.Size())
	}
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	hdr := make([]byte, 4)
	if _, err := f.Read(hdr); err != nil {
		return fmt.Errorf("apk unreadable: %w", err)
	}
	if hdr[0] != 'P' || hdr[1] != 'K' {
		return fmt.Errorf("apk is not a ZIP package (bad magic) — often a JSON error download")
	}
	zr, err := zip.OpenReader(path)
	if err != nil {
		return fmt.Errorf("apk zip open failed: %w", err)
	}
	defer zr.Close()

	hasManifest := false
	hasSig := false
	for _, e := range zr.File {
		name := strings.ReplaceAll(e.Name, "\\", "/")
		lower := strings.ToLower(name)
		if lower == "androidmanifest.xml" {
			hasManifest = true
		}
		if strings.HasPrefix(lower, "meta-inf/") {
			if strings.HasSuffix(lower, ".rsa") ||
				strings.HasSuffix(lower, ".dsa") ||
				strings.HasSuffix(lower, ".ec") ||
				strings.HasSuffix(lower, ".sf") {
				hasSig = true
			}
		}
	}
	if !hasManifest {
		return fmt.Errorf("apk missing AndroidManifest.xml")
	}
	if !hasSig {
		return fmt.Errorf("apk missing META-INF signature — unsigned packages fail with App not installed")
	}
	return nil
}
