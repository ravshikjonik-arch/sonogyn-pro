from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


Confidence = Literal["low", "medium", "high"]


class ExtractedFeature(BaseModel):
    key: str
    value: Any
    confidence: Confidence
    source_span: str | None = None


class OradsFromTextRequest(BaseModel):
    text: str = Field(min_length=8, max_length=8000)
    age_years: int | None = Field(default=None, ge=14, le=100)
    menopause: Literal["pre", "post"] | None = None
    use_llm: bool = False


class OradsFromTextResponse(BaseModel):
    extracted: dict[str, Any]
    features: list[ExtractedFeature]
    protocol_draft: str
    orads_hint: str | None = None
    missing_fields: list[str]
    disclaimer: str
    pipeline: str
