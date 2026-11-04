#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"
require_colibri

echo "COLIBRI_HOME=$COLIBRI_HOME"
(cd "$COLIBRI_HOME" && "$PY" "$COLI" status) || true

code=$(curl -sS -o /tmp/colibri-models.json -w "%{http_code}" --max-time 3 http://127.0.0.1:8000/v1/models || echo 000)
echo "GET /v1/models → HTTP $code"
if [[ "$code" == "200" ]]; then
  "$PY" - <<'PY'
import json
d=json.load(open("/tmp/colibri-models.json"))
data=d.get("data") or d.get("models") or []
ids=[]
for m in data[:12]:
  if isinstance(m, dict):
    ids.append(m.get("id") or m.get("name"))
  else:
    ids.append(str(m))
print("models:", ", ".join(x for x in ids if x) or "(none)")
PY
else
  echo "sidecar down — run: pnpm colibri:start   (or pnpm colibri:setup first)"
fi
