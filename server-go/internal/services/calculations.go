package services

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/eklier101/apexdrive/internal/db"
)

func number(v any) float64 {
	switch n := v.(type) {
	case int64:
		return float64(n)
	case float64:
		return n
	case int:
		return float64(n)
	}
	return 0
}

func rounded(v float64, places int) float64 {
	p := math.Pow10(places)
	return math.Round(v*p) / p
}

func RecalculateVehicleFillups(d *db.DB, vehicleID string) error {
	rows, err := d.Query(`SELECT * FROM fillups WHERE vehicle_id=? ORDER BY odometer ASC,date ASC`, vehicleID)
	if err != nil {
		return err
	}
	var last map[string]any
	accumulated := 0.0
	for i, cur := range rows {
		var mpg, distance, cost any
		full, missed := number(cur["is_full_tank"]) != 0, number(cur["is_missed"]) != 0
		if i == 0 || missed {
			if full {
				last, accumulated = cur, 0
			}
		} else if last != nil {
			dist := number(cur["odometer"]) - number(last["odometer"])
			if dist > 0 {
				accumulated += number(cur["gallons"])
				if full {
					mpg = rounded(dist/accumulated, 2)
					distance = rounded(dist, 1)
					cost = rounded(number(cur["total_cost"])/dist, 4)
					last, accumulated = cur, 0
				}
			}
		} else if full {
			last, accumulated = cur, 0
		}
		if _, err := d.Exec(`UPDATE fillups SET calculated_mpg=?,calculated_cost_per_unit_distance=?,distance_traveled=? WHERE id=?`,
			mpg, cost, distance, cur["id"]); err != nil {
			return err
		}
	}
	return nil
}

func SyncVehicleReminders(d *db.DB, vehicleID string) error {
	rows, err := d.Query(`SELECT * FROM service_reminders WHERE vehicle_id=?`, vehicleID)
	if err != nil {
		return err
	}
	for _, rem := range rows {
		latest, err := d.QueryOne(`SELECT * FROM services WHERE vehicle_id=? AND (service_type=? OR title LIKE ?) ORDER BY odometer DESC,date DESC LIMIT 1`,
			vehicleID, rem["service_type"], "%"+fmt.Sprint(rem["service_type"])+"%")
		if err != nil {
			return err
		}
		lastOdo, lastDate := rem["last_serviced_odometer"], rem["last_serviced_date"]
		if latest != nil {
			lastOdo, lastDate = latest["odometer"], latest["date"]
		}
		var nextOdo, nextDate any
		if number(rem["interval_miles"]) != 0 && lastOdo != nil {
			nextOdo = number(lastOdo) + number(rem["interval_miles"])
		}
		if months := int(number(rem["interval_months"])); months != 0 && lastDate != nil {
			if t, e := time.Parse("2006-01-02", fmt.Sprint(lastDate)); e == nil {
				nextDate = t.AddDate(0, months, 0).Format("2006-01-02")
			}
		}
		if _, err := d.Exec(`UPDATE service_reminders SET last_serviced_odometer=?,last_serviced_date=?,next_due_odometer=?,next_due_date=? WHERE id=?`,
			lastOdo, lastDate, nextOdo, nextDate, rem["id"]); err != nil {
			return err
		}
	}
	return nil
}

func reminderStatus(rem map[string]any, current float64) map[string]any {
	status := "good"
	var miles, days any
	if rem["next_due_odometer"] != nil {
		n := number(rem["next_due_odometer"]) - current
		miles = n
		if n <= 0 {
			status = "overdue"
		} else if n <= 500 {
			status = "due_soon"
		}
	}
	if rem["next_due_date"] != nil {
		if due, err := time.Parse("2006-01-02", fmt.Sprint(rem["next_due_date"])); err == nil {
			n := math.Ceil(due.Sub(time.Now()).Hours() / 24)
			days = n
			if n <= 0 {
				status = "overdue"
			} else if n <= 14 && status != "overdue" {
				status = "due_soon"
			}
		}
	}
	rem["status"], rem["miles_remaining"], rem["days_remaining"] = status, miles, days
	return rem
}

