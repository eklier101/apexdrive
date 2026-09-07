package httpapi

import (
	"net/http"
	"strings"

	"github.com/eklier101/apexdrive/internal/auth"
	"github.com/eklier101/apexdrive/internal/db"
	"github.com/go-chi/chi/v5"
)

func (a *API) authRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", a.register)
		r.Post("/login", a.login)
		r.With(a.requireAuth).Get("/me", a.me)
		r.With(a.requireAuth).Put("/profile", a.updateProfile)
		r.With(a.requireAuth).Put("/password", a.changePassword)
		r.With(a.requireAuth).Delete("/account", a.deleteAccount)
		r.Get("/status", a.authStatus)
	})
}

func (a *API) register(w http.ResponseWriter, r *http.Request) {
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	username, password := strings.ToLower(strings.TrimSpace(text(b["username"]))), text(b["password"])
	if username == "" || password == "" {
		writeError(w, 400, "Username and password are required")
		return
	}
	if len(username) < 3 {
		writeError(w, 400, "Username must be at least 3 characters")
		return
	}
	if len(password) < 4 {
		writeError(w, 400, "Password must be at least 4 characters")
		return
	}
	existing, err := a.db.QueryOne(`SELECT id FROM users WHERE username=?`, username)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if existing != nil {
		writeError(w, 400, "Username already taken")
		return
	}
	count, err := a.userCount()
	if err != nil {
		writeError(w, 500, err)
		return
	}
	role := auth.RoleUser
	if count == 0 {
		role = auth.RoleAdmin
	}
	hash, salt, err := auth.HashPassword(password)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	id := db.NewID("usr")
	var email any
	if strings.TrimSpace(text(b["email"])) != "" {
		email = strings.TrimSpace(text(b["email"]))
	}
	if _, err = a.db.Exec(
		`INSERT INTO users(id,username,email,password_hash,salt,role) VALUES(?,?,?,?,?,?)`,
		id, username, email, hash, salt, role,
	); err != nil {
		writeError(w, 500, err)
		return
	}
	token, err := auth.GenerateToken(a.cfg.JWTSecret, auth.UserPayload{UserID: id, Username: username, Role: role})
	if err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 201, map[string]any{
		"user":  map[string]any{"id": id, "username": username, "email": email, "role": role},
		"token": token,
	})
}

func (a *API) login(w http.ResponseWriter, r *http.Request) {
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	username, password := strings.ToLower(strings.TrimSpace(text(b["username"]))), text(b["password"])
	if username == "" || password == "" {
		writeError(w, 400, "Username and password are required")
		return
	}
	user, err := a.db.QueryOne(`SELECT * FROM users WHERE username=?`, username)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if user == nil || !auth.VerifyPassword(password, text(user["password_hash"]), text(user["salt"])) {
		writeError(w, 401, "Invalid username or password")
		return
	}
	role := auth.NormalizeRole(text(user["role"]))
	token, err := auth.GenerateToken(a.cfg.JWTSecret, auth.UserPayload{
		UserID:   text(user["id"]),
		Username: text(user["username"]),
		Role:     role,
	})
	if err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"user": publicUser(user), "token": token})
}

func (a *API) me(w http.ResponseWriter, r *http.Request) {
	user, err := a.db.QueryOne(`SELECT id,username,email,role,created_at FROM users WHERE id=?`, userFromContext(r).UserID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if user == nil {
		writeError(w, 404, "User not found")
		return
	}
	writeJSON(w, 200, map[string]any{"user": publicUser(user)})
}

func (a *API) authStatus(w http.ResponseWriter, r *http.Request) {
	count, err := a.userCount()
	if err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"hasUsers": count > 0, "count": count})
}

func (a *API) updateProfile(w http.ResponseWriter, r *http.Request) {
	u := userFromContext(r)
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	emailRaw := strings.TrimSpace(text(b["email"]))
	var email any
	if emailRaw != "" {
		email = emailRaw
	} else {
		email = nil
	}
	if _, err = a.db.Exec(`UPDATE users SET email=?, updated_at=datetime('now') WHERE id=?`, email, u.UserID); err != nil {
		writeError(w, 500, err)
		return
	}
	user, err := a.db.QueryOne(`SELECT id,username,email,role,created_at FROM users WHERE id=?`, u.UserID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"user": publicUser(user)})
}

func (a *API) changePassword(w http.ResponseWriter, r *http.Request) {
	u := userFromContext(r)
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	current := text(b["current_password"])
	next := text(b["new_password"])
	if current == "" || next == "" {
		writeError(w, 400, "current_password and new_password are required")
		return
	}
	if len(next) < 4 {
		writeError(w, 400, "Password must be at least 4 characters")
		return
	}
	row, err := a.db.QueryOne(`SELECT password_hash,salt FROM users WHERE id=?`, u.UserID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if row == nil {
		writeError(w, 404, "User not found")
		return
	}
	if !auth.VerifyPassword(current, text(row["password_hash"]), text(row["salt"])) {
		writeError(w, 401, "Current password is incorrect")
		return
	}
	hash, salt, err := auth.HashPassword(next)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if _, err = a.db.Exec(`UPDATE users SET password_hash=?, salt=?, updated_at=datetime('now') WHERE id=?`, hash, salt, u.UserID); err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"success": true, "message": "Password updated"})
}

func (a *API) deleteAccount(w http.ResponseWriter, r *http.Request) {
	u := userFromContext(r)
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	password := text(b["password"])
	confirm := strings.TrimSpace(text(b["confirm"]))
	if password == "" {
		writeError(w, 400, "password is required")
		return
	}
	if !strings.EqualFold(confirm, "DELETE") {
		writeError(w, 400, `Type DELETE to confirm permanent account deletion`)
		return
	}
	row, err := a.db.QueryOne(`SELECT password_hash,salt,role FROM users WHERE id=?`, u.UserID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if row == nil {
		writeError(w, 404, "User not found")
		return
	}
	if !auth.VerifyPassword(password, text(row["password_hash"]), text(row["salt"])) {
		writeError(w, 401, "Password is incorrect")
		return
	}
	if auth.IsAdmin(text(row["role"])) {
		n, err := a.adminCount()
		if err != nil {
			writeError(w, 500, err)
			return
		}
		if n <= 1 {
			writeError(w, 400, "Cannot delete the last admin account")
			return
		}
	}
	// FK cascades remove vehicles (+ fillups/services/…) and inventory owned by this user.
	if _, err = a.db.Exec(`DELETE FROM users WHERE id=?`, u.UserID); err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"success": true, "message": "Account permanently deleted"})
}
