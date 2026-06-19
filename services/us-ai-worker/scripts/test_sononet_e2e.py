#!/usr/bin/env python3
"""Smoke e2e: SonoNet inference + orchestrator (без LLM если ключей нет)."""

from __future__ import annotations

import base64
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sononet_infer import classify_fetal_plane, sononet_available  # noqa: E402


def main() -> int:
    if not sononet_available():
        print("FAIL: SonoNet weights missing — run scripts/setup-sononet-weights.sh")
        return 1

    sample = ROOT.parents[1] / "apps/web/public/clinical-atlas/orads-referat/case-01.png"
    if not sample.is_file():
        print(f"SKIP: sample image not found at {sample}")
        return 0

    png = sample.read_bytes()
    pred = classify_fetal_plane(png)
    if not pred:
        print("FAIL: classify_fetal_plane returned None")
        return 1

    print("OK SonoNet inference")
    print(f"  labelRu: {pred.get('labelRu')}")
    print(f"  labelEn: {pred.get('labelEn')}")
    print(f"  confidence: {pred.get('confidence')}")

    from sonogyn_agents.orchestrator import analyze_study  # noqa: E402

    frame = {
        "mediaId": "test-001",
        "fileName": sample.name,
        "mediaType": "image",
        "mimeType": "image/png",
        "dataBase64": base64.b64encode(png).decode("ascii"),
    }
    try:
        report = analyze_study(
            clinical_context="Плод, скрининг 2 триместра",
            frames=[frame],
            domain="fetal",
        )
        print("OK orchestrator")
        print(f"  pipeline: {report.pipeline}")
        print(f"  frames: {len(report.frames)}")
        print(f"  summary: {report.study_summary[:120]}…")
    except RuntimeError as exc:
        if "OPENROUTER" in str(exc) or "Ollama" in str(exc):
            print(f"OK orchestrator (SonoNet-only path): {exc}")
        else:
            raise

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
