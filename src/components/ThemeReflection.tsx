'use client';

import { useState } from 'react';
import { useIsClient } from '@/lib/storage';

export default function ThemeReflection({ slug }: { slug: string }) {
  const ready = useIsClient();
  return ready ? <ReflectionEditor key={slug} slug={slug} /> : <p className="text-sm text-parchment-500">Loading your reflection…</p>;
}

function ReflectionEditor({ slug }: { slug: string }) {
  const storageKey = `biblelogos-theme-reflection:${slug}`;
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(storageKey) ?? ''; } catch { return ''; }
  });
  const [status, setStatus] = useState('');
  function save() {
    try {
      localStorage.setItem(storageKey, text);
      setStatus('Reflection saved in this browser.');
    } catch {
      setStatus('Unable to save in this browser. Copy your reflection somewhere safe.');
    }
  }
  return (
    <div className="mt-6">
      <label htmlFor="theme-reflection" className="block text-sm font-medium text-parchment-200">Your reflection</label>
      <p id="reflection-help" className="text-xs text-parchment-500 mt-1 mb-3">Private to this browser. Save your changes before leaving the study.</p>
      <textarea id="theme-reflection" aria-describedby="reflection-help" rows={6} value={text}
        onChange={event => { setText(event.target.value); setStatus('Unsaved changes.'); }}
        className="w-full rounded-lg border border-parchment-700 bg-parchment-900 p-3 text-parchment-100" />
      <button onClick={save} className="mt-3 rounded-lg bg-gold-600 px-4 py-2 text-white text-sm hover:opacity-90">Save reflection</button>
      <p role="status" className="mt-2 text-xs text-parchment-400">{status}</p>
    </div>
  );
}
