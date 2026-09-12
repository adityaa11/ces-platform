# SFE-001 validation evidence

- **Ticket / batch:** SFE-001 / BATCH-26
- **Implementation state:** awaiting review
- **Run date:** 13 September 2026

## Submitted fixture

The user created `safara-project-01` through the project modal with `Safara Initial Draft` and the description `Safara Initial Draft Extraction testing`.

| Check | Observed result |
|---|---|
| Initial Draft identity | `saf-a2b3c4d5e6f7`, shared by the Initial Draft record and its project-scoped processing job |
| Master | Generated as `master`, empty, with no published work |
| Initial Draft | Generated as `Initial Draft`, `extracting`, unavailable, with zero processed PRDs |
| Source PDF | `docs/PRD/safara-project-01/saf-a2b3c4d5e6f7/Safara_Incremental_PRD_01_Foundation_Enrollment-1.pdf` |
| Stored hash | `75a6bf6c7411c909f9a94dd763cfb540656717c5ecac789dad57e7de4e6740bc`; independently matched against the stored PDF bytes |
| Registry safety | The local fixture record has source metadata and hash only; it does not retain browser-upload Base64 bytes |

## Failure-path checks

- A second POST for `safara-project-01` was rejected with `That project ID is already in use.`
- An unsafe filename `../unsafe.pdf` was rejected with `Invalid PDF file.` The attempted `docs/PRD/sfe-unsafe-path/sfe-a2b3c4d5e6f7` directory did not remain.
- The modal reports all three required-field messages before it makes a request.
- Fixture contracts verify workspace-ID collision retry and the bounded-retry failure state.

## Rendered UI checks

- Reloading `/demo` displays the persisted `Safara Initial Draft` Extracting card with its submitted description, one uploaded PRD, empty Master, zero-percent Initial Draft, and `Waiting for extraction` state.
- Desktop, 768px tablet, and 390px mobile snapshots retained the card labels, progress semantics, and disabled open action. The narrow widths expose the navigation menu instead of the desktop sidebar.
- The Create a project dialog is named, its fields have visible labels and constraints, focus moves to Close dialog on keyboard entry, and the Close dialog button works with Enter.
- The processing notice uses the application surface, border, ink, muted, and forest tokens, so it remains legible with the rest of the component palette.

## Automated checks

`node --test packages/atlas-fixtures/tests/contracts.test.mjs` passed 16 of 16 tests. A direct TypeScript check still reports pre-existing unrelated errors in the app and fixture baseline (for example Ces item row links, pdf.js task typing, Cloudflare globals, and TypeScript-extension import settings); none name the SFE-001 implementation files.
