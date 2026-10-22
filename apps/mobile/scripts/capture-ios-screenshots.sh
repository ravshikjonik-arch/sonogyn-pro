#!/usr/bin/env bash
# Снимки экранов для App Store (6.7") с iOS Simulator.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/store-assets/captures/raw"
mkdir -p "$OUT"

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Нужен Xcode / xcrun."
  exit 1
fi

BOOTED="$(xcrun simctl list devices booted | rg -o '[0-9A-F-]{36}' | head -1 || true)"
if [[ -z "$BOOTED" ]]; then
  echo "Запустите Simulator и приложение SonoGyn Pro, затем снова запустите этот скрипт."
  echo "Рекомендуемое устройство: iPhone 16 Pro Max (1290×2796 logical)."
  exit 1
fi

echo "Simulator: $BOOTED"
echo "Переключайте экраны в приложении и нажимайте Enter для каждого кадра."
echo "Порядок: 01-home 02-orads 03-iota 04-breast 05-evidence 06-auth"
echo ""

NAMES=(01-home 02-orads 03-iota 04-breast 05-evidence 06-auth)
for name in "${NAMES[@]}"; do
  read -r -p "Экран «$name» готов — Enter для снимка…" _
  xcrun simctl io booted screenshot "$OUT/$name.png"
  echo "  → $OUT/$name.png"
done

echo ""
echo "Готово. Откройте: $ROOT/store-assets/generate-frames.html"
