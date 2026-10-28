let sequence = 0;
/** Saved items must also work on local HTTP origins that do not expose randomUUID. */
export function localId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2)}`;
}
