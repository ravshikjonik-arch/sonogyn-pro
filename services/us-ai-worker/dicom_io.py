"""DICOM → PNG для vision-анализа."""

from __future__ import annotations

import io
from typing import Any

import numpy as np
from PIL import Image


def dicom_bytes_to_png_bytes(raw: bytes) -> tuple[bytes, dict[str, Any]]:
    import pydicom

    ds = pydicom.dcmread(io.BytesIO(raw), force=True)
    arr = ds.pixel_array.astype(np.float32)
    arr = arr - float(arr.min())
    peak = float(arr.max())
    if peak > 0:
        arr = arr / peak * 255.0
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    meta: dict[str, Any] = {
        "modality": str(getattr(ds, "Modality", "") or ""),
        "studyDescription": str(getattr(ds, "StudyDescription", "") or ""),
        "seriesDescription": str(getattr(ds, "SeriesDescription", "") or ""),
    }
    ps = getattr(ds, "PixelSpacing", None)
    if ps is not None:
        try:
            meta["pixelSpacingMm"] = float(ps[0])
        except (TypeError, IndexError, ValueError):
            pass
    return buf.getvalue(), meta
