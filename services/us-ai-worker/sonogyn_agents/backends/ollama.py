"""Локальный Ollama (LLaVA / llama3.2-vision) — без внешних API."""

from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

from sonogyn_agents.backends.base import VisionBackend


def _extract_json(text: str) -> dict[str, Any]:
    trimmed = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", trimmed, re.I)
    candidate = fence.group(1).strip() if fence else trimmed
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start >= 0 and end > start:
        return json.loads(candidate[start : end + 1])
    return json.loads(candidate)


class OllamaBackend(VisionBackend):
    def __init__(self) -> None:
        self.base = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        self.model = os.environ.get("OLLAMA_VISION_MODEL", "llava:13b")

    def available(self) -> bool:
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{self.base}/api/tags")
                return res.status_code == 200
        except Exception:  # noqa: BLE001
            return False

    def name(self) -> str:
        return f"ollama/{self.model}"

    def analyze(
        self,
        *,
        system_prompt: str,
        user_text: str,
        images: list[tuple[str, str]],
    ) -> dict[str, Any]:
        content: list[dict[str, Any]] = [{"type": "text", "text": user_text}]
        for b64, _mime in images[:4]:
            content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}})

        with httpx.Client(timeout=180.0) as client:
            res = client.post(
                f"{self.base}/api/chat",
                json={
                    "model": self.model,
                    "stream": False,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_text, "images": [b64 for b64, _ in images[:4]]},
                    ],
                    "options": {"temperature": 0.2},
                },
            )
            res.raise_for_status()
            raw = res.json()["message"]["content"]
        return _extract_json(raw)
