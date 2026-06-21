#!/usr/bin/env python3
"""CLI: пакетный анализ папки DICOM/PNG (аналог ai_mri_analyzer для SonoGyn)."""

from __future__ import annotations

import argparse
import os
import sys

# Запуск из services/us-ai-worker
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="SonoGyn Pro — пакетный ИИ-разбор архива УЗИ (DICOM/JPEG/PNG)",
    )
    parser.add_argument("image_dir", help="Папка с DICOM или изображениями (рекурсивно)")
    parser.add_argument("--output", "-o", default=None, help="Папка для CSV и отчётов")
    parser.add_argument("--domain", default="auto", choices=["auto", "fetal", "breast", "gyn", "kidney"])
    parser.add_argument("--context", default="", help="Клинический контекст для всех серий")
    parser.add_argument("--backend", default=None, help="ollama | openrouter | auto")
    parser.add_argument("--sample", type=int, default=None, help="Макс. кадров на серию (dry-run)")
    parser.add_argument("--max-files", type=int, default=None, help="Макс. файлов всего")
    parser.add_argument("--no-resume", action="store_true", help="Не пропускать уже обработанные серии")
    args = parser.parse_args()

    from batch_archive import analyze_archive

    print(f"📂 Сканирование: {args.image_dir}")
    result = analyze_archive(
        root_dir=args.image_dir,
        output_dir=args.output,
        clinical_context=args.context,
        domain=args.domain,
        backend=args.backend,
        max_files=args.max_files,
        resume=not args.no_resume,
        sample_per_series=args.sample,
    )

    print(f"✅ Серий обработано: {result['seriesProcessed']} / {result['seriesTotal']}")
    print(f"   Файлов: {result['filesScanned']}")
    if result.get("csvPath"):
        print(f"   CSV: {result['csvPath']}")
    print(f"   Отчёты: {result['reportsDir']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
