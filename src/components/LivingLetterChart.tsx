'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { LivingLetter, LivingLetterGroup } from '@/lib/theme-studies';
import LetterPronunciation from './LetterPronunciation';

export default function LivingLetterChart({ groups, ordered = false }: { groups: LivingLetterGroup[]; ordered?: boolean }) {
  const [selected, setSelected] = useState<{ letter: LivingLetter; family: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const chartId = useId();
  const alphabet = 'אבגדהוזחטיכלמנסעפצקרשת';
  const orderedLetters = groups.flatMap(group => group.entries.map(letter => ({ letter, family: group.name })))
    .sort((a, b) => alphabet.indexOf(a.letter.letter) - alphabet.indexOf(b.letter.letter));

  useEffect(() => {
    if (!selected) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  return (
    <div className="mt-6">
      <p id={`${chartId}-help`} className="text-sm text-parchment-400 mb-5">
        {ordered && 'All 22 letters in Hebrew alphabetical order, read from right to left. '}
        Select a letter to explore its shape, sound and symbolic interpretations, including its Christocentric meaning and association. Book of Formation associations for the doubles and simples are shared within their families.
      </p>
      {ordered ? (
        <div role="group" aria-label="Hebrew alphabet chart" aria-describedby={`${chartId}-help`} dir="rtl" className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {orderedLetters.map(({ letter, family }) => (
            <button key={letter.name} type="button" dir="ltr" aria-label={`${letter.name} — ${letter.letter}`} aria-haspopup="dialog"
              onClick={() => setSelected({ letter, family })}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-parchment-800 bg-parchment-900/50 p-2 hover:border-gold-400 hover:bg-parchment-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 transition-colors">
              <span lang="he" dir="rtl" className="text-4xl leading-tight text-gold-400">{letter.letter}</span>
              <span className="text-sm text-parchment-200">{letter.name}</span>
            </button>
          ))}
        </div>
      ) : (
      <div role="group" aria-label="Living letters chart" aria-describedby={`${chartId}-help`} className="space-y-6">
        {groups.map(group => (
          <section key={group.name} aria-label={group.name}>
            <h3 className="font-serif text-xl text-parchment-100 mb-2">{group.name}</h3>
            <p className="text-sm text-parchment-400 leading-relaxed mb-3">{group.connections}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {group.entries.map(letter => (
                <button key={letter.name} type="button" aria-label={`${letter.name} — ${letter.letter}`} aria-haspopup="dialog"
                  onClick={() => setSelected({ letter, family: group.name })}
                  className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-parchment-800 bg-parchment-900/50 p-3 hover:border-gold-400 hover:bg-parchment-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 transition-colors">
                  <span lang="he" dir="rtl" className="text-4xl leading-tight text-gold-400">{letter.letter}</span>
                  <span className="text-sm text-parchment-200">{letter.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      )}
      <dialog ref={dialogRef} aria-labelledby={`${chartId}-title`} aria-describedby={`${chartId}-family`}
        onClose={() => setSelected(null)}
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
            event.currentTarget.close();
          }
        }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-parchment-700 bg-parchment-950 p-5 text-parchment-100 shadow-2xl backdrop:bg-black/60 sm:p-7">
        {selected && (
          <>
            <header className="flex items-start justify-between gap-4">
              <div>
                <p id={`${chartId}-family`} className="text-xs text-parchment-500 mb-2">{selected.family}</p>
                <h2 id={`${chartId}-title`} className="font-serif text-3xl text-parchment-50">{selected.letter.name}</h2>
              </div>
              <button type="button" aria-label="Close letter details" onClick={() => dialogRef.current?.close()}
                className="rounded-lg p-3 text-parchment-400 hover:bg-parchment-800 hover:text-parchment-100 focus-visible:outline-2 focus-visible:outline-gold-400">
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <p lang="he" dir="rtl" className="my-5 text-center text-7xl text-gold-400 leading-normal">{selected.letter.letter}</p>
            {selected.letter.shape && <section className="mb-5">
              <h3 className="font-serif text-xl mb-2">Explore the shape</h3>
              <p className="text-sm text-parchment-300 leading-relaxed">{selected.letter.shape}</p>
            </section>}
            {selected.letter.sound && <section className="mb-5">
              <h3 className="font-serif text-xl mb-2">Listen and compare</h3>
              <p className="text-sm text-parchment-300 leading-relaxed">{selected.letter.sound}</p>
              <LetterPronunciation key={selected.letter.letter} letter={selected.letter} />
              <p className="mt-3 text-sm text-parchment-400 leading-relaxed">{selected.letter.soundExercise}</p>
            </section>}
            <section>
              <h3 className="font-serif text-xl mb-2">Living letter meaning</h3>
              <p className="text-sm text-parchment-300 leading-relaxed">{selected.letter.meaning}</p>
            </section>
            {selected.letter.christocentric && <section className="mt-5">
              <h3 className="font-serif text-xl mb-2">Christocentric interpretation</h3>
              <p className="text-sm font-medium text-gold-400 mb-2">{selected.letter.christocentric.association}</p>
              <p className="text-sm text-parchment-300 leading-relaxed">{selected.letter.christocentric.meaning}</p>
            </section>}
            {selected.letter.interpretation && <section className="mt-5">
              <h3 className="font-serif text-xl mb-2">Golden Dawn interpretation</h3>
              {selected.letter.interpretation.split('\n\n').map(paragraph => <p key={paragraph} className="mt-3 text-sm text-parchment-300 leading-relaxed">{paragraph}</p>)}
              <p className="mt-3 text-xs text-parchment-500 leading-relaxed">{selected.letter.attribution}</p>
            </section>}
            <section className="mt-5">
              <h3 className="font-serif text-xl mb-2">Usage in the Book of Formation</h3>
              <p className="text-sm text-parchment-300 leading-relaxed">{selected.letter.usage}</p>
            </section>
            <section className="mt-5 border-t border-parchment-800 pt-4">
              <h3 className="text-sm font-medium mb-2">For reflection</h3>
              <p className="text-sm text-parchment-400 leading-relaxed">{selected.letter.reflection}</p>
            </section>
          </>
        )}
      </dialog>
    </div>
  );
}
