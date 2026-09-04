#!/bin/bash
set -e

echo "=== Building ApexDrive Web Assets ==="
cd client
npm run build
npx cap sync android

echo "=== Building Android APK ==="
cd android
./gradlew assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
DEST_DIR="../../server/data/apks"
mkdir -p "$DEST_DIR"
cp "$APK_PATH" "$DEST_DIR/apexdrive_latest.apk"

echo "=== APK Successfully Built ==="
echo "Output saved to: server/data/apks/apexdrive_latest.apk"
