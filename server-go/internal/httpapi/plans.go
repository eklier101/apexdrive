package httpapi

import (
	"net/http"
	"strings"

	"github.com/eklier101/apexdrive/internal/db"
	"github.com/go-chi/chi/v5"
)

func (a *API) planRoutes(r chi.Router) {
	r.Route("/plans", func(r chi.Router) {
		r.Use(a.requireAuth)
		r.Get("/", a.listPlans)
		r.Post("/", a.createPlan)
		r.Get("/{id}", a.getPlan)
		r.Put("/{id}", a.updatePlan)
		r.Delete("/{id}", a.deletePlan)
		r.Post("/{id}/apply", a.markPlanApplied)
	})
}

type planPartIn struct {
	InventoryItemID any     `json:"inventory_item_id"`
	Name            string  `json:"name"`
	Quantity        float64 `json:"quantity"`
	UnitCost        float64 `json:"unit_cost"`
	Acquisition     string  `json:"acquisition"`
	Notes           string  `json:"notes"`
}

func (a *API) listPlans(w http.ResponseWriter, r *http.Request) {
	vid, ok := vehicleQuery(w, r)
	if !ok {
		return
	}
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	var rows []map[string]any
	var err error
	if status != "" {
		rows, err = a.db.Query(`SELECT * FROM plans WHERE vehicle_id=? AND status=? ORDER BY updated_at DESC`, vid, status)
	} else {
		rows, err = a.db.Query(`SELECT * FROM plans WHERE vehicle_id=? ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'applied' THEN 1 ELSE 2 END, updated_at DESC`, vid)
	}
	if err != nil {
		writeError(w, 500, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		enriched, err := a.attachPlanParts(row)
		if err != nil {
			writeError(w, 500, err)
			return
		}
		out = append(out, enriched)
	}
	writeJSON(w, 200, out)
}

func (a *API) getPlan(w http.ResponseWriter, r *http.Request) {
	row, err := a.db.QueryOne(`SELECT * FROM plans WHERE id=?`, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if row == nil {
		writeError(w, 404, "Plan not found")
		return
	}
	out, err := a.attachPlanParts(row)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, out)
}

func (a *API) createPlan(w http.ResponseWriter, r *http.Request) {
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	vid := text(b["vehicle_id"])
	if vid == "" {
		writeError(w, 400, "vehicle_id is required")
		return
	}
	kind := strings.ToLower(strings.TrimSpace(text(b["plan_kind"])))
	if kind != "service" && kind != "upgrade" {
		writeError(w, 400, "plan_kind must be service or upgrade")
		return
	}
	title := strings.TrimSpace(text(b["title"]))
	if title == "" {
		writeError(w, 400, "title is required")
		return
	}
	u := userFromContext(r)
	id := db.NewID("plan")
	var userID any
	if u != nil {
		userID = u.UserID
	}
	_, err = a.db.Exec(
		`INSERT INTO plans(id,vehicle_id,user_id,plan_kind,title,service_type,category,notes,labor_cost,status) VALUES(?,?,?,?,?,?,?,?,?,?)`,
		id, vid, userID, kind, title, nullable(b["service_type"]), nullable(b["category"]), nullable(b["notes"]), num(b["labor_cost"]), "open",
	)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if err = a.replacePlanParts(id, b["parts"]); err != nil {
		writeError(w, 400, err)
		return
	}
	row, _ := a.db.QueryOne(`SELECT * FROM plans WHERE id=?`, id)
	out, _ := a.attachPlanParts(row)
	writeJSON(w, 201, out)
}

func (a *API) updatePlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	old, err := a.db.QueryOne(`SELECT * FROM plans WHERE id=?`, id)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if old == nil {
		writeError(w, 404, "Plan not found")
		return
	}
	b, err := bodyMap(r)
	if err != nil {
		writeError(w, 400, "Invalid JSON")
		return
	}
	get := func(k string) any {
		if _, ok := b[k]; ok {
			return b[k]
		}
		return old[k]
	}
	kind := strings.ToLower(strings.TrimSpace(text(get("plan_kind"))))
	if kind != "service" && kind != "upgrade" {
		kind = text(old["plan_kind"])
	}
	title := strings.TrimSpace(text(get("title")))
	if title == "" {
		writeError(w, 400, "title is required")
		return
	}
	status := text(get("status"))
	if status == "" {
		status = "open"
	}
	_, err = a.db.Exec(
		`UPDATE plans SET plan_kind=?, title=?, service_type=?, category=?, notes=?, labor_cost=?, status=?, updated_at=datetime('now') WHERE id=?`,
		kind, title, nullable(get("service_type")), nullable(get("category")), nullable(get("notes")), num(get("labor_cost")), status, id,
	)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if _, ok := b["parts"]; ok {
		if err = a.replacePlanParts(id, b["parts"]); err != nil {
			writeError(w, 400, err)
			return
		}
	}
	row, _ := a.db.QueryOne(`SELECT * FROM plans WHERE id=?`, id)
	out, _ := a.attachPlanParts(row)
	writeJSON(w, 200, out)
}

