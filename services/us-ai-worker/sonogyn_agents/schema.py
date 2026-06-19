"""Схемы структурированного отчёта на русском."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class StudyDomain(str, Enum):
    AUTO = "auto"
    FETAL = "fetal"
    BREAST = "breast"
    GYN = "gyn"
    KIDNEY = "kidney"


@dataclass
class FrameFinding:
    media_id: str
    file_name: str
    findings: list[str] = field(default_factory=list)
    scan_errors: list[str] = field(default_factory=list)
    plane_guess: str | None = None
    birads: str | None = None
    orads: str | None = None
    biometry_hints: list[str] = field(default_factory=list)
    confidence: float | None = None
    sononet: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "mediaId": self.media_id,
            "fileName": self.file_name,
            "findings": self.findings,
            "scanErrors": self.scan_errors,
            "planeGuess": self.plane_guess,
            "biometryHints": self.biometry_hints,
            "confidence": self.confidence,
        }
        if self.birads:
            d["birads"] = self.birads
        if self.orads:
            d["orads"] = self.orads
        if self.sononet:
            d["sononet"] = self.sononet
        return d


@dataclass
class StructuredReport:
    domain: StudyDomain
    study_summary: str
    impression: str
    recommendations: list[str]
    frames: list[FrameFinding]
    scorecard: str | None = None  # BI-RADS / O-RADS summary
    pipeline: str = "us-ai-worker"
    model_version: str = "unknown"
    cv_models: list[str] = field(default_factory=list)
    locale: str = "ru"
    disclaimer: str = ""
    clinical_context: str = ""
    media_ids: list[str] = field(default_factory=list)
    sononet_available: bool = False

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "domain": self.domain.value,
            "modelVersion": self.model_version,
            "pipeline": self.pipeline,
            "locale": self.locale,
            "disclaimer": self.disclaimer,
            "studySummary": self.study_summary,
            "impression": self.impression,
            "recommendations": self.recommendations,
            "scorecard": self.scorecard,
            "frames": [f.to_dict() for f in self.frames],
            "mediaIds": self.media_ids,
            "clinicalContext": self.clinical_context,
            "cvModels": self.cv_models,
            "sononetAvailable": self.sononet_available,
        }
