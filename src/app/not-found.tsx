import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 px-4 py-16 lg:px-8 max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-parchment-500 mb-2">404</p>
      <h1 className="font-serif text-3xl font-semibold text-parchment-50 mb-3">Page not found</h1>
      <p className="text-parchment-400 mb-8">That page or passage doesn&apos;t exist. Try searching for it instead.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-gold-600 text-parchment-950 text-sm font-medium hover:opacity-90">Home</Link>
        <Link href="/search" className="px-5 py-2.5 rounded-xl border border-parchment-800 text-parchment-200 text-sm hover:bg-parchment-900">Search</Link>
      </div>
    </main>
  );
}
