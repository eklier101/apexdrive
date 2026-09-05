package apkembed

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const bootstrapPath = "assets/public/server-bootstrap.json"

// InjectServerURL copies an APK and replaces/adds assets/public/server-bootstrap.json
// with the given server URL. The result must be re-signed before install on modern Android;
// when signing tools are unavailable we still inject so sideloaded/debug flows can work
// after re-signing locally.
func InjectServerURL(apkPath, serverURL string) ([]byte, error) {
	serverURL = strings.TrimRight(strings.TrimSpace(serverURL), "/")
	if serverURL == "" {
		return os.ReadFile(apkPath)
	}
	payload, err := json.Marshal(map[string]string{"url": serverURL})
	if err != nil {
		return nil, err
	}

	zr, err := zip.OpenReader(apkPath)
	if err != nil {
		return nil, err
	}
	defer zr.Close()

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	written := false
	for _, f := range zr.File {
		name := f.Name
		// Drop existing signatures so a later signer can re-sign cleanly.
		if strings.HasPrefix(name, "META-INF/") && (strings.HasSuffix(strings.ToUpper(name), ".SF") ||
			strings.HasSuffix(strings.ToUpper(name), ".RSA") ||
			strings.HasSuffix(strings.ToUpper(name), ".DSA") ||
			strings.HasSuffix(strings.ToUpper(name), ".EC") ||
			strings.EqualFold(filepath.Base(name), "MANIFEST.MF")) {
			continue
		}
		if name == bootstrapPath {
			if err := writeZipFile(zw, name, payload); err != nil {
				_ = zw.Close()
				return nil, err
			}
			written = true
			continue
		}
		if err := copyZipFile(zw, f); err != nil {
			_ = zw.Close()
			return nil, err
		}
	}
	if !written {
		if err := writeZipFile(zw, bootstrapPath, payload); err != nil {
			_ = zw.Close()
			return nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writeZipFile(zw *zip.Writer, name string, data []byte) error {
	w, err := zw.Create(name)
	if err != nil {
		return err
	}
	_, err = w.Write(data)
	return err
}

func copyZipFile(zw *zip.Writer, f *zip.File) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()
	hdr := f.FileHeader
	w, err := zw.CreateHeader(&hdr)
	if err != nil {
		return err
	}
	_, err = io.Copy(w, rc)
	return err
}

// PublicOrigin builds http(s)://host from the request Host / X-Forwarded-* headers.
func PublicOrigin(scheme, host, forwardedProto, forwardedHost string) string {
	if host == "" && forwardedHost == "" {
		return ""
	}
	h := host
	if forwardedHost != "" {
		h = strings.Split(forwardedHost, ",")[0]
		h = strings.TrimSpace(h)
	}
	s := scheme
	if forwardedProto != "" {
		s = strings.TrimSpace(strings.Split(forwardedProto, ",")[0])
	}
	if s == "" {
		s = "http"
	}
	if h == "" {
		return ""
	}
	return fmt.Sprintf("%s://%s", s, h)
}
