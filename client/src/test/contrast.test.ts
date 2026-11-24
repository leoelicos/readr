import { describe, expect, it } from 'vitest';
import css from '../index.css?raw';

/** WCAG 2.x contrast for the design tokens, in both themes, straight from index.css. */
const tokens = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi)].map((m) => [
    m[1]!,
    { light: m[2]!, dark: m[3]! },
  ]),
);

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const pairs: [fg: string, bg: string, min: number][] = [
  ['ink', 'paper', 7],
  ['ink', 'surface', 7],
  ['muted', 'paper', 7],
  ['muted', 'surface', 7],
  ['muted', 'surface-2', 4.5],
  ['accent', 'paper', 4.5],
  ['accent', 'surface', 4.5],
  ['accent-ink', 'accent', 4.5],
  ['accent-2', 'paper', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'paper', 4.5],
  ['success', 'surface', 4.5],
  ['paper', 'ink', 7], // toasts + Save button
  ['focus', 'paper', 3],
  ['focus', 'surface', 3],
  ['line', 'paper', 1], // decorative hairline, exempt
];

describe.each(['light', 'dark'] as const)('%s theme contrast', (theme) => {
  it.each(pairs)('%s on %s ≥ %s:1', (fg, bg, min) => {
    const ratio = contrast(tokens[fg]![theme], tokens[bg]![theme]);
    expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });
});
