package config

import (
	"fmt"
	"os"
	"path/filepath"
)

type Config struct {
	Host       string
	Port       string
	DataDir    string
	DBPath     string
	UploadsDir string
	APKsDir    string
	JWTSecret  string
	PublicDir  string
	Production bool
}

func Load() (*Config, error) {
	dataDir := envOr("DATA_DIR", filepath.Join(".", "data"))
	dbPath := envOr("DB_PATH", filepath.Join(dataDir, "vehicle_tracker.db"))
	prod := os.Getenv("NODE_ENV") == "production" || os.Getenv("APP_ENV") == "production"
	secret := os.Getenv("JWT_SECRET")
	if prod && secret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required in production")
	}
	if secret == "" {
		secret = "dev-only-insecure-jwt-secret-do-not-use-in-production"
	}
	return &Config{
		Host:       envOr("HOST", "0.0.0.0"),
		Port:       envOr("PORT", "8090"),
		DataDir:    dataDir,
		DBPath:     dbPath,
		UploadsDir: filepath.Join(dataDir, "uploads"),
		APKsDir:    filepath.Join(dataDir, "apks"),
		JWTSecret:  secret,
		PublicDir:  envOr("PUBLIC_DIR", filepath.Join(".", "public")),
		Production: prod,
	}, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
