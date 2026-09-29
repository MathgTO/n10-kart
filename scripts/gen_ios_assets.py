"""Generate the iOS AppIcon set (incl. 1024 marketing icon, no alpha) and dark splash
from the existing N10 artwork in public/icons/icon-512.png.

Run: python3 scripts/gen_ios_assets.py   (then `npx cap sync ios` is not needed; files land in ios/)
"""
import json
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/icons/icon-512.png"
XC = ROOT / "ios/App/App/Assets.xcassets"
ICONSET = XC / "AppIcon.appiconset"
SPLASH = XC / "Splash.imageset"
BG = (10, 10, 10)  # #0a0a0a, same as the web theme colour


def full_bleed_mark(size: int) -> Image.Image:
    """Opaque square icon: the N10 mark on #0a0a0a with no rounded corners (iOS masks it)."""
    src = Image.open(SRC).convert("RGBA")
    base = Image.new("RGBA", src.size, BG + (255,))
    base.alpha_composite(src)  # fills the transparent rounded corners with the tile colour
    # The source tile already carries the mark with safe margins; upscale with Lanczos + light sharpen.
    big = base.resize((size, size), Image.LANCZOS)
    if size > src.size[0]:
        big = big.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return big.convert("RGB")  # strip alpha (App Store rejects a marketing icon with alpha)


ICONS = [
    # (idiom, size-in-points, scale)
    ("iphone", "20x20", 2), ("iphone", "20x20", 3),
    ("iphone", "29x29", 2), ("iphone", "29x29", 3),
    ("iphone", "40x40", 2), ("iphone", "40x40", 3),
    ("iphone", "60x60", 2), ("iphone", "60x60", 3),
    ("ipad", "20x20", 1), ("ipad", "20x20", 2),
    ("ipad", "29x29", 1), ("ipad", "29x29", 2),
    ("ipad", "40x40", 1), ("ipad", "40x40", 2),
    ("ipad", "76x76", 1), ("ipad", "76x76", 2),
    ("ipad", "83.5x83.5", 2),
    ("ios-marketing", "1024x1024", 1),
]


def main():
    for f in ICONSET.glob("*.png"):
        f.unlink()
    master = full_bleed_mark(1024)
    images = []
    for idiom, pts, scale in ICONS:
        px = round(float(pts.split("x")[0]) * scale)
        name = f"AppIcon-{idiom}-{pts}@{scale}x.png"
        img = master if px == 1024 else master.resize((px, px), Image.LANCZOS)
        img.save(ICONSET / name, optimize=True)
        images.append({"filename": name, "idiom": idiom, "scale": f"{scale}x", "size": pts})
    (ICONSET / "Contents.json").write_text(
        json.dumps({"images": images, "info": {"author": "xcode", "version": 1}}, indent=2) + "\n"
    )

    # Splash: dark 2732x2732 with the mark centred (LaunchScreen uses aspect-fill, so keep it central).
    splash = Image.new("RGB", (2732, 2732), BG)
    mark = full_bleed_mark(640)
    splash.paste(mark, ((2732 - 640) // 2, (2732 - 640) // 2))
    for name in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
        splash.save(SPLASH / name, optimize=True)

    # Store copy of the marketing icon for App Store Connect / metadata
    out = ROOT / "ios/AppStoreIcon-1024.png"
    master.save(out, optimize=True)
    print("icons:", len(images), "splash: 3", "marketing:", out)


if __name__ == "__main__":
    main()
