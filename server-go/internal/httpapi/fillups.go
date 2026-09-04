package httpapi

import (
	"net/http"

	"github.com/eklier101/apexdrive/internal/db"
	"github.com/eklier101/apexdrive/internal/services"
	"github.com/go-chi/chi/v5"
)

func (a *API) fillupRoutes(r chi.Router){
	r.Route("/fillups",func(r chi.Router){r.Get("/",a.listFillups);r.Get("/latest",a.latestFillup);r.Post("/",a.createFillup);r.Put("/{id}",a.updateFillup);r.Delete("/{id}",a.deleteFillup)})
}
func (a *API) listFillups(w http.ResponseWriter,r *http.Request){id,ok:=a.vehicleQuery(w,r);if !ok{return};rows,err:=a.db.Query(`SELECT * FROM fillups WHERE vehicle_id=? ORDER BY odometer DESC,date DESC`,id);if err!=nil{writeError(w,500,err);return};writeJSON(w,200,rows)}
func (a *API) latestFillup(w http.ResponseWriter,r *http.Request){id,ok:=a.vehicleQuery(w,r);if !ok{return};row,err:=a.db.QueryOne(`SELECT * FROM fillups WHERE vehicle_id=? ORDER BY odometer DESC,date DESC LIMIT 1`,id);if err!=nil{writeError(w,500,err);return};writeJSON(w,200,row)}
func fillupCosts(b map[string]any,old map[string]any)(float64,float64,float64){
	gal:=num(value(b,"gallons",old["gallons"]));price:=num(value(b,"price_per_unit",old["price_per_unit"]));total:=num(value(b,"total_cost",old["total_cost"]))
	if total>0&&price==0&&gal>0{price=roundedHTTP(total/gal,3)}else if price>0&&gal>0{if _,ok:=b["total_cost"];!ok||total==0{total=roundedHTTP(price*gal,2)}}
	return gal,price,total
}
func roundedHTTP(v float64,p int)float64{m:=1.0;for i:=0;i<p;i++{m*=10};return float64(int(v*m+0.5))/m}
func (a *API) createFillup(w http.ResponseWriter,r *http.Request){
	b,err:=bodyMap(r);if err!=nil{writeError(w,400,"Invalid JSON");return};if text(b["vehicle_id"])==""{writeError(w,400,"vehicle_id, odometer, and gallons are required");return};if _,ok:=b["odometer"];!ok{writeError(w,400,"vehicle_id, odometer, and gallons are required");return};if _,ok:=b["gallons"];!ok{writeError(w,400,"vehicle_id, odometer, and gallons are required");return};if _,ok:=a.ownedVehicle(w,r,text(b["vehicle_id"]));!ok{return}
	gal,price,total:=fillupCosts(b,map[string]any{"gallons":0,"price_per_unit":0,"total_cost":0});id:=db.NewID("flp")
	_,err=a.db.Exec(`INSERT INTO fillups(id,vehicle_id,date,odometer,gallons,price_per_unit,total_cost,is_full_tank,is_missed,fuel_grade,station,latitude,longitude,notes,receipt_image) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		id,b["vehicle_id"],value(b,"date",today()),num(b["odometer"]),gal,price,total,boolInt(value(b,"is_full_tank",true)),boolInt(value(b,"is_missed",false)),value(b,"fuel_grade","Regular"),nullable(b["station"]),nullable(b["latitude"]),nullable(b["longitude"]),nullable(b["notes"]),nullable(b["receipt_image"]))
	if err!=nil{writeError(w,500,err);return};if err=services.RecalculateVehicleFillups(a.db,text(b["vehicle_id"]));err!=nil{writeError(w,500,err);return};row,_:=a.db.QueryOne(`SELECT * FROM fillups WHERE id=?`,id);writeJSON(w,201,row)
}
func boolInt(v any)int{if truthy(v){return 1};return 0}
func (a *API) updateFillup(w http.ResponseWriter,r *http.Request){
	id:=chi.URLParam(r,"id");old,err:=a.db.QueryOne(`SELECT * FROM fillups WHERE id=?`,id);if err!=nil{writeError(w,500,err);return};if old==nil{writeError(w,404,"Fillup not found");return};if _,ok:=a.ownedVehicle(w,r,text(old["vehicle_id"]));!ok{return};b,err:=bodyMap(r);if err!=nil{writeError(w,400,"Invalid JSON");return};gal,price,total:=fillupCosts(b,old)
	get:=func(k string)any{if v,ok:=b[k];ok{return v};return old[k]}
	_,err=a.db.Exec(`UPDATE fillups SET date=?,odometer=?,gallons=?,price_per_unit=?,total_cost=?,is_full_tank=?,is_missed=?,fuel_grade=?,station=?,latitude=?,longitude=?,notes=?,receipt_image=?,updated_at=datetime('now') WHERE id=?`,
		get("date"),num(get("odometer")),gal,price,total,boolInt(get("is_full_tank")),boolInt(get("is_missed")),get("fuel_grade"),get("station"),get("latitude"),get("longitude"),get("notes"),get("receipt_image"),id)
	if err!=nil{writeError(w,500,err);return};if err=services.RecalculateVehicleFillups(a.db,text(old["vehicle_id"]));err!=nil{writeError(w,500,err);return};row,_:=a.db.QueryOne(`SELECT * FROM fillups WHERE id=?`,id);writeJSON(w,200,row)
}
func (a *API) deleteFillup(w http.ResponseWriter,r *http.Request){id:=chi.URLParam(r,"id");old,err:=a.db.QueryOne(`SELECT * FROM fillups WHERE id=?`,id);if err!=nil{writeError(w,500,err);return};if old==nil{writeError(w,404,"Fillup not found");return};if _,ok:=a.ownedVehicle(w,r,text(old["vehicle_id"]));!ok{return};if _,err=a.db.Exec(`DELETE FROM fillups WHERE id=?`,id);err!=nil{writeError(w,500,err);return};if err=services.RecalculateVehicleFillups(a.db,text(old["vehicle_id"]));err!=nil{writeError(w,500,err);return};writeJSON(w,200,map[string]any{"message":"Fillup deleted successfully"})}
