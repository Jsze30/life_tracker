---
name: pixel-art
description: >
  Create pixel art on a canvas of any size — 16×16 icons, 32×32 sprites, 64×64 scenes,
  128×128 illustrations. Use this skill whenever the user asks to draw, sketch, illustrate,
  or create any image as pixel art, or wants to convert/copy a reference image to pixel art.
  Triggers on requests like "draw a frog in pixel art", "make a 32×32 mushroom sprite",
  "pixel art version of this image", "design an icon", or "copy this image as pixel art".
  Always use this skill when pixel art, sprites, icons, or canvas drawing is involved.
compatibility:
  tools: [Bash, Write, Read]
  optional_deps: ["pillow (pip install pillow) — required for PNG output and image downscaling"]
---

# Pixel Art

You render pixel art using a bundled Python script at:
`~/.Codex/skills/pixel-art/scripts/render.py`

Output is SVG by default (no dependencies). PNG requires Pillow.

---

## Quick workflow

1. Choose canvas size and output path
2. Plan the composition (silhouette → color zones → details)
3. Choose a palette (4–8 colors is ideal for most subjects)
4. Produce a data JSON file (pixel array or drawing commands)
5. Run `render.py` to generate the SVG/PNG
6. Tell the user the output path and open it if possible

---

## Data formats

### Format A — Pixel array (best for ≤32×32)

```json
{
  "width": 16,
  "height": 16,
  "scale": 24,
  "background": "#FFFFFF",
  "pixels": [
    [null, null, "#3a7d44", "#3a7d44", ...],
    ...
  ]
}
```

- `pixels` is a 2D array: outer = rows (top→bottom), inner = columns (left→right)
- `null` or `""` = transparent (shows background)
- `scale` controls display size (default: auto ~400px wide)
- `background` fills the canvas behind transparent pixels (omit for transparent)

### Format B — Drawing commands (best for >32×32 or geometric shapes)

```json
{
  "width": 64,
  "height": 64,
  "scale": 6,
  "background": "#87ceeb",
  "commands": [
    {"op": "fill",       "color": "#87ceeb"},
    {"op": "rect",       "x": 10, "y": 30, "w": 44, "h": 25, "color": "#3a7d44", "fill": true},
    {"op": "circle",     "cx": 32, "cy": 20, "r": 14, "color": "#ff69b4", "fill": true},
    {"op": "line",       "x0": 5, "y0": 60, "x1": 59, "y1": 60, "color": "#000000"},
    {"op": "ellipse",    "cx": 32, "cy": 32, "rx": 20, "ry": 12, "color": "#ffcc00", "fill": true},
    {"op": "flood_fill", "x": 32, "y": 32, "color": "#ff0000"},
    {"op": "pixel",      "x": 5, "y": 5, "color": "#000000"},
    {"op": "hline",      "y": 10, "x": 0, "w": 64, "color": "#cccccc"},
    {"op": "vline",      "x": 32, "y": 0, "h": 64, "color": "#cccccc"}
  ]
}
```

Commands execute top-to-bottom. Use `fill` first to set a base, then layer shapes.
`fill` field (default true) sets whether shapes are filled or just outlined.

---

## Running the script

```bash
# SVG output (no dependencies)
python ~/.Codex/skills/pixel-art/scripts/render.py \
  --data /tmp/pixels.json --out /path/to/output.svg

# PNG output (requires pillow)
python ~/.Codex/skills/pixel-art/scripts/render.py \
  --data /tmp/pixels.json --out /path/to/output.png --scale 10

# Copy/downscale an image to pixel art (requires pillow)
python ~/.Codex/skills/pixel-art/scripts/render.py \
  --source /path/to/photo.jpg --width 32 --height 32 \
  --colors 16 --out /path/to/output.svg

# Show pixel grid overlay (helpful for editing)
python ~/.Codex/skills/pixel-art/scripts/render.py \
  --data /tmp/pixels.json --out /path/to/output.svg --grid
```

Save JSON to `/tmp/pixel_art_data.json` unless the user specifies otherwise.
Save output to the current working directory or wherever is most natural for the project.

---

## Design methodology

Good pixel art starts from structure, not from the top-left corner. Always plan before specifying pixels.

### Step 1 — Silhouette
Define the overall shape in a single color first. This is the most important step — the silhouette determines whether the subject is recognizable at a glance. For a 16×16 canvas, the subject should fill roughly 10–14 pixels in its largest dimension.

### Step 2 — Major color zones
Block in the main color areas. Don't add detail yet. A frog: dark green body, lighter green belly, dark patches for eyes.

### Step 3 — Details and shading
Add highlights (lighter shade of base color) and shadows (darker shade). One pixel of highlight on the top edge and one pixel of shadow on the bottom edge creates a lot of depth.

