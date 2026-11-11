# Detection relay

A small server that holds the API keys for paid AI-detection services, so the keys are never inside the app. The app sends one image here only after the user confirms. The relay forwards it to the chosen provider and returns `{ "score": 0..1, "model": "..." }`. It stores nothing.

**Status: built and unit-tested with mocked answers. Not yet tried against the live services, because no accounts exist.** Verify each provider with a real key before switching it on.

## Settings (environment variables)

| Variable | Purpose |
|---|---|
| `REALITY_DEFENDER_API_KEY` | Reality Defender key |
| `HIVE_API_KEY` | Hive key |
| `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET` | Sightengine credentials |
| `ALLOWED_ORIGINS` | Web origins allowed to call, e.g. `https://jir-man.github.io` |
| `DAILY_CAP` | Total requests per day (default 100) |
| `PER_CLIENT_DAILY` | Requests per day per client (default 10) |

Never commit keys. Set them as secrets on the host.

## Run

- Locally: `PORT=8787 node server/detector-relay/node.mjs` (Node 22.18 or newer).
- Cloudflare Workers: `relay.ts` exports a default `{ fetch }` handler. Keys are set with `wrangler secret put`.

Then build the app with `EXPO_PUBLIC_DETECTOR_RELAY_URL=<relay URL>` and `EXPO_PUBLIC_DETECTORS=reality_defender` (comma-separated list of the switched-on providers).

## Endpoints

- `GET /health`
- `POST /v1/detect?provider=reality_defender|hive|sightengine` with a multipart `media` field (JPEG, PNG or WebP, up to 20 MB).
