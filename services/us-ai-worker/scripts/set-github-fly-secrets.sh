#!/usr/bin/env bash
# Interactive GitHub Actions secrets for Fly deploy (no secrets in repo).
set -euo pipefail
REPO="${GITHUB_REPO:-ravshikjonik-arch/sonogyn-pro}"
echo "=== 1/2 FLY_API_TOKEN → GitHub secret ==="
gh secret set FLY_API_TOKEN -R "$REPO"
echo ""
echo "=== 2/2 OPENROUTER_API_KEY → GitHub secret ==="
gh secret set OPENROUTER_API_KEY -R "$REPO"
echo ""
echo "Done. Run workflow: US AI Worker (Fly) on branch main."
