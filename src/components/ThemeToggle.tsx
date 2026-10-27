'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { THEME_EVENT, THEME_KEY } from '@/lib/preferences';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function currentTheme(): 'light' | 'dark' {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return darkQuery().matches ? 'dark' : 'light';
}

// Changes come from this toggle (in any instance) or from the device's own setting
function subscribe(onChange: () => void) {
  const query = darkQuery();
  query.addEventListener('change', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    query.removeEventListener('change', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);

  const toggle = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private browsing */ }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <button onClick={toggle} aria-label={label} title={label} className={className}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
