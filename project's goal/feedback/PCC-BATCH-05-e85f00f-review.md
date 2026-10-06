# Review: PCC-005 / PCC-BATCH-05

- Ticket / batch: `PCC-005` / `PCC-BATCH-05`
- Reviewed commit: `e85f00f7ae8128ab36969279033f48892f09d081`
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-005-production-project-library-and-create-ui.md` as incorporated by session 2 Round 1 at `f3b67f15a4f6d978d738657fb1efcf5ff476ab06`; source anchors `SRC-PCC-02`, `SRC-PCC-05`, `SRC-PCC-06`, `SRC-PCC-07`. Subsequent ticket edits change state and append checkpoint evidence only; scope and acceptance are unchanged.
- Review session: 2
- Review round: 2
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-05-f3b67f1-review-session-2.md` (`CHANGES_REQUIRED`)
- Remediation commit: `779712f102efd1b9c78a0a65344296c305df2d69`
- Result: `CHANGES_REQUIRED`
- Convergence: `IMPROVING`

## Evidence

### Target and scope

- `git status --short` and `git status --short --untracked-files=no`: no tracked implementation edits; existing untracked review/context documents are not implementation evidence.
- `git rev-parse HEAD`: reviewed revision above. `git diff --name-only 779712f..HEAD`: only the PCC-005 ticket evidence appendix changed after remediation. The recorded remediation therefore identifies the implementation at reviewed HEAD unambiguously.
- `git diff f3b67f1..HEAD -- apps/atlas`: remediation changes only `ProductionProjectLibrary.tsx`, `production-project-create.ts`, and `production-project-create.test.mjs`.
- Ticket/README remain `awaiting_review`. Accepted PCC-003/PCC-004 dependencies are carried forward from Round 1; PCC-004 PASS is recorded in `PCC-BATCH-04-1cd1631-review.md`. Their boundaries are not reopened.
- Applied CK bounded Round 2 rules, engineering implementation review and its security-readiness extension, frontend VIS-001–015, and the applicable Atlas UI/UX Review Protocol. Review covers the four prior findings, remediation delta, affected acceptance criteria and regressions. No new deployment target or design direction is inferred.
- `git diff --check f3b67f1..HEAD`: passed.

### Compose validation

Initial sandboxed Docker access failed with access denied to Docker configuration/engine. The approved escalated invocation succeeded; no environment blocker remains.

