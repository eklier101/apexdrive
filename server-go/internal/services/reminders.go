package services

import (
	"fmt"
	"strings"

	"github.com/eklier101/apexdrive/internal/db"
)

// SyncVehicleReminders resets each reminder from the latest matching service log.
// Interval rules:
//   - interval_miles > 0  → next_due_odometer = last_odo + miles
//   - interval_months > 0 → next_due_date = last_date + months
//   - zero / null means that axis is unused
// Status treats both dues as "whichever comes first" (overdue if either is past).
func SyncVehicleReminders(d *db.DB, vehicleID string) error {
	rows, err := d.Query(`SELECT * FROM service_reminders WHERE vehicle_id=?`, vehicleID)
	if err != nil {
		return err
	}
	services, err := d.Query(`SELECT * FROM services WHERE vehicle_id=? ORDER BY odometer DESC, date DESC`, vehicleID)
	if err != nil {
		return err
	}

	for _, rem := range rows {
		remType := fmt.Sprint(rem["service_type"])
		var latest map[string]any
		for _, s := range services {
			if ServiceMatchesReminder(fmt.Sprint(s["service_type"]), fmt.Sprint(s["title"]), remType) {
				latest = s
				break
			}
		}

		lastOdo, lastDate := rem["last_serviced_odometer"], rem["last_serviced_date"]
		clearedDismissed := false
		if latest != nil {
			if fmt.Sprint(lastOdo) != fmt.Sprint(latest["odometer"]) || fmt.Sprint(lastDate) != fmt.Sprint(latest["date"]) {
				clearedDismissed = true
			}
			lastOdo, lastDate = latest["odometer"], latest["date"]
		}

		miles := number(rem["interval_miles"])
		months := int(number(rem["interval_months"]))
		var nextOdo, nextDate any
		if miles > 0 && lastOdo != nil {
			nextOdo = number(lastOdo) + miles
		}
		if months > 0 && lastDate != nil {
			nextDate = MonthDate(lastDate, months)
		}

		if clearedDismissed {
			_, err = d.Exec(`UPDATE service_reminders SET last_serviced_odometer=?, last_serviced_date=?, next_due_odometer=?, next_due_date=?, is_dismissed=0, updated_at=datetime('now') WHERE id=?`,
				lastOdo, lastDate, nextOdo, nextDate, rem["id"])
		} else {
			_, err = d.Exec(`UPDATE service_reminders SET last_serviced_odometer=?, last_serviced_date=?, next_due_odometer=?, next_due_date=? WHERE id=?`,
				lastOdo, lastDate, nextOdo, nextDate, rem["id"])
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// ServiceMatchesReminder links a logged service to a reminder interval.
func ServiceMatchesReminder(serviceType, title, reminderType string) bool {
	rem := normalizeServiceKey(reminderType)
	if rem == "" {
		return false
	}
	svcType := normalizeServiceKey(serviceType)
	svcTitle := normalizeServiceKey(title)

	if svcType == rem || svcTitle == rem {
		return true
	}
	if strings.Contains(svcType, rem) || strings.Contains(svcTitle, rem) {
		return true
	}
	if strings.Contains(rem, svcType) && len(svcType) >= 4 {
		return true
	}

	remCanon := canonicalServiceType(rem)
	svcCanon := canonicalServiceType(svcType)
	titleCanon := canonicalServiceType(svcTitle)
	if remCanon != "" && (remCanon == svcCanon || remCanon == titleCanon) {
		return true
	}
	return false
}

func normalizeServiceKey(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	replacer := strings.NewReplacer(
		"&", " and ",
		"/", " ",
		"-", " ",
		"_", " ",
		",", " ",
		".", " ",
	)
	s = replacer.Replace(s)
	for strings.Contains(s, "  ") {
		s = strings.ReplaceAll(s, "  ", " ")
	}
	return strings.TrimSpace(s)
}

func canonicalServiceType(s string) string {
	s = normalizeServiceKey(s)
	switch {
	case strings.Contains(s, "oil") && (strings.Contains(s, "change") || strings.Contains(s, "filter") || s == "oil"):
		return "oil_change"
	case strings.Contains(s, "spark") && strings.Contains(s, "plug"):
		return "spark_plugs"
	case strings.Contains(s, "cabin") && strings.Contains(s, "filter"):
		return "cabin_air_filter"
	case strings.Contains(s, "engine") && strings.Contains(s, "air") && strings.Contains(s, "filter"):
		return "engine_air_filter"
	case strings.Contains(s, "air filter") && !strings.Contains(s, "cabin"):
		return "engine_air_filter"
	case strings.Contains(s, "tire") && strings.Contains(s, "rotat"):
		return "tire_rotation"
	case strings.Contains(s, "tire") && (strings.Contains(s, "replace") || strings.Contains(s, "new")):
		return "tire_replacement"
	case strings.Contains(s, "brake") && strings.Contains(s, "fluid"):
		return "brake_fluid"
	case strings.Contains(s, "brake"):
		return "brake_service"
	case strings.Contains(s, "coolant") || strings.Contains(s, "antifreeze"):
		return "coolant"
	case strings.Contains(s, "transmission") || strings.Contains(s, "trans fluid"):
		return "transmission"
	case strings.Contains(s, "battery"):
		return "battery"
	case strings.Contains(s, "align"):
		return "alignment"
	case strings.Contains(s, "inspect"):
		return "inspection"
	default:
		return s
	}
}
