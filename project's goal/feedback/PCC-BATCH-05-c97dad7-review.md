# Review: PCC-005 / PCC-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-005-production-project-library-and-create-ui.md` / `PCC-BATCH-05`
- Reviewed commit: `c97dad7e168fc6d9df674a17e80f99670c2c94bb` (`test(atlas): remediate PCC-005 CK-004 coverage`)
- Frozen ticket baseline: PCC-005 baseline `SRC-PCC-02`, `SRC-PCC-05`, `SRC-PCC-06`, and `SRC-PCC-07`, as established by session 2 Round 1 at `f3b67f15a4f6d978d738657fb1efcf5ff476ab06`; no scope/acceptance change
- Review session: 2
- Review round: 3
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-05-e85f00f-review.md` (`CHANGES_REQUIRED`, Round 2)
- Remediation commit: `c97dad7e168fc6d9df674a17e80f99670c2c94bb`
- Result: `REVIEW_CONVERGENCE_BLOCKED`
- Convergence: `IMPROVING`

## Evidence

### Target, scope, and dependencies

- `git rev-parse HEAD`: `c97dad7e168fc6d9df674a17e80f99670c2c94bb`; `HEAD` matches the committed CK-004 follow-up and the ticket remains `awaiting_review`.
- `git status --short --untracked-files=no`: no tracked changes. `git status --short` lists only pre-existing untracked CK/review/context documents; no in-scope implementation edits are present.
- `git diff e85f00f..HEAD --stat`: the remediation is limited to browser/helper regression coverage, pinned test tooling, ignore entries, the ticket's evidence appendix, and retained screenshots. No production component or dependency authority implementation changed.
- PCC-003 and PCC-004 remain accepted dependencies; PCC-004's accepted PASS artifact is `project's goal/feedback/PCC-BATCH-04-1cd1631-review.md`. Their authority boundaries were not reopened.
- Applied CK Round 3's bounded review to CK-004, the remediation delta, affected PCC-005 validation/visual acceptance, `REV-READY-PCC-005-01/02/03`, the mandatory security-readiness extension, frontend VIS-001–015, and the applicable Atlas UI/UX review protocol.
- `git diff --check e85f00f..HEAD`: passed.

### Compose validation

The Docker daemon was initially unavailable to the sandbox. With approved Docker access, the required services were started and the validation image was rebuilt once. Browser dependencies were installed in the recreated Atlas container as required by the checkpoint instructions. All following validation commands ran in Compose.

