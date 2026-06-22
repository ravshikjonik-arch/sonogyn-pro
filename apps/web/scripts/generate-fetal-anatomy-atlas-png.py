#!/usr/bin/env python3
"""Generate grayscale fetal US PNG placeholders — replace with clinic echograms (same basename)."""

from __future__ import annotations

import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

WEB_ROOT = Path(__file__).resolve().parents[1]
SVG_DIR = WEB_ROOT.parent.parent / "public" / "images" / "fetal-anatomy"
OUT = WEB_ROOT / "public" / "images" / "fetal-anatomy"
W, H = 640, 400


def parse_svg_meta(svg_path: Path) -> tuple[str, str, str]:
    text = svg_path.read_text(encoding="utf-8")
    title_match = re.search(r"<title>([^<]+)</title>", text)
    title = title_match.group(1) if title_match else svg_path.stem
    kind = "pathology" if "_pathology" in svg_path.stem else "normal"
    view_id = svg_path.stem.replace("_normal", "").replace("_pathology", "")
    return view_id, kind, title


def speckle(draw: ImageDraw.ImageDraw, rng: random.Random, count: int, tone: int) -> None:
    for _ in range(count):
        x = rng.randint(12, W - 12)
        y = rng.randint(12, H - 12)
        r = rng.randint(1, 3)
        shade = max(0, min(255, tone + rng.randint(-18, 18)))
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(shade, shade, shade))


def draw_fetal_silhouette(draw: ImageDraw.ImageDraw, rng: random.Random, pathology: bool) -> None:
    cx, cy = W // 2, H // 2 + 10
    head_rx, head_ry = 78, 62
    body_rx, body_ry = 110, 88
    head_tone = 118 if not pathology else 96
    body_tone = 102 if not pathology else 82
    draw.ellipse((cx - head_rx, cy - 130 - head_ry, cx + head_rx, cy - 130 + head_ry), fill=(head_tone, head_tone, head_tone))
    draw.ellipse((cx - body_rx, cy - body_ry, cx + body_rx, cy + body_ry), fill=(body_tone, body_tone, body_tone))
    draw.line((cx, cy - 40, cx, cy + 70), fill=(88, 88, 88), width=3)
    if pathology:
        draw.ellipse((cx + 24, cy - 118, cx + 44, cy - 98), outline=(210, 60, 60), width=3)
        draw.line((cx - 70, cy + 20, cx - 30, cy + 55), fill=(210, 60, 60), width=4)
    else:
        draw.ellipse((cx - 18, cy - 145, cx + 18, cy - 109), outline=(150, 150, 150), width=2)


def draw_placeholder(view_id: str, kind: str, title: str) -> None:
    rng = random.Random(f"{view_id}:{kind}")
    pathology = kind == "pathology"
    base = 24 if pathology else 32
    img = Image.new("RGB", (W, H), (base, base, base))
    draw = ImageDraw.Draw(img)
    speckle(draw, rng, 900 if pathology else 700, 46 if pathology else 58)
    draw_fetal_silhouette(draw, rng, pathology)
    speckle(draw, rng, 250, 40 if pathology else 52)
    draw.rounded_rectangle((10, 10, W - 10, H - 10), radius=12, outline=(70, 70, 70), width=2)
    badge = "PATHOLOGY · placeholder" if pathology else "NORMAL · placeholder"
    badge_color = (220, 90, 90) if pathology else (120, 190, 255)
    draw.text((20, 16), "Fetal US · II trimester", fill=(180, 180, 180))
    draw.text((20, 34), badge, fill=badge_color)
    draw.text((20, H - 32), view_id, fill=(140, 140, 140))
    draw.text((20, H - 16), "SonoGyn-Pro · clinical PNG slot", fill=(110, 110, 110))
    img = img.filter(ImageFilter.GaussianBlur(radius=0.4))
    out_path = OUT / f"{view_id}_{kind}.png"
    img.save(out_path, format="PNG", optimize=True)
    print(f"wrote {out_path.name}")


def main() -> None:
    svgs = sorted(SVG_DIR.glob("*_normal.svg"))
    if not svgs:
        raise SystemExit(f"No SVG placeholders in {SVG_DIR}")
    for svg in svgs:
        view_id, _, title = parse_svg_meta(svg)
        draw_placeholder(view_id, "normal", title)
        pathology_svg = SVG_DIR / f"{view_id}_pathology.svg"
        if pathology_svg.exists():
            _, _, ptitle = parse_svg_meta(pathology_svg)
            draw_placeholder(view_id, "pathology", ptitle)
    print(f"Done: {len(list(OUT.glob('*.png')))} PNG in {OUT}")


if __name__ == "__main__":
    main()
