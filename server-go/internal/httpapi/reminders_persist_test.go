package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/eklier101/apexdrive/internal/config"
	"github.com/eklier101/apexdrive/internal/db"
)

func testRouter(t *testing.T) http.Handler {
	t.Helper()
	dir := t.TempDir()
	database, err := db.Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = database.Close() })
	cfg := &config.Config{
		JWTSecret:  "test-secret",
		UploadsDir: filepath.Join(dir, "uploads"),
		APKsDir:    filepath.Join(dir, "apks"),
		PublicDir:  filepath.Join(dir, "public"),
	}
	return NewRouter(cfg, database)
}

func decodeMap(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("decode JSON: %v body=%s", err, rec.Body.String())
	}
	return out
}

func jsonReq(t *testing.T, h http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var r *http.Request
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		r = httptest.NewRequest(method, path, bytes.NewReader(b))
		r.Header.Set("Content-Type", "application/json")
	} else {
		r = httptest.NewRequest(method, path, nil)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, r)
	return rec
}

func seedVehicle(t *testing.T, h http.Handler) string {
	t.Helper()
	rec := jsonReq(t, h, http.MethodPost, "/api/vehicles", map[string]any{
		"name": "Test Car", "make": "Toyota", "model": "Camry", "year": 2020,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create vehicle: %d %s", rec.Code, rec.Body.String())
	}
	return text(decodeMap(t, rec)["id"])
}

// Manual last-performed must survive create + list + dashboard. Syncing from
// older service logs on those reads silently discards the user's value and
// marks the reminder overdue.
func TestReminderKeepsManualLastServiceDespiteOlderLog(t *testing.T) {
	h := testRouter(t)
	vid := seedVehicle(t, h)

	rec := jsonReq(t, h, http.MethodPost, "/api/services", map[string]any{
		"vehicle_id":   vid,
		"service_type": "Oil Change",
		"title":        "Engine Oil & Filter",
		"odometer":     20000,
		"date":         "2024-01-15",
		"parts_cost":   0,
		"labor_cost":   0,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create service: %d %s", rec.Code, rec.Body.String())
	}

	rec = jsonReq(t, h, http.MethodPost, "/api/reminders", map[string]any{
		"vehicle_id":             vid,
		"service_type":           "Oil Change",
		"title":                  "Engine Oil & Filter Change",
		"interval_miles":         5000,
		"interval_months":        0,
		"last_serviced_odometer": 55000,
		"last_serviced_date":     "2026-08-01",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create reminder: %d %s", rec.Code, rec.Body.String())
	}
	created := decodeMap(t, rec)
	if num(created["last_serviced_odometer"]) != 55000 {
		t.Fatalf("create overwrote last_serviced_odometer: got %v want 55000 body=%s", created["last_serviced_odometer"], rec.Body.String())
	}
	if num(created["next_due_odometer"]) != 60000 {
		t.Fatalf("create next_due_odometer: got %v want 60000", created["next_due_odometer"])
	}

	rec = jsonReq(t, h, http.MethodGet, "/api/reminders?vehicle_id="+vid, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("list reminders: %d %s", rec.Code, rec.Body.String())
	}
	var listed []map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &listed); err != nil {
		t.Fatalf("list JSON: %v", err)
	}
	if len(listed) != 1 {
		t.Fatalf("list len=%d", len(listed))
	}
	if num(listed[0]["last_serviced_odometer"]) != 55000 {
		t.Fatalf("GET /reminders overwrote last_serviced_odometer: got %v want 55000", listed[0]["last_serviced_odometer"])
	}

	rec = jsonReq(t, h, http.MethodGet, "/api/stats/dashboard?vehicle_id="+vid, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("dashboard: %d %s", rec.Code, rec.Body.String())
	}
	dash := decodeMap(t, rec)
	rems, _ := dash["reminders"].([]any)
	if len(rems) != 1 {
		t.Fatalf("dashboard reminders len=%d", len(rems))
	}
	rem, _ := rems[0].(map[string]any)
	if num(rem["last_serviced_odometer"]) != 55000 {
		t.Fatalf("dashboard overwrote last_serviced_odometer: got %v want 55000", rem["last_serviced_odometer"])
	}
}

func TestLoggingMatchingServiceStillResetsReminder(t *testing.T) {
	h := testRouter(t)
	vid := seedVehicle(t, h)

	rec := jsonReq(t, h, http.MethodPost, "/api/reminders", map[string]any{
		"vehicle_id":             vid,
		"service_type":           "Oil Change",
		"title":                  "Engine Oil & Filter Change",
		"interval_miles":         5000,
		"last_serviced_odometer": 10000,
		"last_serviced_date":     "2025-01-01",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create reminder: %d %s", rec.Code, rec.Body.String())
	}

	rec = jsonReq(t, h, http.MethodPost, "/api/services", map[string]any{
		"vehicle_id":   vid,
		"service_type": "Oil Change",
		"title":        "Engine Oil & Filter",
		"odometer":     16000,
		"date":         "2026-06-01",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create service: %d %s", rec.Code, rec.Body.String())
	}

	rec = jsonReq(t, h, http.MethodGet, "/api/reminders?vehicle_id="+vid, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("list reminders: %d %s", rec.Code, rec.Body.String())
	}
	var listed []map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &listed); err != nil {
		t.Fatal(err)
	}
	if len(listed) != 1 {
		t.Fatalf("list len=%d", len(listed))
	}
	if num(listed[0]["last_serviced_odometer"]) != 16000 {
		t.Fatalf("expected service log to reset last_serviced_odometer to 16000, got %v", listed[0]["last_serviced_odometer"])
	}
	if num(listed[0]["next_due_odometer"]) != 21000 {
		t.Fatalf("expected next_due_odometer 21000, got %v", listed[0]["next_due_odometer"])
	}
}
