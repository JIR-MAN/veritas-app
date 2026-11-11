/**
 * Reads the hidden details (metadata) inside a file and looks for AI labels.
 * Only metadata segments are searched (EXIF fields, the XMP packet, PNG text
 * chunks), never the compressed image data, to avoid accidental matches.
 * Location coordinates are never returned; only whether they are present.
 */
import { parse as exifParse } from 'exifr/dist/full.esm.mjs';

export type MetaFinding = {
  kind: 'ai_declared' | 'generator' | 'generation_settings';
  source: string;
  value: string;
};

export type MetadataReport = {
  findings: MetaFinding[];
  fields: { label: string; value: string }[];
  hasLocation: boolean;
  hasCamera: boolean;
  hasAnyMetadata: boolean;
};

const AI_SOURCE_TYPES = ['trainedAlgorithmicMedia', 'compositeWithTrainedAlgorithmicMedia', 'algorithmicMedia', 'compositeSynthetic'];

/** Names of AI image/video generators that commonly write themselves into metadata. */
const GENERATORS: [RegExp, string][] = [
  [/midjourney/i, 'Midjourney'],
  [/dall[·\-\s]?e/i, 'DALL·E'],
  [/stable[\s_-]?diffusion/i, 'Stable Diffusion'],
  [/automatic1111|sd-webui/i, 'Stable Diffusion (AUTOMATIC1111)'],
  [/comfyui/i, 'ComfyUI'],
  [/invokeai/i, 'InvokeAI'],
  [/novelai/i, 'NovelAI'],
  [/adobe firefly|\bfirefly\b/i, 'Adobe Firefly'],
  [/\bimagen\b/i, 'Google Imagen'],
  [/gemini/i, 'Google Gemini'],
  [/chatgpt|gpt-4o|gpt-image|openai/i, 'OpenAI / ChatGPT'],
  [/ideogram/i, 'Ideogram'],
  [/leonardo\.?ai/i, 'Leonardo.Ai'],
  [/\bflux(\.1)?\b|black forest labs/i, 'FLUX'],
  [/bing image creator|microsoft designer/i, 'Microsoft Designer / Bing Image Creator'],
  [/runwayml|\brunway\b/i, 'Runway'],
  [/\bsora\b/i, 'OpenAI Sora'],
  [/\bkling\b/i, 'Kling'],
  [/meta ai|imagine with meta/i, 'Meta AI'],
  [/\bgrok\b|xai aurora/i, 'xAI Grok'],
  [/dreamstudio/i, 'DreamStudio'],
  [/nightcafe/i, 'NightCafe'],
  [/craiyon/i, 'Craiyon'],
  [/playground ?ai/i, 'Playground AI'],
];

/** PNG text keys written by popular generators. */
const GEN_SETTING_KEYS = ['parameters', 'prompt', 'workflow', 'invokeai_metadata', 'sd-metadata', 'dream', 'generation_data', 'negative_prompt'];

function latin1(bytes: Uint8Array, start = 0, end = bytes.length) {
  let s = '';
  for (let i = start; i < end; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(end, i + 0x8000))));
  return s;
}

async function inflate(data: Uint8Array): Promise<string | null> {
  try {
    const ds = new (globalThis as any).DecompressionStream('deflate');
    const out = await new Response(new Blob([data as BlobPart]).stream().pipeThrough(ds)).arrayBuffer();
    return new TextDecoder().decode(out);
  } catch {
    return null;
  }
}

/** Reads tEXt, zTXt and iTXt chunks from a PNG. */
export async function pngTextChunks(bytes: Uint8Array): Promise<{ key: string; text: string }[]> {
  const out: { key: string; text: string }[] = [];
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return out;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 8;
  while (p + 8 <= bytes.length && out.length < 64) {
    const len = dv.getUint32(p);
    const type = latin1(bytes, p + 4, p + 8);
    const data = bytes.subarray(p + 8, Math.min(bytes.length, p + 8 + len));
    if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
      const nul = data.indexOf(0);
      if (nul > 0) {
        const key = latin1(data, 0, nul);
        let text: string | null = null;
        if (type === 'tEXt') text = latin1(data, nul + 1);
        else if (type === 'zTXt') text = await inflate(data.subarray(nul + 2));
        else {
          const compressed = data[nul + 1] === 1;
          // skip compression method, language tag and translated keyword
          let q = nul + 3;
          q = data.indexOf(0, q) + 1;
          q = data.indexOf(0, q) + 1;
          const body = data.subarray(q);
          text = compressed ? await inflate(body) : new TextDecoder().decode(body);
        }
        if (text != null) out.push({ key, text: text.slice(0, 20000) });
      }
    }
    if (type === 'IEND') break;
    p += 12 + len;
  }
  return out;
}

