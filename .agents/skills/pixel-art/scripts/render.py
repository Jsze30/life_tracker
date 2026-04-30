#!/usr/bin/env python3
"""
Pixel Art Renderer — converts pixel grid JSON or drawing commands to SVG/PNG.
Also downscales source images to pixel art resolution.

Usage:
  python render.py --data pixels.json --out art.svg
  python render.py --data pixels.json --out art.png --scale 10
  python render.py --source photo.jpg --width 32 --height 32 --out pixel.svg --colors 16
"""

import json
import sys
import argparse
import math
from pathlib import Path


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


# ── SVG output ──────────────────────────────────────────────────────────────

def render_svg(pixels, width, height, scale, background, show_grid):
    tw, th = width * scale, height * scale
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{tw}" height="{th}" '
        f'shape-rendering="crispEdges" style="image-rendering:pixelated">'
    ]
    if background:
        parts.append(f'<rect width="{tw}" height="{th}" fill="{background}"/>')
    for y in range(height):
        for x in range(width):
            c = pixels[y][x] if y < len(pixels) and x < len(pixels[y]) else None
            if c and str(c).lower() not in ('none', 'null', 'transparent', ''):
                parts.append(
                    f'<rect x="{x*scale}" y="{y*scale}" '
                    f'width="{scale}" height="{scale}" fill="{c}"/>'
                )
    if show_grid and scale >= 4:
        g = 'stroke="rgba(0,0,0,0.15)" stroke-width="0.5"'
        for x in range(0, tw + 1, scale):
            parts.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{th}" {g}/>')
        for y in range(0, th + 1, scale):
            parts.append(f'<line x1="0" y1="{y}" x2="{tw}" y2="{y}" {g}/>')
    parts.append('</svg>')
    return '\n'.join(parts)


# ── PNG output (requires Pillow) ─────────────────────────────────────────────

def render_png(pixels, width, height, scale, background, output_path):
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow required for PNG. Install: pip install pillow")
    img = Image.new('RGBA', (width * scale, height * scale), (0, 0, 0, 0))
    if background:
        r, g, b = hex_to_rgb(background)
        bg = Image.new('RGBA', img.size, (r, g, b, 255))
        img = bg
    for y in range(height):
        for x in range(width):
            c = pixels[y][x] if y < len(pixels) and x < len(pixels[y]) else None
            if c and str(c).lower() not in ('none', 'null', 'transparent', ''):
                r, g, b = hex_to_rgb(c)
                for dy in range(scale):
                    for dx in range(scale):
                        img.putpixel((x*scale+dx, y*scale+dy), (r, g, b, 255))
    img.save(output_path)


# ── Drawing primitives ────────────────────────────────────────────────────────

def _set(pixels, x, y, color, width, height):
    if 0 <= x < width and 0 <= y < height:
        pixels[y][x] = color


def draw_line(pixels, x0, y0, x1, y1, color, width, height):
    dx, dy = abs(x1-x0), abs(y1-y0)
    sx, sy = (1 if x0<x1 else -1), (1 if y0<y1 else -1)
    err = dx - dy
    while True:
        _set(pixels, x0, y0, color, width, height)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy: err -= dy; x0 += sx
        if e2 < dx:  err += dx; y0 += sy


def draw_circle(pixels, cx, cy, r, color, filled, width, height):
    if filled:
        for y in range(max(0, cy-r), min(height, cy+r+1)):
            for x in range(max(0, cx-r), min(width, cx+r+1)):
                if (x-cx)**2 + (y-cy)**2 <= r*r:
                    pixels[y][x] = color
    else:
        x, y, err = r, 0, 0
        while x >= y:
            for dx, dy in [(x,y),(-x,y),(x,-y),(-x,-y),(y,x),(-y,x),(y,-x),(-y,-x)]:
                _set(pixels, cx+dx, cy+dy, color, width, height)
            y += 1
            err += 2*y + 1
            if err > 0:
                x -= 1
                err -= 2*x + 1


def draw_ellipse(pixels, cx, cy, rx, ry, color, filled, width, height):
    for py in range(max(0, cy-ry), min(height, cy+ry+1)):
        for px in range(max(0, cx-rx), min(width, cx+rx+1)):
            v = ((px-cx)/rx)**2 + ((py-cy)/ry)**2 if rx and ry else 999
            if filled and v <= 1:
                pixels[py][px] = color
            elif not filled and 0.75 <= v <= 1.25:
                pixels[py][px] = color


def flood_fill(pixels, x, y, new_color, width, height):
    if not (0 <= x < width and 0 <= y < height):
        return
    target = pixels[y][x]
    if target == new_color:
        return
    stack = [(x, y)]
    while stack:
        cx, cy = stack.pop()
        if not (0 <= cx < width and 0 <= cy < height):
            continue
        if pixels[cy][cx] != target:
            continue
        pixels[cy][cx] = new_color
        stack += [(cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)]


