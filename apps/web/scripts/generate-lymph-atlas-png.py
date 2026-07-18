#!/usr/bin/env python3
"""Generate lymph_node_shape_atlas.png — comparative B-mode schematic (4 shapes)."""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "public" / "images" / "lymphnodes"
W, H = 960, 540


def draw_oval_node(draw: ImageDraw.ImageDraw, ox: int, oy: int, scale: float = 1.0) -> None:
    cx, cy = ox + 110, oy + 90
    draw.ellipse(
        (cx - int(72 * scale), cy - int(32 * scale), cx + int(72 * scale), cy + int(32 * scale)),
        fill="#475569",
        outline="#1e293b",
        width=2,
    )
    draw.ellipse(
        (cx - int(22 * scale), cy - int(14 * scale), cx + int(22 * scale), cy + int(14 * scale)),
        fill="#e2e8f0",
        outline="#94a3b8",
        width=1,
    )


def draw_round_node(draw: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    cx, cy = ox + 110, oy + 90
    r = 48
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill="#475569", outline="#1e293b", width=2)
    draw.pieslice((cx - 18, cy - 12, cx + 18, cy + 12), 200, 340, fill="#64748b", outline="#334155")
    draw.ellipse((cx + 8, cy - 10, cx + 26, cy + 8), fill="#334155", outline="#0f172a", width=1)


def draw_lobulated_node(draw: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    cx, cy = ox + 110, oy + 90
    pts = [
        (cx - 55, cy),
        (cx - 45, cy - 38),
        (cx - 10, cy - 48),
        (cx + 25, cy - 35),
        (cx + 52, cy - 10),
        (cx + 58, cy + 20),
        (cx + 35, cy + 45),
        (cx, cy + 50),
        (cx - 35, cy + 40),
        (cx - 58, cy + 15),
    ]
    draw.polygon(pts, fill="#475569", outline="#1e293b")
    draw.ellipse((cx - 18, cy - 10, cx + 18, cy + 14), fill="#cbd5e1", outline="#94a3b8")


def draw_spiculated_node(draw: ImageDraw.ImageDraw, ox: int, oy: int) -> None:
    cx, cy = ox + 110, oy + 90
    draw.ellipse((cx - 42, cy - 42, cx + 42, cy + 42), fill="#334155", outline="#0f172a", width=2)
    for angle in range(0, 360, 25):
        import math

        rad = math.radians(angle)
        x1 = cx + int(38 * math.cos(rad))
        y1 = cy + int(38 * math.sin(rad))
        x2 = cx + int(58 * math.cos(rad))
        y2 = cy + int(58 * math.sin(rad))
        draw.line((x1, y1, x2, y2), fill="#0f172a", width=2)


def panel(draw: ImageDraw.ImageDraw, x: int, y: int, title: str, fn) -> None:
    draw.rounded_rectangle((x, y, x + 220, y + 200), radius=10, outline="#64748b", width=2, fill="#0f172a")
    fn(draw, x + 10, y + 20)
    draw.text((x + 12, y + 8), title, fill="#38bdf8")
    draw.text((x + 12, y + 178), "B-mode schematic", fill="#64748b")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W, H), "#082f49")
    draw = ImageDraw.Draw(img)

    draw.text((24, 16), "LN-RADS US · Shape atlas (B-mode teaching)", fill="#7dd3fc")
    draw.text((24, 38), "Oval + hilum = benign | Round + eccentric cortex = suspicious | Spiculated = malignant", fill="#94a3b8")

    panel(draw, 40, 70, "1. Oval (L/S > 2)", draw_oval_node)
    panel(draw, 280, 70, "2. Round (L/S ~ 1)", draw_round_node)
    panel(draw, 520, 70, "3. Lobulated", draw_lobulated_node)
    panel(draw, 760, 70, "4. Spiculated", draw_spiculated_node)

    # Doppler row hints
    doppler_y = 300
    for i, (label, color) in enumerate(
        [
            ("Hilar flow (c)", "#22c55e"),
            ("Displaced hilar (f)", "#eab308"),
            ("Peripheral (i)", "#f97316"),
            ("Chaotic/absent (l)", "#ef4444"),
        ]
    ):
        bx = 40 + i * 230
        draw.rounded_rectangle((bx, doppler_y, bx + 210, doppler_y + 180), radius=10, outline=color, width=2, fill="#0f172a")
        draw.text((bx + 12, doppler_y + 12), f"Doppler · {label}", fill=color)
        cx, cy = bx + 105, doppler_y + 100
        draw.ellipse((cx - 35, cy - 22, cx + 35, cy + 22), fill="#475569", outline="#64748b")
        if i == 0:
            draw.line((cx, cy + 20, cx, cy - 30), fill="#22c55e", width=3)
        elif i == 1:
            draw.line((cx + 15, cy, cx - 25, cy - 5), fill="#eab308", width=2)
        elif i == 2:
            draw.line((cx + 30, cy - 10, cx - 20, cy + 5), fill="#f97316", width=2)
            draw.line((cx + 25, cy + 15, cx - 15, cy - 15), fill="#f97316", width=2)
        else:
            draw.line((cx - 30, cy - 15, cx + 25, cy + 10), fill="#ef4444", width=2)
            draw.line((cx + 20, cy - 20, cx - 25, cy + 15), fill="#ef4444", width=2)

    out_path = OUT / "lymph_node_shape_atlas.png"
    img.save(out_path, format="PNG", optimize=True)
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
