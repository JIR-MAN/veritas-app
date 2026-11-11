import { useSyncExternalStore } from 'react';
import { kv } from '@/features/store/kv';

export type Appearance = 'system' | 'light' | 'dark';
type Settings = { appearance: Appearance };
const KEY = 'settings.v1';
const defaults: Settings = { appearance: 'system' };

let current: Settings | null = null;
const listeners = new Set<() => void>();
function get(): Settings {
  if (!current) {
    try {
      current = { ...defaults, ...JSON.parse(kv.get(KEY) ?? '{}') };
    } catch {
      current = defaults;
    }
  }
  return current!;
}

export const settings = {
  get,
  set(patch: Partial<Settings>) {
    current = { ...get(), ...patch };
    kv.set(KEY, JSON.stringify(current));
    listeners.forEach((l) => l());
  },
  reset() {
    current = defaults;
    kv.remove(KEY);
    listeners.forEach((l) => l());
  },
};

export function useSettings(): Settings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    get,
    get,
  );
}
