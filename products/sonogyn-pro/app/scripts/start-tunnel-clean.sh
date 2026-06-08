#!/usr/bin/env bash
# Туннель для Expo Go вне локальной Wi‑Fi (через ngrok). Перед стартом чистим порты и кэш Metro.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
bash "$ROOT/scripts/kill-expo-ports.sh"
exec npx expo start --tunnel --port 19001 --clear
