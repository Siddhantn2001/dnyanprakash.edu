#!/usr/bin/env python3
"""Regenerate the 3 favicon files from a source logo.

Pads the (portrait) source to a centered square on white, then exports:
  images/favicon.ico        (multi-size: 16, 32, 48)
  images/favicon-32.png     (32x32)
  images/apple-touch-icon.png  (180x180)

The source logo file is preserved as-is and must never be cropped/altered
per CLAUDE.md §6 Rule 0 — we only size and place it.
"""
from PIL import Image
from pathlib import Path
import sys

SRC = Path('/Users/siddhantnarhare/Desktop/WEBsite/Dnyanprakash Logo.jpg')
OUT = Path('/Users/siddhantnarhare/dnyanprakash-website/images')

def main():
    if not SRC.exists():
        sys.exit(f'source logo missing: {SRC}')

    logo = Image.open(SRC).convert('RGBA')
    w, h = logo.size
    side = max(w, h)

    # Center on a white square canvas so portrait logos don't squish at 16×16.
    square = Image.new('RGBA', (side, side), (255, 255, 255, 255))
    square.paste(logo, ((side - w) // 2, (side - h) // 2), logo)

    # favicon.ico — multi-size
    (OUT / 'favicon.ico').unlink(missing_ok=True)
    square.save(OUT / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

    # favicon-32.png
    square.resize((32, 32), Image.LANCZOS).save(OUT / 'favicon-32.png', 'PNG', optimize=True)

    # apple-touch-icon.png (180x180)
    square.resize((180, 180), Image.LANCZOS).save(OUT / 'apple-touch-icon.png', 'PNG', optimize=True)

    for name in ('favicon.ico', 'favicon-32.png', 'apple-touch-icon.png'):
        p = OUT / name
        print(f'  {name:26s}  {p.stat().st_size:>7d} bytes')

if __name__ == '__main__':
    main()
