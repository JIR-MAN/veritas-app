/** Native key-value persistence backed by SQLite in the app's private storage. */
import Storage from 'expo-sqlite/kv-store';

export const kv = {
  get: (key: string): string | null => Storage.getItemSync(key),
  set: (key: string, value: string) => Storage.setItemSync(key, value),
  remove: (key: string) => {
    Storage.removeItemSync(key);
  },
  clear: () => {
    Storage.clearSync();
  },
};
