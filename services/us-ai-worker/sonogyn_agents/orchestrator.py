"""Оркестратор: DICOM → CV tools → domain agent → structured RU report."""

from __future__ import annotations

import base64
import os
from typing import Any

from sonogyn_agents.adapters.echo_alpha_stub import echo_alpha_available, run_echo_alpha_breast
from sonogyn_agents.adapters.ustri_adapter import classify_with_ustri, ustri_available
from sonogyn_agents.agents.base import DomainAgent
from sonogyn_agents.agents.breast_agent import BreastAgent
from sonogyn_agents.agents.fetal_agent import FetalAgent
from sonogyn_agents.agents.gyn_agent import GynAgent
from sonogyn_agents.agents.kidney_agent import KidneyAgent
from sonogyn_agents.backends.factory import get_vision_backend
from sonogyn_agents.schema import FrameFinding, StructuredReport, StudyDomain
from dicom_io import dicom_bytes_to_png_bytes
from sononet_infer import classify_fetal_plane, sononet_available

DISCLAIMER_RU = (
    "Черновик ИИ-ассистента PRO. Не является диагнозом. Интерпретация и заключение — за врачом УЗИ."
)

_AGENTS: dict[StudyDomain, DomainAgent] = {
    StudyDomain.FETAL: FetalAgent(),
    StudyDomain.BREAST: BreastAgent(),
    StudyDomain.GYN: GynAgent(),
    StudyDomain.KIDNEY: KidneyAgent(),
}

_DOMAIN_KEYWORDS: dict[StudyDomain, tuple[str, ...]] = {
    StudyDomain.FETAL: ("плод", "беремен", "фет", "fetal", "скрининг", "триместр", "плацент"),
    StudyDomain.BREAST: ("молоч", "breast", "birads", "bi-rads", "маст", "фibroadenom"),
    StudyDomain.GYN: ("яичник", "матк", "эндометр", "orads", "o-rads", "гинек", "мтп", "myoma"),
    StudyDomain.KIDNEY: ("почк", "kidney", "члс", "нефр", "урол"),
}


