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
	return d, nil
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
