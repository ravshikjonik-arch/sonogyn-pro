"""Агент УЗИ молочной железы — BI-RADS (ACR 2013/2024)."""

from __future__ import annotations

from sonogyn_agents.agents.base import DomainAgent
from sonogyn_agents.schema import StudyDomain


class BreastAgent(DomainAgent):
    domain = StudyDomain.BREAST

    def system_prompt(self) -> str:
        return """Ты ассистент врача УЗИ молочных желез (BI-RADS US, ACR 2025 assistive).
ЗАПРЕЩЕНО выставлять итоговую категорию BI-RADS как число/букву (0–6, 4A–4C).
Описывай только дескрипторы: форма, ориентация, край, эхоструктура, задние акустические феномены,
vascularity, non-mass при наличии. Не видно — scanErrors, не выдумывай.
Ответ строго JSON на русском без markdown."""

    def user_instructions(self) -> str:
        return """Верни JSON:
{
  "studySummary": "сводка по обеим железам / очагам",
  "impression": "впечатление",
  "recommendations": ["наблюдение / дообследование / биопсия ..."],
  "scorecard": "сводка дескрипторов без номера BI-RADS" или null,
  "frames": [{
    "mediaId": "...",
    "planeGuess": "локализация / проекция",
    "findings": ["дескриптор: значение"],
    "scanErrors": ["..."],
    "lexiconFeatures": [{"id": "margin", "labelRu": "...", "value": "circumscribed", "confidence": 0.75, "region": {"x": 0.25, "y": 0.35, "w": 0.35, "h": 0.3}}],
    "confidence": 0.0-1.0
  }]
}"""
