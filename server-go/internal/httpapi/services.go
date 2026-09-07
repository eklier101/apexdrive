package httpapi

import (
	"net/http"

	"github.com/eklier101/apexdrive/internal/db"
	svc "github.com/eklier101/apexdrive/internal/services"
	"github.com/go-chi/chi/v5"
)

func (a *API) serviceRoutes(r chi.Router){r.Route("/services",func(r chi.Router){r.Get("/",a.listServices);r.Post("/",a.createService);r.Put("/{id}",a.updateService);r.Delete("/{id}",a.deleteService)})}
func parseParts(v any)[]svc.ServicePartInput{
	raw,ok:=v.([]any);if !ok{return nil};out:=make([]svc.ServicePartInput,0,len(raw));for _,x:=range raw{m,ok:=x.(map[string]any);if !ok{continue};out=append(out,svc.ServicePartInput{InventoryItemID:m["inventory_item_id"],Name:text(m["name"]),Quantity:num(m["quantity"]),UnitCost:num(m["unit_cost"])})};return out
}
func attachParts(dbs *db.DB,rows []map[string]any)([]map[string]any,error){
	ids:=make([]string,len(rows));for i,r:=range rows{ids[i]=text(r["id"])};parts,err:=svc.GetServicePartsForServices(dbs,ids);if err!=nil{return nil,err};by:=map[string][]map[string]any{};for _,p:=range parts{k:=text(p["service_id"]);by[k]=append(by[k],p)};for _,r:=range rows{p:=by[text(r["id"])];if p==nil{p=[]map[string]any{}};r["parts"]=p};return rows,nil
}
func (a *API) listServices(w http.ResponseWriter,r *http.Request){id,ok:=vehicleQuery(w,r);if !ok{return};rows,err:=a.db.Query(`SELECT * FROM services WHERE vehicle_id=? ORDER BY date DESC,odometer DESC`,id);if err==nil{rows,err=attachParts(a.db,rows)};if err!=nil{writeError(w,500,err);return};writeJSON(w,200,rows)}
func hasInventory(parts []svc.ServicePartInput)bool{for _,p:=range parts{if p.InventoryItemID!=nil&&text(p.InventoryItemID)!=""{return true}};return false}
func (a *API) createService(w http.ResponseWriter,r *http.Request){
	b,err:=bodyMap(r);if err!=nil{writeError(w,400,"Invalid JSON");return};if text(b["vehicle_id"])==""||text(b["service_type"])==""||text(b["title"])==""{writeError(w,400,"vehicle_id, odometer, service_type, and title are required");return};if _,ok:=b["odometer"];!ok{writeError(w,400,"vehicle_id, odometer, service_type, and title are required");return}
	parts:=parseParts(b["parts"]);use:=truthy(b["use_inventory_parts"])||hasInventory(parts);partsTotal,labor:=num(value(b,"parts_cost",0)),num(value(b,"labor_cost",0));initialParts:=partsTotal;if use{initialParts=0};total:=initialParts+labor;if v,ok:=b["total_cost"];ok{total=num(v)};id:=db.NewID("srv")
	_,err=a.db.Exec(`INSERT INTO services(id,vehicle_id,date,odometer,service_type,title,description,parts_cost,labor_cost,total_cost,is_diy,service_provider,receipt_image) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,id,b["vehicle_id"],value(b,"date",today()),num(b["odometer"]),b["service_type"],b["title"],nullable(b["description"]),initialParts,labor,total,boolInt(value(b,"is_diy",false)),nullable(b["service_provider"]),nullable(b["receipt_image"]))
	if err!=nil{writeError(w,500,err);return};if use{partsTotal,err=svc.ApplyServiceParts(a.db,id,parts);if err==nil{if _,ok:=b["total_cost"];!ok{total=partsTotal+labor};_,err=a.db.Exec(`UPDATE services SET parts_cost=?,total_cost=?,updated_at=datetime('now') WHERE id=?`,partsTotal,total,id)}};if err!=nil{writeError(w,500,err);return};if err=svc.SyncVehicleReminders(a.db,text(b["vehicle_id"]));err!=nil{writeError(w,500,err);return};row,_:=a.db.QueryOne(`SELECT * FROM services WHERE id=?`,id);sp,_:=svc.GetServiceParts(a.db,id);row["parts"]=sp;writeJSON(w,201,row)
}
func (a *API) updateService(w http.ResponseWriter,r *http.Request){
	id:=chi.URLParam(r,"id");old,err:=a.db.QueryOne(`SELECT * FROM services WHERE id=?`,id);if err!=nil{writeError(w,500,err);return};if old==nil{writeError(w,404,"Service record not found");return};b,err:=bodyMap(r);if err!=nil{writeError(w,400,"Invalid JSON");return}
	partsTotal,labor:=num(old["parts_cost"]),num(old["labor_cost"]);if v,ok:=b["parts_cost"];ok{partsTotal=num(v)};if v,ok:=b["labor_cost"];ok{labor=num(v)}
	_,partsPresent:=b["parts"];_,usePresent:=b["use_inventory_parts"];if partsPresent||usePresent{if err=svc.RestoreServiceParts(a.db,id);err!=nil{writeError(w,500,err);return};parts:=parseParts(b["parts"]);if valueBool(b,"use_inventory_parts",true)&&hasInventory(parts){partsTotal,err=svc.ApplyServiceParts(a.db,id,parts)}else if !partsPresent&&!valueBool(b,"use_inventory_parts",true){partsTotal=num(value(b,"parts_cost",old["parts_cost"]))};if err!=nil{writeError(w,500,err);return}}
	total:=partsTotal+labor;if v,ok:=b["total_cost"];ok{total=num(v)};get:=func(k string)any{if v,ok:=b[k];ok{return v};return old[k]}
	_,err=a.db.Exec(`UPDATE services SET date=?,odometer=?,service_type=?,title=?,description=?,parts_cost=?,labor_cost=?,total_cost=?,is_diy=?,service_provider=?,receipt_image=?,updated_at=datetime('now') WHERE id=?`,get("date"),num(get("odometer")),get("service_type"),get("title"),get("description"),partsTotal,labor,total,boolInt(get("is_diy")),get("service_provider"),get("receipt_image"),id)
	if err!=nil{writeError(w,500,err);return};if err=svc.SyncVehicleReminders(a.db,text(old["vehicle_id"]));err!=nil{writeError(w,500,err);return};row,_:=a.db.QueryOne(`SELECT * FROM services WHERE id=?`,id);sp,_:=svc.GetServiceParts(a.db,id);row["parts"]=sp;writeJSON(w,200,row)
}
func valueBool(b map[string]any,k string,f bool)bool{if v,ok:=b[k];ok{return truthy(v)};return f}
func (a *API) deleteService(w http.ResponseWriter,r *http.Request){id:=chi.URLParam(r,"id");old,err:=a.db.QueryOne(`SELECT * FROM services WHERE id=?`,id);if err!=nil{writeError(w,500,err);return};if old==nil{writeError(w,404,"Service record not found");return};if err=svc.RestoreServiceParts(a.db,id);err==nil{_,err=a.db.Exec(`DELETE FROM services WHERE id=?`,id)};if err==nil{err=svc.SyncVehicleReminders(a.db,text(old["vehicle_id"]))};if err!=nil{writeError(w,500,err);return};writeJSON(w,200,map[string]any{"message":"Service deleted successfully"})}
