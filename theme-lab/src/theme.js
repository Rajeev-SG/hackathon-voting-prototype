// src/theme.js
// Theme generation utilities (browser + Node compatible, pure ESM).
//
// Outputs:
// - shadcn semantic tokens as HSL triplets (so you can do hsl(var(--token))).
// - Radix-style 12-step scales (solid + alpha) generated from a seed color using OKLCH.
//
// Important: This is "Radix-inspired" for rapid prototyping.
// For maximum fidelity, use the official Radix custom palette tool and paste its CSS. (Docs: https://www.radix-ui.com/colors/docs/overview/custom-palettes)

export function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

export function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

export function assertHex(hex) {
  if (typeof hex !== "string") throw new Error(`Expected hex string, got ${typeof hex}`);
  const h = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex: ${hex}`);
  return h.toUpperCase();
}

export function hexToRgb(hex) {
  const h = assertHex(hex).slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex({ r, g, b }) {
  const rr = clamp(Math.round(r), 0, 255).toString(16).padStart(2, "0");
  const gg = clamp(Math.round(g), 0, 255).toString(16).padStart(2, "0");
  const bb = clamp(Math.round(b), 0, 255).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`.toUpperCase();
}

/** HSL triplet string for shadcn: "h s% l%" */
export function rgbToHslTriplet({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hexToHslTriplet(hex) {
  return rgbToHslTriplet(hexToRgb(hex));
}

// --- WCAG contrast helpers (for choosing primary-foreground) ---
function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function relLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
export function contrastRatio(hexA, hexB) {
  const L1 = relLuminance(hexA);
  const L2 = relLuminance(hexB);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
export function pickOnColor(bgHex, light = "#FFFFFF", dark = "#111111") {
  // Prefer whichever gives higher contrast against background.
  const cLight = contrastRatio(bgHex, light);
  const cDark = contrastRatio(bgHex, dark);
  return cLight >= cDark ? light : dark;
}

// --- OKLab/OKLCH conversion (Björn Ottosson's OKLab) ---
function linearize(u) {
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
}
function delinearize(u) {
  return u <= 0.0031308 ? u * 12.92 : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
}
function srgbToOklab({ r, g, b }) {
  const R = linearize(r / 255);
  const G = linearize(g / 255);
  const B = linearize(b / 255);

  // linear sRGB to LMS
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  return { L, a, b: b2 };
}
function oklabToSrgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const R =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const r = delinearize(R);
  const g = delinearize(G);
  const b2 = delinearize(B);

  return { r: r * 255, g: g * 255, b: b2 * 255 };
}

export function hexToOklch(hex) {
  const lab = srgbToOklab(hexToRgb(hex));
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return { L: lab.L, C, h };
}

function oklchToOklab({ L, C, h }) {
  const hr = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(hr), b: C * Math.sin(hr) };
}

function inGamutSrgb({ r, g, b }) {
  return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
}

export function oklchToHexSafe({ L, C, h }, maxIters = 24) {
  // Reduce chroma until in sRGB gamut.
  let c = C;
  for (let i = 0; i < maxIters; i++) {
    const rgb = oklabToSrgb(oklchToOklab({ L, C: c, h }));
    if (inGamutSrgb(rgb)) return rgbToHex(rgb);
    c *= 0.96;
  }
  // Final clamp as fallback.
  const rgb = oklabToSrgb(oklchToOklab({ L, C: c, h }));
  return rgbToHex(rgb);
}

// --- Scale generation ---
const ACCENT_L_LIGHT = [0.99, 0.97, 0.94, 0.90, 0.85, 0.79, 0.72, 0.64, 0.56, 0.49, 0.42, 0.35];
const ACCENT_L_DARK  = [0.18, 0.22, 0.26, 0.30, 0.34, 0.38, 0.46, 0.54, 0.62, 0.70, 0.78, 0.86];

const ACCENT_C_LIGHT = [0.05, 0.08, 0.12, 0.18, 0.28, 0.38, 0.55, 0.70, 0.85, 0.95, 1.00, 0.90];
const ACCENT_C_DARK  = [0.45, 0.55, 0.62, 0.70, 0.78, 0.86, 0.92, 0.98, 1.00, 0.98, 0.92, 0.80];

const GRAY_L_LIGHT = [0.99, 0.975, 0.95, 0.91, 0.86, 0.80, 0.72, 0.64, 0.52, 0.43, 0.33, 0.20];
const GRAY_L_DARK  = [0.16, 0.20, 0.24, 0.28, 0.34, 0.40, 0.48, 0.56, 0.64, 0.72, 0.82, 0.92];

// Alpha values roughly match "subtle → solid → text" progression.
const ALPHAS = [0.012, 0.024, 0.036, 0.055, 0.08, 0.11, 0.16, 0.24, 0.32, 0.44, 0.56, 0.72];

export function generateScale12(seedHex, mode = "light", kind = "accent") {
  const seed = hexToOklch(seedHex);
  const Ls = kind === "gray" ? (mode === "light" ? GRAY_L_LIGHT : GRAY_L_DARK) : (mode === "light" ? ACCENT_L_LIGHT : ACCENT_L_DARK);
  const Cf = kind === "gray" ? new Array(12).fill(0) : (mode === "light" ? ACCENT_C_LIGHT : ACCENT_C_DARK);

  const solid = [];
  const alpha = [];

  const seedRgb = hexToRgb(seedHex);

  for (let i = 0; i < 12; i++) {
    const L = Ls[i];
    const C = kind === "gray" ? 0 : seed.C * Cf[i];
    const hex = oklchToHexSafe({ L, C, h: seed.h });
    solid.push(hex);

    const a = ALPHAS[i];
    alpha.push(`rgb(${seedRgb.r} ${seedRgb.g} ${seedRgb.b} / ${a})`);
  }

  return { solid, alpha };
}

export function formatScaleCssBlock({ name, light, dark }) {
  // name is like "teal", "purple", "gray"
  // light/dark include {solid[12], alpha[12]}
  const linesLight = [];
  const linesDark = [];

  for (let i = 0; i < 12; i++) {
    linesLight.push(`  --${name}-${i + 1}: ${light.solid[i]};`);
    linesLight.push(`  --${name}-a${i + 1}: ${light.alpha[i]};`);
    linesDark.push(`  --${name}-${i + 1}: ${dark.solid[i]};`);
    linesDark.push(`  --${name}-a${i + 1}: ${dark.alpha[i]};`);
  }

  return [
    `:root {`,
    ...linesLight,
    `}`,
    ``,
    `.dark {`,
    ...linesDark,
    `}`,
  ].join("\n");
}

export function generateRadixScalesCss(palette) {
  const grayLight = generateScale12(palette.graySeed, "light", "gray");
  const grayDark  = generateScale12(palette.graySeed, "dark", "gray");
  const tealLight = generateScale12(palette.teal, "light", "accent");
  const tealDark  = generateScale12(palette.teal, "dark", "accent");
  const purpleLight = generateScale12(palette.purple, "light", "accent");
  const purpleDark  = generateScale12(palette.purple, "dark", "accent");

  return `/* Radix-style 12-step scales (solid + alpha).
   Generated by Theme Lab (OKLCH-based approximation). */

${formatScaleCssBlock({ name: "gray", light: grayLight, dark: grayDark })}

${formatScaleCssBlock({ name: "teal", light: tealLight, dark: tealDark })}

${formatScaleCssBlock({ name: "purple", light: purpleLight, dark: purpleDark })}
`;
}

// --- Semantic token mapping (shadcn-style) ---
// We'll map semantic roles to specific scale steps.
// Radix's doc outlines intended uses per step (1: background, 9: solid backgrounds, 12: high-contrast text). (https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)
function semanticFromScales({ gray, primary, secondary, radius }) {
  // gray/primary/secondary are { light: {solid}, dark:{solid} }.
  const l = {
    background: gray.light.solid[0],
    foreground: gray.light.solid[11],

    card: gray.light.solid[0],
    "card-foreground": gray.light.solid[11],

    popover: gray.light.solid[0],
    "popover-foreground": gray.light.solid[11],

    muted: gray.light.solid[1],
    "muted-foreground": gray.light.solid[9],

    accent: gray.light.solid[1],
    "accent-foreground": gray.light.solid[11],

    border: gray.light.solid[5],
    input: gray.light.solid[5],

    primary: primary.light.solid[8], // step 9
    "primary-foreground": pickOnColor(primary.light.solid[8], "#FFFFFF", "#111111"),

    secondary: secondary.light.solid[8],
    "secondary-foreground": pickOnColor(secondary.light.solid[8], "#FFFFFF", "#111111"),

    ring: primary.light.solid[8],

    destructive: "#EF4444",
    "destructive-foreground": "#FFFFFF",

    radius,
  };

  const d = {
    background: gray.dark.solid[0],
    foreground: gray.dark.solid[11],

    card: gray.dark.solid[1],
    "card-foreground": gray.dark.solid[11],

    popover: gray.dark.solid[1],
    "popover-foreground": gray.dark.solid[11],

    muted: gray.dark.solid[2],
    "muted-foreground": gray.dark.solid[10],

    accent: gray.dark.solid[2],
    "accent-foreground": gray.dark.solid[11],

    border: gray.dark.solid[5],
    input: gray.dark.solid[5],

    primary: primary.dark.solid[8],
    "primary-foreground": pickOnColor(primary.dark.solid[8], "#FFFFFF", "#111111"),

    secondary: secondary.dark.solid[8],
    "secondary-foreground": pickOnColor(secondary.dark.solid[8], "#FFFFFF", "#111111"),

    ring: primary.dark.solid[8],

    destructive: "#B91C1C",
    "destructive-foreground": "#FFFFFF",

    radius,
  };

  return { light: l, dark: d };
}

function semanticToShadcnCss(themeName, semantic) {
  const lightLines = [];
  const darkLines = [];

  for (const [k, v] of Object.entries(semantic.light)) {
    if (k === "radius") {
      lightLines.push(`  --radius: ${v};`);
      continue;
    }
    lightLines.push(`  --${k}: ${hexToHslTriplet(v)};`);
  }
  for (const [k, v] of Object.entries(semantic.dark)) {
    if (k === "radius") {
      darkLines.push(`  --radius: ${v};`);
      continue;
    }
    darkLines.push(`  --${k}: ${hexToHslTriplet(v)};`);
  }

  return `/* shadcn/ui semantic tokens — theme: ${themeName}
   Values are HSL triplets so you can do: hsl(var(--background)) etc. */

@layer base {
  :root {
${lightLines.join("\n")}
  }

  .dark {
${darkLines.join("\n")}
  }
}
`;
}

export function generateShadcnThemeCss({ themeName, palette, radius }) {
  // Build scales once, then map.
  const gray = {
    light: generateScale12(palette.graySeed, "light", "gray"),
    dark: generateScale12(palette.graySeed, "dark", "gray"),
  };
  const teal = {
    light: generateScale12(palette.teal, "light", "accent"),
    dark: generateScale12(palette.teal, "dark", "accent"),
  };
  const purple = {
    light: generateScale12(palette.purple, "light", "accent"),
    dark: generateScale12(palette.purple, "dark", "accent"),
  };

  let primary = teal;
  let secondary = purple;

  if (themeName === "purple") {
    primary = purple;
    secondary = teal;
  } else if (themeName === "duo") {
    primary = teal;
    secondary = purple;
  }

  const semantic = semanticFromScales({ gray, primary, secondary, radius });
  return semanticToShadcnCss(themeName, semantic);
}

export function generateTailwindV3ConfigSnippet() {
  return `// tailwind-v3.config.cjs (snippet)
// Merge this into your Tailwind v3 config.
// This is the standard shadcn-style mapping: utilities reference semantic CSS variables via hsl(var(--token)).

module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};`;
}

export function generateTailwindV4ThemeMappingCss() {
  // Tailwind v4: define theme variables under @theme so utilities like bg-background exist.
  // shadcn's Tailwind v4 guide shows mapping from semantic vars to --color-* vars using hsl(var(--token)). (https://ui.shadcn.com/docs/tailwind-v4)
  return `/* tailwind-v4.theme.css
   Paste this into your Tailwind v4 CSS entry after @import "tailwindcss";
   It maps shadcn semantic vars to Tailwind theme variables so you can do:
   - bg-background / text-foreground
   - bg-primary / text-primary-foreground
*/

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
`;
}

export function generateAllFiles({ palette, radius }) {
  const shadcn_teal = generateShadcnThemeCss({ themeName: "teal", palette, radius });
  const shadcn_purple = generateShadcnThemeCss({ themeName: "purple", palette, radius });
  const shadcn_duo = generateShadcnThemeCss({ themeName: "duo", palette, radius });

  const radix = generateRadixScalesCss(palette);
  const tw3 = generateTailwindV3ConfigSnippet();
  const tw4 = generateTailwindV4ThemeMappingCss();

  return {
    "tokens/shadcn.teal.css": shadcn_teal,
    "tokens/shadcn.purple.css": shadcn_purple,
    "tokens/shadcn.duo.css": shadcn_duo,
    "tokens/radix-scales.css": radix,
    "tokens/tailwind-v3.config.cjs": tw3,
    "tokens/tailwind-v4.theme.css": tw4,
  };
}
