"""OpenRouter / OpenAI-compatible vision API."""

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


class OpenRouterBackend(VisionBackend):
    def available(self) -> bool:
        return bool(
            os.environ.get("OPENAI_API_KEY", "").strip()
            or os.environ.get("OPENROUTER_API_KEY", "").strip()
        )

    def name(self) -> str:
        return os.environ.get("US_VISION_MODEL", "openai/gpt-4o-mini")

    def analyze(
        self,
        *,
        system_prompt: str,
        user_text: str,
        images: list[tuple[str, str]],
    ) -> dict[str, Any]:
        api_key = os.environ.get("OPENAI_API_KEY", "").strip() or os.environ.get(
            "OPENROUTER_API_KEY", ""
        ).strip()
        base_url = os.environ.get("OPENAI_BASE_URL", "").strip()
        if not base_url:
            base_url = os.environ.get("OPENROUTER_API_URL", "https://openrouter.ai/api/v1").rstrip(
                "/"
            )
            if base_url.endswith("/chat/completions"):
                base_url = base_url[: -len("/chat/completions")]
        model = self.name()

        content: list[dict[str, Any]] = [{"type": "text", "text": user_text}]
        for b64, mime in images[:4]:
            content.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}})

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        if "openrouter.ai" in base_url:
            headers["HTTP-Referer"] = os.environ.get("US_AI_WORKER_REFERER", "https://sonogyn-pro.ru")
            headers["X-Title"] = "SonoGyn US AI Worker"

        with httpx.Client(timeout=120.0) as client:
            res = client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": content},
                    ],
                    "temperature": 0.2,
                },
            )
            res.raise_for_status()
            raw = res.json()["choices"][0]["message"]["content"]
        return _extract_json(raw)
