package apkembed

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// TrySignAPK signs an APK bytes buffer using uber-apk-signer or apksigner when configured.
// Env:
//
//	APK_SIGNER_JAR   - path to uber-apk-signer.jar
//	APK_KEYSTORE     - path to .jks / .keystore
//	APK_KEY_ALIAS    - key alias (default apexdrive)
//	APK_STORE_PASS   - store password
//	APK_KEY_PASS     - key password (defaults to store pass)
func TrySignAPK(apkBytes []byte) ([]byte, error) {
	jar := os.Getenv("APK_SIGNER_JAR")
	ks := os.Getenv("APK_KEYSTORE")
	if jar == "" || ks == "" {
		return nil, fmt.Errorf("APK signing not configured")
	}
	alias := envOr("APK_KEY_ALIAS", "apexdrive")
	storePass := envOr("APK_STORE_PASS", "apexdrive")
	keyPass := envOr("APK_KEY_PASS", storePass)

	dir, err := os.MkdirTemp("", "apexdrive-apk-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(dir)

	inPath := filepath.Join(dir, "in.apk")
	if err := os.WriteFile(inPath, apkBytes, 0o644); err != nil {
		return nil, err
	}

	cmd := exec.Command(
		"java", "-jar", jar,
		"--apks", inPath,
		"--out", dir,
		"--ks", ks,
		"--ksAlias", alias,
		"--ksPass", "pass:"+storePass,
		"--ksKeyPass", "pass:"+keyPass,
		"--overwrite",
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("apk sign failed: %w (%s)", err, string(out))
	}

	// uber-apk-signer writes *-aligned-debugSigned.apk or overwrites
	candidates, _ := filepath.Glob(filepath.Join(dir, "*.apk"))
	for _, c := range candidates {
		if filepath.Base(c) == "in.apk" {
			continue
		}
		return os.ReadFile(c)
	}
	// overwrite mode may replace in.apk
	return os.ReadFile(inPath)
}

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
