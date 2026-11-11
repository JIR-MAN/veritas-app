import type { ReportData } from './report';
import { reportHtml } from './report';

/** Web: opens the report in a print window; the browser's "Save as PDF" produces the file. */
export async function exportPdf(d: ReportData): Promise<'shared' | 'unavailable'> {
  const w = window.open('', '_blank');
  if (!w) return 'unavailable';
  w.document.write(reportHtml(d));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return 'shared';
}

export async function exportJson(d: ReportData): Promise<'shared' | 'unavailable'> {
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `VERITAS-${d.case.title.replace(/\W+/g, '-')}.json`;
  a.click();
  return 'shared';
}