/** Finds the XMP packet, if any, without scanning compressed image data as text. */
export function findXmp(bytes: Uint8Array): string | null {
  const s = latin1(bytes, 0, Math.min(bytes.length, 4 * 1024 * 1024));
  const a = s.indexOf('<x:xmpmeta');
  if (a < 0) return null;
  const b = s.indexOf('</x:xmpmeta>', a);
  return b < 0 ? null : s.slice(a, b + 12);
}

export async function analyzeMetadata(bytes: Uint8Array): Promise<MetadataReport> {
  const findings: MetaFinding[] = [];
  const fields: { label: string; value: string }[] = [];
  let hasLocation = false;
  let hasCamera = false;
  let hasAnyMetadata = false;

  const addGenerators = (text: string, source: string) => {
    for (const [re, name] of GENERATORS) {
      if (re.test(text) && !findings.some((f) => f.kind === 'generator' && f.value === name)) findings.push({ kind: 'generator', source, value: name });
    }
  };

  // EXIF / TIFF
  try {
    const ex: any = await exifParse(bytes, { tiff: true, exif: true, gps: true, xmp: false, iptc: true, icc: false, jfif: false, ihdr: false, translateValues: true, reviveValues: false });
    if (ex) {
      hasAnyMetadata = true;
      if (ex.Make || ex.Model) {
        hasCamera = true;
        fields.push({ label: 'Camera', value: ex.Make && ex.Model && String(ex.Model).startsWith(String(ex.Make)) ? String(ex.Model) : [ex.Make, ex.Model].filter(Boolean).join(' ') });
      }
      if (ex.LensModel) fields.push({ label: 'Lens', value: String(ex.LensModel) });
      if (ex.DateTimeOriginal) fields.push({ label: 'Date taken (as written in the file)', value: String(ex.DateTimeOriginal) });
      if (ex.Software) {
        fields.push({ label: 'Software', value: String(ex.Software).slice(0, 120) });
        addGenerators(String(ex.Software), 'EXIF Software');
      }
      for (const k of ['Artist', 'ImageDescription', 'UserComment', 'Copyright', 'Caption', 'Credit', 'Byline', 'OriginatingProgram']) {
        if (ex[k]) addGenerators(String(ex[k]), `Metadata field ${k}`);
      }
      if (ex.latitude != null || ex.GPSLatitude != null) hasLocation = true;
    }
  } catch {
    // Unreadable or no EXIF: not an error.
  }

  // XMP
  const xmp = findXmp(bytes);
  if (xmp) {
    hasAnyMetadata = true;
    const dst = /digitalsourcetype[^>]*?(?:=|>)\s*"?([^"<\s]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = dst.exec(xmp))) {
      const t = m[1].split('/').filter(Boolean).pop() ?? m[1];
      if (AI_SOURCE_TYPES.includes(t)) findings.push({ kind: 'ai_declared', source: 'XMP DigitalSourceType', value: t });
      else if (!fields.some((f) => f.label === 'Declared source type')) fields.push({ label: 'Declared source type', value: t });
    }
    const tool = /CreatorTool(?:="|>)([^"<]+)/i.exec(xmp);
    if (tool) fields.push({ label: 'Created with', value: tool[1].slice(0, 120) });
    addGenerators(xmp.replace(/<x:xmpmeta[^>]*>/, ''), 'XMP metadata');
    if (/exif:GPSLatitude/i.test(xmp)) hasLocation = true;
  }

  // PNG text chunks
  for (const { key, text } of await pngTextChunks(bytes)) {
    hasAnyMetadata = true;
    const k = key.toLowerCase();
    if (GEN_SETTING_KEYS.includes(k)) {
      if (!findings.some((f) => f.kind === 'generation_settings')) findings.push({ kind: 'generation_settings', source: `PNG text "${key}"`, value: 'Image-generation settings (such as a prompt or seed) are stored in the file' });
    }
    addGenerators(`${key} ${text}`, `PNG text "${key}"`);
    if (k === 'software' && !fields.some((f) => f.label === 'Software')) fields.push({ label: 'Software', value: text.slice(0, 120) });
  }

  if (hasLocation) fields.push({ label: 'Location', value: 'Location data is present (coordinates not shown)' });
  return { findings, fields, hasLocation, hasCamera, hasAnyMetadata };
}
