"""Агент УЗИ плода — SonoNet + ISUOG."""

from __future__ import annotations

from typing import Any

from sonogyn_agents.agents.base import DomainAgent
from sonogyn_agents.schema import StudyDomain


class FetalAgent(DomainAgent):
    domain = StudyDomain.FETAL

    def system_prompt(self) -> str:
        return """Ты ассистент врача УЗИ плода (ISUOG, скрининг 1–2 триместра).
Учитывай подсказки SonoNet (CNN плоскостей), сверяй, но не копируй слепо.
Не выдумывай биометрию в мм без шкалы на снимке.
Ответ строго JSON на русском без markdown."""

    def user_instructions(self) -> str:
        return """Верни JSON:
{
  "studySummary": "краткая сводка",
  "impression": "впечатление",
  "recommendations": ["..."],
  "scorecard": "ISUOG: перечень оцененных плоскостей или null",
  "frames": [{
    "mediaId": "...",
    "planeGuess": "русское название плоскости",
    "qualityScore": 0.0-1.0,
    "findings": ["..."],
    "scanErrors": ["..."],
    "biometryHints": ["..."],
    "confidence": 0.0-1.0
  }]
}"""

    def enrich_cv_hints(
        self,
        sononet_map: dict[str, dict[str, Any]],
        ustri_map: dict[str, dict[str, Any]] | None = None,
    ) -> str:
        if not sononet_map:
            return "SonoNet недоступен."
        lines = []
        for mid, sn in sononet_map.items():
            lines.append(
                f"{mid}: SonoNet → {sn.get('labelRu')} ({sn.get('labelEn')}, "
                f"conf {float(sn.get('confidence', 0)):.0%})"
            )
        if ustri_map:
            for mid, us in ustri_map.items():
                lines.append(
                    f"{mid}: USTri → {us.get('labelRu')} (conf {float(us.get('confidence', 0)):.0%})"
                )
        return "\n".join(lines)
