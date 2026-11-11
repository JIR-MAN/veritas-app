# VERITAS (beta)

VERITAS is an app for iPhone, iPad and Android that helps people deal with suspicious media, impersonation, scams and online abuse. It works in four steps: **Check**, **Protect**, **Act** and **Learn**. *VERITAS is a working name until it has been cleared for use.*

> **Status:** milestone 1 of the beta, not yet released. See [docs/STATUS.md](docs/STATUS.md) for what works today.

## What works now (milestone 1)

| | |
|---|---|
| **Check** | Reads Content Credentials (C2PA) **on the device** using the official CAI library. It shows each check separately: the signature, whether the file changed after signing, whether the signer is recognised, and the declared origin. AI watermark and AI detector checks always show as *not checked*, because none is connected. |
| **Protect** | Saves a file as evidence. This calculates its SHA-256 fingerprint on the device, records the time and time zone and the link you found it at, and keeps a private copy. Cases hold your timeline notes, with approximate times marked as such. |
| **Export** | Creates a PDF report and a JSON data file on the device. VERITAS never sends them anywhere. |
| **Demo path** | Four bundled sample files, so reviewers can try a real check without using personal files. |

## Developer quick start

```bash
npm install          # also builds the on-device engine (assets/engine/)
npx expo start       # dev server (the engine needs a development build, not Expo Go)
npm test             # unit tests
npm run lint && npm run typecheck
node e2e/engine.e2e.cjs      # real C2PA engine against fixtures (Chromium)
npm run test:journey         # full Check → Protect → Export journey on the web build
npm run screenshots          # phone and tablet screenshots in artifacts/screens
```

## How it is built

- **App:** Expo SDK 58 / React Native 0.88 / TypeScript / Expo Router (`src/app`).
- **Phones and tablets:** phones get bottom tabs. Tablets get a navigation rail in portrait and a sidebar in landscape, with list-and-detail views (`src/components/AdaptiveTabBar.tsx`, `src/app/(tabs)/cases.tsx`).
- **Credentials engine** (`engine/engine.ts`): `@contentauth/c2pa-web` (c2pa-rs compiled to WebAssembly) runs in a hidden WebView on native and in an iframe on web. Files are streamed in as bytes. Remote manifests and OCSP are not fetched, and the CSP blocks network access. The trust lists are bundled in `assets/trust/` (see `SOURCES.json`).
- **Result wording** (`src/features/check/classify.ts`): one pure function that turns the engine output into what users see. It is tested against real c2pa-rs output (`fixtures/reports`).
- **Storage:** SQLite key-value storage in the app sandbox, plus private file copies in the app's documents folder. There are no accounts, no cloud storage and no analytics.

More detail: [Architecture and decisions](docs/ARCHITECTURE.md) · [Screens](docs/SCREENS.md) · [Integrations register](docs/INTEGRATIONS.md) · [Risks and limitations](docs/RISKS.md) · [Beta setup](docs/BETA_SETUP.md)