| Exact command | Result |
|---|---|
| `docker compose up -d` | Passed; PostgreSQL, Atlas, agents-bridge, and agents-bridge-worker started. |
| `docker compose build --quiet atlas` | Passed. |
| `docker compose up -d --no-build --wait atlas` | Passed; Atlas and PostgreSQL healthy. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright install --with-deps chromium` | Passed; Chromium 145 / Playwright 1.58.2 installed in the recreated container. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` | **9 passed, 0 failed, 0 skipped** (35.9s); covers eight production theme/viewport flows and one fixture authority/regression flow. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/production-project-create.test.mjs` | **12 passed, 0 failed, 0 skipped**. Includes same-submitter retry for eight failure classes, concurrent-submit coalescing, bounded response mapping, and multipart/file assertions. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` | Build passed; **37 total, 36 passed, 0 failed, 1 intentional worker-runtime skip**. Includes rendered HTML/CSP, authentication, PCC-003/004 integration, PCC-005 helpers, and demo scenario checks. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec eslint playwright.config.mjs tests/browser/production-project-create.spec.mjs tests/production-project-create.test.mjs` | Passed. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app lint` | Failed on the same three out-of-scope errors: `components/RuntimeFixtureRoute.tsx:18` and `vite.config.ts:54,99`. No PCC-005 remediation file was reported. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec tsc --noEmit --incremental false` | Failed in unchanged demo, SourcesWorkspace, WorkspaceSwitcherPreview, auth-server, project-creation-boundary, Vite/worker, and atlas-fixtures files. No new remediation file was implicated; no full type-check PASS is claimed. |
| `docker compose ps --format 'table {{.Service}}\t{{.Status}}'` | Atlas, PostgreSQL, agents-bridge, and agents-bridge-worker healthy. |

### CK-004 verification and frontend review

- The former source-regex render claim is gone. The committed Playwright suite drives the hydrated production and fixture components. All nine browser cases passed in Compose.
- Production browser flows cover loading/disabled controls, duplicate protection, bounded field/form errors, retained inputs, retry on the same dialog, malformed-success rejection without reconciliation, and successful API creation followed by server-authorized waiting-card refresh/reload. The fixture flow covers create/process notice/dismissal, sharing, invite/role/removal, scenario hydration, and absence of production requests.
- The browser suite rendered light/dark at 1440×1000, 900×1000, 390×844, and 640×720 (200%-equivalent reflow). The committed evidence record reports no horizontal page/dialog overflow. I inspected the retained success-state capture `project's goal/Backend_Phase/tickets/Project_Cards_Phase/evidence/PCC-005-CK-004/waiting-card-dark-desktop.png` directly.
- That capture shows the production Master label's description wrapping one or two words per line in a very narrow first column while most of the card width remains unused. The shared `.repository-master-state` grid reserves a `2rem` first column for an icon, but `ProductionProjectCard.tsx` places only its text `div` in that grid. The text is present, yet this produces an excessively tall, poorly proportioned card at desktop width. The browser suite checks the text and overflow but has no composition assertion, so it passes despite the visible failure.
- This is within PCC-005's explicit card/visual contract and the mandatory VIS-006 wrapping/readability gate. The production card state is part of the ticket's acceptance, so the finding does not change PCC-004's data authority or view-model responsibility.
- `REV-READY-PCC-005-01/02` are satisfied by current helper and browser evidence: production submission remains a bounded retryable FormData seam, and `/home`/`/demo` keep distinct mutation and data authorities. `REV-READY-PCC-005-03` remains blocked by CK-005 below. No security boundary regression was found.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | EXPLICIT: `TRUST-PCC-005-02`, `ASSET-PCC-005-01`; accepted success response and bounded client-safe errors. | `apps/atlas/components/production-project-create.ts` | Round 2 verified runtime success-schema validation and bounded error mapping; current browser cases exercise malformed success and private error suppression without refresh/close. | Resolved in prior round; preserve. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | EXPLICIT: PCC-005 submission-helper scope and `REV-READY-PCC-005-01`; one in-flight request with retry after failure. | `apps/atlas/components/production-project-create.ts`; `apps/atlas/components/ProductionProjectLibrary.tsx` | Current focused suite passes concurrent-call coalescing and eight same-submitter failure-then-success cases; browser double-submit/loading flow passes. | Resolved in prior round; preserve. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | EXPLICIT: PCC-005 acceptance requires bounded failures to map to relevant fields or a form alert. | `apps/atlas/components/production-project-create.ts`; `apps/atlas/components/ProductionProjectLibrary.tsx` | Current helper and browser checks pass 409 project-ID, 413/415 file, and generic form error assertions; unsafe server detail is absent from markup. | Resolved in prior round; preserve. |
| CK-004 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | RESOLVED | EXPLICIT: PCC-005 Validation and `REV-READY-PCC-005-01/02/03`; executable helper/component/reconciliation/fixture coverage and rendered state inspection. | `apps/atlas/tests/production-project-create.test.mjs`; `apps/atlas/tests/browser/production-project-create.spec.mjs` | The current Compose browser suite passes 9/9, helper suite 12/12, and app suite 36 passed/1 intentional skip. The actual component transitions and production success reconciliation are exercised; fixture create/share regressions are exercised. Rendered-state evidence is recorded and inspected. | Resolved: required missing executable coverage and rendered inspection now exist. |
| CK-005 | IMPLEMENTATION_DEFECT | LATE_DISCOVERY | OPEN | EXPLICIT: PCC-005 Frontend visual and interaction contract / acceptance requires a readable production Project Card; mandatory frontend gate VIS-006 requires readable wrapping without accidental composition failure. | `apps/atlas/components/ProductionProjectCard.tsx:16`; `apps/atlas/app/globals.css:387`; `evidence/PCC-005-CK-004/waiting-card-dark-desktop.png` | The production Master-state child occupies the grid's text column only; with no leading icon in the first reserved column, `No published work` and the supporting Master copy break word-by-word into a narrow strip. The desktop screenshot shows the resulting oversized card despite ample available width. This existed before the remediation and was discovered by the newly supplied success-state render. | Render the Master label and supporting copy across a normal readable measure at desktop and representative narrow widths, with the production card's visual hierarchy and spacing intact; add a composition assertion so the layout failure cannot pass on text-presence/overflow checks alone. |

## Advisory observations

- The fixture browser test intentionally mocks only fixture persistence transport; component behavior and `createFixtureProject` run, matching the committed validation note. It does not claim a separate fixture persistence integration test.
- The committed CFC evidence is explicit that the capture exposes this layout defect; CK independently confirmed it by inspecting the retained image.
- Full lint and TypeScript failures remain recorded as existing, unrelated diagnostics. Focused lint, app build/tests, and browser/helper checks passed.

## Decision

CK-004 is resolved: the missing helper/component/reconciliation/fixture regression coverage and visual-state inspection are now present and passed in Compose. The new rendered evidence also exposes a distinct production Project Card layout defect against PCC-005's explicit visual contract and mandatory VIS-006 gate. Record it as late discovery CK-005; it predates this remediation and was not caused by it.

The remediation materially closed CK-004, so convergence is `IMPROVING`. However, Round 3 is the final ordinary review round and CK-005 remains blocking. The required result is `REVIEW_CONVERGENCE_BLOCKED`; no automatic CFC is authorized. Return review-session authority to human/planning review. A new CK session requires explicit human authorization or a new approved baseline; PCC-005 does not receive PASS and PCC-006 must not advance.
