package services

import (
	"encoding/json"
	"math"
	"path/filepath"
	"testing"

	"github.com/eklier101/apexdrive/internal/db"
)

func testDB(t *testing.T) *db.DB {
	t.Helper()
	d, err := db.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = d.Close() })
	return d
}

func seedVehicle(t *testing.T, d *db.DB) string {
	t.Helper()
	id := "veh_test"
	_, err := d.Exec(`INSERT INTO vehicles(id,name,make,model,year) VALUES(?,?,?,?,?)`, id, "Test", "Ford", "Focus", 2015)
	if err != nil {
		t.Fatal(err)
	}
	return id
}

func TestRecalculateVehicleFillupsZeroGallonsDoesNotWriteInf(t *testing.T) {
	d := testDB(t)
	vid := seedVehicle(t, d)

	_, err := d.Exec(`INSERT INTO fillups(id,vehicle_id,date,odometer,gallons,price_per_unit,total_cost,is_full_tank,is_missed)
		VALUES(?,?,?,?,?,?,?,?,?)`, "flp_1", vid, "2026-01-01", 1000, 10.0, 3.5, 35.0, 1, 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = d.Exec(`INSERT INTO fillups(id,vehicle_id,date,odometer,gallons,price_per_unit,total_cost,is_full_tank,is_missed)
		VALUES(?,?,?,?,?,?,?,?,?)`, "flp_2", vid, "2026-01-08", 1100, 0.0, 0.0, 0.0, 1, 0)
	if err != nil {
		t.Fatal(err)
	}

	if err := RecalculateVehicleFillups(d, vid); err != nil {
		t.Fatalf("recalculate: %v", err)
	}

	rows, err := d.Query(`SELECT id, gallons, calculated_mpg, calculated_cost_per_unit_distance, distance_traveled FROM fillups ORDER BY odometer`)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := json.Marshal(rows); err != nil {
		t.Fatalf("fillups must be JSON-encodable after recalculate (zero-gallon full tank): %v\nrows=%v", err, rows)
	}
	for _, row := range rows {
		if mpg, ok := row["calculated_mpg"].(float64); ok && (math.IsInf(mpg, 0) || math.IsNaN(mpg)) {
			t.Fatalf("calculated_mpg for %v is non-finite: %v", row["id"], mpg)
		}
		if cost, ok := row["calculated_cost_per_unit_distance"].(float64); ok && (math.IsInf(cost, 0) || math.IsNaN(cost)) {
			t.Fatalf("calculated_cost_per_unit_distance for %v is non-finite: %v", row["id"], cost)
		}
	}
}

func TestRecalculateVehicleFillupsNormalInterval(t *testing.T) {
	d := testDB(t)
	vid := seedVehicle(t, d)

	_, err := d.Exec(`INSERT INTO fillups(id,vehicle_id,date,odometer,gallons,price_per_unit,total_cost,is_full_tank,is_missed)
		VALUES(?,?,?,?,?,?,?,?,?)`, "flp_1", vid, "2026-01-01", 1000, 10.0, 3.5, 35.0, 1, 0)
	if err != nil {
		t.Fatal(err)
	}
	_, err = d.Exec(`INSERT INTO fillups(id,vehicle_id,date,odometer,gallons,price_per_unit,total_cost,is_full_tank,is_missed)
		VALUES(?,?,?,?,?,?,?,?,?)`, "flp_2", vid, "2026-01-08", 1250, 10.0, 3.5, 35.0, 1, 0)
	if err != nil {
		t.Fatal(err)
	}

	if err := RecalculateVehicleFillups(d, vid); err != nil {
		t.Fatalf("recalculate: %v", err)
	}

	row, err := d.QueryOne(`SELECT calculated_mpg, distance_traveled FROM fillups WHERE id=?`, "flp_2")
	if err != nil {
		t.Fatal(err)
	}
	mpg := number(row["calculated_mpg"])
	dist := number(row["distance_traveled"])
	if mpg != 25 {
		t.Fatalf("mpg=%v want 25", mpg)
	}
	if dist != 250 {
		t.Fatalf("distance=%v want 250", dist)
	}
}
