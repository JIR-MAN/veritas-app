# Weekly acceptance sheet: week of 11 November 2026

**What works**
- Check a file with real Content Credentials validation on the device (signature, tampering, trusted signer, declared origin).
- Save a file as evidence: SHA-256 fingerprint, time and time zone, source link, private copy.
- Cases with a timeline of your notes (approximate times are marked) and VERITAS's own records.
- PDF report and JSON data export, created on the device.
- Delete a record, a case, or everything. Light and dark mode. Phone and tablet layouts.

**What changed**
- First build, milestone 1 (Check → Protect → Export).
- New AI checks: AI labels in file details, Adobe TrustMark invisible watermark (on device, one-time reader download), Google SynthID via Google's own page, reverse image search, and an advanced "error levels" view.
- Paid AI detectors (Reality Defender, Hive, Sightengine) are built but switched off until you approve an account and budget.

**What fails or isn't tested yet**
- Not yet run on a physical iPhone or Android device. Every test so far ran in a browser (Chromium) at phone and tablet sizes. The on-device WebView engine and the PDF share sheet still need a real-device check.
- Picking from the Photos app can give a re-saved copy that has lost its credentials. The Files picker keeps the original.
- Act (reporting guidance), Law and Learn come in milestones 2 and 3.

**What needs owner approval**
- Any paid AI detector: which one, the account sign-up, and a monthly budget cap (see INTEGRATIONS.md for prices).
- An Expo account token for automated Android test builds (free), see BETA_SETUP.md.
- Apple Developer Program (US$99/year) before an iPhone/iPad TestFlight build is possible.

**Beta link**
- Not available yet. It will be added once the first EAS build has run.

## Test results (11 Nov 2026)

| Suite | Result |
|---|---|
| Unit tests (Jest, incl. detection relay) | 50 / 50 passed |
| Engine regression (real c2pa-rs, 14 fixtures) | 14 / 14 passed |
| Full journey (web build) | 14 / 14 steps passed |
| TrustMark reader (real Adobe models and samples) | Runs on GitHub: see the "TrustMark reader" workflow |
| Typecheck, lint | clean |
| Screenshots | 6 sizes × light/dark × 8 screens, reviewed |
