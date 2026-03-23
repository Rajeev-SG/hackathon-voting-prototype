# Theme Lab — shadcn/ui + Radix (12-step scales) + Tailwind v3/v4

This repo is a **single-file static theme playground** + a small **CLI generator**.

It takes a minimal palette (like the one you shared) and produces:

- **Multiple shadcn/ui themes** (semantic tokens: `--background`, `--primary`, etc.)
- **“Radix-style” 12-step scales** (`--teal-1 … --teal-12` + alpha variants)
- **Tailwind v3 config** snippet (classic `hsl(var(--token))` mapping)
- **Tailwind v4 @theme file** (`--color-background`, etc.) so you can use utilities like `bg-background`, `text-foreground`, etc.

Notes:
- shadcn/ui recommends theming via semantic CSS variables. citeturn1view2
- Tailwind v4 defines utility-generating tokens using `@theme`, and shadcn’s v4 guide shows mapping semantic vars into `--color-*` tokens. citeturn1view0turn1view1
- Radix Colors scales are 12-step with intended UI use cases (backgrounds, borders, solid fills, text). citeturn1view4turn1view3

## Quick start (no build tools)

Open `index.html` in your browser.

You can:
- tweak palette colors
- switch theme presets (teal-primary / purple-primary / duo)
- toggle dark mode
- export generated files

## CLI (optional)

Requirements: Node 18+.

```bash
node cli/generate.mjs --in cli/palette.example.json --out dist
```

Outputs (example):
- `dist/tokens/shadcn.teal.css`
- `dist/tokens/shadcn.purple.css`
- `dist/tokens/shadcn.duo.css`
- `dist/tokens/radix-scales.css`
- `dist/tokens/tailwind-v3.config.cjs`
- `dist/tokens/tailwind-v4.theme.css`

## How to use in a shadcn/ui project

1) Copy one generated theme file into your app (commonly `app/globals.css` or imported from it):
- `tokens/shadcn.teal.css` (or purple/duo)

2) Tailwind v3:
- merge `tokens/tailwind-v3.config.cjs` into your `tailwind.config.*`.

3) Tailwind v4:
- add `tokens/tailwind-v4.theme.css` to your CSS entry (after `@import "tailwindcss";`), or paste its `@theme` block into your main CSS.

## About the 12-step scales

This project generates **Radix-inspired** 12-step scales from a single “seed” color using OKLCH/OKLab math.
It’s good enough for prototyping quickly, but if you need maximum fidelity + wide-gamut support, use Radix’s official custom palette tool. citeturn1view3
