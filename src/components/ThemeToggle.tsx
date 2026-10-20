'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export const THEME_KEY = 'biblelogos-theme';

/** Applies a saved theme before first paint, so the page never flashes the wrong colours. */
export const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

function currentTheme(): 'light' | 'dark' {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => setTheme(currentTheme()), []);

  const toggle = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private browsing */ }
    setTheme(next);
  };

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <button onClick={toggle} aria-label={label} title={label} className={className}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
