# Architecture decisions

1. **Expo + React Native, not a web wrapper.** The native file picker, file system, SQLite, print and share sheet are all used directly. The only web technology is the hidden credentials engine.
2. **C2PA runs in a WebView.** The maintained CAI library for JavaScript is a WebAssembly build of c2pa-rs (`c2pa-web`). Hermes has no WebAssembly, so the engine runs in a hidden WebView with JavaScript only, no file access and a CSP with no network. **Trust boundary:** the app sends bytes in and gets JSON out, and the engine can't reach the network or the file system. An alternative for later is a native binding (c2pa-ios / c2pa-android), which would avoid the base64 transfer cost.
3. **No remote fetches during checks.** Remote manifests and OCSP are disabled so that no third party learns which file is being checked. Results say when credentials are stored online.
4. **One classifier owns the wording.** `classify.ts` is the only place that turns engine output into user-facing claims. It is tested against real engine output.
5. **Local-first storage.** No backend in milestone 1. Cases are JSON in SQLite KV storage, and files are copied into the sandbox.
6. **Tests use real artifacts.** Fixtures come from c2pa-rs, or are generated and signed with its public test certificate (`scripts/make-fixtures.mjs`). Engine output is captured from the real library (`scripts/capture-reports.cjs`).
7. **Every extra check is opt-in or on device.** Metadata and error levels run in the same engine page. TrustMark runs in a second hidden page (ONNX models in WebAssembly), loaded only when the user opens it. Web services (reverse search, SynthID, paid detectors) only run after the user confirms, and paid detectors go through a relay so API keys are never in the app.
