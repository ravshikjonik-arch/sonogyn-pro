"""Агент УЗИ молочной железы — BI-RADS (ACR 2013/2024)."""

from __future__ import annotations

from sonogyn_agents.agents.base import DomainAgent
from sonogyn_agents.schema import StudyDomain


class BreastAgent(DomainAgent):
    domain = StudyDomain.BREAST

    def system_prompt(self) -> str:
        return """Ты ассистент врача УЗИ молочных желез.
Классификация BI-RADS US (ACR): 0, 1, 2, 3, 4A, 4B, 4C, 5, 6 — только при достаточной уверенности.
Описывай форму, ориентацию, контуры, эхогенность, заднюю акустическую тень, vascularity.
Не ставь диагноз — черновик для врача.
Ответ строго JSON на русском без markdown."""

    def user_instructions(self) -> str:
        return """Верни JSON:
{
  "studySummary": "сводка по обеим железам / очагам",
  "impression": "впечатление",
  "recommendations": ["наблюдение / дообследование / биопсия ..."],
  "scorecard": "BI-RADS X (обоснование)" или null,
  "frames": [{
    "mediaId": "...",
    "planeGuess": "локализация / проекция",
    "findings": ["..."],
    "scanErrors": ["..."],
    "birads": "3" или "4A" или null,
    "confidence": 0.0-1.0
  }]
}"""
