/** Parse a score input value: empty -> undefined, valid finite >=0 -> floored int, else undefined. */
export function parseScore(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/** Parse a positive integer setting input. Falls back to `fallback` if not
 *  finite or negative (the function name promises non-negative output). */
export function parsePositiveInt(v: string, fallback: number): number {
  if (v === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}
