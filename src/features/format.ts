export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatDateTime(iso: string, timeZone?: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Splits a hex hash into groups of 8 so people can read it aloud and compare. */
export function groupHash(h: string) {
  return h.match(/.{1,8}/g)?.join(' ') ?? h;
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/** Parses a local date (YYYY-MM-DD) and time (HH:MM) typed by the user. Returns null if invalid. */
export function parseLocal(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!d || !t) return null;
  const out = new Date(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  if (out.getMonth() !== +d[2] - 1 || +t[1] > 23 || +t[2] > 59) return null;
  return out;
}
