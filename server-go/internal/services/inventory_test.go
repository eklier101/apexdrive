package services

import (
	"path/filepath"
	"testing"

	"github.com/eklier101/apexdrive/internal/db"
)

func TestApplyServicePartsDoesNotDeductWhenLaterItemIsShort(t *testing.T) {
	dir := t.TempDir()
	d, err := db.Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer d.Close()

	if _, err := d.Exec(`INSERT INTO users(id,username,password_hash,salt) VALUES('usr_a','alice','x','s')`); err != nil {
		t.Fatal(err)
	}
	if _, err := d.Exec(`INSERT INTO vehicles(id,user_id,name,make,model,year) VALUES('veh_a','usr_a','Civic','Honda','Civic',2020)`); err != nil {
		t.Fatal(err)
	}
	if _, err := d.Exec(`INSERT INTO services(id,vehicle_id,date,odometer,service_type,title) VALUES('srv_a','veh_a','2026-01-01',1000,'Oil Change','Oil')`); err != nil {
		t.Fatal(err)
	}
	if _, err := d.Exec(`INSERT INTO parts_inventory(id,user_id,name,category,unit,unit_cost,quantity_on_hand) VALUES('inv_oil','usr_a','Oil','Oil','bottle',8,2)`); err != nil {
		t.Fatal(err)
	}
	if _, err := d.Exec(`INSERT INTO parts_inventory(id,user_id,name,category,unit,unit_cost,quantity_on_hand) VALUES('inv_filter','usr_a','Filter','Oil Filter','each',12,1)`); err != nil {
		t.Fatal(err)
	}

	_, err = ApplyServiceParts(d, "srv_a", []ServicePartInput{
		{InventoryItemID: "inv_oil", Name: "Oil", Quantity: 1},
		{InventoryItemID: "inv_filter", Name: "Filter", Quantity: 2},
	})
	if err == nil {
		t.Fatal("expected stock error")
	}

	oil, err := d.QueryOne(`SELECT quantity_on_hand FROM parts_inventory WHERE id='inv_oil'`)
	if err != nil {
		t.Fatal(err)
	}
	if number(oil["quantity_on_hand"]) != 2 {
		t.Fatalf("oil stock changed after failed apply: %v", oil["quantity_on_hand"])
	}
	filter, err := d.QueryOne(`SELECT quantity_on_hand FROM parts_inventory WHERE id='inv_filter'`)
	if err != nil {
		t.Fatal(err)
	}
	if number(filter["quantity_on_hand"]) != 1 {
		t.Fatalf("filter stock changed after failed apply: %v", filter["quantity_on_hand"])
	}
	parts, err := GetServiceParts(d, "srv_a")
	if err != nil {
		t.Fatal(err)
	}
	if len(parts) != 0 {
		t.Fatalf("service parts should be empty, got %#v", parts)
	}
}
