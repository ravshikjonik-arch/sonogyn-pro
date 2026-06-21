"""Базовый доменный агент — system prompt + JSON schema."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from sonogyn_agents.schema import StudyDomain


class DomainAgent(ABC):
    domain: StudyDomain

    @abstractmethod
    def system_prompt(self) -> str:
        ...

    @abstractmethod
    def user_instructions(self) -> str:
        ...

    def enrich_cv_hints(
        self,
        sononet_map: dict[str, dict[str, Any]],
        ustri_map: dict[str, dict[str, Any]] | None = None,
    ) -> str:
        return ""
