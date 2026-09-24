/** Percent (0–100, rounded) of part over total; 0 when total is 0. */
export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
