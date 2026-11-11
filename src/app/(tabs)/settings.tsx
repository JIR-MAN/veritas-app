import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { confirm, notify } from '@/components/confirm';
import { cases } from '@/features/cases/store';
import { engineClient } from '@/features/check/engine-client';
import { deleteAllStored } from '@/features/evidence/fileio';
import { APP_VERSION } from '@/features/export/report';
import { settings, useSettings, type Appearance } from '@/features/settings/store';
import { Group, Icon, Row, Screen } from '@/ui';

export default function Settings() {
  const { appearance } = useSettings();
  useSyncExternalStore(engineClient.onStatus, engineClient.status, engineClient.status);
  const info = engineClient.info();

  async function wipe() {
    const ok = await confirm('Delete all data?', 'Every case, note, fingerprint and private file copy on this device will be removed. This can’t be undone.', 'Delete everything');
    if (!ok) return;
    cases.wipeAll();
    deleteAllStored();
    settings.reset();
    notify('Deleted', 'All VERITAS data has been removed from this device.');
  }

  const opt = (v: Appearance, label: string) => (
    <Row key={v} title={label} selected={appearance === v} onPress={() => settings.set({ appearance: v })} trailing={appearance === v ? <Icon name="check" color="accent" /> : <></>} />
  );

  return (
    <Screen testID="screen-settings">
      <PageTitle title="Settings" />
      <Group title="Appearance">{[opt('system', 'Match device'), opt('light', 'Light'), opt('dark', 'Dark')]}</Group>
      <Group title="Privacy and checks">
        <Row icon="shield" title="Privacy" subtitle="What is stored, and where" onPress={() => router.push('/about/privacy')} />
        <Row icon="book-open" title="How checks work" subtitle="What results mean and their limits" onPress={() => router.push('/about/checks')} />
      </Group>
      <Group title="Your data" footer="Removes everything VERITAS has stored on this device.">
        <Row icon="trash-2" title="Delete all data" destructive onPress={wipe} />
      </Group>
      <Group title="About">
        <Row title="Version" value={`${APP_VERSION}`} />
        <Row title="Credentials engine" value={info ? `c2pa-web ${info.libraryVersion}` : engineClient.status() === 'failed' ? 'Unavailable' : 'Starting…'} />
        <Row title="Trust lists" value={info?.trustListsFetched ?? '—'} />
      </Group>
    </Screen>
  );
}
