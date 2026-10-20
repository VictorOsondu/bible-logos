'use client';

/** Shown when a panel's data could not be loaded. */
export default function LoadError({ onRetry, what = 'this' }: { onRetry: () => void; what?: string }) {
  return (
    <p className="text-sm text-parchment-400" role="alert">
      Couldn&apos;t load {what}.{' '}
      <button onClick={onRetry} className="underline underline-offset-2 hover:text-parchment-100">Try again</button>
    </p>
  );
}
