import { describe, it, expect } from 'vitest';

/**
 * Mirrors the hex values documented in tokens.css. Computes real WCAG 2.2 contrast ratios rather
 * than asserting on eyeballed color choices (references/contrast-forced-colors.md).
 */
const LIGHT = {
  bg: '#ffffff',
  text: '#1a1a1a',
  mutedText: '#4b5563',
  link: '#1d4ed8',
  focus: '#2563eb',
  danger: '#b91c1c',
};

const DARK = {
  bg: '#0f1115',
  text: '#f3f4f6',
  mutedText: '#9ca3af',
  link: '#93c5fd',
  focus: '#60a5fa',
  danger: '#f87171',
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return [r, g, b];
}

/** WCAG relative luminance (https://www.w3.org/TR/WCAG22/#dfn-relative-luminance). */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number): number => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexToRgb(hexA));
  const l2 = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

describe('design token contrast (WCAG 2.2 AA)', () => {
  it.each([
    ['light text/bg', LIGHT.text, LIGHT.bg, 4.5],
    ['light muted-text/bg', LIGHT.mutedText, LIGHT.bg, 4.5],
    ['light link/bg', LIGHT.link, LIGHT.bg, 4.5],
    ['light danger/bg', LIGHT.danger, LIGHT.bg, 4.5],
    ['light focus/bg (non-text)', LIGHT.focus, LIGHT.bg, 3],
    ['dark text/bg', DARK.text, DARK.bg, 4.5],
    ['dark muted-text/bg', DARK.mutedText, DARK.bg, 4.5],
    ['dark link/bg', DARK.link, DARK.bg, 4.5],
    ['dark danger/bg', DARK.danger, DARK.bg, 4.5],
    ['dark focus/bg (non-text)', DARK.focus, DARK.bg, 3],
  ])('%s meets its threshold', (_label, fg, bg, minRatio) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(minRatio);
  });
});
