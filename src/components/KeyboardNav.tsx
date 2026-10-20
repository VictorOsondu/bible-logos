'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  prevHref?: string;
  nextHref?: string;
}

/** Arrow keys (or h/l) move between chapters; ? shows the shortcuts. */
export default function KeyboardNav({ prevHref, nextHref }: Props) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'h':
          if (prevHref) { e.preventDefault(); router.push(prevHref); }
          break;
        case 'ArrowRight':
        case 'l':
          if (nextHref) { e.preventDefault(); router.push(nextHref); }
          break;
        case '/':
          e.preventDefault();
          router.push('/search');
          break;
        case '?':
          e.preventDefault();
          setShowHelp(prev => !prev);
          break;
        case 'Escape':
          setShowHelp(false);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prevHref, nextHref, router]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 no-print" onClick={() => setShowHelp(false)}>
      <div className="bg-parchment-950 border border-parchment-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-parchment-50 mb-4">Keyboard shortcuts</h3>
        <div className="space-y-2 text-sm">
          {[
            ['← / h', 'Previous chapter'],
            ['→ / l', 'Next chapter'],
            ['/', 'Go to Search'],
            ['?', 'Toggle this help'],
            ['Esc', 'Close panel'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="px-2 py-0.5 bg-parchment-900 rounded-sm text-parchment-200 font-mono text-xs border border-parchment-800 min-w-12 text-center">{key}</kbd>
              <span className="text-parchment-300">{desc}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowHelp(false)}
          className="mt-4 w-full text-center text-xs text-parchment-500 hover:text-parchment-300 transition-colors"
        >
          Press Esc or click outside to close
        </button>
      </div>
    </div>
  );
}
