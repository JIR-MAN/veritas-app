import { router } from 'expo-router';
import { useState } from 'react';
import { startCheck } from '@/features/check/session';
import { loadSample, pickFile } from '@/features/evidence/fileio';
import type { SampleKey } from '@/features/evidence/samples';
import { notify } from './confirm';

export function useStartCheck() {
  const [busy, setBusy] = useState<string | null>(null);
  async function run(source: 'pick' | SampleKey) {
    setBusy(source);
    try {
      const file = source === 'pick' ? await pickFile() : await loadSample(source);
      if (!file) return;
      if (!file.size) {
        notify('Empty file', 'This file has no content, so there is nothing to check.');
        return;
      }
      const id = startCheck(file);
      router.push({ pathname: '/check/[id]', params: { id } });
    } catch {
      notify('Couldn’t open the file', 'VERITAS could not read this file. Try another copy of it.');
    } finally {
      setBusy(null);
    }
  }
  return { run, busy };
}
