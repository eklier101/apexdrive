package httpapi

import(
 "net/http"
 "strings"
 "time"
 "github.com/go-chi/chi/v5"
)
func(a *API)healthRoutes(r chi.Router){r.Get("/health",a.health);r.Get("/tunnel-status",a.tunnelStatus)}
func protocol(r *http.Request)string{if p:=r.Header.Get("X-Forwarded-Proto");p!=""{return strings.Split(p,",")[0]};if r.TLS!=nil{return "https"};return "http"}
func(a *API)health(w http.ResponseWriter,r *http.Request){writeJSON(w,200,map[string]any{"status":"ok","app":"ApexDrive","time":time.Now().UTC().Format(time.RFC3339Nano),"protocol":protocol(r),"secure":protocol(r)=="https","cloudflare":r.Header.Get("Cf-Ray")!=""})}
func(a *API)tunnelStatus(w http.ResponseWriter,r *http.Request){cf:=r.Header.Get("Cf-Ray")!="" ;host:=r.Host;var url any;if cf{url="https://"+host};ip:=r.Header.Get("Cf-Connecting-Ip");if ip==""{ip=r.RemoteAddr};writeJSON(w,200,map[string]any{"active":true,"isCloudflareTunnel":cf,"cfRay":nullable(r.Header.Get("Cf-Ray")),"cfCountry":nullable(r.Header.Get("Cf-Ipcountry")),"cfConnectingIp":nullable(r.Header.Get("Cf-Connecting-Ip")),"clientIp":ip,"host":host,"protocol":protocol(r),"protoHeader":protocol(r),"secure":protocol(r)=="https","tunnelUrl":url})}
