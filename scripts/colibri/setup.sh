#!/usr/bin/env bash
# First-time Colibri install for SonoGyn (downloads ~20GB model).
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"
require_colibri

MODEL_ID="${COLIBRI_SETUP_MODEL:-qwen36-35b}"
echo "Colibri setup model=$MODEL_ID (override with COLIBRI_SETUP_MODEL=…)"
echo "This downloads a large model. Keep the Mac awake / disk free ≥25GB."

# macOS python.org builds often lack CA bundle → HuggingFace download fails SSL.
if [[ -z "${SSL_CERT_FILE:-}" ]]; then
  CERT="$("$PY" -c 'import certifi; print(certifi.where())' 2>/dev/null || true)"
  if [[ -n "$CERT" ]]; then
    export SSL_CERT_FILE="$CERT"
    export REQUESTS_CA_BUNDLE="$CERT"
    export CURL_CA_BUNDLE="$CERT"
  else
    echo "note: install CA bundle:  $PY -m pip install --user certifi"
  fi
fi

cd "$COLIBRI_HOME"
exec "$PY" "$COLI" setup --yes --model "$MODEL_ID" --background --no-browser "$@"
