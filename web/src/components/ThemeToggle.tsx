'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export const THEME_KEY = 'sybrary-theme';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  window.setTimeout(() => root.classList.remove('theme-switching'), 300);
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  // null until mounted: the server can't know the theme, so render a neutral button first
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    // Follow the OS setting until the person picks a theme themselves
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch {}
      if (stored) return;
      const next: Theme = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`btn btn-outline btn-sm btn-icon relative overflow-hidden ${className}`}
      style={{ width: 40, height: 40 }}
    >
      <Sun
        aria-hidden
        size={18}
        strokeWidth={2.4}
        className={`absolute transition-all duration-300 ease-pop ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
      <Moon
        aria-hidden
        size={18}
        strokeWidth={2.4}
        className={`absolute transition-all duration-300 ease-pop ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
      />
    </button>
  );
}
