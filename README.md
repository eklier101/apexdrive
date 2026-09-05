# ApexDrive

Self-hosted vehicle expense and maintenance tracker: fuel logs, services, parts inventory, upgrades, reminders, and cost analytics.

**Stack:** Go API (`server-go/`) · React / TypeScript web & Android UI (`client/`) · Docker

This repository is **open source** so you can read and audit the code. You do **not** need to compile it to run it. Prebuilt artifacts are published with each release:

- **Docker image** — `ghcr.io/eklier101/apexdrive`
- **Android APK** — [GitHub Releases](https://github.com/eklier101/apexdrive/releases)

A compose file and Docker CLI examples are included so you can run the published image, or build from this source if you prefer.

## About this project

ApexDrive was built with substantial help from AI coding tools. The code is still **human-owned**: it is reviewed for bugs, errors, and security issues, and it continues to be checked that way as it changes. Treat it like any other self-hosted app — read the source, set your own `JWT_SECRET`, and keep it updated.

## Feedback

- [Report a bug](https://github.com/eklier101/apexdrive/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/eklier101/apexdrive/issues/new?template=feature_request.yml)

## Quick start (prebuilt Docker image)

**Requirements:** Docker. You do not need Node, Java, or Android SDK.

Create a folder, add a `.env` file with a strong secret:

```bash
mkdir apexdrive && cd apexdrive
cat > .env << 'EOF'
JWT_SECRET=change-me-to-a-long-random-string
EOF
```

### Docker Compose (recommended)

Save [`docker-compose.ghcr.yml`](docker-compose.ghcr.yml) next to `.env` (or clone this repo and use the file in place):

```bash
docker compose -f docker-compose.ghcr.yml up -d
```

### Docker CLI

Same image, no Compose file:

```bash
docker pull ghcr.io/eklier101/apexdrive:latest

docker run -d \
  --name apexdrive \
  --restart unless-stopped \
  -p 8090:8090 \
  -e JWT_SECRET=change-me-to-a-long-random-string \
  -e PORT=8090 \
  -e HOST=0.0.0.0 \
  -e DATA_DIR=/app/data \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/eklier101/apexdrive:latest
```

On Windows PowerShell:

```powershell
docker pull ghcr.io/eklier101/apexdrive:latest

docker run -d --name apexdrive --restart unless-stopped `
  -p 8090:8090 `
  -e JWT_SECRET=change-me-to-a-long-random-string `
  -e PORT=8090 -e HOST=0.0.0.0 -e DATA_DIR=/app/data `
  -v ${PWD}/data:/app/data `
  ghcr.io/eklier101/apexdrive:latest
```

Open [http://localhost:8090](http://localhost:8090), register the first account, and add a vehicle.

Health check: `http://localhost:8090/api/health`

### Container shows "unhealthy"

The image healthcheck hits `http://127.0.0.1:8090/api/health` inside the container. Common fixes:

1. Confirm `.env` has `JWT_SECRET=...` — without it the process exits immediately in production.
2. Check logs: `docker logs apexdrive` (look for fatal JWT / DB errors).
3. Recreate after updating compose: `docker compose -f docker-compose.ghcr.yml pull && docker compose -f docker-compose.ghcr.yml up -d`
4. Manual probe: `docker exec apexdrive wget -q -O - http://127.0.0.1:8090/api/health`

Pin a version: `ghcr.io/eklier101/apexdrive:1.0.22` instead of `:latest`.

If `docker pull` is denied, the package may still be private. On [the package page](https://github.com/eklier101/apexdrive/pkgs/container/apexdrive) use **Package settings → Change visibility → Public**.

### Data persistence

The `./data` volume stores the SQLite database, uploaded receipts, and any APKs you later serve from the app.

## Android APK (prebuilt)

Download the APK from [Releases](https://github.com/eklier101/apexdrive/releases). Install it, then:

1. On the **sign-in screen**, enter your **Server URL** (for example `http://192.168.1.50:8090` or `https://your-domain.com`)
2. Register or log in
3. You can change the URL later under **Settings → Server Connection URL**

There is no default server URL in the app.

If you already run ApexDrive, you can also fetch the APK from Settings on the website, or from your own server after you have placed one there: `http://<your-server>:8090/api/app/download-latest`.

## Build from source (optional)

Use this if you want to verify or change the code. Most people can skip it.

**Docker image from this repo:**

```bash
cp .env.example .env
docker compose up --build -d
```

**APK (Node 22+, Android SDK, Java 17+):**

```powershell
.\build-all.ps1
```

Output: `data/apks/apexdrive_latest.apk` (and `apexdrive_vX.Y.Z.apk`)

## Development

```bash
# Terminal 1 — Go API (port 8090)
cd server-go && go run ./cmd/apexdrive

# Terminal 2 — Web client (Vite)
cd client && npm install && npm run dev
```

The legacy Node server remains under `server/` (see archive branch `archive/node-typescript-v1.0.22`). Production Docker images use the Go binary.

Set `JWT_SECRET` (and `APP_ENV=production` or `NODE_ENV=production`) for production-like auth locally.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(required in production)* | Signing key for auth tokens |
| `APP_ENV` / `NODE_ENV` | — | Set to `production` to require `JWT_SECRET` |
| `PORT` | `8090` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `DATA_DIR` | `./data` | Database, uploads, APK storage |
| `DB_PATH` | `{DATA_DIR}/vehicle_tracker.db` | SQLite file path |
| `PUBLIC_DIR` | `./public` | Built web UI (Docker sets `/app/public`) |

## Releases

Each tagged release (`v*`) publishes:

- Prebuilt Android APK on [Releases](https://github.com/eklier101/apexdrive/releases)
- Prebuilt Docker image `ghcr.io/eklier101/apexdrive` (`latest` and the version tag)

## License

MIT — see [LICENSE](LICENSE).
