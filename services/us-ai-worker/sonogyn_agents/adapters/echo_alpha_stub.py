"""Echo-Alpha (MiliLab) — в репозитории нет inference-кода, только paper README."""

from __future__ import annotations

import os
from typing import Any


def echo_alpha_available() -> bool:
    path = os.environ.get("ECHO_ALPHA_PATH", "").strip()
    if not path or not os.path.isdir(path):
        return False
    # Репозиторий на GitHub не содержит detect/infer — только figs/
    infer = os.path.join(path, "infer.py")
    return os.path.isfile(infer)


def run_echo_alpha_breast(image_png: bytes) -> dict[str, Any] | None:
    """Placeholder: подключить при публикации весов Echo-Alpha."""
    if not echo_alpha_available():
        return None
    return {
        "source": "echo-alpha-stub",
        "biradsHint": None,
        "note": "Echo-Alpha weights not public; use LLM breast agent.",
    }
