package httpapi

import(
 "net/http"
 "github.com/eklier101/apexdrive/internal/db"
 "github.com/go-chi/chi/v5"
)
func(a *API)expenseRoutes(r chi.Router){r.Route("/expenses",func(r chi.Router){r.Get("/",a.listExpenses);r.Post("/",a.createExpense);r.Put("/{id}",a.updateExpense);r.Delete("/{id}",a.deleteExpense)})}
func(a *API)listExpenses(w http.ResponseWriter,r *http.Request){id,ok:=vehicleQuery(w,r);if !ok{return};rows,err:=a.db.Query(`SELECT * FROM other_expenses WHERE vehicle_id=? ORDER BY date DESC,created_at DESC`,id);if err!=nil{writeError(w,500,err);return};writeJSON(w,200,rows)}
func(a *API)createExpense(w http.ResponseWriter,r *http.Request){b,err:=bodyMap(r);if err!=nil{writeError(w,400,"Invalid JSON");return};if text(b["vehicle_id"])==""{writeError(w,400,"vehicle_id and amount are required");return};if _,ok:=b["amount"];!ok{writeError(w,400,"vehicle_id and amount are required");return};id:=db.NewID("exp");_,err=a.db.Exec(`INSERT INTO other_expenses(id,vehicle_id,date,category,amount,notes,receipt_image) VALUES(?,?,?,?,?,?,?)`,id,b["vehicle_id"],value(b,"date",today()),value(b,"category","Insurance"),num(b["amount"]),nullable(b["notes"]),nullable(b["receipt_image"]));if err!=nil{writeError(w,500,err);return};row,_:=a.db.QueryOne(`SELECT * FROM other_expenses WHERE id=?`,id);writeJSON(w,201,row)}
func(a *API)updateExpense(w http.ResponseWriter,r *http.Request){id:=chi.URLParam(r,"id");old,err:=a.db.QueryOne(`SELECT * FROM other_expenses WHERE id=?`,id);if err!=nil{writeError(w,500,err);return};if old==nil{writeError(w,404,"Expense record not found");return};b,err:=bodyMap(r);if err!=nil{writeError(w,400,"Invalid JSON");return};get:=func(k string)any{if v,ok:=b[k];ok{return v};return old[k]};_,err=a.db.Exec(`UPDATE other_expenses SET date=?,category=?,amount=?,notes=?,receipt_image=?,updated_at=datetime('now') WHERE id=?`,get("date"),get("category"),num(get("amount")),get("notes"),get("receipt_image"),id);if err!=nil{writeError(w,500,err);return};row,_:=a.db.QueryOne(`SELECT * FROM other_expenses WHERE id=?`,id);writeJSON(w,200,row)}
func(a *API)deleteExpense(w http.ResponseWriter,r *http.Request){if _,err:=a.db.Exec(`DELETE FROM other_expenses WHERE id=?`,chi.URLParam(r,"id"));err!=nil{writeError(w,500,err);return};writeJSON(w,200,map[string]any{"message":"Expense deleted successfully"})}