def apply_commands(pixels, commands, width, height):
    for cmd in commands:
        op = cmd.get('op') or cmd.get('type', '')
        color = cmd.get('color', '#000000')
        filled = cmd.get('fill', cmd.get('filled', True))

        if op == 'fill':
            for y in range(height):
                for x in range(width):
                    pixels[y][x] = color

        elif op == 'pixel':
            _set(pixels, cmd['x'], cmd['y'], color, width, height)

        elif op == 'rect':
            x, y, w, h = cmd['x'], cmd['y'], cmd['w'], cmd['h']
            for ry in range(y, y+h):
                for rx in range(x, x+w):
                    if filled or rx==x or rx==x+w-1 or ry==y or ry==y+h-1:
                        _set(pixels, rx, ry, color, width, height)

        elif op == 'circle':
            cx = cmd.get('cx', cmd.get('x', 0))
            cy = cmd.get('cy', cmd.get('y', 0))
            draw_circle(pixels, cx, cy, cmd['r'], color, filled, width, height)

        elif op == 'ellipse':
            cx, cy = cmd.get('cx', 0), cmd.get('cy', 0)
            rx_val = cmd.get('rx', cmd.get('r', 4))
            ry_val = cmd.get('ry', cmd.get('r', 4))
            draw_ellipse(pixels, cx, cy, rx_val, ry_val, color, filled, width, height)

        elif op == 'line':
            x0 = cmd.get('x0', cmd.get('x1', 0))
            y0 = cmd.get('y0', cmd.get('y1', 0))
            x1 = cmd.get('x1', cmd.get('x2', 0))
            y1 = cmd.get('y1', cmd.get('y2', 0))
            draw_line(pixels, x0, y0, x1, y1, color, width, height)

        elif op == 'hline':
            ry = cmd['y']
            for rx in range(cmd.get('x', 0), cmd.get('x', 0) + cmd.get('w', width)):
                _set(pixels, rx, ry, color, width, height)

        elif op == 'vline':
            rx = cmd['x']
            for ry in range(cmd.get('y', 0), cmd.get('y', 0) + cmd.get('h', height)):
                _set(pixels, rx, ry, color, width, height)

        elif op == 'flood_fill':
            flood_fill(pixels, cmd['x'], cmd['y'], color, width, height)


# ── Image downscale mode ──────────────────────────────────────────────────────

def downscale_image(source_path, target_w, target_h, n_colors):
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow required for --source mode. Install: pip install pillow")
    img = Image.open(source_path).convert('RGBA')
    # Crop to square if requested dimensions are square
    if target_w == target_h:
        min_dim = min(img.size)
        left = (img.width - min_dim) // 2
        top = (img.height - min_dim) // 2
        img = img.crop((left, top, left+min_dim, top+min_dim))
    img_small = img.resize((target_w, target_h), Image.LANCZOS)
    if n_colors:
        rgb = img_small.convert('RGB')
        quantized = rgb.quantize(colors=n_colors)
        img_small = quantized.convert('RGBA')
    pixels = []
    for y in range(target_h):
        row = []
        for x in range(target_w):
            r, g, b, a = img_small.getpixel((x, y))
            row.append(None if a < 64 else f'#{r:02x}{g:02x}{b:02x}')
        pixels.append(row)
    return pixels


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data',       help='JSON pixel data file')
    p.add_argument('--source',     help='Source image to downscale')
    p.add_argument('--width',  type=int, default=16)
    p.add_argument('--height', type=int, default=16)
    p.add_argument('--scale',  type=int, help='Pixels per cell (auto if omitted)')
    p.add_argument('--colors', type=int, help='Quantize to N colors (source mode)')
    p.add_argument('--background', default=None)
    p.add_argument('--out',        default='pixel_art.svg')
    p.add_argument('--grid',   action='store_true', help='Overlay pixel grid (SVG)')
    args = p.parse_args()

    out = Path(args.out)
    is_png = out.suffix.lower() == '.png'

    # ── Source image downscale ──
    if args.source:
        pixels = downscale_image(args.source, args.width, args.height, args.colors)
        width, height = args.width, args.height
        background = args.background
        scale = args.scale or max(1, 400 // width)

    # ── JSON data ──
    elif args.data:
        with open(args.data) as f:
            data = json.load(f)
        width      = data.get('width', args.width)
        height     = data.get('height', args.height)
        background = data.get('background', args.background)
        scale      = args.scale or data.get('scale') or max(1, 400 // width)

        pixels = [[None]*width for _ in range(height)]

        if 'commands' in data:
            apply_commands(pixels, data['commands'], width, height)
        elif 'pixels' in data:
            raw = data['pixels']
            if raw and isinstance(raw[0], list):
                for y, row in enumerate(raw):
                    for x, c in enumerate(row):
                        if y < height and x < width:
                            pixels[y][x] = c or None
            else:
                for i, c in enumerate(raw):
                    y, x = divmod(i, width)
                    if y < height:
                        pixels[y][x] = c or None
    else:
        sys.exit("Provide --data or --source")

    # ── Render ──
    if is_png:
        render_png(pixels, width, height, scale, background, str(out))
    else:
        svg = render_svg(pixels, width, height, scale, background, args.grid)
        out.write_text(svg, encoding='utf-8')

    print(f"✓ Saved: {out}  ({width}×{height} px, scale={scale})")


if __name__ == '__main__':
    main()
