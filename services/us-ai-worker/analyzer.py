"""Vision + SonoNet пайплайн — thin wrapper над sonogyn_agents."""

from __future__ import annotations

from typing import Any

from report_ru import build_report_markdown
from sonogyn_agents.orchestrator import analyze_study


def analyze_frames(payload: dict[str, Any]) -> dict[str, Any]:
    clinical = str(payload.get("clinicalContext") or "")
    frames_in = list(payload.get("frames") or [])
    media_ids = list(payload.get("mediaIds") or [])
    domain = str(payload.get("domain") or "auto")
    backend = payload.get("backend")

    report = analyze_study(
        clinical_context=clinical,
        frames=frames_in,
        media_ids=media_ids,
        domain=domain,
        backend=backend,
    )
    result = report.to_api_dict()
    result["reportMarkdown"] = build_report_markdown(result)
    return result


def analyze_batch(payload: dict[str, Any]) -> dict[str, Any]:
    """Несколько исследований в одном запросе."""
    studies = list(payload.get("studies") or [])
    if not studies:
        raise RuntimeError("studies[] пуст")

    results: list[dict[str, Any]] = []
    for study in studies:
        results.append(analyze_frames(study))
    return {"count": len(results), "results": results}
