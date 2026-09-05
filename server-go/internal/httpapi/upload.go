package httpapi

import(
 "fmt"
 "io"
 "net/http"
 "os"
 "path/filepath"
 "regexp"
 "time"
 "github.com/go-chi/chi/v5"
)
var cleanImage=regexp.MustCompile(`[^a-zA-Z0-9_-]`)
func(a *API)uploadRoutes(r chi.Router){r.Post("/upload",a.uploadImage)}
func(a *API)uploadImage(w http.ResponseWriter,r *http.Request){r.Body=http.MaxBytesReader(w,r.Body,25<<20);if err:=r.ParseMultipartForm(25<<20);err!=nil{writeError(w,400,err);return};src,h,err:=r.FormFile("file");if err!=nil{writeError(w,400,"No image file uploaded");return};defer src.Close();ext:=filepath.Ext(h.Filename);if ext==""{ext=".jpg"};base:=cleanImage.ReplaceAllString(h.Filename[:len(h.Filename)-len(filepath.Ext(h.Filename))],"_");name:=fmt.Sprintf("img_%d_%s%s",time.Now().UnixMilli(),base,ext);dst,err:=os.Create(filepath.Join(a.cfg.UploadsDir,name));if err!=nil{writeError(w,500,err);return};size,copyErr:=io.Copy(dst,src);closeErr:=dst.Close();if copyErr!=nil{writeError(w,500,copyErr);return};if closeErr!=nil{writeError(w,500,closeErr);return};writeJSON(w,200,map[string]any{"url":"/uploads/"+name,"filename":name,"size":size})}
