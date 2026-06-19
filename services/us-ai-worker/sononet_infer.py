"""SonoNet inference — классификация стандартных плоскостей плода (CPU)."""

from __future__ import annotations

import io
import os
from functools import lru_cache
from typing import Any

import numpy as np
from PIL import Image

from plane_labels import ISUOG_HINTS, SONONET_LABELS_EN, label_to_ru

INPUT_SIZE = (288, 224)  # W, H per test.py
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "sononet", "SonoNet64.pth")
NETWORK_NAME = os.environ.get("SONONET_MODEL", "SN64")


def sononet_available() -> bool:
    return os.path.isfile(WEIGHTS_PATH)


@lru_cache(maxsize=1)
def _load_model():
    import torch

    from sononet.sononet import SonoNet

    if not sononet_available():
        raise FileNotFoundError(
            f"SonoNet weights missing at {WEIGHTS_PATH}. Run: bash scripts/setup-sononet-weights.sh"
        )

    net = SonoNet(NETWORK_NAME, weights=WEIGHTS_PATH)
    net.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    net.to(device)
    return net, device


def _preprocess_png(png_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(png_bytes)).convert("L")
    image = image.resize(INPUT_SIZE, resample=Image.BICUBIC)
    arr = np.asarray(image, dtype=np.float32)
    arr = np.reshape(arr, (1, 1, arr.shape[0], arr.shape[1]))
    mean = float(arr.mean())
    std = float(arr.std()) or 1.0
    arr = np.array(255.0 * (arr - mean) / std, dtype=np.float32)
    return arr


def classify_fetal_plane(png_bytes: bytes) -> dict[str, Any] | None:
    if not sononet_available():
        return None

    import torch

    net, device = _load_model()
    tensor = torch.from_numpy(_preprocess_png(png_bytes)).to(device)

    with torch.no_grad():
        outputs = net(tensor)
        confidence, prediction = torch.max(outputs.data, 1)

    idx = int(prediction[0].item())
    conf = float(confidence[0].item())
    label_en = SONONET_LABELS_EN[idx] if 0 <= idx < len(SONONET_LABELS_EN) else "Unknown"
    label_ru = label_to_ru(label_en)

    scan_errors: list[str] = []
    if label_en == "Background":
        scan_errors.append("Кадр не похож на стандартную плоскость плода (SonoNet: Background)")
    if conf < 0.35:
        scan_errors.append(f"Низкая уверенность SonoNet ({conf:.0%}) — проверьте качество и плоскость")

    return {
        "model": f"SonoNet-{NETWORK_NAME}",
        "labelEn": label_en,
        "labelRu": label_ru,
        "confidence": round(conf, 4),
        "isuogHint": ISUOG_HINTS.get(label_en),
        "scanErrors": scan_errors,
        "isStandardPlane": label_en != "Background" and conf >= 0.35,
    }
