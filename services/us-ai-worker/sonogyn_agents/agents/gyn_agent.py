"""Агент гинекологического УЗИ — O-RADS / IOTA."""

from __future__ import annotations

from sonogyn_agents.agents.base import DomainAgent
from sonogyn_agents.schema import StudyDomain


class GynAgent(DomainAgent):
    domain = StudyDomain.GYN

    def system_prompt(self) -> str:
        return """Ты ассистент врача УЗИ (акушерство-гинекология, малого таза).
ЗАПРЕЩЕНО выставлять итоговую категорию O-RADS или IOTA-риск как число/класс.
Описывай только признаки по лексикону ACR O-RADS US v2022 (локулярность, размер, стенка, солид ≥3 мм,
число папиллярных проекций, перегородки, цветовой допpler, тень, асцит, типичные доброкачественные паттерны).
Если признак не виден — укажи в scanErrors, не выдумывай.
Ответ строго JSON на русском без markdown."""

    def user_instructions(self) -> str:
        return """Верни JSON:
{
  "studySummary": "...",
  "impression": "...",
  "recommendations": ["..."],
  "scorecard": "краткая сводка признаков без номера категории" или null,
  "frames": [{
    "mediaId": "...",
    "planeGuess": "локализация",
    "findings": ["признак: значение"],
    "scanErrors": ["..."],
    "lexiconFeatures": [{"id": "solid_component_present", "labelRu": "...", "value": true, "confidence": 0.7}],
    "confidence": 0.0-1.0
  }]
}"""
