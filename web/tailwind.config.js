/** @type {import('tailwindcss').Config} */
// Brand colours come from CSS custom properties in src/app/globals.css so they
// follow the light/dark theme (html.dark). Colours used with opacity modifiers
// (bg-primary/10) are declared as space-separated RGB channels (--*-rgb).
const rgb = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: rgb('primary'),
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)',
        },
        'on-primary': rgb('on-primary'),
        secondary: {
          DEFAULT: rgb('secondary'),
          dark: 'var(--secondary-dark)',
        },
        accent: rgb('accent'),
        'on-accent': rgb('on-accent'),
        // Text-safe accent: error text, destructive actions, alert borders
        danger: rgb('danger'),
        sun: rgb('sun'),
        ink: '#17153a',
        edge: rgb('edge'),
        drop: 'var(--drop)',
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
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        'pop-sm': '2px 2px 0 0 var(--drop)',
        pop: '4px 4px 0 0 var(--drop)',
        'pop-lg': '6px 6px 0 0 var(--drop)',
        'pop-primary': '4px 4px 0 0 var(--primary)',
      },
      transitionTimingFunction: {
        pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  // `.container` is defined in globals.css; disable Tailwind's breakpoint-stepped
  // container so it doesn't fight it.
  corePlugins: {
    container: false,
  },
  plugins: [],
};
