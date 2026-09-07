package httpapi

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/eklier101/apexdrive/internal/auth"
)

type userKey struct{}

func (a *API) optionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header != "" {
			token := strings.TrimPrefix(header, "Bearer ")
			if user, ok := auth.VerifyToken(a.cfg.JWTSecret, token); ok {
				r = r.WithContext(context.WithValue(r.Context(), userKey{}, user))
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (a *API) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if userFromContext(r) == nil {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Authentication token required"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func userFromContext(r *http.Request) *auth.UserPayload {
	user, _ := r.Context().Value(userKey{}).(*auth.UserPayload)
	return user
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, err any) {
	writeJSON(w, status, map[string]any{"error": fmt.Sprint(err)})
}

func bodyMap(r *http.Request) (map[string]any, error) {
	var body map[string]any
	err := json.NewDecoder(io.LimitReader(r.Body, 50<<20)).Decode(&body)
	return body, err
}

func text(v any) string {
	if v == nil { return "" }
	return fmt.Sprint(v)
}

func num(v any) float64 {
	switch n := v.(type) {
	case float64: return n
	case int64: return float64(n)
	case json.Number: f, _ := n.Float64(); return f
	default: f, _ := strconv.ParseFloat(text(v), 64); return f
	}
}

func integer(v any) int { return int(num(v)) }

func truthy(v any) bool {
	switch x := v.(type) {
	case bool: return x
	case float64: return x != 0
	case string: return x != "" && x != "0" && x != "false"
	}
	return false
}

func value(body map[string]any, key string, fallback any) any {
	if v, ok := body[key]; ok { return v }
	return fallback
}

func nullable(v any) any {
	if v == nil || text(v) == "" { return nil }
	return v
}

func today() string { return time.Now().Format("2006-01-02") }
