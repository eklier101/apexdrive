package httpapi

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/eklier101/apexdrive/internal/config"
	"github.com/eklier101/apexdrive/internal/db"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

type API struct {
	cfg *config.Config
	db  *db.DB
}

func NewRouter(cfg *config.Config, database *db.DB) http.Handler {
	a := &API{cfg: cfg, db: database}
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowOriginFunc: func(_ *http.Request, _ string) bool { return true },
		AllowedMethods:  []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:  []string{"Accept", "Authorization", "Content-Type"}, ExposedHeaders: []string{"Content-Disposition"},
		AllowCredentials: true,
	}))
	r.Use(a.optionalAuth)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "SAMEORIGIN")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			next.ServeHTTP(w, r)
		})
	})

	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.UploadsDir))))
	r.Route("/api", func(r chi.Router) {
		a.authRoutes(r)
		a.healthRoutes(r)
		a.appUpdateRoutes(r)
		r.Group(func(r chi.Router) {
			r.Use(a.requireAuth)
			a.vehicleRoutes(r)
			a.fillupRoutes(r)
			a.serviceRoutes(r)
			a.inventoryRoutes(r)
			a.upgradeRoutes(r)
			a.expenseRoutes(r)
			a.reminderRoutes(r)
			a.statsRoutes(r)
			a.uploadRoutes(r)
		})
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			writeError(w, http.StatusNotFound, "Not found")
			return
		}
		index := filepath.Join(cfg.PublicDir, "index.html")
		if _, err := os.Stat(index); err == nil {
			http.ServeFile(w, r, index)
			return
		}
		http.NotFound(w, r)
	})
	if _, err := os.Stat(cfg.PublicDir); err == nil {
		r.Get("/*", a.servePublic)
	}
	return r
}

func (a *API) servePublic(w http.ResponseWriter, r *http.Request) {
	root := filepath.Clean(a.cfg.PublicDir)
	index := filepath.Join(root, "index.html")
	rel := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
	target := root
	if rel != "" {
		target = filepath.Join(root, filepath.FromSlash(rel))
	}
	if target != root && !strings.HasPrefix(target, root+string(os.PathSeparator)) {
		http.ServeFile(w, r, index)
		return
	}
	if info, err := os.Stat(target); err == nil && !info.IsDir() {
		http.ServeFile(w, r, target)
		return
	}
	http.ServeFile(w, r, index)
}