def detect_domain(clinical: str, explicit: str | None = None) -> StudyDomain:
    if explicit and explicit != StudyDomain.AUTO.value:
        try:
            return StudyDomain(explicit)
        except ValueError:
            pass
    text = clinical.lower()
    scores = {d: sum(1 for kw in kws if kw in text) for d, kws in _DOMAIN_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        return best
    return StudyDomain.FETAL


def _decode_frame_to_png(frame: dict[str, Any]) -> bytes | None:
    raw = base64.b64decode(frame["dataBase64"])
    media_type = frame.get("mediaType", "image")
    file_name = str(frame.get("fileName", "")).lower()
    if media_type == "dicom" or file_name.endswith(".dcm"):
        png, _meta = dicom_bytes_to_png_bytes(raw)
        return png
    mime = str(frame.get("mimeType") or "image/jpeg")
    if mime.startswith("video/"):
        return None
    return raw


def _run_sononet(frames: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    if not sononet_available():
        return out
    for frame in frames[:6]:
        mid = str(frame.get("mediaId", ""))
        png = _decode_frame_to_png(frame)
        if not png:
            continue
        pred = classify_fetal_plane(png)
        if pred:
            out[mid] = pred
    return out


def _run_external_cv(domain: StudyDomain, frames: list[dict[str, Any]]) -> list[str]:
    models: list[str] = []
    if sononet_available() and domain in (StudyDomain.FETAL, StudyDomain.AUTO):
        models.append("SonoNet-SN64")
    if ustri_available():
        models.append("USTri-USpec")
    if echo_alpha_available():
        models.append("Echo-Alpha-stub")
    for frame in frames[:3]:
        png = _decode_frame_to_png(frame)
        if not png:
            continue
        if domain == StudyDomain.BREAST:
            run_echo_alpha_breast(png)
            if ustri_available():
                classify_with_ustri(png, "breast_3cls")
        elif domain == StudyDomain.FETAL and ustri_available():
            classify_with_ustri(png, "fetal_plane_cls")
    return models


def _merge_sononet(llm_frames: list[dict], sononet_map: dict[str, dict]) -> list[FrameFinding]:
    result: list[FrameFinding] = []
    for f in llm_frames:
        mid = str(f.get("mediaId", ""))
        sn = sononet_map.get(mid)
        conf = float(f.get("confidence") or 0.5)
        if sn:
            conf = max(conf, float(sn.get("confidence") or 0))
        result.append(
            FrameFinding(
                media_id=mid,
                file_name=str(f.get("fileName", "")),
                findings=list(f.get("findings") or []),
                scan_errors=list(f.get("scanErrors") or []),
                plane_guess=f.get("planeGuess") or (sn.get("labelRu") if sn else None),
                birads=f.get("birads"),
                orads=f.get("orads"),
                biometry_hints=list(f.get("biometryHints") or []),
                confidence=round(conf, 4),
                sononet=sn,
            )
        )
    return result


def _sononet_only_frames(
    sononet_map: dict[str, dict], frames_in: list[dict]
) -> list[FrameFinding]:
    out: list[FrameFinding] = []
    for frame in frames_in:
        mid = str(frame.get("mediaId", ""))
        sn = sononet_map.get(mid)
        if not sn:
            continue
        out.append(
            FrameFinding(
                media_id=mid,
                file_name=str(frame.get("fileName", "")),
                findings=[sn["isuogHint"]] if sn.get("isuogHint") else [],
                scan_errors=list(sn.get("scanErrors") or []),
                plane_guess=sn.get("labelRu"),
                confidence=float(sn.get("confidence") or 0),
                sononet=sn,
            )
        )
    return out


def analyze_study(
    *,
    clinical_context: str = "",
    frames: list[dict[str, Any]],
    media_ids: list[str] | None = None,
    domain: str = "auto",
    backend: str | None = None,
) -> StructuredReport:
    domain_enum = detect_domain(clinical_context, domain)
    agent = _AGENTS.get(domain_enum, FetalAgent())

    sononet_map = _run_sononet(frames) if domain_enum in (StudyDomain.FETAL, StudyDomain.AUTO) else {}
    cv_models = _run_external_cv(domain_enum, frames)

    prepared: list[tuple[dict[str, Any], str, str]] = []
    for frame in frames[:6]:
        png = _decode_frame_to_png(frame)
        if png:
            b64 = base64.b64encode(png).decode("ascii")
            prepared.append((frame, b64, "image/png"))

    if not prepared and not sononet_map:
        raise RuntimeError("Нет декодируемых кадров")

    vision = get_vision_backend(backend)
    study_summary = ""
    impression = ""
    recommendations: list[str] = []
    scorecard: str | None = None
    frame_findings: list[FrameFinding] = []
    pipeline = "us-ai-worker"
    model_version = "sononet-only"

    if prepared and vision:
        frame_lines = "\n".join(
            f"{i + 1}. id={f.get('mediaId')}, файл={f.get('fileName')}"
            for i, (f, _, _) in enumerate(prepared)
        )
        cv_block = agent.enrich_cv_hints(sononet_map) or "CV-подсказки недоступны."
        user_text = f"""Клинический контекст:
{clinical_context or 'Не указан.'}

Домен: {domain_enum.value}

CV-подсказки:
{cv_block}

Кадры:
{frame_lines}

{agent.user_instructions()}"""

        try:
            parsed = vision.analyze(
                system_prompt=agent.system_prompt(),
                user_text=user_text,
                images=[(b64, mime) for _, b64, mime in prepared],
            )
            study_summary = str(parsed.get("studySummary") or "")
            impression = str(parsed.get("impression") or "")
            recommendations = list(parsed.get("recommendations") or [])
            scorecard = parsed.get("scorecard")
            raw_frames = list(parsed.get("frames") or [])
            # attach fileName from input
            id_to_name = {str(f.get("mediaId")): str(f.get("fileName", "")) for f in frames}
            for rf in raw_frames:
                rf["fileName"] = id_to_name.get(str(rf.get("mediaId")), "")
            frame_findings = _merge_sononet(raw_frames, sononet_map)
            model_version = vision.name()
            pipeline = f"us-ai-worker+{vision.name().split('/')[0]}"
            if sononet_map:
                pipeline += "+sononet"
        except Exception as exc:  # noqa: BLE001
            if not sononet_map:
                raise
            study_summary = f"Vision LLM недоступен ({exc}). Использован только SonoNet."
            pipeline = "us-ai-worker+sononet"
            model_version = "SonoNet-SN64"
    elif sononet_map:
        pipeline = "us-ai-worker+sononet"
        model_version = "SonoNet-SN64"
        labels = [sn.get("labelRu", "") for sn in sononet_map.values()]
        study_summary = f"SonoNet: {len(sononet_map)} кадр(ов) — " + ", ".join(labels)
        impression = "Только CNN-плоскости. Задайте Ollama или OPENROUTER_API_KEY для полного отчёта."
        recommendations = [
            "Сверьте плоскости с протоколом ISUOG.",
            "Для BI-RADS/O-RADS включите vision backend.",
        ]
    else:
        raise RuntimeError("Нужен Ollama, OPENROUTER_API_KEY или веса SonoNet")

    if not frame_findings and sononet_map:
        frame_findings = _sononet_only_frames(sononet_map, frames)

    return StructuredReport(
        domain=domain_enum,
        study_summary=study_summary,
        impression=impression,
        recommendations=recommendations,
        frames=frame_findings,
        scorecard=str(scorecard) if scorecard else None,
        pipeline=pipeline,
        model_version=model_version,
        cv_models=cv_models,
        disclaimer=DISCLAIMER_RU,
        clinical_context=clinical_context,
        media_ids=media_ids or [],
        sononet_available=sononet_available(),
    )
