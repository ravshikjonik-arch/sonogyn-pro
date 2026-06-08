#!/usr/bin/env bash
# Expo живёт только в apps/mobile — не запускайте `npx expo` из корня монорепо.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile"
bash scripts/kill-expo-ports.sh 2>/dev/null || true
exec env -u CI npx expo start --port 19001 --lan --clear "$@"
