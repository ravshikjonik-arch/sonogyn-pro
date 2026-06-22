"""SonoGyn Protocol AI — text/voice → O-RADS features + protocol draft (CDS, not diagnosis)."""

from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sonogyn_protocol.orads_extractor import (
    DISCLAIMER,
    build_protocol_draft,
    extract_orads_features,
    heuristic_orads_hint,
)
from sonogyn_protocol.schemas import OradsFromTextRequest, OradsFromTextResponse

load_dotenv()

app = FastAPI(title="SonoGyn Protocol AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

WORKER_SECRET = os.getenv("PROTOCOL_AI_SECRET", "").strip()


def _auth(authorization: str | None, x_worker_secret: str | None) -> None:
    if not WORKER_SECRET:
        return
    token = (authorization or "").removeprefix("Bearer ").strip() or (x_worker_secret or "").strip()
    if token != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "protocol-ai"}


@app.post("/orads/from-text", response_model=OradsFromTextResponse)
def orads_from_text(
    body: OradsFromTextRequest,
    authorization: str | None = Header(default=None),
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> OradsFromTextResponse:
    _auth(authorization, x_worker_secret)

    extraction = extract_orads_features(body.text, body.age_years, body.menopause)
    draft = build_protocol_draft(body.text, extraction.extracted)
    hint = heuristic_orads_hint(extraction.extracted)

    return OradsFromTextResponse(
        extracted=extraction.extracted,
        features=[
            {
                "key": f.key,
                "value": f.value,
                "confidence": f.confidence,
                "source_span": f.source_span,
            }
            for f in extraction.features
        ],
        protocol_draft=draft,
        orads_hint=hint,
        missing_fields=extraction.missing_fields,
        disclaimer=DISCLAIMER,
        pipeline="orads-rule-v1" + ("+llm" if body.use_llm else ""),
    )
