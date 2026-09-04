package httpapi

import (
	"net/http"

	"github.com/eklier101/apexdrive/internal/db"
	"github.com/go-chi/chi/v5"
)

func (a *API) vehicleRoutes(r chi.Router) {
	r.Route("/vehicles", func(r chi.Router) {
		r.Get("/", a.listVehicles)
		r.Post("/", a.createVehicle)
		r.Get("/{id}", a.getVehicle)
		r.Put("/{id}", a.updateVehicle)
		r.Delete("/{id}", a.deleteVehicle)
	})
}

func (a *API) listVehicles(w http.ResponseWriter, r *http.Request) {
	u := userFromContext(r)
	rows, err := a.db.Query(`SELECT * FROM vehicles WHERE user_id=? OR user_id IS NULL ORDER BY is_active DESC,created_at ASC`, u.UserID)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, rows)
}

func (a *API) getVehicle(w http.ResponseWriter, r *http.Request) {
	row, ok := a.ownedVehicle(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	writeJSON(w, 200, row)
}

func (a *API) createVehicle(w http.ResponseWriter, r *http.Request) {
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	if text(b["name"]) == "" || text(b["make"]) == "" || text(b["model"]) == "" || num(b["year"]) == 0 {
		writeError(w, 400, "Name, make, model, and year are required")
		return
	}
	id, userID := db.NewID("veh"), any(nil)
	if u := userFromContext(r); u != nil {
		userID = u.UserID
	}
	args := []any{id, userID, b["name"], b["make"], b["model"], integer(b["year"]), nullable(b["trim"]), nullable(b["engine"]), nullable(b["vin"]), nullable(b["license_plate"]),
		value(b, "fuel_type", "Gasoline"), nullable(b["tank_capacity"]), value(b, "odometer_unit", "mi"), value(b, "fuel_unit", "gal"), value(b, "currency", "USD"),
		nullable(b["purchase_date"]), num(value(b, "purchase_price", 0)), num(value(b, "purchase_odometer", 0)), nullable(b["photo_url"]), nullable(b["notes"])}
	_, err = a.db.Exec(`INSERT INTO vehicles(id,user_id,name,make,model,year,trim,engine,vin,license_plate,fuel_type,tank_capacity,odometer_unit,fuel_unit,currency,purchase_date,purchase_price,purchase_odometer,photo_url,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, args...)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	row, _ := a.db.QueryOne(`SELECT * FROM vehicles WHERE id=?`, id)
	writeJSON(w, 201, row)
}

func (a *API) updateVehicle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	old, ok := a.ownedVehicle(w, r, id)
	if !ok {
		return
	}
	var err error
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	keys := []string{"name", "make", "model", "year", "trim", "engine", "vin", "license_plate", "fuel_type", "tank_capacity", "odometer_unit", "fuel_unit", "currency", "purchase_date", "purchase_price", "purchase_odometer", "is_active", "photo_url", "notes"}
	vals := make([]any, 0, len(keys)+1)
	for _, k := range keys {
		if v, ok := b[k]; ok {
			switch k {
			case "year", "is_active":
				vals = append(vals, integer(v))
			case "tank_capacity", "purchase_price", "purchase_odometer":
				vals = append(vals, num(v))
			default:
				vals = append(vals, v)
			}
		} else {
			vals = append(vals, old[k])
		}
	}
	vals = append(vals, id)
	_, err = a.db.Exec(`UPDATE vehicles SET name=?,make=?,model=?,year=?,trim=?,engine=?,vin=?,license_plate=?,fuel_type=?,tank_capacity=?,odometer_unit=?,fuel_unit=?,currency=?,purchase_date=?,purchase_price=?,purchase_odometer=?,is_active=?,photo_url=?,notes=?,updated_at=datetime('now') WHERE id=?`, vals...)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	row, _ := a.db.QueryOne(`SELECT * FROM vehicles WHERE id=?`, id)
	writeJSON(w, 200, row)
}

func (a *API) deleteVehicle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if _, ok := a.ownedVehicle(w, r, id); !ok {
		return
	}
	if _, err := a.db.Exec(`DELETE FROM vehicles WHERE id=?`, id); err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"success": true, "message": "Vehicle deleted successfully"})
}
