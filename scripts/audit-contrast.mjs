#!/usr/bin/env node
/**
 * Contrast audit for the DPM - Go! HUD.
 *
 *   node scripts/audit-contrast.mjs
 *
 * Reads the colour tokens from src/styles.css, converts OKLCH to sRGB and
 * checks every foreground / background pair the HUD renders against the WCAG
 * 2.1 contrast requirements:
 *
 *   4.5:1  body and small text (the HUD uses 8px to 12px type, so nothing is
 *          treated as "large text")
 *   3.0:1  icons, focus rings, borders that carry meaning and other UI parts
 *
 * Exits with a non zero status when a pair fails, so it can run in CI.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ colour */

/** OKLCH components to linear sRGB. */
function oklchToLinearRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const gamma = (channel) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** Parses `oklch(L C H / A)` into components. */
function parseOklch(value) {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4]);
  return { L: Number(match[1]), C: Number(match[2]), H: Number(match[3]), alpha };
}

function parseHex(value) {
  const hex = value.trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

/** A colour as 8 bit sRGB plus alpha. */
function toRgb(color) {
  if (color.oklch) {
    const [r, g, b] = oklchToLinearRgb(color.oklch.L, color.oklch.C, color.oklch.H);
    return {
      r: clamp01(gamma(r)),
      g: clamp01(gamma(g)),
      b: clamp01(gamma(b)),
      a: color.oklch.alpha,
    };
  }
  return { ...color.hex, a: color.hex.a ?? 1 };
}

/** Composites a translucent colour over an opaque one. */
function composite(foreground, background) {
  const alpha = foreground.a ?? 1;
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }) {
  const lin = channel => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(foreground, background) {
  const fg = composite(toRgb(foreground), toRgb(background));
  const bg = toRgb(background);
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ------------------------------------------------------------------- tokens */

const css = readFileSync(resolve(root, 'src/styles.css'), 'utf8');
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/);
if (!rootBlock) {
  console.error('Could not find the :root token block in src/styles.css');
  process.exit(2);
}

const tokens = {};
for (const line of rootBlock[1].split(';')) {
  const match = line.match(/--([\w-]+)\s*:\s*([^;]+)/);
  if (!match) continue;
  const value = match[2].trim();
  const oklch = parseOklch(value);
  if (oklch) tokens[match[1]] = { oklch };
  else if (value.startsWith('#')) tokens[match[1]] = { hex: parseHex(value) };
}

const hex = value => ({ hex: { ...parseHex(value), a: 1 } });
const opaque = name => {
  const token = tokens[name];
  if (!token) throw new Error(`Unknown token --${name}`);
  return { ...token, oklch: token.oklch ? { ...token.oklch, alpha: 1 } : undefined, hex: token.hex };
};

/**
 * Pairs the HUD actually renders.
 * `min` is the WCAG requirement: 4.5 for text, 3 for meaningful UI parts.
 */
const pairs = [
  { label: 'Body text on the page background', fg: opaque('foreground'), bg: opaque('background'), min: 4.5 },
  { label: 'Body text on a card', fg: opaque('foreground'), bg: opaque('card'), min: 4.5 },
  { label: 'Body text on a panel', fg: opaque('foreground'), bg: opaque('panel'), min: 4.5 },
  { label: 'Muted meta text on the background', fg: opaque('muted-foreground'), bg: opaque('background'), min: 4.5 },
  { label: 'Muted meta text on a card', fg: opaque('muted-foreground'), bg: opaque('card'), min: 4.5 },
  { label: 'Muted meta text on a panel', fg: opaque('muted-foreground'), bg: opaque('panel'), min: 4.5 },
  { label: 'Primary label on the background', fg: opaque('primary'), bg: opaque('background'), min: 4.5 },
  { label: 'Primary label on a card', fg: opaque('primary'), bg: opaque('card'), min: 4.5 },
  { label: 'Primary label on a panel', fg: opaque('primary'), bg: opaque('panel'), min: 4.5 },
  { label: 'Primary button text', fg: opaque('primary-foreground'), bg: opaque('primary'), min: 4.5 },
  { label: 'Warm accent label on the background', fg: opaque('warm'), bg: opaque('background'), min: 4.5 },
  { label: 'Warm accent label on a card', fg: opaque('warm'), bg: opaque('card'), min: 4.5 },
  { label: 'Destructive label on the background', fg: opaque('destructive'), bg: opaque('background'), min: 4.5 },
  { label: 'Panel edge against the background', fg: opaque('border'), bg: opaque('background'), min: 3 },
  { label: 'Skip link text on the primary chip', fg: opaque('primary-foreground'), bg: opaque('primary'), min: 4.5 },
  { label: 'Map line cyan on the map background', fg: hex('#00f0ff'), bg: hex('#070B14'), min: 3 },
  { label: 'Map line amber on the map background', fg: hex('#ffbb70'), bg: hex('#070B14'), min: 3 },
  { label: 'Parking pin amber on the map background', fg: hex('#f59e0b'), bg: hex('#070B14'), min: 3 },
  { label: 'Rider location cyan on the map background', fg: hex('#22d3ee'), bg: hex('#070B14'), min: 3 },
  { label: 'Restaurant pin magenta on the map background', fg: hex('#ff4fd8'), bg: hex('#070B14'), min: 3 },
  { label: 'Pricing page body text', fg: hex('#94a3b8'), bg: hex('#070B14'), min: 4.5 },
  { label: 'Pricing page dim text', fg: hex('#94a3b8'), bg: hex('#070B14'), min: 4.5 },
  { label: 'Pricing page heading text', fg: hex('#ffffff'), bg: hex('#070B14'), min: 4.5 },
  { label: 'Restaurant thumb placeholder on its card', fg: hex('#94a3b8'), bg: hex('#0f172a'), min: 3 },
  { label: 'HUD meta text on the panel', fg: hex('#94a3b8'), bg: opaque('panel'), min: 4.5 },
  { label: 'HUD meta text on a card', fg: hex('#94a3b8'), bg: opaque('card'), min: 4.5 },
  { label: 'Tailwind cyan accent on the page', fg: hex('#22d3ee'), bg: hex('#070B14'), min: 4.5 },
  { label: 'Tailwind amber accent on the page', fg: hex('#fcd34d'), bg: hex('#070B14'), min: 4.5 },
  { label: 'Tailwind emerald accent on the page', fg: hex('#6ee7b7'), bg: hex('#070B14'), min: 4.5 },
  { label: 'Tailwind rose accent on the page', fg: hex('#fda4af'), bg: hex('#070B14'), min: 4.5 },
  { label: 'Tailwind slate body text on the page', fg: hex('#cbd5e1'), bg: hex('#070B14'), min: 4.5 },
];

console.log('DPM - Go! HUD contrast audit (WCAG 2.1)\n');
let failures = 0;
for (const pair of pairs) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const pass = ratio >= pair.min;
  if (!pass) failures += 1;
  const status = pass ? 'PASS' : 'FAIL';
  console.log(
    `  ${status}  ${ratio.toFixed(2).padStart(5)}:1  (needs ${pair.min.toFixed(1)}:1)  ${pair.label}`
  );
}

console.log('');
if (failures > 0) {
  console.error(`${failures} of ${pairs.length} pairs fail WCAG AA.`);
  process.exit(1);
}
console.log(`All ${pairs.length} pairs pass WCAG AA.`);
