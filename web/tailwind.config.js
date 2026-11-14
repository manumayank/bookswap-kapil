/** @type {import('tailwindcss').Config} */
// Brand colours come from CSS custom properties in src/app/globals.css so they
// follow light/dark mode. Colours used with opacity modifiers (bg-primary/10)
// are declared as space-separated RGB channels (--*-rgb).
const rgb = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: rgb('primary'),
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)',
        },
        secondary: {
          DEFAULT: rgb('secondary'),
          dark: 'var(--secondary-dark)',
        },
        accent: rgb('accent'),
        foreground: rgb('foreground'),
        background: rgb('background'),
        card: rgb('card'),
        'card-border': 'var(--card-border)',
        border: 'var(--border)',
        'surface-inverse': rgb('surface-inverse'),
        muted: {
          DEFAULT: rgb('muted'),
          light: rgb('muted-light'),
          'extra-light': rgb('muted-extra-light'),
        },
      },
    },
  },
  // `.container` is defined in globals.css (max-width 1400px); disable
  // Tailwind's breakpoint-stepped container so it doesn't fight it.
  corePlugins: {
    container: false,
  },
  plugins: [],
};
