"""
Generate high-quality web thumbnails for the portfolio.

Usage:
    python tools/optimize_images.py "C:\path\to\photo-01.jpg" "C:\path\to\photo-02.jpg"

What it does:
- Copies each source JPG into assets/images/originals/work-XX.jpg without re-encoding.
- Creates assets/images/works/work-XX-900.webp and work-XX-1800.webp.
- Picks the next available work number automatically.
- Strips EXIF from the web thumbnails only (the originals stay untouched).

Requires: Python 3 and Pillow (`python -m pip install pillow`).
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

PROJECT = Path(__file__).resolve().parent.parent
ORIGINALS = PROJECT / "assets" / "images" / "originals"
WORKS = PROJECT / "assets" / "images" / "works"


def next_number() -> int:
    existing = []
    for path in ORIGINALS.glob("work-*.jpg"):
        try:
            existing.append(int(path.stem.split("-")[1]))
        except (IndexError, ValueError):
            continue
    return max(existing, default=0) + 1


def load(path: Path) -> Image.Image:
    with Image.open(path) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        return image.copy()


def resize_to_width(image: Image.Image, width: int) -> Image.Image:
    if image.width <= width:
        return image.copy()
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.LANCZOS)


def grade(image: Image.Image) -> Image.Image:
    image = ImageEnhance.Contrast(image).enhance(1.02)
    image = ImageEnhance.Color(image).enhance(1.02)
    return image.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=4))


def process(source: Path, number: int) -> None:
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    WORKS.mkdir(parents=True, exist_ok=True)

    original = ORIGINALS / f"work-{number:02d}.jpg"
    shutil.copy2(source, original)

    image = grade(load(source))
    for width, quality in ((1800, 95), (900, 90)):
        output = resize_to_width(image, width)
        filename = WORKS / f"work-{number:02d}-{width}.webp"
        output.save(filename, "WEBP", quality=quality, method=6)
        print(f"created {filename.relative_to(PROJECT)} ({output.width}x{output.height})")

    print(f"kept original as {original.relative_to(PROJECT)}")


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    sources = [Path(arg).expanduser().resolve() for arg in sys.argv[1:]]
    missing = [path for path in sources if not path.is_file()]
    if missing:
        for path in missing:
            print(f"not found: {path}", file=sys.stderr)
        return 1

    start = next_number()
    for offset, source in enumerate(sources):
        process(source, start + offset)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
