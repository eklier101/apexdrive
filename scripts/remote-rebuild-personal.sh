#!/bin/bash
set -euo pipefail
REMOTE=/opt/vehicle-tracker
cd "$REMOTE"
mkdir -p data/uploads data/apks
docker stop vehicle-tracker apexdrive 2>/dev/null || true
docker rm vehicle-tracker apexdrive 2>/dev/null || true
if [ -f /tmp/apexdrive-deploy.tgz ]; then
  tar -xzf /tmp/apexdrive-deploy.tgz -C "$REMOTE"
  rm -f /tmp/apexdrive-deploy.tgz
fi
# Prefer local build; keep data volume
docker compose build
docker compose up -d --force-recreate
sleep 8
echo "--- containers ---"
docker ps --filter name=apexdrive --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
echo "--- health ---"
curl -s http://127.0.0.1:8090/api/health || true
echo
echo "--- binary check ---"
docker exec apexdrive ls -la /app/apexdrive /app/public/index.html 2>/dev/null || true
echo "--- sync status code ---"
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/api/sync/status || true
