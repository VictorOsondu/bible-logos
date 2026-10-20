import Link from 'next/link';
import { NAV_SECTIONS } from '@/lib/navigation';

export default function Footer() {
  return (
    <footer className="border-t border-parchment-800 mt-12 py-8 px-4 bg-parchment-950/50">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <h3 className="text-xs font-semibold text-gold-500 uppercase tracking-wider mb-3">{section.label}</h3>
              <div className="space-y-1.5">
                {section.label === 'Study' && (
                  <Link href="/reader/genesis/1" className="block text-xs text-parchment-400 hover:text-gold-400 transition-colors">Read the Bible</Link>
                )}
                {section.links.map(link => (
                  <Link key={link.href} href={link.href} className="block text-xs text-parchment-400 hover:text-gold-400 transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-6 text-xs">
          <a href="https://github.com/VictorOsondu/bible-logos" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-parchment-900 border border-parchment-800 rounded-full text-parchment-400 hover:text-gold-400 hover:border-gold-500/30 transition-all">
            ⭐ GitHub
          </a>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-parchment-900 border border-parchment-800 rounded-full text-parchment-500">
            📜 Open Source (MIT)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-parchment-900 border border-parchment-800 rounded-full text-parchment-500">
            🌐 KJV · ASV · BBE · YLT · VUL
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-parchment-900 border border-parchment-800 rounded-full text-parchment-500">
            🔬 19 Research Sources
          </span>
        </div>
        <div className="text-center text-xs text-parchment-600 pt-5 border-t border-parchment-800/50">
          <p className="flex items-center justify-center gap-2">
            <span>📖</span>
            <span className="font-semibold text-parchment-500">Bible Logos</span>
            <span>—</span>
            <span>Personal Bible study &amp; research</span>
          </p>
          <p className="mt-1.5 text-parchment-700">
            Built with Next.js &amp; SQLite • Data from public domain translations • Strong&apos;s concordance &amp; cross-references
          </p>
          <p className="mt-1.5 text-parchment-700">
            Based on{' '}
            <a href="https://github.com/quantumnic/biblelens" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400 transition-colors">BibleLens</a>
            {' '}by Nicola Spieser (MIT)
          </p>
        </div>
      </div>
    </footer>
  );
}
