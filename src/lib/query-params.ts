export type QueryParams = Record<string, string | string[] | undefined>;
/** Next.js returns arrays for repeated query keys. Use the first value consistently. */
export const queryValue = (value: string | string[] | undefined, fallback = '') => (Array.isArray(value) ? value[0] : value) ?? fallback;
export function boundedInteger(value: string | string[] | undefined, fallback: number, min: number, max: number): number {
  const raw = queryValue(value);
  if (!/^\d+$/.test(raw)) return fallback;
  const number = Number(raw);
  return Number.isSafeInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
