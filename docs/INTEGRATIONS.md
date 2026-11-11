# Integrations register

| Capability | Status | Provider | Notes |
|---|---|---|---|
| Content Credentials (C2PA) validation | **Real, on device** | `@contentauth/c2pa-web` 0.16.1 (c2pa-rs 0.91) | Runs in a WebView/iframe and is offline. Remote manifests are not fetched. |
| C2PA trust lists | **Real, bundled** | C2PA Conformance list, plus the CAI interim list (legacy) | Fetched 2026-11-11. Refresh at each release. |
| SHA-256 fingerprint | **Real, on device** | `expo-file-system` `File.digest` (native), WebCrypto (web) | |
| PDF export | **Real, on device** | `expo-print` + `expo-sharing` | Web uses the browser's print to PDF. |
| AI labels in file details (EXIF, XMP, IPTC, PNG text) | **Real, on device** | `exifr` + own XMP/PNG readers | Finds IPTC "trained algorithmic media", generator names and image-generation settings. Location is reported only as present, never shown. |
| TrustMark invisible watermark | **Real, on device (opt-in download)** | Adobe TrustMark JS decoder (MIT) + `onnxruntime-web` 1.31.1 | Reader files come from Adobe's server once, when the user taps Download. The image never leaves the device. Tested on GitHub against Adobe's own samples (`.github/workflows/watermark.yml`). |
| Error level analysis | **Real, on device** | Own code (canvas) | Advanced visual aid with a warning. Never used for a verdict. |
| Reverse image search | **User-initiated links** | Google Lens, TinEye, Bing | Opens the service only after the user confirms. Uploads go straight from the user to that service. |
| Google SynthID | **Link to Google's portal** | synthid.com (Google) | Public portal since 7 Oct 2026. No public API (Cloud preview is for trusted testers), and its terms don't allow automated use, so the user checks there themselves. |
| Paid AI detectors | **Built, switched off** | Reality Defender, Hive, Sightengine via `server/detector-relay` | Keys live on the relay, never in the app. Request/response shapes follow public docs and are **not yet verified with a real key**. Needs owner approval, an account and a budget cap. See the table below. |

## Paid detection services (prices checked 11 Nov 2026)

| Service | Free allowance | Paid | Needs |
|---|---|---|---|
| Reality Defender | 50 image scans per month | Audio and video via sales | Account + API key |
| Hive | US$50 credit after adding a card | About US$6 per 1,000 images; 100 requests/day by default | Account, card, API key |
| Sightengine | 2,000 operations per month (500 per day); whether AI detection is in the free plan is unconfirmed | From US$29/month (10,000 ops), US$99, US$399 | Account + API key |
| Google SynthID API | Not offered publicly | n/a | Portal only for now |

To switch one on: host the relay (for example Cloudflare Workers, free tier), set its keys as secrets, then build the app with `EXPO_PUBLIC_DETECTOR_RELAY_URL` and `EXPO_PUBLIC_DETECTORS` (for example `reality_defender`). See `server/detector-relay/README.md`.
| Accounts / cloud sync | **Not built, by design** | None | Needs a security and privacy review first. |
| Crash reporting | **Not yet** | None | Planned (privacy-reviewed, no media in reports). |