func (a *API) deletePlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	old, err := a.db.QueryOne(`SELECT id FROM plans WHERE id=?`, id)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if old == nil {
		writeError(w, 404, "Plan not found")
		return
	}
	if _, err = a.db.Exec(`DELETE FROM plans WHERE id=?`, id); err != nil {
		writeError(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"success": true})
}

func (a *API) markPlanApplied(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	old, err := a.db.QueryOne(`SELECT * FROM plans WHERE id=?`, id)
	if err != nil {
		writeError(w, 500, err)
		return
	}
	if old == nil {
		writeError(w, 404, "Plan not found")
		return
	}
	if _, err = a.db.Exec(`UPDATE plans SET status='applied', updated_at=datetime('now') WHERE id=?`, id); err != nil {
		writeError(w, 500, err)
		return
	}
	row, _ := a.db.QueryOne(`SELECT * FROM plans WHERE id=?`, id)
	out, _ := a.attachPlanParts(row)
	writeJSON(w, 200, out)
}

func (a *API) attachPlanParts(row map[string]any) (map[string]any, error) {
	parts, err := a.db.Query(`SELECT * FROM plan_parts WHERE plan_id=? ORDER BY created_at ASC`, row["id"])
	if err != nil {
		return nil, err
	}
	if parts == nil {
		parts = []map[string]any{}
	}
	partsTotal := 0.0
	for _, p := range parts {
		partsTotal += num(p["quantity"]) * num(p["unit_cost"])
	}
	row["parts"] = parts
	row["parts_cost"] = partsTotal
	row["estimated_total"] = partsTotal + num(row["labor_cost"])
	return row, nil
}

func (a *API) replacePlanParts(planID string, raw any) error {
	_, _ = a.db.Exec(`DELETE FROM plan_parts WHERE plan_id=?`, planID)
	if raw == nil {
		return nil
	}
	arr, ok := raw.([]any)
	if !ok {
		return nil
	}
	for _, item := range arr {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		name := strings.TrimSpace(text(m["name"]))
		if name == "" {
			continue
		}
		acq := strings.ToLower(strings.TrimSpace(text(m["acquisition"])))
		if acq != "owned" {
			acq = "need"
		}
		qty := num(m["quantity"])
		if qty <= 0 {
			qty = 1
		}
		var inv any
		if text(m["inventory_item_id"]) != "" {
			inv = text(m["inventory_item_id"])
			acq = "owned"
		}
		pid := db.NewID("pp")
		if _, err := a.db.Exec(
			`INSERT INTO plan_parts(id,plan_id,inventory_item_id,name,quantity,unit_cost,acquisition,notes) VALUES(?,?,?,?,?,?,?,?)`,
			pid, planID, inv, name, qty, num(m["unit_cost"]), acq, nullable(m["notes"]),
		); err != nil {
			return err
		}
	}
	return nil
}
