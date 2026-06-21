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


def _ustri_task_for_domain(domain: StudyDomain) -> str | None:
    if domain in (StudyDomain.FETAL, StudyDomain.AUTO):
        return "fetal_plane_cls"
    if domain == StudyDomain.BREAST:
        return "breast_3cls"
    return None


def _run_ustri(domain: StudyDomain, frames: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    if not ustri_available():
        return out
    task = _ustri_task_for_domain(domain)
    if not task:
        return out
    for frame in frames[:6]:
        mid = str(frame.get("mediaId", ""))
        png = _decode_frame_to_png(frame)
        if not png:
            continue
        pred = classify_with_ustri(png, task)
        if pred and not pred.get("error"):
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
    return models


def _merge_cv(
    llm_frames: list[dict],
    sononet_map: dict[str, dict],
    ustri_map: dict[str, dict],
) -> list[FrameFinding]:
    result: list[FrameFinding] = []
    for f in llm_frames:
        mid = str(f.get("mediaId", ""))
        sn = sononet_map.get(mid)
        us = ustri_map.get(mid)
        conf = float(f.get("confidence") or 0.5)
        if sn:
            conf = max(conf, float(sn.get("confidence") or 0))
        if us and us.get("confidence"):
            conf = max(conf, float(us["confidence"]))
        plane = f.get("planeGuess")
        if not plane and us and us.get("labelRu"):
            plane = us["labelRu"]
        elif not plane and sn:
            plane = sn.get("labelRu")
        bio = list(f.get("biometryHints") or [])
        if us and us.get("biometryHint") and us["biometryHint"] not in bio:
            bio.append(str(us["biometryHint"]))
        scan_errors = list(f.get("scanErrors") or [])
        if us and us.get("error"):
            scan_errors.append(f"USTri: {us['error']}")
        result.append(
            FrameFinding(
                media_id=mid,
                file_name=str(f.get("fileName", "")),
                findings=list(f.get("findings") or []),
                scan_errors=scan_errors,
                plane_guess=plane,
                birads=f.get("birads") or (us.get("labelRu") if us and "breast" in str(us.get("task", "")) else None),
                orads=f.get("orads"),
                biometry_hints=bio,
                confidence=round(conf, 4),
                sononet=sn,
                ustri=us,
            )
        )
    return result


def _cv_only_frames(
    sononet_map: dict[str, dict],
    ustri_map: dict[str, dict],
    frames_in: list[dict],
) -> list[FrameFinding]:
    out: list[FrameFinding] = []
    for frame in frames_in:
        mid = str(frame.get("mediaId", ""))
        sn = sononet_map.get(mid)
        us = ustri_map.get(mid)
        if not sn and not us:
            continue
        findings: list[str] = []
        if sn and sn.get("isuogHint"):
            findings.append(sn["isuogHint"])
        if us and us.get("isuogHint"):
            findings.append(str(us["isuogHint"]))
        plane = (us or {}).get("labelRu") or (sn or {}).get("labelRu")
        conf = float((us or {}).get("confidence") or (sn or {}).get("confidence") or 0)
        bio: list[str] = []
        if us and us.get("biometryHint"):
            bio.append(str(us["biometryHint"]))
        out.append(
            FrameFinding(
                media_id=mid,
                file_name=str(frame.get("fileName", "")),
                findings=findings,
                scan_errors=list((sn or {}).get("scanErrors") or []),
                plane_guess=plane,
                confidence=conf,
                sononet=sn,
                ustri=us,
                biometry_hints=bio,
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
    ustri_map = _run_ustri(domain_enum, frames)
    cv_models = _run_external_cv(domain_enum, frames)

    prepared: list[tuple[dict[str, Any], str, str]] = []
    for frame in frames[:6]:
        png = _decode_frame_to_png(frame)
        if png:
            b64 = base64.b64encode(png).decode("ascii")
            prepared.append((frame, b64, "image/png"))

    if not prepared and not sononet_map and not ustri_map:
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
        cv_block = agent.enrich_cv_hints(sononet_map, ustri_map) or "CV-подсказки недоступны."
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
            frame_findings = _merge_cv(raw_frames, sononet_map, ustri_map)
            model_version = vision.name()
            pipeline = f"us-ai-worker+{vision.name().split('/')[0]}"
            if sononet_map:
                pipeline += "+sononet"
            if ustri_map:
                pipeline += "+ustri"
        except Exception as exc:  # noqa: BLE001
            if not sononet_map and not ustri_map:
                raise
            study_summary = f"Vision LLM недоступен ({exc}). Использованы только CV-модели."
            pipeline = "us-ai-worker+cv-only"
            model_version = "SonoNet/USTri"
    elif sononet_map or ustri_map:
        pipeline = "us-ai-worker+cv-only"
        parts: list[str] = []
        if sononet_map:
            parts.extend([sn.get("labelRu", "") for sn in sononet_map.values()])
        if ustri_map:
            parts.extend([us.get("labelRu", "") for us in ustri_map.values()])
        study_summary = f"CV: {len(sononet_map) + len(ustri_map)} кадр(ов) — " + ", ".join(filter(None, parts))
        impression = "Только CNN (SonoNet/USTri). Задайте Ollama или OPENROUTER_API_KEY для полного отчёта."
        recommendations = [
            "Сверьте плоскости с протоколом ISUOG.",
            "Для BI-RADS/O-RADS включите vision backend.",
        ]
    else:
        raise RuntimeError("Нужен Ollama, OPENROUTER_API_KEY или веса SonoNet")

    if not frame_findings and (sononet_map or ustri_map):
        frame_findings = _cv_only_frames(sononet_map, ustri_map, frames)

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
