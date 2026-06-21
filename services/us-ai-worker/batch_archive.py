"""Пакетный анализ папки DICOM/JPEG/PNG (паттерн ai_mri_analyzer)."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from analyzer import analyze_frames
from dicom_io import dicom_bytes_to_png_bytes
from report_ru import build_report_markdown

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
DICOM_EXT = {".dcm", ".dicom"}


@dataclass
class ArchiveFile:
    path: Path
    series_key: str
    media_type: str


@dataclass
class BatchProgress:
    processed: set[str] = field(default_factory=set)
    output_dir: Path | None = None

    def load(self, path: Path) -> None:
        if not path.is_file():
            return
        data = json.loads(path.read_text(encoding="utf-8"))
        self.processed = set(data.get("processed") or [])

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps({"processed": sorted(self.processed)}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def mark(self, key: str) -> None:
        self.processed.add(key)


def _file_id(path: Path) -> str:
    return hashlib.sha256(str(path.resolve()).encode()).hexdigest()[:16]


def _series_key_for_dicom(raw: bytes, path: Path) -> str:
    try:
        import pydicom

        ds = pydicom.dcmread(io.BytesIO(raw), force=True, stop_before_pixels=True)
        uid = getattr(ds, "SeriesInstanceUID", None)
        if uid:
            return str(uid)
        study = getattr(ds, "StudyInstanceUID", None)
        if study:
            return str(study)
    except Exception:  # noqa: BLE001
        pass
    return path.parent.name or "default"


def scan_archive(root: Path) -> list[ArchiveFile]:
    root = root.resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Папка не найдена: {root}")

    found: list[ArchiveFile] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        ext = path.suffix.lower()
        if ext in IMAGE_EXT:
            found.append(ArchiveFile(path=path, series_key=path.parent.name, media_type="image"))
        elif ext in DICOM_EXT:
            raw = path.read_bytes()
            found.append(
                ArchiveFile(
                    path=path,
                    series_key=_series_key_for_dicom(raw, path),
                    media_type="dicom",
                )
            )
    return found


def _frame_from_file(af: ArchiveFile) -> dict[str, Any] | None:
    import base64

    raw = af.path.read_bytes()
    mid = f"arch-{_file_id(af.path)}"
    if af.media_type == "dicom":
        try:
            png, meta = dicom_bytes_to_png_bytes(raw)
            return {
                "mediaId": mid,
                "fileName": af.path.name,
                "mediaType": "dicom",
                "mimeType": "image/png",
                "dataBase64": base64.b64encode(png).decode("ascii"),
                "dicomMeta": meta,
                "seriesKey": af.series_key,
                "sourcePath": str(af.path),
            }
        except Exception:  # noqa: BLE001
            return None
    return {
        "mediaId": mid,
        "fileName": af.path.name,
        "mediaType": "image",
        "mimeType": f"image/{af.path.suffix.lstrip('.') or 'png'}",
        "dataBase64": __import__("base64").b64encode(raw).decode("ascii"),
        "seriesKey": af.series_key,
        "sourcePath": str(af.path),
    }


def group_by_series(files: list[ArchiveFile]) -> dict[str, list[ArchiveFile]]:
    groups: dict[str, list[ArchiveFile]] = {}
    for af in files:
        groups.setdefault(af.series_key, []).append(af)
    return groups


def analyze_archive(
    *,
    root_dir: str | Path,
    output_dir: str | Path | None = None,
    clinical_context: str = "",
    domain: str = "auto",
    backend: str | None = None,
    max_files: int | None = None,
    resume: bool = True,
    sample_per_series: int | None = None,
) -> dict[str, Any]:
    """
    Сканирует папку, группирует по серии DICOM, формирует CSV + markdown отчёты.
    Уже обработанные серии пропускаются при resume=True.
    """
    root = Path(root_dir)
    out = Path(output_dir) if output_dir else root / "sonogyn_batch_output"
    out.mkdir(parents=True, exist_ok=True)

    progress = BatchProgress(output_dir=out)
    progress_path = out / ".batch_progress.json"
    if resume:
        progress.load(progress_path)

    all_files = scan_archive(root)
    if max_files:
        all_files = all_files[:max_files]
    if not all_files:
        raise RuntimeError(f"Нет DICOM/изображений в {root}")

    groups = group_by_series(all_files)
    rows: list[dict[str, Any]] = []
    reports_dir = out / "reports"
    reports_dir.mkdir(exist_ok=True)

    for series_key, series_files in groups.items():
        series_id = hashlib.sha256(series_key.encode()).hexdigest()[:12]
        if resume and series_id in progress.processed:
            continue

        if sample_per_series:
            series_files = series_files[:sample_per_series]

        frames: list[dict[str, Any]] = []
        for af in series_files:
            fr = _frame_from_file(af)
            if fr:
                frames.append(fr)
        if not frames:
            continue

        study_payload = {
            "clinicalContext": clinical_context or f"Серия: {series_key}",
            "domain": domain,
            "backend": backend,
            "frames": frames,
            "mediaIds": [f["mediaId"] for f in frames],
        }
        result = analyze_frames(study_payload)

        md_path = reports_dir / f"{series_id}.md"
        md_path.write_text(build_report_markdown(result), encoding="utf-8")

        row = {
            "seriesKey": series_key,
            "seriesId": series_id,
            "fileCount": len(frames),
            "domain": result.get("domain"),
            "pipeline": result.get("pipeline"),
            "modelVersion": result.get("modelVersion"),
            "studySummary": result.get("studySummary", ""),
            "impression": result.get("impression", ""),
            "scorecard": result.get("scorecard") or "",
            "recommendations": " | ".join(result.get("recommendations") or []),
            "reportPath": str(md_path),
            "analyzedAt": datetime.now(timezone.utc).isoformat(),
        }
        rows.append(row)
        progress.mark(series_id)
        progress.save(progress_path)

    csv_path = out / "batch_summary.csv"
    if rows:
        with csv_path.open("w", encoding="utf-8-sig", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)

    return {
        "rootDir": str(root),
        "outputDir": str(out),
        "seriesTotal": len(groups),
        "seriesProcessed": len(rows),
        "filesScanned": len(all_files),
        "csvPath": str(csv_path) if rows else None,
        "reportsDir": str(reports_dir),
        "rows": rows,
    }
