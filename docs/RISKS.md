# Risks and limitations

| # | Risk | Severity | Mitigation / status |
|---|---|---|---|
| 1 | The engine in the WebView hasn't been verified on physical iOS/Android devices | High | Needs a development build test on one iPhone and one Android phone before beta. |
| 2 | Large files (over 200 MB) can't be checked on the device | Medium | Clear "too large" result. The file can still be fingerprinted. |
| 3 | The Photos picker may hand over re-encoded copies without credentials | Medium | Use the Files picker. Add a hint to the UI. |
| 4 | Trust lists go stale | Medium | Shown with their date on every result. Refresh at each release. |
| 5 | Evidence copies are protected by OS sandboxing but not separately encrypted | Medium | Needs a security review before real victim evidence. Planned: encryption at rest. |
| 6 | Users read "unrecognised signer" as "fake" | Medium | Careful wording, with limitations shown on every result. Needs user testing. |
| 7 | Bundled samples use a public test certificate | Low | Labelled as samples, with an honest "unrecognised signer" result. |
| 8 | Web demo storage is per-browser and files are lost on reload | Low | Explained in the app. Web is secondary. |
| 9 | People read "no watermark" or "no AI label" as "real" | High | Every such result says it says nothing about whether the file is real. |
| 10 | File details (metadata) can be faked or removed by anyone | Medium | Shown as "a strong clue, not proof". Never overrides a Content Credentials result. |
| 11 | TrustMark reader files are downloaded from Adobe and could change | Medium | Downloaded only on request, over HTTPS. SHA-256 fingerprints are pinned (`MODEL_SHA256`); a changed file is rejected. The download is about 95 MB, shown before the user agrees. |
| 12 | Paid detectors are wrong in both directions and need an upload | High | Off by default. Results are labelled as the provider's opinion, with bands, not verdicts. Consent before each upload. Not to be switched on before an independent evaluation. |
| 13 | The detection relay is a public endpoint that spends paid credits | Medium | Daily caps (total and per client), image-only, 20 MB limit, no storage or logging of content. Add platform rate limiting when hosted. |
| 14 | Detection relay code is unverified against the live services | Medium | Unit-tested with mocked answers only. Verify with a real key before switching on. |

**Never claimed:** detection accuracy, proof that content is genuine, legal admissibility, chain of custody, or store availability.
