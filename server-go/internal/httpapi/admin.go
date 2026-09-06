package httpapi

import (
	"net/http"

	"github.com/eklier101/apexdrive/internal/auth"
	"github.com/go-chi/chi/v5"
)

func (a *API) adminRoutes(r chi.Router) {
	r.Route("/admin", func(r chi.Router) {
		r.Use(a.requireAuth)
		r.Use(a.requireAdmin)
		r.Get("/users", a.adminListUsers)
		r.Put("/users/{id}/role", a.adminSetRole)
		r.Post("/users/{id}/reset-password", a.adminResetPassword)
		r.Delete("/users/{id}", a.adminDeleteUser)
	})
}

func (a *API) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u := userFromContext(r)
		if u == nil {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Authentication token required"})
			return
		}
		role, err := a.roleForUserID(u.UserID)
		if err != nil {
			writeError(w, 500, err)
			return
		}
		if !auth.IsAdmin(role) {
			writeJSON(w, http.StatusForbidden, map[string]any{"error": "Admin access required"})
			return
		}
		u.Role = auth.RoleAdmin
		next.ServeHTTP(w, r)
	})
}

func (a *API) roleForUserID(id string) (string, error) {
	row, err := a.db.QueryOne(`SELECT role FROM users WHERE id=?`, id)
	if err != nil {
		return "", err
	}
	if row == nil {
		return auth.RoleUser, nil
	}
	return auth.NormalizeRole(text(row["role"])), nil
}

func (a *API) adminCount() (int, error) {
	row, err := a.db.QueryOne(`SELECT COUNT(*) AS c FROM users WHERE role='admin'`)
	if err != nil {
		return 0, err
	}
	return integer(row["c"]), nil
}

func (a *API) adminListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.Query(`
		SELECT u.id, u.username, u.email, u.role, u.created_at,
			(SELECT COUNT(*) FROM vehicles v WHERE v.user_id = u.id) AS vehicle_count
		FROM users u
		ORDER BY u.created_at ASC
	`)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	users := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		users = append(users, map[string]any{
			"id":            row["id"],
			"username":      row["username"],
			"email":         row["email"],
			"role":          auth.NormalizeRole(text(row["role"])),
			"created_at":    row["created_at"],
			"vehicle_count": integer(row["vehicle_count"]),
		})
	}
	writeJSON(w, 200, map[string]any{"users": users})
}

func (a *API) adminSetRole(w http.ResponseWriter, r *http.Request) {
	targetID := chi.URLParam(r, "id")
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	newRole := auth.NormalizeRole(text(b["role"]))
	target, err := a.db.QueryOne(`SELECT id, username, email, role, created_at FROM users WHERE id=?`, targetID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if target == nil {
		writeError(w, 404, "User not found")
		return
	}
	oldRole := auth.NormalizeRole(text(target["role"]))
	if oldRole == auth.RoleAdmin && newRole != auth.RoleAdmin {
		n, err := a.adminCount()
		if err != nil {
			writeError(w, 500, err)
			return
		}
		if n <= 1 {
			writeError(w, 400, "Cannot demote the last admin")
			return
		}
	}
	if _, err = a.db.Exec(`UPDATE users SET role=?, updated_at=datetime('now') WHERE id=?`, newRole, targetID); err != nil {
		writeError(w, 500, err)
		return
	}
	target["role"] = newRole
	writeJSON(w, 200, map[string]any{"user": publicUser(target)})
}

func (a *API) adminResetPassword(w http.ResponseWriter, r *http.Request) {
	targetID := chi.URLParam(r, "id")
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	password := text(b["password"])
	if len(password) < 4 {
		writeError(w, 400, "Password must be at least 4 characters")
		return
	}
	target, err := a.db.QueryOne(`SELECT id FROM users WHERE id=?`, targetID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if target == nil {
		writeError(w, 404, "User not found")
		return
	}
	hash, salt, err := auth.HashPassword(password)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if _, err = a.db.Exec(`UPDATE users SET password_hash=?, salt=?, updated_at=datetime('now') WHERE id=?`, hash, salt, targetID); err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"success": true, "message": "Password reset"})
}

func (a *API) adminDeleteUser(w http.ResponseWriter, r *http.Request) {
	actor := userFromContext(r)
	targetID := chi.URLParam(r, "id")
	if targetID == actor.UserID {
		writeError(w, 400, "Cannot delete your own account from admin; use Profile")
		return
	}
	target, err := a.db.QueryOne(`SELECT id, role FROM users WHERE id=?`, targetID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if target == nil {
		writeError(w, 404, "User not found")
		return
	}
	if auth.IsAdmin(text(target["role"])) {
		n, err := a.adminCount()
		if err != nil {
			writeError(w, 500, err)
			return
		}
		if n <= 1 {
			writeError(w, 400, "Cannot delete the last admin")
			return
		}
	}
	if _, err = a.db.Exec(`DELETE FROM users WHERE id=?`, targetID); err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"success": true, "message": "User deleted"})
}

func publicUser(row map[string]any) map[string]any {
	out := map[string]any{
		"id":       row["id"],
		"username": row["username"],
		"email":    row["email"],
		"role":     auth.NormalizeRole(text(row["role"])),
	}
	if v, ok := row["created_at"]; ok {
		out["created_at"] = v
	}
	return out
}

func (a *API) userCount() (int, error) {
	row, err := a.db.QueryOne(`SELECT COUNT(*) AS c FROM users`)
	if err != nil {
		return 0, err
	}
	return integer(row["c"]), nil
}