package httpapi

import(
 "fmt"
 "net/http"
 "time"
 svc "github.com/eklier101/apexdrive/internal/services"
 "github.com/go-chi/chi/v5"
)
func(a *API)statsRoutes(r chi.Router){r.Route("/stats",func(r chi.Router){r.Get("/dashboard",a.dashboard);r.Get("/trends",a.trends);r.Get("/export",a.export)})}
func(a *API)dashboard(w http.ResponseWriter,r *http.Request){id,ok:=vehicleQuery(w,r);if !ok{return};stats,err:=svc.GetDashboardStats(a.db,id);if err!=nil{writeError(w,500,err);return};if stats==nil{writeError(w,404,"Vehicle not found");return};writeJSON(w,200,stats)}
func(a *API)trends(w http.ResponseWriter,r *http.Request){id,ok:=vehicleQuery(w,r);if !ok{return};out,err:=svc.GetTrends(a.db,id);if err!=nil{writeError(w,500,err);return};writeJSON(w,200,out)}
func(a *API)export(w http.ResponseWriter,r *http.Request){tables:=[]string{"vehicles","fillups","services","service_reminders","upgrades","other_expenses"};out:=map[string]any{"exported_at":time.Now().UTC().Format(time.RFC3339Nano)};for _,t:=range tables{rows,err:=a.db.Query(`SELECT * FROM `+t);if err!=nil{writeError(w,500,err);return};out[t]=rows};w.Header().Set("Content-Disposition",fmt.Sprintf(`attachment; filename="vehicle_tracker_backup_%d.json"`,time.Now().UnixMilli()));writeJSON(w,200,out)}
