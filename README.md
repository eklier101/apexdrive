# ApexDrive

Self-hosted vehicle expense and maintenance tracker: fuel logs, services, parts inventory, upgrades, reminders, and cost analytics.

**Stack:** Go API · React / TypeScript web & Android UI · Docker

This repository is **open source** so you can read and audit the code. You do **not** need to compile it to run it. Prebuilt artifacts are published with each release:

- **Docker image** — `ghcr.io/eklier101/apexdrive` (`latest` and version tags)
- **Android APK** — [GitHub Releases](https://github.com/eklier101/apexdrive/releases)

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

Copy [`docker-compose.yml`](docker-compose.yml) next to `.env` (or clone this repo and use the file in place):

```bash
docker compose up -d
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

Open [http://localhost:8090](http://localhost:8090), register the first account (it becomes **admin**), and add a vehicle.

Health check: `http://localhost:8090/api/health`

### Container shows "unhealthy"

The image healthcheck hits `http://127.0.0.1:8090/api/health` inside the container. Common fixes:

1. Confirm `.env` has `JWT_SECRET=...` — without it the process exits immediately in production.
2. Check logs: `docker logs apexdrive` (look for fatal JWT / DB errors).
3. Recreate after updating: `docker compose pull && docker compose up -d`
4. Manual probe: `docker exec apexdrive wget -q -O - http://127.0.0.1:8090/api/health`

Pin a version: `ghcr.io/eklier101/apexdrive:1.0.31` instead of `:latest`.

If `docker pull` is denied, the package may still be private. On [the package page](https://github.com/eklier101/apexdrive/pkgs/container/apexdrive) use **Package settings → Change visibility → Public**.

### Data persistence

The `./data` volume stores the SQLite database, uploaded receipts, and APKs served from the app.

## Android APK (prebuilt)

Download the APK from [Releases](https://github.com/eklier101/apexdrive/releases). Install it, then:

1. On the **sign-in screen**, enter your **Server URL** (for example `http://192.168.1.50:8090` or `https://your-domain.com`)
2. Register or log in
3. You can change the URL later under **Settings → Server Connection URL**

There is no default server URL in the app.

If you already run ApexDrive, you can also fetch the APK from Settings on the website, or from your own server after one is seeded there: `http://<your-server>:8090/api/app/download-latest`.

Servers validate that the on-disk APK is a real signed package before offering it for download.

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
| `APK_AUTO_FETCH` | `1` | Seed APK from GitHub Releases on startup when missing |
| `APK_GITHUB_REPO` | `eklier101/apexdrive` | Repo used for APK auto-fetch |

## License

MIT — see [LICENSE](LICENSE).
