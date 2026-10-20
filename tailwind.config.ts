import type { Config } from 'tailwindcss'

// Colours come from CSS variables (see globals.css) so the same classes work in light and dark themes.
// In both themes 950 is the page background and 50 the strongest text.
const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map(s => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: scale('parchment', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        gold: scale('gold', [400, 500, 600]),
      },
      fontFamily: {
        serif: ['var(--font-reading)', 'Georgia', 'serif'],
        sans: ['var(--font-ui)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
