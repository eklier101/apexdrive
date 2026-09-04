# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Go API
# ==========================================
FROM golang:1.23-alpine AS go-builder
WORKDIR /src
RUN apk add --no-cache gcc musl-dev
COPY server-go/go.mod server-go/go.sum ./
RUN go mod download
COPY server-go/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/apexdrive ./cmd/apexdrive

# ==========================================
# Stage 3: Production Alpine Runtime
# ==========================================
FROM alpine:3.21 AS runner
WORKDIR /app

RUN apk add --no-cache ca-certificates wget \
  && mkdir -p /app/data/uploads /app/data/apks /app/public

ENV APP_ENV=production
ENV NODE_ENV=production
ENV PORT=8090
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data
ENV PUBLIC_DIR=/app/public

COPY --from=go-builder /out/apexdrive /app/apexdrive
COPY --from=client-builder /app/client/dist /app/public

VOLUME ["/app/data"]

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8090/api/health || exit 1

CMD ["/app/apexdrive"]
