/** Deterministic, accessible palette for generated covers when a book has no artwork. */
const PALETTES = [
  ['#1f3a5f', '#f4d58d'],
  ['#5b2333', '#f7d6bf'],
  ['#264d3b', '#e9f5db'],
  ['#3d2c5e', '#f2e9e4'],
  ['#7a3b12', '#fde8c9'],
  ['#0f4c5c', '#e0fbfc'],
  ['#2b2d42', '#edf2f4'],
] as const;

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function coverPalette(seed: string): { bg: string; fg: string; angle: number } {
  const hash = hashString(seed);
  const [bg, fg] = PALETTES[hash % PALETTES.length]!;
  return { bg, fg, angle: (hash >> 3) % 360 };
}
