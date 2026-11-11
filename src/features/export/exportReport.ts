import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { ReportData } from './report';
import { reportHtml } from './report';

const safeName = (s: string) => s.replace(/[^A-Za-z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'case';

/** Creates the PDF on the device and opens the share sheet. Returns false if the user has no share target. */
export async function exportPdf(d: ReportData): Promise<'shared' | 'unavailable'> {
  const { uri } = await Print.printToFileAsync({ html: reportHtml(d) });
  const named = new File(Paths.cache, `VERITAS-${safeName(d.case.title)}-${d.generatedAt.slice(0, 10)}.pdf`);
  if (named.exists) named.delete();
  new File(uri).move(named);
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(named.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Share report' });
  return 'shared';
}

export async function exportJson(d: ReportData): Promise<'shared' | 'unavailable'> {
  const f = new File(Paths.cache, `VERITAS-${safeName(d.case.title)}-${d.generatedAt.slice(0, 10)}.json`);
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(d, null, 2));
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Share data' });
  return 'shared';
}
