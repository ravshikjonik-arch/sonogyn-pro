"""Абстрактный vision backend."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class VisionBackend(ABC):
    @abstractmethod
    def available(self) -> bool:
        ...

    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    def analyze(
        self,
        *,
        system_prompt: str,
        user_text: str,
        images: list[tuple[str, str]],  # (base64, mime)
    ) -> dict[str, Any]:
        """Return parsed JSON dict from model response."""
        ...
