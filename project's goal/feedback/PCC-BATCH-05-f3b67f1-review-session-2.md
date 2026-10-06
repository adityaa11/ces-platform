# Review: PCC-005 / PCC-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-005-production-project-library-and-create-ui.md` / `PCC-BATCH-05`
- Reviewed commit: `f3b67f15a4f6d978d738657fb1efcf5ff476ab06`
- Frozen ticket baseline: PCC-005 baseline `SRC-PCC-02`, `SRC-PCC-05`, `SRC-PCC-06`, and `SRC-PCC-07`; current checkpoint state `awaiting_review`
- Review round: 1 of a new explicitly authorized session for the exact implementation commit
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-05-6baef44-review.md` (`BLOCKED`); the user explicitly requested a new review of `f3b67f1`
- Remediation commit: None
- Result: `CHANGES_REQUIRED`

## Evidence

- Target resolution: current `HEAD` is `6baef44150f8d7a905a950bb7d058d9b62352a7c`; `git diff --name-only f3b67f1..HEAD` contains only three ticket/checkpoint documentation files. The implementation files under `apps/atlas` are unchanged from `f3b67f1`, so this review targets the exact requested implementation commit.
- Dependency state: PCC-003 and PCC-004 are accepted dependencies; the prior PCC-004 PASS artifact is `project's goal/feedback/PCC-BATCH-04-1cd1631-review.md`.
- Required Compose services were restarted and reached healthy state with `docker compose up -d`.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app test`: passed, 26 tests passed, 1 intentional worker-runtime test skipped, 0 failed. The suite built the app and covered existing production `/home`, fixture `/demo`, CSP, PCC-003, PCC-004, and the two PCC-005 helper tests.
- Targeted lint for `components/ProductionProjectLibrary.tsx`, `components/production-project-create.ts`, and `tests/production-project-create.test.mjs`: passed.
- Full app lint: failed only on three unrelated errors in `components/RuntimeFixtureRoute.tsx` and `vite.config.ts`; no PCC-005 file was reported.
- `git diff --check f3b67f1..HEAD`: no whitespace errors.
- Static boundary review confirmed that production mode does not import fixture creation, call `/api/local-fixtures`, encode PDF bytes as base64, or access storage/database paths. `/demo` continues to use its fixture-owned path.
- Frontend review applied the established Entity Library pattern and VIS-001–015 gate. Existing desktop dark/light, empty, validation, keyboard-focus, and fixture-dialog evidence was carried forward because the implementation is unchanged. This rerun additionally used the browser viewport capability to inspect the production library/dialog at 390px mobile and the production library at 768px tablet; the layout remained readable with no horizontal overflow or clipped controls in the full-page captures. The prior BLOCKED classification's viewport-availability premise is therefore resolved.
- Live success/loading/request-error submission was not exercised because it would upload a local file and create a project through the browser; the current `ck` request did not authorize that external side effect. The required helper/component test and render coverage for those states remains an implementation evidence gap below.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | `TRUST-PCC-005-02` and `ASSET-PCC-005-01` (EXPLICIT); success must be based on an accepted server response and response errors must remain client-safe. | `apps/atlas/components/production-project-create.ts:36-41`; `apps/atlas/components/ProductionProjectLibrary.tsx:30-31` | The success body is only TypeScript-cast, not runtime-validated. A malformed 2xx body can close/reset the dialog, refresh, and render `undefined was created`. Non-2xx `body.error` is copied verbatim into client state/markup instead of being mapped through a bounded client-safe response contract. | Validate the success schema before returning it, map status/field errors to bounded messages, and add malformed-success/unknown-error tests. Only close/reset/reconcile after a valid project response. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | Submission-helper scope and `REV-READY-PCC-005-01` (EXPLICIT); production creation must have one bounded in-flight request and prevent duplicate submissions. | `apps/atlas/components/ProductionProjectLibrary.tsx:26-31`; `apps/atlas/components/production-project-create.ts:29-41` | The visible button becomes disabled after state updates, but the submit handler has no loading guard and the helper has no in-flight/coalescing mechanism. A second submit event can enter independently of the disabled control and issue another POST. | Add an explicit one-in-flight guard/ref or helper-level coalescing seam, keep retryability after failure, and test concurrent/double-submit behavior. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-005 acceptance requires bounded errors to map to relevant fields or a form alert (EXPLICIT). | `apps/atlas/components/ProductionProjectLibrary.tsx:31`; `apps/atlas/project-creation-boundary.ts:95-99` | Every request failure is assigned to `errors.prdFiles`. The bounded server 409 `That project ID is already in use.` is therefore announced under the PRD file field rather than the project ID field or a form-level error. | Return field/form error metadata from the helper and render 400/409/413/415/500 errors against the relevant field or explicit form alert. |
| CK-004 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-005 Validation and `REV-READY-PCC-005-01` / `REV-READY-PCC-005-02` (EXPLICIT); required helper/component, render, and `/demo` regression coverage must be added. | `apps/atlas/tests/production-project-create.test.mjs:9-21` | The added test file contains only two helper tests: one partial validation case and one happy-path multipart request. It does not cover one-in-flight behavior, safe response mapping, success reconciliation, retryable failures, file count/type/size branches, no-base64 transport, production render states, or the required `/demo` regression assertions. The live request-state visual states were consequently not independently evidenced. | Add the ticket-required helper/component/render/regression coverage, including loading, success, request error, retry, field mapping, authority separation, and fixture-preservation assertions, and run it in Compose. |

## Advisory observations

- The exact `f3b67f1` implementation is visually coherent at the inspected desktop, tablet, and mobile widths and preserves the established production/fixture presentation split.
- The three full-lint errors are pre-existing/out of scope and are not PCC-005 findings.
- The previous `BLOCKED` result should not be carried forward for viewport availability: the browser capability was available and the required responsive widths were inspected in this rerun.

## Decision

The exact `f3b67f1` checkpoint is not ready for PASS. The automated Compose evidence is healthy and the prior evidence blocker is resolved, but four implementation-repairable findings remain. This is `CHANGES_REQUIRED`, not `BLOCKED`; a committed remediation is required before the next CK round.
