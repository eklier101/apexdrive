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
		r.Get("/status", a.authStatus)
	})
}

func (a *API) register(w http.ResponseWriter, r *http.Request) {
	b, err := bodyMap(r); if err != nil { writeError(w, 400, "Invalid JSON"); return }
	username, password := strings.ToLower(strings.TrimSpace(text(b["username"]))), text(b["password"])
	if username == "" || password == "" { writeError(w, 400, "Username and password are required"); return }
	if len(username) < 3 { writeError(w, 400, "Username must be at least 3 characters"); return }
	if len(password) < 4 { writeError(w, 400, "Password must be at least 4 characters"); return }
	existing, err := a.db.QueryOne(`SELECT id FROM users WHERE username=?`, username)
	if err != nil { writeError(w, 500, err); return }
	if existing != nil { writeError(w, 400, "Username already taken"); return }
	hash, salt, err := auth.HashPassword(password); if err != nil { writeError(w, 500, err); return }
	id := db.NewID("usr")
	var email any
	if strings.TrimSpace(text(b["email"])) != "" { email = strings.TrimSpace(text(b["email"])) }
	if _, err = a.db.Exec(`INSERT INTO users(id,username,email,password_hash,salt) VALUES(?,?,?,?,?)`, id, username, email, hash, salt); err != nil { writeError(w, 500, err); return }
	token, err := auth.GenerateToken(a.cfg.JWTSecret, auth.UserPayload{UserID:id, Username:username}); if err != nil { writeError(w,500,err); return }
	writeJSON(w, 201, map[string]any{"user":map[string]any{"id":id,"username":username,"email":email},"token":token})
}

func (a *API) login(w http.ResponseWriter, r *http.Request) {
	b, err := bodyMap(r); if err != nil { writeError(w,400,"Invalid JSON"); return }
	username, password := strings.ToLower(strings.TrimSpace(text(b["username"]))), text(b["password"])
	if username == "" || password == "" { writeError(w,400,"Username and password are required"); return }
	user, err := a.db.QueryOne(`SELECT * FROM users WHERE username=?`, username)
	if err != nil { writeError(w,500,err); return }
	if user == nil || !auth.VerifyPassword(password, text(user["password_hash"]), text(user["salt"])) { writeError(w,401,"Invalid username or password"); return }
	token, err := auth.GenerateToken(a.cfg.JWTSecret, auth.UserPayload{UserID:text(user["id"]), Username:text(user["username"])}); if err != nil { writeError(w,500,err); return }
	writeJSON(w,200,map[string]any{"user":map[string]any{"id":user["id"],"username":user["username"],"email":user["email"]},"token":token})
}

func (a *API) me(w http.ResponseWriter, r *http.Request) {
	user, err := a.db.QueryOne(`SELECT id,username,email,created_at FROM users WHERE id=?`, userFromContext(r).UserID)
	if err != nil { writeError(w,500,err); return }; if user == nil { writeError(w,404,"User not found"); return }
	writeJSON(w,200,map[string]any{"user":user})
}

func (a *API) authStatus(w http.ResponseWriter, r *http.Request) {
	users, err := a.db.Query(`SELECT id,username FROM users LIMIT 10`); if err != nil { writeError(w,500,err); return }
	writeJSON(w,200,map[string]any{"hasUsers":len(users)>0,"count":len(users)})
}
