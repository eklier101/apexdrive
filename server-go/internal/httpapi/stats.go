package httpapi

import (
	"fmt"
	svc "github.com/eklier101/apexdrive/internal/services"
	"github.com/go-chi/chi/v5"
	"net/http"
	"strings"
	"time"
)

func (a *API) statsRoutes(r chi.Router) {
	r.Route("/stats", func(r chi.Router) {
		r.Get("/dashboard", a.dashboard)
		r.Get("/trends", a.trends)
		r.Get("/export", a.export)
	})
}
func (a *API) dashboard(w http.ResponseWriter, r *http.Request) {
	id, ok := a.vehicleQuery(w, r)
	if !ok {
		return
	}
	stats, err := svc.GetDashboardStats(a.db, id)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if stats == nil {
		writeError(w, 404, "Vehicle not found")
		return
	}
	writeJSON(w, 200, stats)
}
func (a *API) trends(w http.ResponseWriter, r *http.Request) {
	id, ok := a.vehicleQuery(w, r)
	if !ok {
		return
	}
	out, err := svc.GetTrends(a.db, id)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, out)
}
func (a *API) export(w http.ResponseWriter, r *http.Request) {
	u := userFromContext(r)
	vehicles, err := a.db.Query(`SELECT * FROM vehicles WHERE user_id=? OR user_id IS NULL ORDER BY created_at ASC`, u.UserID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	out := map[string]any{"exported_at": time.Now().UTC().Format(time.RFC3339Nano), "vehicles": vehicles}
	ids := make([]any, len(vehicles))
	marks := make([]string, len(vehicles))
	for i, v := range vehicles {
		ids[i] = v["id"]
		marks[i] = "?"
	}
	related := []string{"fillups", "services", "service_reminders", "upgrades", "other_expenses"}
	for _, t := range related {
		if len(ids) == 0 {
			out[t] = []map[string]any{}
			continue
		}
		rows, err := a.db.Query(`SELECT * FROM `+t+` WHERE vehicle_id IN (`+strings.Join(marks, ",")+`)`, ids...)
		if err != nil {
			writeError(w, 500, err)
			return
		}
		out[t] = rows
	}
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="vehicle_tracker_backup_%d.json"`, time.Now().UnixMilli()))
	writeJSON(w, 200, out)
}
