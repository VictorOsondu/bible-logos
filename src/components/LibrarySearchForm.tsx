'use client';
import { useState } from 'react';
import { useCollections } from './CollectionToggle';
import { getTranslation } from '@/lib/translations';
export default function LibrarySearchForm({ q, scope = 'bible', version = 'KJV', testament = '', available, collections }: { q: string; scope?: string; version?: string; testament?: string; available: string[]; collections?: string[] }) {
  const stored = useCollections();
  const enabled = collections ?? stored;
  const [selectedScope, setScope] = useState(scope);
  const [translation, setTranslation] = useState(version);
  const field = 'bg-parchment-900 text-parchment-200 rounded-lg px-3 py-3 text-sm border border-parchment-700 max-w-full';
  return <form className="flex flex-wrap gap-3 items-end">
    <input name="q" maxLength={1000} defaultValue={q} aria-label="Search text" placeholder="Search texts…" className={`${field} flex-1 min-w-40`} />
    <input type="hidden" name="collections" value={enabled.join(',')} />
    <label className="text-xs text-parchment-400 min-w-0 max-w-full">Scope<select name="scope" aria-label="Search scope" value={selectedScope} onChange={e => { setScope(e.target.value); setTranslation(e.target.value === 'bible' ? 'KJV' : 'ALL'); }} className={`${field} block`}><option value="bible">Bible</option><option value="enabled">Bible + enabled collections</option><option value="all">All library</option></select></label>
    <label className="text-xs text-parchment-400 min-w-0 max-w-full">Version<select name="translation" aria-label="Search version" value={translation} onChange={e => setTranslation(e.target.value)} className={`${field} block`}><option value="ALL">All versions</option>{available.map(id => <option key={id} value={id}>{getTranslation(id)?.name ?? id}</option>)}</select></label>
    <label className="text-xs text-parchment-400 min-w-0 max-w-full">Testament<select name="testament" aria-label="Testament" defaultValue={testament} className={`${field} block`}><option value="">All</option><option value="OT">Old Testament</option><option value="NT">New Testament</option></select></label>
    <button className="px-6 py-3 bg-gold-600 text-parchment-950 rounded-xl font-semibold">Search</button>
  </form>;
}
