export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  lastModified?: number | null;
  /** Web only: the browser File object. */
  webFile?: Blob;
  isSample?: boolean;
};

export const CHUNK_BYTES = 512 * 1024;
export const MAX_CHECK_BYTES = 200 * 1024 * 1024;

export const SUPPORTED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/gif', 'image/tiff',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/aac',
  'application/pdf',
];

/** Detects the real file type from its first bytes. Never trust the extension alone. */
export function sniffMime(head: Uint8Array): string | null {
  const b = head;
  const at = (i: number, ...v: number[]) => v.every((x, k) => b[i + k] === x);
  const ascii = (i: number, s: string) => [...s].every((ch, k) => b[i + k] === ch.charCodeAt(0));
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (ascii(0, 'GIF8')) return 'image/gif';
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
  if (ascii(0, 'RIFF') && ascii(8, 'WAVE')) return 'audio/wav';
  if (ascii(0, 'RIFF') && ascii(8, 'AVI ')) return 'video/x-msvideo';
  if (ascii(0, '%PDF')) return 'application/pdf';
  if (ascii(0, 'ID3') || at(0, 0xff, 0xfb) || at(0, 0xff, 0xf3) || at(0, 0xff, 0xf2)) return 'audio/mpeg';
  if (at(0, 0x49, 0x49, 0x2a, 0x00) || at(0, 0x4d, 0x4d, 0x00, 0x2a)) return 'image/tiff';
  if (ascii(4, 'ftyp')) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (/^(heic|heix|hevc|heim|heis|mif1|msf1)$/.test(brand)) return 'image/heic';
    if (/^avi[fs]$/.test(brand)) return 'image/avif';
    if (brand === 'qt  ') return 'video/quicktime';
    if (/^M4A/.test(brand)) return 'audio/mp4';
    return 'video/mp4';
  }
  return null;
}