func GetDashboardStats(d *db.DB, vehicleID string) (map[string]any, error) {
	vehicle, err := d.QueryOne(`SELECT * FROM vehicles WHERE id=?`, vehicleID)
	if err != nil || vehicle == nil {
		return nil, err
	}
	fillups, err := d.Query(`SELECT * FROM fillups WHERE vehicle_id=? ORDER BY odometer DESC,date DESC`, vehicleID)
	if err != nil { return nil, err }
	svcs, err := d.Query(`SELECT * FROM services WHERE vehicle_id=? ORDER BY date DESC`, vehicleID)
	if err != nil { return nil, err }
	upgrades, err := d.Query(`SELECT * FROM upgrades WHERE vehicle_id=? ORDER BY date DESC`, vehicleID)
	if err != nil { return nil, err }
	expenses, err := d.Query(`SELECT * FROM other_expenses WHERE vehicle_id=? ORDER BY date DESC`, vehicleID)
	if err != nil { return nil, err }
	reminders, err := d.Query(`SELECT * FROM service_reminders WHERE vehicle_id=?`, vehicleID)
	if err != nil { return nil, err }

	current := number(vehicle["purchase_odometer"])
	for _, r := range append(append([]map[string]any{}, fillups...), svcs...) {
		current = math.Max(current, number(r["odometer"]))
	}
	minOdo := number(vehicle["purchase_odometer"])
	if minOdo == 0 && len(fillups) > 0 {
		minOdo = number(fillups[0]["odometer"])
		for _, f := range fillups { minOdo = math.Min(minOdo, number(f["odometer"])) }
	}
	miles := math.Max(0, current-minOdo)
	var fuelCost, gallons, svcCost, partsCost, laborCost, upgradesCost, otherCost float64
	var mpgs []float64
	diy := 0
	for _, f := range fillups {
		fuelCost += number(f["total_cost"]); gallons += number(f["gallons"])
		if m := number(f["calculated_mpg"]); m > 0 && m < 150 { mpgs = append(mpgs, m) }
	}
	for _, s := range svcs {
		svcCost += number(s["total_cost"]); partsCost += number(s["parts_cost"]); laborCost += number(s["labor_cost"])
		if number(s["is_diy"]) == 1 { diy++ }
	}
	for _, u := range upgrades { upgradesCost += number(u["total_cost"]) }
	for _, e := range expenses { otherCost += number(e["amount"]) }
	avg, best, worst, last := 0.0, 0.0, 0.0, 0.0
	if len(mpgs) > 0 {
		best, worst, last = mpgs[0], mpgs[0], mpgs[0]
		for _, m := range mpgs { avg += m; best = math.Max(best, m); worst = math.Min(worst, m) }
		avg = rounded(avg/float64(len(mpgs)), 2)
	}
	for i := range reminders { reminders[i] = reminderStatus(reminders[i], current) }
	totalSpent := fuelCost + svcCost + upgradesCost + otherCost
	ratio := func(a, b float64, p int) float64 { if b == 0 { return 0 }; return rounded(a/b, p) }

	timeline := make([]map[string]any, 0)
	add := func(rows []map[string]any, typ string) {
		for i, r := range rows {
			if i == 5 { break }
			ev := map[string]any{"type": typ, "id": r["id"], "date": r["date"], "cost": r["total_cost"]}
			switch typ {
			case "fillup":
				ev["odometer"], ev["title"] = r["odometer"], fmt.Sprintf("Fuel Fillup (%v %v)", r["gallons"], vehicle["fuel_unit"])
				if number(r["calculated_mpg"]) != 0 { ev["extra"] = fmt.Sprintf("%v MPG", r["calculated_mpg"]) }
			case "service":
				ev["odometer"], ev["title"] = r["odometer"], r["title"]
				if number(r["is_diy"]) != 0 { ev["extra"] = "DIY" } else if r["service_provider"] != nil { ev["extra"] = r["service_provider"] } else { ev["extra"] = "Shop" }
			case "upgrade":
				ev["odometer"], ev["title"], ev["extra"] = r["odometer"], r["title"], r["category"]
			case "expense":
				ev["odometer"], ev["title"], ev["cost"] = nil, r["category"], r["amount"]
				if r["notes"] != nil { ev["extra"] = r["notes"] }
			}
			timeline = append(timeline, ev)
		}
	}
	add(fillups, "fillup"); add(svcs, "service"); add(upgrades, "upgrade"); add(expenses, "expense")
	sort.SliceStable(timeline, func(i, j int) bool { return fmt.Sprint(timeline[i]["date"]) > fmt.Sprint(timeline[j]["date"]) })
	if len(timeline) > 10 { timeline = timeline[:10] }

	return map[string]any{
		"vehicle": vehicle,
		"metrics": map[string]any{
			"currentOdometer": current, "totalMilesDriven": miles,
			"fuel": map[string]any{"totalCost": fuelCost, "totalGallons": gallons, "avgPricePerUnit": ratio(fuelCost, gallons, 3), "costPerMile": ratio(fuelCost, miles, 3), "avgMpg": avg, "bestMpg": best, "worstMpg": worst, "lastMpg": last, "fillupCount": len(fillups)},
			"service": map[string]any{"totalCost": svcCost, "partsCost": partsCost, "laborCost": laborCost, "serviceCount": len(svcs), "diyCount": diy},
			"upgrades": map[string]any{"totalCost": upgradesCost, "upgradeCount": len(upgrades)},
			"expenses": map[string]any{"totalCost": otherCost, "expenseCount": len(expenses)},
			"tco": map[string]any{"purchasePrice": number(vehicle["purchase_price"]), "totalSpentExcludingPurchase": totalSpent, "totalTCO": totalSpent + number(vehicle["purchase_price"]), "overallCostPerMile": ratio(totalSpent, miles, 3)},
		},
		"reminders": reminders,
		"spendBreakdown": []map[string]any{
			{"name":"Fuel","value":rounded(fuelCost,2),"color":"#3B82F6"},
			{"name":"Maintenance & Service","value":rounded(svcCost,2),"color":"#10B981"},
			{"name":"Upgrades & Mods","value":rounded(upgradesCost,2),"color":"#8B5CF6"},
			{"name":"Other Expenses","value":rounded(otherCost,2),"color":"#F59E0B"},
		},
		"timeline": timeline,
	}, nil
}

