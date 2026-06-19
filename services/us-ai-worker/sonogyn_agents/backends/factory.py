"""Выбор vision backend по env."""

from __future__ import annotations

import os

from sonogyn_agents.backends.base import VisionBackend
from sonogyn_agents.backends.ollama import OllamaBackend
from sonogyn_agents.backends.openrouter import OpenRouterBackend


def get_vision_backend(preferred: str | None = None) -> VisionBackend | None:
    pref = (preferred or os.environ.get("US_VISION_BACKEND", "auto")).strip().lower()

    ollama = OllamaBackend()
    openrouter = OpenRouterBackend()

    if pref == "ollama":
        return ollama if ollama.available() else None
    if pref in ("openrouter", "cloud"):
        return openrouter if openrouter.available() else None

    # auto: prefer local for PHI
    if ollama.available():
        return ollama
    if openrouter.available():
        return openrouter
    return None
