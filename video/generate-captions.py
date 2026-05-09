#!/usr/bin/env python3
"""Composite subtitle text onto frames for LP Intel demo."""

from PIL import Image, ImageDraw, ImageFont
import os, textwrap

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, 'frames')
COMPOSITES_DIR = os.path.join(SCRIPT_DIR, 'composites')
os.makedirs(COMPOSITES_DIR, exist_ok=True)

# MUST match audio verbatim
CLIPS = {
    "01-hook": "This tool reads any wallet's LP positions and tells you exactly what they're worth. Fees earned, impermanent loss, risk level. All from on-chain data.",
    "02-problem": "AI agents can create Uniswap positions. But they can't analyze existing ones. No tool tells an agent whether an LP is making or losing money.",
    "03-multi-dex": "LP Intel scans three DEXes per chain. Uniswap, SushiSwap, PancakeSwap. One command, four chains, every V3 position in the wallet.",
    "04-fees": "Fees aren't just the tokens owed field. We read fee growth global, fee growth outside for both ticks, and compute the real uncollected amount. That's the actual Uniswap V3 pool math.",
    "05-entry-price": "Entry prices come from binary-searching the NFT mint block. Twenty-four RPC calls to find exactly when the position was created. Then we pull the historical pool price at that block.",
    "06-json": "Agents get clean JSON. No terminal colors, no status messages. Just structured data they can act on.",
    "07-close": "LP Intel. Built with OnchainOS and Uniswap AI Skills.",
}

def get_font(size):
    candidates = [
        '/System/Library/Fonts/HelveticaNeue.ttc',
        '/System/Library/Fonts/Helvetica.ttc',
        '/Library/Fonts/Arial.ttf',
    ]
    for f in candidates:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except:
                continue
    return ImageFont.load_default()

font = get_font(32)

for clip, text in CLIPS.items():
    frame_path = os.path.join(FRAMES_DIR, f'{clip}.png')
    if not os.path.exists(frame_path):
        print(f'SKIP {clip} (no frame)')
        continue

    img = Image.open(frame_path).convert('RGBA')
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    wrapped = textwrap.fill(text, width=70)
    lines = wrapped.split('\n')

    line_height = 42
    padding = 20
    margin_x = 160
    box_h = len(lines) * line_height + padding * 2
    box_y = img.height - box_h - 60
    box_w = img.width - margin_x * 2

    draw.rounded_rectangle(
        [(margin_x, box_y), (margin_x + box_w, box_y + box_h)],
        radius=12,
        fill=(0, 0, 0, 120)
    )

    y = box_y + padding
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = margin_x + (box_w - tw) // 2
        draw.text((x, y), line, fill=(255, 255, 255, 240), font=font)
        y += line_height

    result = Image.alpha_composite(img, overlay)
    result = result.convert('RGB')
    result.save(os.path.join(COMPOSITES_DIR, f'{clip}.png'))
    print(f'OK {clip}')

print('All composites generated')