func GetTrends(d *db.DB, vehicleID string) (map[string]any, error) {
	fillups, err := d.Query(`SELECT date,odometer,gallons,price_per_unit,total_cost,calculated_mpg,distance_traveled FROM fillups WHERE vehicle_id=? ORDER BY date ASC,odometer ASC`, vehicleID)
	if err != nil { return nil, err }
	type source struct{ query, kind, cost string }
	sources := []source{
		{`SELECT date,total_cost FROM services WHERE vehicle_id=?`, "service", "total_cost"},
		{`SELECT date,total_cost FROM upgrades WHERE vehicle_id=?`, "upgrades", "total_cost"},
		{`SELECT date,amount FROM other_expenses WHERE vehicle_id=?`, "other", "amount"},
	}
	monthly := map[string]map[string]any{}
	ensure := func(month string) map[string]any {
		if monthly[month] == nil { monthly[month] = map[string]any{"month":month,"fuel":0.0,"service":0.0,"upgrades":0.0,"other":0.0,"total":0.0,"gallons":0.0,"miles":0.0} }
		return monthly[month]
	}
	for _, f := range fillups {
		date := fmt.Sprint(f["date"]); if len(date) < 7 { continue }; m := ensure(date[:7])
		for k, v := range map[string]float64{"fuel":number(f["total_cost"]),"total":number(f["total_cost"]),"gallons":number(f["gallons"]),"miles":number(f["distance_traveled"])} { m[k] = number(m[k])+v }
	}
	for _, s := range sources {
		rows, e := d.Query(s.query, vehicleID); if e != nil { return nil, e }
		for _, r := range rows {
			date := fmt.Sprint(r["date"]); if len(date) < 7 { continue }; m := ensure(date[:7]); val := number(r[s.cost])
			m[s.kind], m["total"] = number(m[s.kind])+val, number(m["total"])+val
		}
	}
	keys := make([]string,0,len(monthly)); for k := range monthly { keys=append(keys,k) }; sort.Strings(keys)
	out := make([]map[string]any,0,len(keys))
	for _, k := range keys {
		m:=monthly[k]; for _, p:=range []string{"fuel","service","upgrades","other","total"} { m[p]=rounded(number(m[p]),2) }; m["gallons"]=rounded(number(m["gallons"]),1); m["miles"]=rounded(number(m["miles"]),1); out=append(out,m)
	}
	timeline := make([]map[string]any,0,len(fillups))
	for _, f := range fillups { timeline=append(timeline,map[string]any{"date":f["date"],"odometer":f["odometer"],"mpg":f["calculated_mpg"],"pricePerUnit":f["price_per_unit"],"gallons":f["gallons"],"totalCost":f["total_cost"],"distance":f["distance_traveled"]}) }
	return map[string]any{"monthlyTrends":out,"fillupTimeline":timeline},nil
}

func EnrichReminders(rows []map[string]any, current float64) []map[string]any {
	for i := range rows { rows[i] = reminderStatus(rows[i], current) }
	return rows
}

func MonthDate(date any, months int) any {
	if date == nil || strings.TrimSpace(fmt.Sprint(date)) == "" { return nil }
	t, err := time.Parse("2006-01-02", fmt.Sprint(date)); if err != nil { return nil }
	return t.AddDate(0, months, 0).Format("2006-01-02")
}
