"""SonoGyn Pro — US AI Worker (DICOM + SonoNet + modular agents)."""

from __future__ import annotations

import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from analyzer import analyze_batch, analyze_frames
from batch_archive import analyze_archive
from sonogyn_agents.adapters.ustri_adapter import ustri_available
from sonogyn_agents.backends.factory import get_vision_backend
from sononet_infer import sononet_available

app = FastAPI(title="SonoGyn US AI Worker", version="0.4.0")


def _check_auth(authorization: Optional[str]) -> None:
    secret = os.environ.get("US_AI_WORKER_SECRET", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="US_AI_WORKER_SECRET not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.removeprefix("Bearer ").strip()
    if token != secret:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict[str, object]:
    vision = get_vision_backend()
    return {
        "status": "ok",
        "service": "us-ai-worker",
        "version": "0.4.0",
        "capabilities": {
            "dicom": True,
            "sononet": sononet_available(),
            "ustri": ustri_available(),
            "visionBackend": vision.name() if vision else None,
            "domains": ["auto", "fetal", "breast", "gyn", "kidney"],
            "batch": True,
            "archiveFolder": True,
        },
    }


@app.post("/analyze")
async def analyze(request: Request, authorization: Optional[str] = Header(default=None)) -> JSONResponse:
    _check_auth(authorization)
    try:
        payload = await request.json()
        result = analyze_frames(payload)
        return JSONResponse(result)
    except Exception as e:  # noqa: BLE001 — worker boundary
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/analyze/batch")
async def analyze_batch_route(
    request: Request, authorization: Optional[str] = Header(default=None)
) -> JSONResponse:
    _check_auth(authorization)
    try:
        payload = await request.json()
        result = analyze_batch(payload)
        return JSONResponse(result)
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/analyze/archive")
async def analyze_archive_route(
    request: Request, authorization: Optional[str] = Header(default=None)
) -> JSONResponse:
    """Пакетный разбор папки на сервере (DICOM/JPEG/PNG) → CSV + markdown."""
    _check_auth(authorization)
    try:
        payload = await request.json()
        root_dir = str(payload.get("rootDir") or "").strip()
        if not root_dir:
            return JSONResponse({"error": "rootDir обязателен"}, status_code=400)
        result = analyze_archive(
            root_dir=root_dir,
            output_dir=payload.get("outputDir"),
            clinical_context=str(payload.get("clinicalContext") or ""),
            domain=str(payload.get("domain") or "auto"),
            backend=payload.get("backend"),
            max_files=payload.get("maxFiles"),
            resume=bool(payload.get("resume", True)),
            sample_per_series=payload.get("samplePerSeries"),
        )
        return JSONResponse(result)
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/analyze/archive")
async def analyze_archive_route(
    request: Request, authorization: Optional[str] = Header(default=None)
) -> JSONResponse:
    """Пакетный разбор папки на сервере (DICOM/JPEG/PNG) → CSV + markdown."""
    _check_auth(authorization)
    try:
        payload = await request.json()
        root_dir = str(payload.get("rootDir") or "").strip()
        if not root_dir:
            return JSONResponse({"error": "rootDir обязателен"}, status_code=400)
        result = analyze_archive(
            root_dir=root_dir,
            output_dir=payload.get("outputDir"),
            clinical_context=str(payload.get("clinicalContext") or ""),
            domain=str(payload.get("domain") or "auto"),
            backend=payload.get("backend"),
            max_files=payload.get("maxFiles"),
            resume=bool(payload.get("resume", True)),
            sample_per_series=payload.get("samplePerSeries"),
        )
        return JSONResponse(result)
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": str(e)}, status_code=500)
