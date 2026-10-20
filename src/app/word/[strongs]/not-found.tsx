import Link from 'next/link';

export default function WordNotFound() {
  return (
    <main className="flex-1 px-4 py-16 lg:px-8 max-w-2xl text-center">
      <h1 className="font-serif text-3xl font-semibold text-parchment-50 mb-3">Strong&apos;s number not found</h1>
      <p className="text-parchment-400 mb-8">
        Strong&apos;s numbers look like H2617 (Hebrew) or G26 (Greek). Search the concordance to find the one you need.
      </p>
      <Link href="/concordance" className="inline-block px-5 py-2.5 rounded-xl bg-gold-600 text-parchment-950 text-sm font-medium hover:opacity-90">
        Search the concordance
      </Link>
    </main>
  );
}
