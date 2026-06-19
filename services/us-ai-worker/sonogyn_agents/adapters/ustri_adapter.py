"""USTri (MacDunno) — optional GPU classifier."""

from __future__ import annotations

import os
from typing import Any


def ustri_available() -> bool:
    root = os.environ.get("USTRI_PATH", "").strip()
    weights = os.environ.get("USTRI_USPEC_WEIGHTS", "").strip()
    if not root or not os.path.isdir(root):
        return False
    if weights and os.path.isfile(weights):
        return True
    default = os.path.join(root, "USpec.pth")
    return os.path.isfile(default)


def classify_with_ustri(image_png: bytes, task: str) -> dict[str, Any] | None:
    """
    task: fetal_plane_cls | breast_3cls | breast_2cls
    Requires USTRI_PATH + USpec.pth + CUDA (see docs/REPO_ANALYSIS.md).
    """
    if not ustri_available():
        return None
    # Full integration needs USTri train/eval imports — deferred until GPU deploy
    return {
        "source": "ustri-stub",
        "task": task,
        "note": "Set USTRI_PATH and implement infer hook from MacDunno/USTri eval.py",
    }
