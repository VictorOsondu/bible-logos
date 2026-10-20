import type { Metadata } from 'next';
import Link from 'next/link';
import { REFERENCE_SECTION } from '@/lib/navigation';

export const metadata: Metadata = { title: 'Reference — Bible Logos' };

export default function ReferencePage() {
  return (
    <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10 max-w-4xl">
      <h1 className="font-serif text-3xl font-semibold text-parchment-50 mb-2">Reference</h1>
      <p className="text-sm text-parchment-500 mb-6">Indexes of people, places and themes, each linking to the verses.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {REFERENCE_SECTION.links.map(({ href, icon: Icon, label, description }) => (
          <Link key={href} href={href} className="flex items-start gap-3 p-4 rounded-xl hover:bg-parchment-900 transition-colors">
            <Icon size={18} className="mt-0.5 text-gold-400 shrink-0" />
            <span>
              <span className="block text-sm font-medium text-parchment-100">{label}</span>
              <span className="block text-xs text-parchment-500">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
