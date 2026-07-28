import type { Config } from 'tailwindcss';

export default {
  darkMode: ['media'],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // spec 004 FR-007: headings/brand only — a system fallback stack keeps text visible and
      // legible if the self-hosted woff2 request is blocked or slow (font-display: swap in
      // index.css handles the timing; this handles the permanent fallback).
      fontFamily: {
        display: [
          '"Space Grotesk"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
