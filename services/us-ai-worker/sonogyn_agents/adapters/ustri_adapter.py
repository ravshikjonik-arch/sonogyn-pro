"""USTri (MacDunno/ISBI 2026) — GPU inference для плоскостей плода и BI-RADS."""

from __future__ import annotations

import io
import os
import sys
from functools import lru_cache
from typing import Any

from sonogyn_agents.adapters.ustri_labels import ISUOG_BY_FETAL_PLANE, label_for_task


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))


def _weights_path() -> str:
    explicit = os.environ.get("USTRI_USPEC_WEIGHTS", "").strip()
    if explicit and os.path.isfile(explicit):
        return explicit
    root = os.environ.get("USTRI_PATH", "").strip()
    if root:
        candidate = os.path.join(root, "USpec.pth")
        if os.path.isfile(candidate):
            return candidate
    repo = _repo_root()
    for rel in ("USTri/USpec.pth", "apps/web/app/api/ustri_inference/USTri/USpec.pth"):
        p = os.path.join(repo, rel)
        if os.path.isfile(p):
            return p
    return ""


def ustri_available() -> bool:
    root = os.environ.get("USTRI_PATH", "").strip()
    if not root or not os.path.isdir(root):
        repo_ustri = os.path.join(_repo_root(), "USTri")
        if os.path.isdir(repo_ustri):
            os.environ.setdefault("USTRI_PATH", repo_ustri)
            root = repo_ustri
        else:
            return False
    return bool(_weights_path())


def _ensure_import_paths() -> None:
    root = os.environ.get("USTRI_PATH", "").strip() or os.path.join(_repo_root(), "USTri")
    if root not in sys.path:
        sys.path.insert(0, root)
    repo = _repo_root()
    if repo not in sys.path:
        sys.path.insert(0, repo)


@lru_cache(maxsize=1)
def _load_agent():
    _ensure_import_paths()
    import torch
    import numpy as np
    import cv2  # noqa: F401
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
    from PIL import Image

    from model_factory import MultiTaskModelFactory, TASK_CONFIGURATIONS  # type: ignore[import-not-found]
    from model import IMAGENET_MEAN, IMAGENET_STD  # type: ignore[import-not-found]

    weights = _weights_path()
    if not weights:
        raise FileNotFoundError("USpec.pth не найден. USTRI_USPEC_WEIGHTS или USTRI_PATH/USpec.pth")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = MultiTaskModelFactory(
        encoder_name=os.environ.get("USTRI_ENCODER", "R50-ViT-B_16"),
        encoder_weights=None,
        task_configs=TASK_CONFIGURATIONS,
        regression_heatmap_size=64,
        per_dataset_decoders=True,
        use_task_adapters=True,
        adapter_reduction=4,
    ).to(device)

    checkpoint = torch.load(weights, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint)
    model.eval()

    transforms = A.Compose([
        A.Resize(256, 256),
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ToTensorV2(),
    ])

    task_names = {cfg["task_id"]: cfg["task_name"] for cfg in TASK_CONFIGURATIONS}

    class _Agent:
        def __init__(self) -> None:
            self.device = device
            self.model = model
            self.transforms = transforms
            self.task_names = task_names

        def predict_png(self, png_bytes: bytes, task_id: str) -> dict[str, Any]:
            if task_id not in self.task_names:
                raise ValueError(f"Неизвестная задача USTri: {task_id}")

            image = Image.open(io.BytesIO(png_bytes)).convert("RGB")
            image_np = np.array(image)
            tensor = self.transforms(image=image_np)["image"].unsqueeze(0).to(self.device)
            task_name = self.task_names[task_id]

            with torch.no_grad():
                output = self.model(tensor, task_id=task_id)

            if task_name == "classification":
                probs = torch.softmax(output, dim=1).cpu().numpy()[0]
                idx = int(probs.argmax())
                return {
                    "source": "USTri-USpec",
                    "task": task_id,
                    "taskType": "classification",
                    "classIndex": idx,
                    "labelRu": label_for_task(task_id, idx),
                    "confidence": round(float(probs[idx]), 4),
                    "probabilities": [round(float(p), 4) for p in probs.tolist()],
                    "isuogHint": ISUOG_BY_FETAL_PLANE.get(idx) if task_id == "fetal_plane_cls" else None,
                }

            if task_name == "Regression":
                coords = output.cpu().numpy()[0].flatten().tolist()
                w, h = image.size
                pixels: list[float] = []
                for i in range(0, len(coords), 2):
                    pixels.extend([coords[i] * w, coords[i + 1] * h])
                return {
                    "source": "USTri-USpec",
                    "task": task_id,
                    "taskType": "regression",
                    "pointsNormalized": coords,
                    "pointsPixels": pixels,
                    "biometryHint": "USTri: ключевые точки биометрии (fetal_femur / IUGC)",
                }

            return {
                "source": "USTri-USpec",
                "task": task_id,
                "taskType": task_name,
                "rawShape": list(output.shape),
            }

    return _Agent()


def classify_with_ustri(image_png: bytes, task: str) -> dict[str, Any] | None:
    """
    task: fetal_plane_cls | breast_3cls | breast_2cls | fetal_femur
    Требует USTRI_PATH + USpec.pth (+ torch, albumentations, opencv).
    """
    if not ustri_available():
        return None
    try:
        agent = _load_agent()
        return agent.predict_png(image_png, task)
    except Exception as exc:  # noqa: BLE001
        return {
            "source": "USTri-USpec",
            "task": task,
            "error": str(exc),
        }
