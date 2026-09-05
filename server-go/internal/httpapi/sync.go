package httpapi

import (
	"crypto/subtle"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

type accountSyncPayload struct {
	User             map[string]any   `json:"user"`
	Vehicles         []map[string]any `json:"vehicles"`
	Fillups          []map[string]any `json:"fillups"`
	Services         []map[string]any `json:"services"`
	ServiceParts     []map[string]any `json:"service_parts"`
	PartsInventory   []map[string]any `json:"parts_inventory"`
	ServiceReminders []map[string]any `json:"service_reminders"`
	Upgrades         []map[string]any `json:"upgrades"`
	OtherExpenses    []map[string]any `json:"other_expenses"`
}

func (a *API) syncRoutes(r chi.Router) {
	r.Route("/sync", func(r chi.Router) {
		r.Use(a.requireSyncToken)
		r.Post("/account", a.importAccount)
		r.Put("/upload/{filename}", a.syncUpload)
		r.Get("/status", a.syncStatus)
	})
}

func (a *API) requireSyncToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if a.cfg.SyncToken == "" {
			writeError(w, http.StatusNotFound, "Account sync is disabled (set SYNC_TOKEN to enable)")
			return
		}
		got := strings.TrimSpace(r.Header.Get("X-Sync-Token"))
		if got == "" {
			auth := r.Header.Get("Authorization")
			if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
				got = strings.TrimSpace(auth[7:])
			}
		}
		if subtle.ConstantTimeCompare([]byte(got), []byte(a.cfg.SyncToken)) != 1 {
			writeError(w, http.StatusUnauthorized, "Invalid sync token")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *API) syncStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{"ok": true, "sync": "enabled"})
}

func (a *API) importAccount(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 64<<20)
	var payload accountSyncPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, 400, err)
		return
	}
	if payload.User == nil || text(payload.User["username"]) == "" || text(payload.User["id"]) == "" {
		writeError(w, 400, "user.id and user.username are required")
		return
	}
	username := strings.ToLower(text(payload.User["username"]))
	payload.User["username"] = username

	tx, err := a.db.Begin()
	if err != nil {
		writeError(w, 500, err)
		return
	}
	defer func() { _ = tx.Rollback() }()

	existing, err := tx.Query(`SELECT id FROM users WHERE lower(username) = ? LIMIT 1`, username)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	var existingID string
	if existing.Next() {
		_ = existing.Scan(&existingID)
	}
	_ = existing.Close()
	if existingID != "" {
		if _, err := tx.Exec(`DELETE FROM users WHERE id = ?`, existingID); err != nil {
			writeError(w, 500, err)
			return
		}
	}

	if err := upsertMap(tx, "users", payload.User); err != nil {
		writeError(w, 500, err)
		return
	}
	for _, tableRows := range []struct {
		table string
		rows  []map[string]any
	}{
		{"vehicles", payload.Vehicles},
		{"parts_inventory", payload.PartsInventory},
		{"fillups", payload.Fillups},
		{"services", payload.Services},
		{"service_reminders", payload.ServiceReminders},
		{"upgrades", payload.Upgrades},
		{"other_expenses", payload.OtherExpenses},
		{"service_parts", payload.ServiceParts},
	} {
		for _, row := range tableRows.rows {
			if err := upsertMap(tx, tableRows.table, row); err != nil {
				writeError(w, 500, fmt.Errorf("%s: %w", tableRows.table, err))
				return
			}
		}
	}

	if err := tx.Commit(); err != nil {
		writeError(w, 500, err)
		return
	}

	writeJSON(w, 200, map[string]any{
		"ok":       true,
		"username": username,
		"user_id":  text(payload.User["id"]),
		"counts": map[string]int{
			"vehicles":          len(payload.Vehicles),
			"fillups":           len(payload.Fillups),
			"services":          len(payload.Services),
			"service_parts":     len(payload.ServiceParts),
			"parts_inventory":   len(payload.PartsInventory),
			"service_reminders": len(payload.ServiceReminders),
			"upgrades":          len(payload.Upgrades),
			"other_expenses":    len(payload.OtherExpenses),
		},
	})
}

func (a *API) syncUpload(w http.ResponseWriter, r *http.Request) {
	name := filepath.Base(chi.URLParam(r, "filename"))
	if name == "." || name == "/" || name == "" || strings.Contains(name, "..") {
		writeError(w, 400, "invalid filename")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 25<<20)
	if err := os.MkdirAll(a.cfg.UploadsDir, 0755); err != nil {
		writeError(w, 500, err)
		return
	}
	dstPath := filepath.Join(a.cfg.UploadsDir, name)
	tmp := dstPath + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	size, copyErr := io.Copy(f, r.Body)
	closeErr := f.Close()
	if copyErr != nil || closeErr != nil {
		_ = os.Remove(tmp)
		if copyErr != nil {
			writeError(w, 500, copyErr)
		} else {
			writeError(w, 500, closeErr)
		}
		return
	}
	if err := os.Rename(tmp, dstPath); err != nil {
		_ = os.Remove(tmp)
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "filename": name, "size": size})
}

func upsertMap(tx *sql.Tx, table string, row map[string]any) error {
	if len(row) == 0 {
		return nil
	}
	cols := make([]string, 0, len(row))
	placeholders := make([]string, 0, len(row))
	args := make([]any, 0, len(row))
	for k, v := range row {
		cols = append(cols, k)
		placeholders = append(placeholders, "?")
		args = append(args, v)
	}
	q := fmt.Sprintf(`INSERT OR REPLACE INTO %s (%s) VALUES (%s)`, table, strings.Join(cols, ","), strings.Join(placeholders, ","))
	_, err := tx.Exec(q, args...)
	return err
}
