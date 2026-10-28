'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import type { LivingLetter } from '@/lib/theme-studies';

export default function LetterPronunciation({ letter }: { letter: LivingLetter }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const audio = audioRef.current;
    return () => {
      mounted.current = false;
      audio?.pause();
    };
  }, []);

  if (!letter.audio) return null;
  const recording = letter.audio;

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    setFailed(false);
    setLoading(true);
    // No request to the external audio host until the listener presses Play.
    if (!audio.getAttribute('src') || failed) audio.src = recording.src;
    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <audio ref={audioRef} preload="none"
        onPlaying={() => { setPlaying(true); setLoading(false); }}
        onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onError={() => { setFailed(true); setLoading(false); setPlaying(false); }} />
      <button type="button" onClick={togglePlayback} disabled={loading}
        aria-label={`${playing ? 'Stop' : 'Play'} pronunciation of ${letter.name}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-parchment-700 px-3 py-2 text-sm text-gold-400 hover:bg-parchment-800 focus-visible:outline-2 focus-visible:outline-gold-400 disabled:opacity-60">
        {playing ? <Square size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {loading ? 'Loading pronunciation…' : playing ? 'Stop pronunciation' : 'Hear the letter name'}
      </button>
      {failed && <p role="status" className="mt-2 text-sm text-parchment-300">Audio could not play. Try again or listen on the source page below.</p>}
      <p className="mt-2 text-xs text-parchment-500">
        Modern Hebrew letter name · <a href={recording.sourceUrl} target="_blank" rel="noreferrer" className="text-gold-400 hover:underline">Audio source: Polly Lingual (opens in a new tab)</a>
      </p>
      <p className="mt-1 text-xs text-parchment-500">{recording.credit}</p>
    </div>
  );
}
