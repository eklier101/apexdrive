/** Coerce API/SQLite values (often strings) to finite numbers */
export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === '') return fallback;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

export function formatMoney(value: unknown): string {
  return asNumber(value).toFixed(2);
}
