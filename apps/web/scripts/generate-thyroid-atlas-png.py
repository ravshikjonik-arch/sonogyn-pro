#!/usr/bin/env python3
"""Generate PNG atlas placeholders (240×140) — replace with clinic echograms same basename."""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "public" / "images" / "thyroid"

IMAGES = [
    ("normal_thyroid", "Normal thyroid"),
    ("colloid_nodule", "Colloid nodule"),
    ("spongiform_nodule", "Spongiform"),
    ("simple_cyst", "Simple cyst"),
    ("hemorrhagic_cyst", "Hemorrhagic cyst"),
    ("follicular_adenoma", "Follicular adenoma"),
    ("papillary_carcinoma", "Papillary CA"),
    ("follicular_carcinoma", "Follicular CA"),
    ("medullary_carcinoma", "Medullary CA"),
    ("anaplastic_carcinoma", "Anaplastic CA"),
    ("suspicious_lymph_node", "Suspicious LN"),
]

W, H = 240, 140


def draw_placeholder(name: str, label: str) -> None:
    img = Image.new("RGB", (W, H), "#082f49")
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((8, 8, W - 8, H - 8), radius=8, outline="#38bdf8", width=2, fill="#0f172a")
    draw.ellipse((W // 2 - 56, H // 2 - 36, W // 2 + 56, H // 2 + 36), outline="#7dd3fc", width=2)
    draw.ellipse((W // 2 - 28, H // 2 - 20, W // 2 + 28, H // 2 + 20), outline="#0ea5e9", width=1)
    draw.text((12, 10), "Thyroid US · placeholder", fill="#7dd3fc")
    draw.text((12, H - 28), label, fill="#94a3b8")
    draw.text((12, H - 14), f"{name}.png", fill="#64748b")
    img.save(OUT / f"{name}.png", format="PNG", optimize=True)
    print(f"wrote {name}.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for basename, label in IMAGES:
        draw_placeholder(basename, label)
    print(f"Done: {len(IMAGES)} PNG in {OUT}")


if __name__ == "__main__":
    main()
