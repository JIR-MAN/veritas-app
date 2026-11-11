/**
 * VERITAS detection relay. Holds the paid detection services' API keys on a
 * server so they are never shipped inside the app. Forwards one file per
 * request to the provider the user chose, returns {score, model}, and keeps
 * nothing: no file, no result, no log of content.
 *
 * Standard fetch handler: runs on Cloudflare Workers, Deno, Bun, or Node 22+
 * (see node.mjs). Configuration comes from environment variables only:
 *   HIVE_API_KEY, SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET, REALITY_DEFENDER_API_KEY
 *   ALLOWED_ORIGINS  comma-separated web origins allowed to call (apps send none)
 *   DAILY_CAP        total requests per day across all users (default 100)
 *   PER_CLIENT_DAILY requests per day per client address (default 10)
 *   MONTHLY_CAP      total requests per calendar month (default 50, the
 *                    Reality Defender free allowance). Needs the COUNTERS KV
 *                    binding to be reliable across server instances.
 *
 * NOT YET VERIFIED against the live services: no accounts exist yet. The
 * request and response shapes follow each provider's public documentation and
 * must be checked with a real key before this is switched on.
 */

/** Minimal Cloudflare KV interface, used for the monthly cap when bound as COUNTERS. */
export type KV = { get(key: string): Promise<string | null>; put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void> };
export type Env = { COUNTERS?: KV } & Record<string, any>;
export type Opinion = { score: number; model: string };
type Provider = (file: File, env: Env, f: typeof fetch) => Promise<Opinion>;

export const MAX_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

class RelayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/** Sightengine "genai" model: type.ai_generated in [0,1]. */
export const sightengine: Provider = async (file, env, f) => {
  if (!env.SIGHTENGINE_API_USER || !env.SIGHTENGINE_API_SECRET) throw new RelayError(503, 'Sightengine is not configured');
  const form = new FormData();
  form.append('media', file, file.name || 'image');
  form.append('models', 'genai');
  form.append('api_user', env.SIGHTENGINE_API_USER);
  form.append('api_secret', env.SIGHTENGINE_API_SECRET);
  const r = await f('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: form });
  const j: any = await r.json().catch(() => null);
  const s = j?.type?.ai_generated;
  if (!r.ok || j?.status !== 'success' || typeof s !== 'number') throw new RelayError(502, 'Sightengine gave no usable answer');
  return { score: clamp(s), model: 'sightengine genai' };
};

/** Hive AI-generated content detection (synchronous task API): class "ai_generated". */
export const hive: Provider = async (file, env, f) => {
  if (!env.HIVE_API_KEY) throw new RelayError(503, 'Hive is not configured');
  const form = new FormData();
  form.append('media', file, file.name || 'image');
  const r = await f('https://api.thehive.ai/api/v2/task/sync', { method: 'POST', headers: { authorization: `Token ${env.HIVE_API_KEY}` }, body: form });
  const j: any = await r.json().catch(() => null);
  const classes: { class: string; score: number }[] | undefined = j?.status?.[0]?.response?.output?.[0]?.classes;
  const s = classes?.find((c) => c.class === 'ai_generated')?.score;
  if (!r.ok || typeof s !== 'number') throw new RelayError(502, 'Hive gave no usable answer');
  return { score: clamp(s), model: 'hive ai-generated' };
};

/** Reality Defender: upload via a pre-signed URL, then poll for the summary (finalScore 0-100). */
export const realityDefender: Provider = async (file, env, f) => {
  const key = env.REALITY_DEFENDER_API_KEY;
  if (!key) throw new RelayError(503, 'Reality Defender is not configured');
  const base = 'https://api.prd.realitydefender.xyz';
  const headers = { 'x-api-key': key, 'content-type': 'application/json' };
  const p = await f(`${base}/api/files/aws-presigned`, { method: 'POST', headers, body: JSON.stringify({ fileName: file.name || 'image.jpg' }) });
  const pj: any = await p.json().catch(() => null);
  const url = pj?.response?.signedUrl;
  const requestId = pj?.requestId ?? pj?.mediaId;
  if (!p.ok || !url || !requestId) throw new RelayError(502, 'Reality Defender upload was refused');
  const up = await f(url, { method: 'PUT', body: file });
  if (!up.ok) throw new RelayError(502, 'Reality Defender upload failed');
  for (let i = 0; i < 30; i++) {
    await new Promise((res) => setTimeout(res, i === 0 ? 2000 : 3000));
    const r = await f(`${base}/api/media/users/${requestId}`, { headers });
    const j: any = await r.json().catch(() => null);
    const status = j?.resultsSummary?.status;
    const score = j?.resultsSummary?.metadata?.finalScore;
    if (status && status !== 'ANALYZING' && typeof score === 'number') return { score: clamp(score / 100), model: 'reality defender' };
  }
  throw new RelayError(504, 'Reality Defender took too long');
};

export const PROVIDERS: Record<string, Provider> = { sightengine, hive, reality_defender: realityDefender };

/** In-memory daily counters. On multi-instance hosts use the platform's rate limiter as well. */
const counters = new Map<string, number>();
const monthCounters = new Map<string, number>();
let counterDay = '';
function allow(client: string, env: Env) {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== counterDay) {
    counters.clear();
    counterDay = day;
  }
  const cap = Number(env.DAILY_CAP ?? 100);
  const per = Number(env.PER_CLIENT_DAILY ?? 10);
  const total = counters.get('*') ?? 0;
  const mine = counters.get(client) ?? 0;
  if (total >= cap || mine >= per) return false;
  counters.set('*', total + 1);
  counters.set(client, mine + 1);
  return true;
}
/** Monthly cap, stored in KV when available so it holds across instances. */
async function allowMonth(env: Env) {
  const cap = Number(env.MONTHLY_CAP ?? 50);
  const key = `month:${new Date().toISOString().slice(0, 7)}`;
  if (env.COUNTERS) {
    const used = Number((await env.COUNTERS.get(key)) ?? 0);
    if (used >= cap) return false;
    await env.COUNTERS.put(key, String(used + 1), { expirationTtl: 60 * 60 * 24 * 40 });
    return true;
  }
  const used = monthCounters.get(key) ?? 0;
  if (used >= cap) return false;
  monthCounters.set(key, used + 1);
  return true;
}

