package main

import (
	"log"
	"net"
	"net/http"
	"os"

	"github.com/eklier101/apexdrive/internal/config"
	"github.com/eklier101/apexdrive/internal/db"
	"github.com/eklier101/apexdrive/internal/httpapi"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	for _, dir := range []string{cfg.DataDir, cfg.UploadsDir, cfg.APKsDir} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Fatal(err)
		}
	}
	database, err := db.Open(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()
	address := net.JoinHostPort(cfg.Host, cfg.Port)
	log.Printf("ApexDrive Go API listening on http://%s", address)
	if err := http.ListenAndServe(address, httpapi.NewRouter(cfg, database)); err != nil {
		log.Fatal(err)
	}
}
