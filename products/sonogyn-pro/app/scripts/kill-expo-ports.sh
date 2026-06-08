#!/usr/bin/env bash
# Освобождает типичные порты Metro/Expo перед новым запуском.
set -euo pipefail
# Metro/Expo часто поднимают 19000–19006, если 19001 занят — иначе браузер открывают «не тот» порт и видят белый экран.
for p in 19000 19001 19002 19003 19004 19005 19006 8081 8085 8086 8088 8090 8091; do
  pid=$(lsof -ti "tcp:$p" 2>/dev/null || true)
  if [[ -n "${pid}" ]]; then
    kill -9 $pid 2>/dev/null || true
    echo "Освобождён порт $p (pid $pid)"
  fi
done
echo "Готово."
