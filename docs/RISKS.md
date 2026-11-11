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

**Never claimed:** detection accuracy, proof that content is genuine, legal admissibility, chain of custody, or store availability.
