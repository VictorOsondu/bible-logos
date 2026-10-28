'use client';
import { useSessionStorageFallback } from '@/lib/storage';
export default function StorageNotice() {
  const temporary = useSessionStorageFallback();
  return temporary ? <p role="status" className="m-4 rounded-lg border border-gold-500/50 px-4 py-3 text-sm text-parchment-200">Browser storage could not save your changes. They are available in this session, but will be lost if you reload or close this page. Copy or export notes you want to keep.</p> : null;
}
