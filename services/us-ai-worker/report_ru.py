"""Markdown-отчёт на русском для экспорта из UI."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def build_report_markdown(result: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Черновик ИИ-разбора УЗИ — SonoGyn Pro",
        "",
        f"**Дата:** {now}",
        f"**Pipeline:** {result.get('pipeline', '—')}",
        f"**Модели:** {', '.join(result.get('cvModels') or []) or '—'} · {result.get('modelVersion', '—')}",
        "",
        "> " + str(result.get("disclaimer", "")),
        "",
    ]

    if result.get("clinicalContext"):
        lines.extend(["## Клинический контекст", "", str(result["clinicalContext"]), ""])

    lines.extend(["## Сводка", "", str(result.get("studySummary", "")), ""])
    lines.extend(["## Впечатление", "", str(result.get("impression", "")), ""])

    if result.get("scorecard"):
        lines.extend(["## Классификация", "", str(result["scorecard"]), ""])

    recs = result.get("recommendations") or []
    if recs:
        lines.append("## Рекомендации")
        lines.append("")
        for r in recs:
            lines.append(f"- {r}")
        lines.append("")

    frames = result.get("frames") or []
    if frames:
        lines.append("## По кадрам")
        lines.append("")
        for i, f in enumerate(frames, 1):
            sn = f.get("sononet") or {}
            plane = f.get("planeGuess") or sn.get("labelRu") or "—"
            conf = f.get("confidence")
            conf_pct = f"{round(float(conf) * 100)}%" if conf is not None else "—"
            lines.append(f"### Кадр {i}")
            lines.append("")
            lines.append(f"- **Плоскость (LLM):** {plane}")
            if sn:
                lines.append(
                    f"- **SonoNet:** {sn.get('labelRu')} ({sn.get('labelEn')}) — "
                    f"{round(float(sn.get('confidence', 0)) * 100)}%"
                )
            if f.get("birads"):
                lines.append(f"- **BI-RADS:** {f.get('birads')}")
            if f.get("orads"):
                lines.append(f"- **O-RADS:** {f.get('orads')}")
            lines.append(f"- **Уверенность LLM:** {conf_pct}")
            findings = f.get("findings") or []
            if findings:
                lines.append(f"- **Находки:** {'; '.join(findings)}")
            errors = f.get("scanErrors") or []
            if errors:
                lines.append(f"- **Замечания по сканированию:** {'; '.join(errors)}")
            bio = f.get("biometryHints") or []
            if bio:
                lines.append(f"- **Биометрия:** {'; '.join(bio)}")
            lines.append("")

    return "\n".join(lines).strip() + "\n"
