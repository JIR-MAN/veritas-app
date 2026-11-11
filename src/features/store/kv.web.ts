/** Web demo persistence: the browser's localStorage, scoped to this site. */
const PREFIX = 'veritas:';
const ls = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};
const memory = new Map<string, string>();

export const kv = {
  get: (key: string): string | null => {
    try {
      return ls()?.getItem(PREFIX + key) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set: (key: string, value: string) => {
    memory.set(key, value);
    try {
      ls()?.setItem(PREFIX + key, value);
    } catch {}
  },
  remove: (key: string) => {
    memory.delete(key);
    try {
      ls()?.removeItem(PREFIX + key);
    } catch {}
  },
  clear: () => {
    memory.clear();
    try {
      const s = ls();
      if (!s) return;
      Object.keys(s)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => s.removeItem(k));
    } catch {}
  },
};
