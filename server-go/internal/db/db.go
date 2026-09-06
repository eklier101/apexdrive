package db

import (
	"database/sql"
	"embed"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schemaFS embed.FS

type DB struct{ *sql.DB }

func Open(path string) (*DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, err
	}
	raw, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	raw.SetMaxOpenConns(1)
	d := &DB{raw}
	if _, err = d.Exec("PRAGMA foreign_keys=ON"); err != nil {
		raw.Close()
		return nil, err
	}
	schema, err := schemaFS.ReadFile("schema.sql")
	if err != nil {
		raw.Close()
		return nil, err
	}
	if _, err = d.Exec(string(schema)); err != nil {
		raw.Close()
		return nil, fmt.Errorf("initialize schema: %w", err)
	}
	if err = d.migrateUserRoles(); err != nil {
		raw.Close()
		return nil, fmt.Errorf("migrate user roles: %w", err)
	}
	return d, nil
}

// migrateUserRoles adds users.role for existing DBs and promotes the oldest
// user to admin when no admin exists (first-user-is-admin bootstrap).
func (d *DB) migrateUserRoles() error {
	cols, err := d.Query(`PRAGMA table_info(users)`)
	if err != nil {
		return err
	}
	hasRole := false
	for _, c := range cols {
		if strings.EqualFold(fmt.Sprint(c["name"]), "role") {
			hasRole = true
			break
		}
	}
	if !hasRole {
		if _, err = d.Exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`); err != nil {
			return err
		}
	}
	admin, err := d.QueryOne(`SELECT id FROM users WHERE role='admin' LIMIT 1`)
	if err != nil {
		return err
	}
	if admin != nil {
		return nil
	}
	oldest, err := d.QueryOne(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`)
	if err != nil {
		return err
	}
	if oldest == nil {
		return nil
	}
	_, err = d.Exec(`UPDATE users SET role='admin', updated_at=datetime('now') WHERE id=?`, oldest["id"])
	return err
}

func (d *DB) Query(query string, args ...any) ([]map[string]any, error) {
	rows, err := d.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	out := make([]map[string]any, 0)
	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}
		m := make(map[string]any, len(cols))
		for i, c := range cols {
			if b, ok := vals[i].([]byte); ok {
				m[c] = string(b)
			} else {
				m[c] = vals[i]
			}
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (d *DB) QueryOne(query string, args ...any) (map[string]any, error) {
	rows, err := d.Query(query, args...)
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	return rows[0], nil
}

func (d *DB) Exec(query string, args ...any) (sql.Result, error) {
	return d.DB.Exec(query, args...)
}

func NewID(prefix string) string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	var suffix strings.Builder
	for i := 0; i < 6; i++ {
		suffix.WriteByte(chars[rand.Intn(len(chars))])
	}
	return fmt.Sprintf("%s_%d_%s", prefix, time.Now().UnixMilli(), suffix.String())
}
