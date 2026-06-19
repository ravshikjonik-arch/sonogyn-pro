"""SonoGyn Pro — Streamlit UI для PRO-пользователей (локальный анализ УЗИ)."""

from __future__ import annotations

import base64
import io
import os
import uuid
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

from dicom_io import dicom_bytes_to_png_bytes
from pro_auth import is_pro_access
from report_ru import build_report_markdown
from sonogyn_agents.backends.factory import get_vision_backend
from sonogyn_agents.orchestrator import analyze_study
from sononet_infer import sononet_available

st.set_page_config(page_title="SonoGyn Pro — ИИ УЗИ", page_icon="🩺", layout="wide")

DOMAINS = {
    "auto": "Авто (по контексту)",
    "fetal": "Плод / скрининг",
    "breast": "Молочная железа (BI-RADS)",
    "gyn": "Гинекология (O-RADS)",
    "kidney": "Почки",
}


def _file_to_frame(uploaded, idx: int) -> dict | None:
    raw = uploaded.read()
    name = uploaded.name.lower()
    mid = f"upload-{idx}-{uuid.uuid4().hex[:8]}"
    if name.endswith(".dcm"):
        try:
            png, meta = dicom_bytes_to_png_bytes(raw)
            return {
                "mediaId": mid,
                "fileName": uploaded.name,
                "mediaType": "dicom",
                "mimeType": "image/png",
                "dataBase64": base64.b64encode(png).decode("ascii"),
            }
        except Exception as exc:  # noqa: BLE001
            st.warning(f"DICOM {uploaded.name}: {exc}")
            return None
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return {
        "mediaId": mid,
        "fileName": uploaded.name,
        "mediaType": "image",
        "mimeType": "image/png",
        "dataBase64": base64.b64encode(buf.getvalue()).decode("ascii"),
    }


def main() -> None:
    st.title("SonoGyn Pro — ИИ-разбор УЗИ")
    st.caption("PRO-only · findings · impression · BI-RADS / O-RADS · русский отчёт")

    with st.sidebar:
        st.header("Доступ PRO")
        license_key = st.text_input("License key", type="password")
        jwt = st.text_area("Supabase JWT (опционально)", height=80)
        ok, msg = is_pro_access(license_key=license_key or None, jwt=jwt or None)
        if ok:
            st.success(f"PRO: {msg}")
        else:
            st.error(msg)
            st.info("Для dev: `SONOGYN_PRO_DEV_BYPASS=1` или `SONOGYN_PRO_KEYS=...`")

        st.divider()
        backend = st.selectbox("Vision backend", ["auto", "ollama", "openrouter"])
        vision = get_vision_backend(backend if backend != "auto" else None)
        st.write(f"Vision: **{vision.name() if vision else '—'}**")
        st.write(f"SonoNet: **{'✓' if sononet_available() else '✗'}**")

    if not ok:
        st.stop()

    col1, col2 = st.columns([1, 1])
    with col1:
        domain = st.selectbox("Домен", list(DOMAINS.keys()), format_func=lambda k: DOMAINS[k])
        clinical = st.text_area("Клинический контекст", placeholder="Плод 20 нед, скрининг 2 триместра…")
        uploads = st.file_uploader(
            "Снимки (PNG/JPG/DICOM), папка — несколько файлов",
            accept_multiple_files=True,
            type=["png", "jpg", "jpeg", "dcm", "bmp"],
        )
        run = st.button("Запустить анализ", type="primary", disabled=not uploads)

    with col2:
        st.subheader("Статус")
        if uploads:
            st.write(f"Файлов: {len(uploads)}")

    if run and uploads:
        frames = []
        for i, u in enumerate(uploads):
            fr = _file_to_frame(u, i)
            if fr:
                frames.append(fr)
        if not frames:
            st.error("Не удалось прочитать файлы")
            st.stop()

        with st.spinner("Анализ…"):
            try:
                report = analyze_study(
                    clinical_context=clinical,
                    frames=frames,
                    domain=domain,
                    backend=backend if backend != "auto" else None,
                )
                result = report.to_api_dict()
                result["reportMarkdown"] = build_report_markdown(result)
            except Exception as exc:  # noqa: BLE001
                st.error(str(exc))
                st.stop()

        st.success("Готово")
        if result.get("scorecard"):
            st.metric("Классификация", result["scorecard"])

        tab1, tab2, tab3 = st.tabs(["Отчёт", "Markdown", "JSON"])
        with tab1:
            st.markdown(f"> {result.get('disclaimer', '')}")
            st.subheader("Сводка")
            st.write(result.get("studySummary", ""))
            st.subheader("Findings / впечатление")
            st.write(result.get("impression", ""))
            for r in result.get("recommendations") or []:
                st.write(f"- {r}")
            for i, f in enumerate(result.get("frames") or [], 1):
                with st.expander(f"Кадр {i}: {f.get('fileName', '')}"):
                    st.json(f)

        with tab2:
            st.download_button(
                "Скачать report.md",
                data=result["reportMarkdown"],
                file_name="sonogyn-us-report.md",
                mime="text/markdown",
            )
            st.code(result["reportMarkdown"], language="markdown")

        with tab3:
            st.json(result)


if __name__ == "__main__":
    main()
