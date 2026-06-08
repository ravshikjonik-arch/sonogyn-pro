#!/usr/bin/env bash
# Сборка Android APK (preview) для коллег вне вашей Wi‑Fi — ставят файл, Metro не нужен.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! npx eas-cli whoami &>/dev/null; then
  echo "Нет входа в Expo. Выполните в этом каталоге:"
  echo "  npm run eas:login"
  exit 1
fi

echo "Запуск облачной сборки Android (profile: preview, APK)…"
npx eas-cli build --platform android --profile preview

echo ""
echo "Дальше: откройте ссылку билда из вывода выше (expo.dev) и отправьте коллегам APK или кнопку Install."
echo "Expo Go для такого билда не нужен — это отдельное приложение (internal distribution)."
