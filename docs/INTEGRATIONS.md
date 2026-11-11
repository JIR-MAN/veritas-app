# Integrations register

| Capability | Status | Provider | Notes |
|---|---|---|---|
| Content Credentials (C2PA) validation | **Real, on device** | `@contentauth/c2pa-web` 0.16.1 (c2pa-rs 0.91) | Runs in a WebView/iframe and is offline. Remote manifests are not fetched. |
| C2PA trust lists | **Real, bundled** | C2PA Conformance list, plus the CAI interim list (legacy) | Fetched 2026-11-11. Refresh at each release. |
| SHA-256 fingerprint | **Real, on device** | `expo-file-system` `File.digest` (native), WebCrypto (web) | |
| PDF export | **Real, on device** | `expo-print` + `expo-sharing` | Web uses the browser's print to PDF. |
| AI watermark detection | **Unavailable** | None | Shown as "not checked". Needs an authorised provider and owner approval. |
| AI forensic detector (image/video/audio) | **Unavailable** | None | Shown as "not checked". Needs independent evaluation, consent design and a budget cap. |
| Accounts / cloud sync | **Not built, by design** | None | Needs a security and privacy review first. |
| Crash reporting | **Not yet** | None | Planned (privacy-reviewed, no media in reports). |
