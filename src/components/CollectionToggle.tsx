'use client';
import { useStoredJson, writeStoredJson } from '@/lib/storage';
import { COLLECTIONS, type CollectionId } from '@/lib/text-library';
export const COLLECTION_KEY = 'biblelogos-collections';
const NONE: string[] = [];
export const useCollections = () => useStoredJson(COLLECTION_KEY, NONE).filter((id): id is CollectionId => typeof id === 'string' && COLLECTIONS.some(c => c.id === id));
export default function CollectionToggle({ id }: { id: CollectionId }) {
  const enabled = useCollections();
  const active = enabled.includes(id);
  return <button type="button" aria-pressed={active} aria-label={`${active ? 'Enabled' : 'Enable collection'}: ${COLLECTIONS.find(c => c.id === id)?.name}`} className="px-3 py-2 rounded-lg border border-parchment-700 text-sm text-gold-400" onClick={() => writeStoredJson(COLLECTION_KEY, active ? enabled.filter(c => c !== id) : [...enabled, id])}>
    {active ? 'Enabled' : 'Enable collection'}<span className="sr-only">: {COLLECTIONS.find(c => c.id === id)?.name}</span>
  </button>;
}
