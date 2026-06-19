"""SonoNet 14-class labels (EN + RU). Baumgartner et al., 2016."""

SONONET_LABELS_EN = [
    "3VV",
    "4CH",
    "Abdominal",
    "Background",
    "Brain (Cb.)",
    "Brain (Tv.)",
    "Femur",
    "Kidneys",
    "Lips",
    "LVOT",
    "Profile",
    "RVOT",
    "Spine (cor.)",
    "Spine (sag.)",
]

SONONET_LABELS_RU: dict[str, str] = {
    "3VV": "Трёхсосудистый сложный (3VV)",
    "4CH": "4-камерный срез сердца (4CH)",
    "Abdominal": "Абдоминальный срез (AC)",
    "Background": "Фон / нестандартная плоскость",
    "Brain (Cb.)": "Мозг — мозжечок (Cb)",
    "Brain (Tv.)": "Мозг — transthalamic (TT)",
    "Femur": "Бедренная кость (Femur)",
    "Kidneys": "Почки",
    "Lips": "Профиль губ",
    "LVOT": "LVOT",
    "Profile": "Лицевой профиль",
    "RVOT": "RVOT",
    "Spine (cor.)": "Позвоночник (коронарный)",
    "Spine (sag.)": "Позвоночник (сагиттальный)",
}

ISUOG_HINTS: dict[str, str] = {
    "Brain (Tv.)": "ISUOG: TT — биометрия BPD/HC",
    "Abdominal": "ISUOG: AC, желудок, пуповина",
    "Femur": "ISUOG: FL",
    "4CH": "ISUOG: 4-chamber — сердце",
    "3VV": "ISUOG: 3VV / trachea",
}


def label_to_ru(en_label: str) -> str:
    return SONONET_LABELS_RU.get(en_label.strip(), en_label)
