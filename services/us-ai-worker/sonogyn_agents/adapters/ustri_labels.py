"""Русские подписи для задач USTri (FMC UIA)."""

from __future__ import annotations

# fetal_plane_cls — 6 классов (FMC; уточняйте по вашему датасету)
FETAL_PLANE_CLS_RU: list[str] = [
    "Мозг (transthalamic / cerebellum)",
    "Абдоминальный срез (AC)",
    "Бедренная кость (FL)",
    "4-камерный срез сердца",
    "Почечный срез",
    "Нестандартная / другая плоскость",
]

BREAST_3CLS_RU: list[str] = [
    "Доброкачественное (BI-RADS 2)",
    "Вероятно доброкачественное (BI-RADS 3)",
    "Подозрительное / злокачественное (BI-RADS 4–5)",
]

BREAST_2CLS_RU: list[str] = [
    "Доброкачественное (BI-RADS 2)",
    "Подозрительное / злокачественное (BI-RADS 4–5)",
]

TASK_TO_LABELS: dict[str, list[str]] = {
    "fetal_plane_cls": FETAL_PLANE_CLS_RU,
    "breast_3cls": BREAST_3CLS_RU,
    "breast_2cls": BREAST_2CLS_RU,
}

ISUOG_BY_FETAL_PLANE: dict[int, str] = {
    0: "ISUOG: TT/Cb — BPD, HC",
    1: "ISUOG: AC, желудок",
    2: "ISUOG: FL",
    3: "ISUOG: 4-chamber",
    4: "ISUOG: почки плода",
}


def label_for_task(task_id: str, class_index: int) -> str:
    labels = TASK_TO_LABELS.get(task_id, [])
    if 0 <= class_index < len(labels):
        return labels[class_index]
    return f"Класс {class_index}"
