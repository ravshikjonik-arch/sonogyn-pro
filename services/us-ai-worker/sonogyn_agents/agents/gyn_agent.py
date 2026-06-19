"""Агент гинекологического УЗИ — O-RADS / IOTA."""

from __future__ import annotations

from sonogyn_agents.agents.base import DomainAgent
from sonogyn_agents.schema import StudyDomain


class GynAgent(DomainAgent):
    domain = StudyDomain.GYN

    def system_prompt(self) -> str:
        return """Ты ассистент врача УЗИ (акушерство-гинекология, малого таза).
Для кист/образований яичников используй O-RADS US (1–5) при достаточных признаках.
IOTA simple rules — только как подсказка, не заменяет клинику.
Ответ строго JSON на русском без markdown."""

    def user_instructions(self) -> str:
        return """Верни JSON:
{
  "studySummary": "...",
  "impression": "...",
  "recommendations": ["..."],
  "scorecard": "O-RADS X" или null,
  "frames": [{
    "mediaId": "...",
    "planeGuess": "локализация",
    "findings": ["..."],
    "scanErrors": ["..."],
    "orads": "2" или null,
    "confidence": 0.0-1.0
  }]
}"""
