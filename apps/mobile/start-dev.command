#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT/server"
APP_DIR="$ROOT"
EXPO_PORT="${EXPO_PORT:-8085}"

# Секреты только из server/.env.local (см. server/.env.local.example). Не коммитьте их в git.
ENV_LOCAL="$SERVER_DIR/.env.local"
if [[ ! -f "$ENV_LOCAL" ]]; then
  echo "Создайте файл server/.env.local (образец: server/.env.local.example) с JWT_SECRET и опционально ADMIN_EMAIL."
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_LOCAL"
set +a
if [[ -z "${JWT_SECRET:-}" ]]; then
  echo "В server/.env.local должен быть задан JWT_SECRET."
  exit 1
fi

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Этот файл рассчитан на macOS (Terminal.app)."
  exit 1
fi

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      echo "Освобождаю порт ${port} (останавливаю процессы: ${pids})"
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi
}

# Чтобы Expo не спрашивал "Use another port?" из-за старого процесса
# (часто 8081 занят другим Metro — освобождаем и дефолтный порт Expo)
kill_port 8081
kill_port "${EXPO_PORT}"

osascript <<EOF
tell application "Terminal"
  activate
  do script "cd \"$SERVER_DIR\" && export JWT_SECRET=\"$JWT_SECRET\" && export ADMIN_EMAIL=\"$ADMIN_EMAIL\" && echo \"=== CHAT SERVER (оставь это окно открытым) ===\" && npm run start"
  delay 0.5
  do script "cd \"$APP_DIR\" && echo \"=== EXPO APP (QR сканируй отсюда) ===\" && (test -d node_modules/@expo/ngrok || npm install --no-fund --no-audit @expo/ngrok@^4.1.0) && npx expo start -c --tunnel --port ${EXPO_PORT}"
end tell
EOF

echo ""
echo "Готово: открылось 2 окна Terminal."
echo "1) Оставь окно CHAT SERVER работающим."
echo "2) В окне EXPO отсканируй QR в Expo Go."
echo "3) В приложении: Чат -> Выйти -> Войти снова -> Обновить ленту (чтобы подтянулась роль admin)."
