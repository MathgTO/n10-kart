"""Generate distinctive N10 paddock mark SVG + PNG icons (no letterforms)."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

OUT = Path(__file__).resolve().parents[1] / "public"
ICONS = OUT / "icons"
ICONS.mkdir(parents=True, exist_ok=True)

LIME = (200, 245, 66, 255)
LIME_DIM = (200, 245, 66, 90)
BG = (10, 10, 10, 255)
WHITE = (255, 255, 255, 255)


def draw_mark(size: int) -> Image.Image:
    """
    Distinctive paddock mark:
    - Near-black rounded tile
    - Quiet timing ring (session/lap)
    - Bold double lime apex chevron (») — speed / paddock
    - White tenth tick on the ring + quiet track baseline
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = float(size)

    def sx(x: float) -> float:
        return s * (x / 64.0)

    def sy(y: float) -> float:
        return s * (y / 64.0)

    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=max(2, int(s * 0.22)), fill=BG)

    # Timing ring (reads as session / lap clock)
    if s >= 24:
        cx, cy, r = sx(32), sy(30), sx(20)
        # Approximate ring with arc segments (Pillow has limited arc stroke control)
        bbox = [cx - r, cy - r, cx + r, cy + r]
        d.arc(bbox, start=210, end=480, fill=LIME_DIM, width=max(1, int(s * 0.028)))
        # White tenth tick at ~3 o'clock on the ring
        tick_len = sx(4.5)
        tick_w = max(1.0, sx(2.4))
        d.rectangle(
            [cx + r - tick_len * 0.15, cy - tick_w / 2, cx + r + sx(1.2), cy + tick_w / 2],
            fill=WHITE,
        )

    def chevron(x0: float) -> None:
        d.polygon(
            [
                (sx(x0), sy(12)),
                (sx(x0 + 10), sy(12)),
                (sx(x0 + 28), sy(30)),
                (sx(x0 + 10), sy(48)),
                (sx(x0), sy(48)),
                (sx(x0 + 16), sy(30)),
            ],
            fill=LIME,
        )

    # Double apex (») — paddock / speed
    chevron(7)
    chevron(25)

    # Quiet track baseline under the mark
    if s >= 20:
        bar_y = sy(55.0)
        bar_h = max(1.0, sy(2.0))
        d.rounded_rectangle(
            [sx(14), bar_y, sx(50), bar_y + bar_h],
            radius=max(1, int(s * 0.02)),
            fill=(200, 245, 66, 220),
        )
    elif s >= 16:
        tick_w = max(1.0, sx(2.5))
        d.rectangle([sx(44), sy(54), sx(44) + tick_w, sy(60)], fill=WHITE)

    return img


MARK_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="N10 mark">
  <rect width="64" height="64" rx="14" fill="#0a0a0a"/>
  <!-- quiet timing ring -->
  <circle cx="32" cy="30" r="20" fill="none" stroke="#c8f542" stroke-width="1.8" opacity="0.35"/>
  <!-- white tenth tick on ring -->
  <rect x="50.5" y="28" width="3.2" height="4" rx="0.6" fill="#fff"/>
  <!-- double apex chevron (paddock / speed) — no letterforms -->
  <polygon fill="#c8f542" points="7,12 17,12 35,30 17,48 7,48 23,30"/>
  <polygon fill="#c8f542" points="25,12 35,12 53,30 35,48 25,48 41,30"/>
  <!-- track baseline -->
  <rect x="14" y="55" width="36" height="2" rx="1" fill="#c8f542" opacity="0.85"/>
</svg>
'''

WORDMARK_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 36" role="img" aria-label="N10">
  <svg x="0" y="2" width="32" height="32" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="#0a0a0a"/>
    <circle cx="32" cy="30" r="20" fill="none" stroke="#c8f542" stroke-width="1.8" opacity="0.35"/>
    <rect x="50.5" y="28" width="3.2" height="4" rx="0.6" fill="#fff"/>
    <polygon fill="#c8f542" points="7,12 17,12 35,30 17,48 7,48 23,30"/>
    <polygon fill="#c8f542" points="25,12 35,12 53,30 35,48 25,48 41,30"/>
    <rect x="14" y="55" width="36" height="2" rx="1" fill="#c8f542" opacity="0.85"/>
  </svg>
  <text x="40" y="26" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif" font-size="24" font-weight="900" letter-spacing="-0.06em" fill="#c8f542">N10</text>
</svg>
'''


def main():
    (OUT / "n10-mark.svg").write_text(MARK_SVG, encoding="utf-8")
    (OUT / "n10-wordmark.svg").write_text(WORDMARK_SVG, encoding="utf-8")

    for name, sz in {
        "icon-16.png": 16,
        "icon-32.png": 32,
        "icon-180.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
        "apple-touch-icon.png": 180,
    }.items():
        draw_mark(sz).save(ICONS / name, optimize=True)
        print("wrote", name)

    (OUT / "apple-touch-icon.png").write_bytes((ICONS / "apple-touch-icon.png").read_bytes())
    draw_mark(32).save(OUT / "favicon.png", optimize=True)
    draw_mark(32).save(OUT / "favicon-32x32.png", optimize=True)
    draw_mark(16).save(OUT / "favicon-16x16.png", optimize=True)
    print("done")


if __name__ == "__main__":
    main()
