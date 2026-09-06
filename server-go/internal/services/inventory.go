package services

import (
	"fmt"
	"strings"

	"github.com/eklier101/apexdrive/internal/db"
)

type ServicePartInput struct {
	InventoryItemID any
	Name            string
	Quantity        float64
	UnitCost        float64
}

func GetServiceParts(d *db.DB, serviceID string) ([]map[string]any, error) {
	return d.Query(`SELECT * FROM service_parts WHERE service_id=? ORDER BY created_at ASC`, serviceID)
}

func GetServicePartsForServices(d *db.DB, ids []string) ([]map[string]any, error) {
	if len(ids) == 0 {
		return []map[string]any{}, nil
	}
	args := make([]any, len(ids))
	marks := make([]string, len(ids))
	for i := range ids {
		args[i], marks[i] = ids[i], "?"
	}
	return d.Query(`SELECT * FROM service_parts WHERE service_id IN (`+strings.Join(marks, ",")+`) ORDER BY service_id,created_at ASC`, args...)
}

func RestoreServiceParts(d *db.DB, serviceID string) error {
	parts, err := GetServiceParts(d, serviceID)
	if err != nil {
		return err
	}
	for _, p := range parts {
		if p["inventory_item_id"] != nil {
			if _, err := d.Exec(`UPDATE parts_inventory SET quantity_on_hand=quantity_on_hand+?,updated_at=datetime('now') WHERE id=?`,
				number(p["quantity"]), p["inventory_item_id"]); err != nil {
				return err
			}
		}
	}
	_, err = d.Exec(`DELETE FROM service_parts WHERE service_id=?`, serviceID)
	return err
}

func ApplyServiceParts(d *db.DB, serviceID string, parts []ServicePartInput) (float64, error) {
	total := 0.0
	for _, p := range parts {
		if p.Quantity <= 0 {
			continue
		}
		name, unitCost := strings.TrimSpace(p.Name), p.UnitCost
		if name == "" {
			name = "Part"
		}
		var inventoryID any
		if p.InventoryItemID != nil && fmt.Sprint(p.InventoryItemID) != "" {
			inventoryID = p.InventoryItemID
			item, err := d.QueryOne(`SELECT * FROM parts_inventory WHERE id=?`, inventoryID)
			if err != nil {
				return 0, err
			}
			if item == nil {
				return 0, fmt.Errorf("inventory item not found: %s", name)
			}
			if number(item["quantity_on_hand"]) < p.Quantity {
				return 0, fmt.Errorf("not enough %q in stock (have %v, need %v)", item["name"], item["quantity_on_hand"], p.Quantity)
			}
			name, unitCost = fmt.Sprint(item["name"]), number(item["unit_cost"])
			if _, err := d.Exec(`UPDATE parts_inventory SET quantity_on_hand=MAX(0,quantity_on_hand-?),updated_at=datetime('now') WHERE id=?`, p.Quantity, inventoryID); err != nil {
				return 0, err
			}
		}
		line := rounded(unitCost*p.Quantity, 2)
		total += line
		if _, err := d.Exec(`INSERT INTO service_parts(id,service_id,inventory_item_id,name,quantity,unit_cost,total_cost) VALUES(?,?,?,?,?,?,?)`,
			db.NewID("sp"), serviceID, inventoryID, name, p.Quantity, unitCost, line); err != nil {
			return 0, err
		}
	}
	return rounded(total, 2), nil
}
