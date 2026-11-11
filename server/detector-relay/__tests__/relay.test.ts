/**
 * @jest-environment node
 */
import { handle, resetCounters } from '../relay';

const env = { SIGHTENGINE_API_USER: 'u', SIGHTENGINE_API_SECRET: 's', HIVE_API_KEY: 'k', DAILY_CAP: '100', PER_CLIENT_DAILY: '3', ALLOWED_ORIGINS: 'https://jir-man.github.io' };

function request(provider: string, opts: { type?: string; origin?: string; ip?: string } = {}) {
  const form = new FormData();
  form.append('media', new File([new Uint8Array([0xff, 0xd8, 0xff])], 'a.jpg', { type: opts.type ?? 'image/jpeg' }));
  const headers: Record<string, string> = { 'x-forwarded-for': opts.ip ?? '1.1.1.1' };
  if (opts.origin) headers.origin = opts.origin;
  return new Request(`https://relay.test/v1/detect?provider=${provider}`, { method: 'POST', body: form, headers });
}
const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => resetCounters());

test('sightengine score is passed through, keys stay on the server', async () => {
  const f = jest.fn((_url: string, init: RequestInit) => {
    expect((init.body as FormData).get('models')).toBe('genai');
    return reply({ status: 'success', type: { ai_generated: 0.97 } });
  });
  const r = await handle(request('sightengine'), env, f as unknown as typeof fetch);
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({ score: 0.97, model: 'sightengine genai' });
  expect(f.mock.calls[0][0]).toBe('https://api.sightengine.com/1.0/check.json');
});

test('hive ai_generated class is used', async () => {
  const f = jest.fn(() => reply({ status: [{ response: { output: [{ classes: [{ class: 'not_ai_generated', score: 0.9 }, { class: 'ai_generated', score: 0.1 }] }] } }] }));
  const r = await handle(request('hive'), env, f as unknown as typeof fetch);
  expect(await r.json()).toEqual({ score: 0.1, model: 'hive ai-generated' });
});

test('unusable provider answers are errors, never a made-up score', async () => {
  const f = jest.fn(() => reply({ status: 'failure' }));
  const r = await handle(request('sightengine'), env, f as unknown as typeof fetch);
  expect(r.status).toBe(502);
  expect((await r.json()).score).toBeUndefined();
});

test('unconfigured provider reports 503', async () => {
  const r = await handle(request('reality_defender'), env, jest.fn() as unknown as typeof fetch);
  expect(r.status).toBe(503);
});

test('rejects unknown providers, non-images and other origins', async () => {
  const f = jest.fn() as unknown as typeof fetch;
  expect((await handle(request('nope'), env, f)).status).toBe(400);
  expect((await handle(request('hive', { type: 'video/mp4' }), env, f)).status).toBe(415);
  expect((await handle(request('hive', { origin: 'https://evil.example' }), env, f)).status).toBe(403);
  expect(f).not.toHaveBeenCalled();
});

test('per-client daily limit', async () => {
  const f = jest.fn(() => reply({ status: 'success', type: { ai_generated: 0.5 } })) as unknown as typeof fetch;
  for (let i = 0; i < 3; i++) expect((await handle(request('sightengine', { ip: '9.9.9.9' }), env, f)).status).toBe(200);
  expect((await handle(request('sightengine', { ip: '9.9.9.9' }), env, f)).status).toBe(429);
  expect((await handle(request('sightengine', { ip: '8.8.8.8' }), env, f)).status).toBe(200);
});

test('monthly cap stops requests once the free allowance is used', async () => {
  const store = new Map<string, string>();
  const kv = { get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: string) => void store.set(k, v) };
  const f = jest.fn(() => reply({ status: 'success', type: { ai_generated: 0.5 } })) as unknown as typeof fetch;
  const e = { ...env, MONTHLY_CAP: '2', PER_CLIENT_DAILY: '10', COUNTERS: kv };
  expect((await handle(request('sightengine', { ip: '1.0.0.1' }), e, f)).status).toBe(200);
  expect((await handle(request('sightengine', { ip: '1.0.0.2' }), e, f)).status).toBe(200);
  const r = await handle(request('sightengine', { ip: '1.0.0.3' }), e, f);
  expect(r.status).toBe(429);
  expect((await r.json()).error).toBe('monthly_limit');
});