### Step 4 — Outline
A 1-pixel dark outline (black or very dark version of the subject color) makes the sprite pop against any background. Pixel art looks significantly more polished with outlining.

### Palette selection
- Pick a base color, a highlight (~30% brighter), and a shadow (~30% darker)
- Limit to 4–8 colors total for cohesive results
- Use slightly desaturated colors for a more professional look (avoid pure #FF0000 red)
- Common palettes: NES (54 colors), PICO-8 (16 colors), Game Boy (4 greens)

### Proportions for common subjects

**Characters / animals (16×16)**:
- Head: rows 1–5 (5px tall), body: rows 6–11 (6px), legs: rows 12–15 (4px)
- Eyes: 2px wide × 1–2px tall, spaced 2px apart, in upper third of head
- Limbs: 2–3px wide

**Frogs specifically**:
- Wide elliptical body (10×8px in a 16×16 canvas)
- Eyes on top of head, protruding as small circles
- Strong dark outline
- Front legs slightly raised, back legs bent outward
- Lighter belly color on bottom half of body

**Icons / items (16×16)**:
- Leave 1–2px padding on all sides
- Use strong silhouette — must read in silhouette alone
- Maximum 5–6 colors

**Scenes (64×128+)**:
- Use drawing commands for background fills
- Layer: sky → ground → background elements → foreground elements
- Add details with pixel commands last

---

## Pixel-by-pixel specification tips

When writing a pixel array for a 16×16:
- Think of the canvas as a 16×16 grid
- Describe rows in blocks: "rows 0–2 are background (null), rows 3–4 are the top of the head"
- For symmetric subjects, design left half, then mirror: `row[x] = row[width-1-x]`
- A simple trick: write the row in groups of 4 pixels to stay oriented

When writing long null runs, you can think of a shorthand in your head:
- `null×8` means 8 transparent pixels in a row, but write them out fully in the JSON

---

## Copying an image

When the user provides an image to copy (by path or pasted into the conversation):

**If given a file path**: Use `--source` mode. The script handles downscaling and color quantization automatically.
```bash
python ~/.Codex/skills/pixel-art/scripts/render.py \
  --source ~/Downloads/frog.jpg --width 32 --height 32 \
  --colors 12 --out frog_pixel.svg
```
Adjust `--colors` for the desired palette size (8–16 is usually best).

**If pasted as an image in chat**: Analyze the image visually:
1. Identify the main colors (list 4–8 hex values)
2. Identify the major regions (what's in each quadrant of the image)
3. Map those regions to pixel coordinates at the target resolution
4. Use drawing commands for large regions, pixel-level spec for details

For small targets (≤16×16 from a complex image), interpret rather than copy exactly — simplify to the essential shapes and colors that make the subject recognizable.

---

## Scale guide

| Canvas size | Suggested scale | Output size |
|-------------|----------------|-------------|
| 8×8         | 48             | 384px       |
| 16×16       | 24             | 384px       |
| 32×32       | 12             | 384px       |
| 48×48       | 8              | 384px       |
| 64×64       | 6              | 384px       |
| 128×128     | 3              | 384px       |

The script auto-computes scale if omitted, targeting ~400px output width.

---

## Example: 16×16 heart icon

```json
{
  "width": 16,
  "height": 16,
  "scale": 24,
  "background": null,
  "pixels": [
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, "#cc2244", "#cc2244", null, null, "#cc2244", "#cc2244", null, null, null, null, null, null, null, null],
    [null, "#cc2244", "#ff4466", "#ff4466", "#cc2244", "#cc2244", "#ff4466", "#ff4466", "#cc2244", null, null, null, null, null, null, null],
    [null, "#cc2244", "#ff4466", "#ff4466", "#ff4466", "#ff4466", "#ff4466", "#ff4466", "#cc2244", null, null, null, null, null, null, null],
    [null, null, "#cc2244", "#ff4466", "#ff4466", "#ff4466", "#ff4466", "#cc2244", null, null, null, null, null, null, null, null],
    [null, null, null, "#cc2244", "#ff4466", "#ff4466", "#cc2244", null, null, null, null, null, null, null, null, null],
    [null, null, null, null, "#cc2244", "#cc2244", null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
  ]
}
```

*(Heart truncated for brevity — real output would be 16 rows × 16 cols.)*

---

## Common mistakes to avoid

- **Off-by-one rows**: Count rows carefully. A 16×16 canvas has rows 0–15.
- **Forgetting the outline**: Add a 1px dark border around any character or creature — it dramatically improves readability.
- **Too many colors**: More than 8 colors usually looks muddy at small sizes.
- **Pure black backgrounds**: Use very dark navy (#1a1a2e) or dark green instead of #000000 — looks more polished.
- **Symmetry drift**: For symmetric subjects, verify the midpoint. In a 16-wide canvas, the center falls between columns 7 and 8.
