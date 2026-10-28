// JSON values kept in localStorage, readable from React through useSyncExternalStore.
// Writes made here notify every component using the same key; other tabs notify via 'storage'.

import { useSyncExternalStore } from 'react';

const CHANGE_EVENT = 'biblelogos-storage';
const cache = new Map<string, { raw: string | null; value: unknown }>();
const sessionValues = new Map<string, string>();

function readRaw(key: string): string | null {
  if (sessionValues.has(key)) return sessionValues.get(key)!;
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage unavailable (private browsing, blocked)
  }
}

/** Reads a stored JSON value. Returns the same object until the stored text changes. */
export function readStoredJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value = fallback;
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback) ? Array.isArray(parsed) : parsed !== null && typeof parsed === typeof fallback) value = parsed as T;
    } catch {
      // corrupt entry: fall back
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStoredJson(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
    sessionValues.delete(key);
  } catch {
    // Keep the current session usable, but visibly report that persistence failed.
    sessionValues.set(key, serialized);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** A stored JSON value as React state. `fallback` should be a constant (it is returned by reference). */
export function useStoredJson<T>(key: string, fallback: T): T {
  return useSyncExternalStore(subscribe, () => readStoredJson(key, fallback), () => fallback);
}

const noSubscription = () => () => {};

/** False while rendering on the server and during hydration, true afterwards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}

/** True only after a write actually failed; no warning is shown speculatively. */
export const useSessionStorageFallback = () => useSyncExternalStore(subscribe, () => sessionValues.size > 0, () => false);
