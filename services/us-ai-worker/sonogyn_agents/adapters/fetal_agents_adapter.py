"""FetalAgents / FetUSAgents — multi-agent fetal pipeline (weights not released)."""

from __future__ import annotations

import os
import subprocess
from typing import Any


def fetal_agents_available() -> bool:
    root = os.environ.get("FETAL_AGENTS_PATH", "").strip()
    if not root or not os.path.isdir(root):
        return False
    return os.path.isfile(os.path.join(root, "main.py"))


def run_fetal_agents(case_dir: str, inquiry: str) -> dict[str, Any] | None:
    root = os.environ.get("FETAL_AGENTS_PATH", "").strip()
    if not fetal_agents_available() or not root:
        return None
    try:
        proc = subprocess.run(
            ["python", "main.py", "--inquiry", inquiry, "--case_dir", case_dir],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
        return {
            "source": "fetal-agents",
            "stdout": proc.stdout[-4000:],
            "stderr": proc.stderr[-2000:],
            "returncode": proc.returncode,
        }
    except Exception as exc:  # noqa: BLE001
        return {"source": "fetal-agents", "error": str(exc)}
