package db

import (
	"encoding/json"
	"math"
	"path/filepath"
	"testing"
)

func TestQuerySanitizesNonFiniteFloats(t *testing.T) {
	d, err := Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = d.Close() })

	_, err = d.Exec(`INSERT INTO vehicles(id,name,make,model,year) VALUES(?,?,?,?,?)`, "veh_1", "T", "Ford", "Focus", 2015)
	if err != nil {
		t.Fatal(err)
	}
	_, err = d.Exec(`INSERT INTO fillups(id,vehicle_id,date,odometer,gallons,price_per_unit,total_cost,calculated_mpg)
		VALUES(?,?,?,?,?,?,?,?)`, "flp_1", "veh_1", "2026-01-01", 1000, 10.0, 3.5, 35.0, math.Inf(1))
	if err != nil {
		t.Fatal(err)
	}

	row, err := d.QueryOne(`SELECT calculated_mpg FROM fillups WHERE id=?`, "flp_1")
	if err != nil {
		t.Fatal(err)
	}
	if row["calculated_mpg"] != nil {
		t.Fatalf("expected Inf to be sanitized to nil, got %v", row["calculated_mpg"])
	}
	if _, err := json.Marshal(row); err != nil {
		t.Fatalf("sanitized row must be JSON-encodable: %v", err)
	}
}
