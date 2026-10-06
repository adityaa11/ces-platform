# Review: PCC-005 / PCC-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-005-production-project-library-and-create-ui.md` / `PCC-BATCH-05`
- Reviewed commit: `6baef44150f8d7a905a950bb7d058d9b62352a7c` (`f3b67f15a4f6d978d738657fb1efcf5ff476ab06` implementation checkpoint)
- Frozen ticket baseline: PCC-005 baseline `SRC-PCC-02`, `SRC-PCC-05`, `SRC-PCC-06`, and `SRC-PCC-07`; ticket state `awaiting_review`
- Review round: 1
- Maximum review rounds: 3
- Prior review: None for PCC-005 / PCC-BATCH-05
- Remediation commit: None
- Result: `BLOCKED`

## Evidence

- Target resolution: `HEAD` is `6baef44150f8d7a905a950bb7d058d9b62352a7c`; the ticket records `f3b67f1` as the implementation checkpoint and the current HEAD records the checkpoint evidence/state. No in-scope implementation changes were present in the worktree; existing untracked files are prior review/context artifacts.
- Dependency state: PCC-003 and PCC-004 are accepted dependencies; the prior PCC-004 PASS artifact is `project's goal/feedback/PCC-BATCH-04-1cd1631-review.md`.
- `docker compose build --quiet atlas`: passed.
- `docker compose up -d --no-deps atlas`: passed; the Atlas service was running from the rebuilt image.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app test`: passed, 26 tests passed, 1 intentional worker-runtime test skipped, 0 failed. This included the PCC-005 helper tests, production `/home` rendering, fixture `/demo` rendering, CSP, and integration coverage already present in the app suite.
- Targeted lint for `components/ProductionProjectLibrary.tsx`, `components/production-project-create.ts`, and `tests/production-project-create.test.mjs`: passed.
- Full app lint: failed only on three recorded out-of-scope errors in `components/RuntimeFixtureRoute.tsx` and `vite.config.ts`; no PCC-005 file was reported.
- `git diff --check 1cd16313390b8990f3425ab9d408ccfd3cdfa0ef..HEAD`: passed.
- Static boundary review confirmed the production component/helper does not import fixture creation, call `/api/local-fixtures`, encode PDF bytes as base64, or access storage/database paths. `/demo` continues to use its fixture-owned path.
- Browser review covered the normal desktop viewport in dark and light themes for `/home` and `/demo`, the empty state, production and fixture dialogs, validation errors, visible keyboard focus, and the established reference hierarchy. Direct narrow desktop/tablet/mobile/200% visual inspection was not available because the current computer-use browser surface exposed no viewport override. Loading/success/request-error visual states were not submitted because the next UI action would upload a local file and create a project; CK was not authorized to transmit a file through the browser.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | `TRUST-PCC-005-02` and `ASSET-PCC-005-01` (EXPLICIT); the client must reconcile only an accepted server response and must not expose internal response errors. | `apps/atlas/components/production-project-create.ts:36-41`; `apps/atlas/components/ProductionProjectLibrary.tsx:30-31` | Successful JSON is only TypeScript-cast, not runtime-validated. A malformed 2xx body can still close/reset the dialog, refresh, and render `undefined was created`. Non-2xx `body.error` is copied verbatim into client markup instead of being mapped to bounded safe messages. | Validate the accepted success shape before returning it, map status/field errors through a bounded client-safe matrix, and add tests for malformed success and unsafe/unknown error bodies. Only close/reset/reconcile after a valid project response. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | Submission helper scope and `REV-READY-PCC-005-01` (EXPLICIT); production submission must have one bounded in-flight request and duplicate submissions must be prevented. | `apps/atlas/components/ProductionProjectLibrary.tsx:26-31`; `apps/atlas/components/production-project-create.ts:29-41` | The component disables the visible button after setting state, but the submit handler has no loading guard and the helper has no in-flight/coalescing mechanism. A second submit event can enter before or independently of the disabled control and issue another POST. | Add an explicit one-in-flight guard/ref or helper-level coalescing/cancellation seam, preserve retryability after failure, and test concurrent/double submit behavior. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-005 scope/acceptance requiring bounded errors to map to the relevant fields or a form alert (EXPLICIT). | `apps/atlas/components/ProductionProjectLibrary.tsx:31`; `apps/atlas/project-creation-boundary.ts:95-99` | Every request failure is assigned to `errors.prdFiles`. For example, the server's bounded 409 `That project ID is already in use.` is announced under the PRD file field rather than the project ID field or a form-level error. | Preserve bounded server errors while returning field/form error metadata and render the message against the relevant field or an explicit form alert; cover 400/409/413/415/500 mappings. |
| CK-004 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-005 Validation and `REV-READY-PCC-005-01` / `REV-READY-PCC-005-02` (EXPLICIT); required helper/component, render, and `/demo` regression tests must be added. | `apps/atlas/tests/production-project-create.test.mjs:9-21` | The new test file contains only two helper tests: one partial validation case and one happy-path multipart request. It does not test one-in-flight behavior, safe response mapping, success reconciliation, retryable failures, file count/type/size branches, no-base64 transport, production render assertions, or the requested `/demo` regression assertions. | Add the ticket-required helper/component/render/regression coverage and run it in Compose, including failure/retry and production-vs-fixture authority assertions. |
| CK-005 | KNOWLEDGE_GAP | INITIAL_REVIEW | OPEN | PCC-005 Validation and `REV-READY-PCC-005-03` (EXPLICIT); visual inspection is required for narrow desktop/tablet, mobile, 200%/equivalent reflow, loading, success, and request-error states. | Browser validation evidence and affected `/home` dialog/card surfaces | Normal desktop, both themes, empty, validation, and focus states were inspected. The available browser binding had no viewport override for direct narrow/mobile/200% inspection. Loading/success/request-error states could not be exercised without uploading a local file and causing a project-creation side effect; that action was not authorized by the `ck` request. | Provide the required direct visual evidence using a viewport-capable review surface and an authorized safe test fixture or equivalent non-mutating harness, then re-review the affected frontend gate states. |

## Advisory observations

- The PCC-005 production card and shell separation are consistent with the accepted PCC-004 model, and the normal desktop/light/dark presentation follows the established Entity Library hierarchy and semantic token system.
- The three full-lint errors are pre-existing/out of scope and were not used as PCC-005 findings.

## Decision

The checkpoint cannot advance to PASS. CK found four implementation-repairable findings and one mandatory frontend-evidence blocker. The Compose build/test evidence is healthy, but the response boundary, duplicate-submit seam, relevant error mapping, required test coverage, and required responsive/state evidence must be addressed before a subsequent CK round can establish acceptance.
