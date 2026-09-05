package httpapi

import (
	"net/http"
	"os"
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
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-Sync-Token"}, ExposedHeaders: []string{"Content-Disposition"},
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
		a.vehicleRoutes(r)
		a.fillupRoutes(r)
		a.serviceRoutes(r)
		a.inventoryRoutes(r)
		a.upgradeRoutes(r)
		a.expenseRoutes(r)
		a.reminderRoutes(r)
		a.planRoutes(r)
		a.statsRoutes(r)
		a.appUpdateRoutes(r)
		a.uploadRoutes(r)
		a.healthRoutes(r)
		a.syncRoutes(r)
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
		fs := http.FileServer(http.Dir(cfg.PublicDir))
		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			path := filepath.Join(cfg.PublicDir, filepath.Clean(r.URL.Path))
			if info, err := os.Stat(path); err == nil && !info.IsDir() {
				fs.ServeHTTP(w, r)
				return
			}
			http.ServeFile(w, r, filepath.Join(cfg.PublicDir, "index.html"))
		})
	}
	return r
}
