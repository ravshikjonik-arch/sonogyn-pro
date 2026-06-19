"""Агент УЗИ почек — LLM (Echo-Alpha detector недоступен)."""

from __future__ import annotations

from sonogyn_agents.agents.base import DomainAgent
from sonogyn_agents.schema import StudyDomain


class KidneyAgent(DomainAgent):
    domain = StudyDomain.KIDNEY

    def system_prompt(self) -> str:
        return """Ты ассистент врача УЗИ почек и мочевыводящих путей.
Оценивай размеры, кортико-медуллярную дифференцировку, ЧЛС, конкременты, кисты, гидронефроз.
Echo-Alpha-style: сначала гипотеза, затем локальные признаки — в тексте findings.
Ответ строго JSON на русском без markdown."""

    def user_instructions(self) -> str:
        return """Верни JSON:
{
  "studySummary": "...",
  "impression": "...",
  "recommendations": ["..."],
  "scorecard": null,
  "frames": [{
    "mediaId": "...",
    "planeGuess": "проекция",
    "findings": ["..."],
    "scanErrors": ["..."],
    "confidence": 0.0-1.0
  }]
}"""
