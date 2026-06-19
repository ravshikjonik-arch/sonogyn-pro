#!/bin/sh
set -e
PORT="${PORT:-8090}"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