export function resetCounters() {
  counters.clear();
  monthCounters.clear();
}

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowed = String(env.ALLOWED_ORIGINS ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' };
}

export async function handle(req: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  const h = cors(req, env);
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (url.pathname === '/health') return json(200, { ok: true, providers: Object.keys(PROVIDERS) });
  if (url.pathname !== '/v1/detect' || req.method !== 'POST') return json(404, { error: 'not_found' });
  const origin = req.headers.get('origin');
  if (origin && !h['access-control-allow-origin']) return json(403, { error: 'origin_not_allowed' });
  const provider = PROVIDERS[url.searchParams.get('provider') ?? ''];
  if (!provider) return json(400, { error: 'unknown_provider' });
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX_BYTES + 64 * 1024) return json(413, { error: 'too_large' });
  const client = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  let file: File;
  try {
    const form = await req.formData();
    const m = (form as unknown as { get(name: string): File | string | null }).get('media');
    if (!m || typeof m === 'string') return json(400, { error: 'no_media' });
    file = m as File;
  } catch {
    return json(400, { error: 'bad_form' });
  }
  if (file.size > MAX_BYTES) return json(413, { error: 'too_large' });
  if (!IMAGE_TYPES.includes(file.type)) return json(415, { error: 'images_only' });
  if (!allow(client, env)) return json(429, { error: 'daily_limit' });
  if (!(await allowMonth(env))) return json(429, { error: 'monthly_limit' });
  try {
    return json(200, await provider(file, env, f));
  } catch (e) {
    const status = e instanceof RelayError ? e.status : 502;
    return json(status, { error: e instanceof Error ? e.message : 'provider_failed' });
  }
}

export default { fetch: (req: Request, env: Env) => handle(req, env) };
