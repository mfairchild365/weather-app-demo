import type { Config } from 'tailwindcss';

export default {
  darkMode: ['media'],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
