# Screen inventory (milestone 1)

| Screen | Route | Phone | Tablet |
|---|---|---|---|
| Home | `/` | Single column, one primary action | Same, with the navigation rail or sidebar |
| Check | `/check` | Choose file, list of checks, samples | Two columns (checks / samples) on wide screens |
| Result | `/check/[id]` | Verdict, checks, details, limitations, sticky "Save as evidence" | Two panes: verdict + file + save / checks + details |
| Cases | `/cases` | List | Master/detail split |
| Case | `/case/[id]` | Evidence, timeline, report, delete | Shown in the detail pane |
| New case | `/case/new` (modal) | Name + what happened | Same |
| Add to timeline | `/case/[id]/note` (modal) | Text, date, time, approximate | Same |
| Evidence record | `/evidence/[id]` | Fingerprint, result, source, file actions | Two panes |
| Settings | `/settings` | Appearance, privacy, delete all, versions | Same |
| How checks work | `/about/checks` | | |
| Privacy | `/about/privacy` | | |

States covered: engine loading, engine unavailable, check running, every result type, empty cases, missing record, export unavailable.
Screenshots are in `artifacts/screens` (CI artifact, or run `npm run screenshots`).