| Exact command | Result |
|---|---|
| `docker compose up -d` | Required services running/healthy. |
| `node .agents/skills/ck/scripts/run-compose-checks.mjs --manifest $ckManifest --report "$env:TEMP/pcc005-ck-round2-checks-report.json" --tail-bytes 2500` | Runner: 3 passed, 0 failed. `$ckManifest` was the temporary `pcc005-ck-round2-checks.json`; expanded checks below. |
| `docker compose build --quiet atlas` | Passed, once through the runner. |
| `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/app exec node --test tests/production-project-create.test.mjs` | 5 passed, 0 failed, 0 skipped. |
| `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/app exec eslint components/ProductionProjectLibrary.tsx components/production-project-create.ts tests/production-project-create.test.mjs` | Passed. |
| `docker compose up -d --no-build --wait atlas` | Atlas and PostgreSQL healthy. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` | App build passed; 30 tests total, 29 passed, 0 failed, 1 intentional worker-runtime skip. Includes rendered HTML/CSP, authenticated creation/home integration, and existing demo scenario assertions. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app lint` | Failed with the same three previously recorded errors: `RuntimeFixtureRoute.tsx:18`, `vite.config.ts:54,99`. No remediation file reported. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec tsc --noEmit --incremental false` | Failed: diagnostics in unchanged demo, SourcesWorkspace, WorkspaceSwitcherPreview, auth-server, project-creation-boundary, Vite/worker and atlas-fixtures files. No remediation file reported. Full type-check PASS is not claimed; these diagnostics are outside the remediation delta. |
| `docker compose ps --format "table {{.Service}}\t{{.Status}}"` | Atlas, PostgreSQL, agents-bridge and worker all healthy. |

Additional non-persistent diagnostic: the following script was piped to `docker compose exec -T -w /workspace/apps/atlas atlas node --input-type=module`. All four failure/retry cases passed. This independently supports CK-002, but is not a substitute for the committed regression coverage required by CK-004.

```js
import assert from 'node:assert/strict';
import { createJiti } from 'jiti';
const jiti = createJiti('/workspace/apps/atlas/package.json');
const { createProductionProjectSubmitter } = await jiti.import('/workspace/apps/atlas/components/production-project-create.ts');
const input = { projectId: 'ck-probe', projectName: 'CK probe', projectDescription: '', files: [new File(['%PDF-1.7'], 'probe.pdf', { type: 'application/pdf' })] };
for (const firstFailure of ['network', 400, 500, 'invalid-json']) {
  let calls = 0;
  const submit = createProductionProjectSubmitter(async () => {
    calls++;
    if (calls === 1) {
      if (firstFailure === 'network') throw new Error('internal detail');
      return new Response(firstFailure === 'invalid-json' ? 'invalid' : '{}', { status: typeof firstFailure === 'number' ? firstFailure : 201 });
    }
    return Response.json({ project: { projectId: 'ck-probe', name: 'CK probe', documentCount: 1 } }, { status: 201 });
  });
  await assert.rejects(submit(input));
  assert.equal((await submit(input)).project.projectId, 'ck-probe');
  assert.equal(calls, 2);
}
console.log('PASS: same submitter retries after all 4 failure modes; mocked transport, no persistence.');
```

### Affected extension coverage

- `REV-READY-PCC-005-01`: success shape is checked before returning; non-2xx bodies are not copied into client errors. A stable per-component submitter coalesces pending calls and clears the promise in `finally`. Same-origin multipart and browser/server authority separation remain intact. Persistent component/reconciliation regression coverage remains incomplete under CK-004.
- `REV-READY-PCC-005-02`: call sites and fixture adapter are unchanged; production still has no fixture persistence or database/storage logic. Existing home waiting-card/isolation and demo scenario/render tests passed. Source-token assertions alone do not prove fixture creation/share interactions.
- `REV-READY-PCC-005-03`: remediation adds a form alert using existing `field-error` styling and `role="alert"`; existing field wiring and disabled/loading controls remain. No shared styles, shell, card layout or visual direction changed. Round 1 accepted visual evidence for unaffected states is carried forward. The new request-error alert and loading/success/retry transitions have no rendered visual evidence in the remediation checkpoint; none was independently rendered during this round. Browser inventory was available, with no open authenticated tab; this is not a claim that browser tooling is unavailable.
- VIS-001–007, VIS-010, VIS-012–014 have no visual-contract change in this delta. VIS-008/009/011/015 require the affected state/render verification still tracked by CK-004. A complete frontend PASS is not claimed from source inspection or passing helper tests.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | EXPLICIT: `TRUST-PCC-005-02`, `ASSET-PCC-005-01`; accepted response and bounded errors. | `apps/atlas/components/production-project-create.ts:28-53` | Runtime guard requires project ID/name and positive integer document count; malformed JSON/schema becomes a bounded form error; status mapping ignores raw server errors. Malformed-success and unknown-error assertions pass. | Met: only validated success reaches close/reset/refresh; unsafe server error text is not rendered. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | EXPLICIT: submission-helper scope and `REV-READY-PCC-005-01`; one in-flight request and retryability. | `apps/atlas/components/production-project-create.ts:56-61`; `apps/atlas/components/ProductionProjectLibrary.tsx:17,31` | Stable ref retains a coalescing submitter. Committed concurrent-call test confirms identical promise and one request. `finally` clears on both outcomes; independent Compose probe verifies retry on the same instance after four failure modes. | Met: concurrent calls issue one POST, and failure restores ability to submit. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | EXPLICIT: acceptance requires bounded failures at relevant fields or a form alert. | `apps/atlas/components/production-project-create.ts:28-35`; `apps/atlas/components/ProductionProjectLibrary.tsx:32,42-46` | 409 maps to project ID, 413/415 to PDFs, 400 and other failures to form-level copy. Component consumes structured errors and includes a form alert. Mapping assertions for 409/413/415/500 pass. | Met at implementation level; remaining rendered-state regression obligations are consolidated under CK-004. |
| CK-004 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | OPEN | EXPLICIT: PCC-005 Validation requires helper/component tests for retry and success reconciliation, production dialog/render assertions and affected visual states; `REV-READY-PCC-005-01/02/03`. Same requirement and identity as Round 1. | `apps/atlas/tests/production-project-create.test.mjs:34-45`; `apps/atlas/components/ProductionProjectLibrary.tsx:27-49` | The purported failure/retry test resolves its first request successfully, then creates a new submitter for another success. It cannot detect failure leaving the original instance stuck. The purported render test only reads TSX and matches regexes; it never mounts or renders the dialog. No committed test exercises loading/disabled controls, visible request errors, retained inputs/retry, close/reset and refresh on valid success, or preventing reconciliation on malformed success. Existing PCC-004 home integration verifies waiting cards, and demo render tests verify scenarios, but neither drives these production client transitions. The CFC checkpoint supplies no new visual inspection for affected request states. | Complete the existing finding: commit a failure-then-success regression on the same submitter; execute/render the actual component through loading, field/form errors, retry, valid and malformed success, asserting dialog/reset/refresh behavior and server-backed list reconciliation. Cover the required production button/dialog and fixture-preservation assertions using executable behavior/render coverage, reusing existing tests where sufficient. Inspect and record affected request states against the existing theme/responsive/accessibility contract, then run the relevant Compose checks. |

## Advisory observations

- Added validation branches, concurrent request coalescing, and safe response mapping materially improve the implementation. Three prior blockers are closed; no new finding or regression is established.
- Passing counts do not establish coverage absent from the test bodies. Test names and the CFC claim of rendered-alert coverage overstate the checks actually performed.
- Full lint and TypeScript checks are not green. Their reported locations are outside the three-file remediation; they are recorded without expanding this round into unrelated repairs.

## Decision

`CHANGES_REQUIRED`: CK-004 remains implementation-repairable within the frozen ticket. No planning or knowledge decision is needed. Convergence is `IMPROVING` because CK-001 through CK-003 are resolved and coverage has partially improved.

This is Round 2 of session 2. One ordinary CK round remains after committed remediation. The ticket is not accepted, and PCC-006 must not start from this checkpoint. No implementation or ticket baseline was modified by this review.
