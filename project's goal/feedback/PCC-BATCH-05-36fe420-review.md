# Review: PCC-005 / PCC-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-005-production-project-library-and-create-ui.md` / `PCC-BATCH-05`
- Reviewed commit: `36fe4209611272f717eb41fbd90d749865d918a3` (`fix(atlas): remediate PCC-005 CK-005 shared cards`)
- Frozen ticket baseline: PCC-005 baseline `SRC-PCC-02`, `SRC-PCC-05`, `SRC-PCC-06`, and `SRC-PCC-07`; scope and acceptance unchanged
- Review session: 3 (new session authorized by the committed CK-005 remediation checkpoint)
- Review round: 1
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-05-c97dad7-review.md` (`REVIEW_CONVERGENCE_BLOCKED`, prior session Round 3)
- Remediation commit: `36fe4209611272f717eb41fbd90d749865d918a3`
- Result: `CHANGES_REQUIRED`

## Evidence

### Target, scope, and dependencies

- `git rev-parse HEAD`: `36fe4209611272f717eb41fbd90d749865d918a3`; the ticket remains `awaiting_review`.
- `git status --short --untracked-files=no`: no tracked working-tree changes. Untracked PDFs in `docs/example/` and earlier context/review documents are outside the PCC-005 implementation boundary.
- The ticket's new CK-005 checkpoint records the human-authorized revision as `0ca18ff`. That commit is present in the object database; its implementation tree matches the reviewed `HEAD`. `git diff --name-status 0ca18ff..HEAD` contains only the PCC-005 evidence appendix, so the reviewed target includes the same implementation plus its checkpoint record.
- PCC-003 and PCC-004 remain accepted dependencies; PCC-004's PASS is recorded in `project's goal/feedback/PCC-BATCH-04-1cd1631-review.md`. No dependency authority or read-model responsibility is reopened.
- Round 1 review covered the full PCC-005-authorized production/fixture boundary, submission helper and response handling, view-model mapping, shared card presentation, grid sizing, current browser/render assertions, security-readiness bindings, frontend gate VIS-001–015, and the applicable Atlas UI/UX review protocol.
- `git diff --check c97dad7..HEAD`: passed.

### Compose validation

The services were healthy before validation. Atlas was rebuilt once for the reviewed checkout. The first browser invocation could not launch because the recreated container lacked the pinned Playwright binary; after installing the checkpoint's pinned browser runtime, the browser suite passed.

| Exact command | Result |
|---|---|
| `docker compose build --quiet atlas` | Passed. |
| `docker compose up -d --no-build --wait atlas` | Passed; Atlas and PostgreSQL healthy. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright install --with-deps chromium` | Passed; Chromium 145 / Playwright 1.58.2 installed in the current container. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` (first attempt) | Could not launch any of the 9 tests because Chromium was absent; no assertions executed. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` (after browser installation) | **9 passed, 0 failed, 0 skipped** (33.7s): eight production theme/viewport cases and one fixture creation/share/scenario regression. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/production-project-create.test.mjs` | **12 passed, 0 failed, 0 skipped**. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` | Build passed; **37 total, 36 passed, 0 failed, 1 intentional worker-runtime skip**. Includes rendered HTML/CSP, auth, PCC-003/004 integration, and PCC-005 helper coverage. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec eslint components/ProductionProjectCard.tsx components/ProductionProjectLibrary.tsx components/ProjectCard.tsx components/ProjectCardPresentation.tsx components/ProjectLibrary.tsx components/useProjectCardGrid.ts tests/browser/production-project-create.spec.mjs tests/project-home.integration.test.mjs tests/rendered-html.test.mjs` | Passed. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app lint` | Failed on the same three unrelated errors: `components/RuntimeFixtureRoute.tsx:18` and `vite.config.ts:54,99`. No changed PCC-005 file was reported. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec tsc --noEmit --incremental false` | Failed in unchanged demo, SourcesWorkspace, WorkspaceSwitcherPreview, auth-server, project-creation-boundary, Vite/worker, and atlas-fixtures files. No changed PCC-005 file was implicated; no full type-check PASS is claimed. |
| `docker compose ps --format 'table {{.Service}}\t{{.Status}}'` | Atlas, PostgreSQL, agents-bridge, and agents-bridge-worker healthy. |

### Implementation and frontend review

- The new `ProjectCardPresentation` restores the intended Master panel composition: its first grid column contains the icon, and the second contains the text. I inspected fresh Playwright success captures at dark desktop (1440px) and dark mobile (390px); both show the text using the available width without clipping or horizontal overflow. The prior CK-005 visual finding is resolved in this session.
- The shared card refactor preserves the fixture adapter's project identifiers, summary, status labels, progress, metrics, actions, routes, and share callback. The browser fixture regression passes creation, simulated processing, sharing, invite/role/removal, and scenario hydration. Production still makes no fixture requests, and its workspace action remains disabled.
- `useProjectCardGrid` centralizes the existing 304px minimum, 400px maximum, 16px gap, count-capped column formula and resize observation for `/home` and `/demo`; the implementation stays within the frozen shell-aware fit contract.
- Security readiness review found no new persistence, session, file-data, fixture-authority, or storage coupling. `REV-READY-PCC-005-01/02` are supported by the existing and current helper/integration/browser evidence. `REV-READY-PCC-005-03` still has the CK-001 projection/metric finding below.
- The production card currently renders the status badge as “Waiting for extraction” and also adds a third metric tile “Waiting / for extraction.” The accepted `ProjectCardViewModel` supplies `state: "waiting-for-extraction"` and exactly two metrics: `publishedFacts` and `uploadedPrds`. `ProductionProjectCard.tsx` hard-codes the status text/tone and synthesizes the third metric instead of using only the server-projected status and metrics. The new browser assertion `toHaveCount(3)` locks in this extra tile. The current data happens to make “Waiting” true, but it is redundant and creates client-owned presentation data contrary to the explicit ticket rule.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | EXPLICIT: PCC-005 Acceptance criterion and Scope require consuming the accepted PCC-004 `ProjectCardViewModel` and prohibit rederiving `Waiting for extraction` or metrics in client code. | `apps/atlas/components/ProductionProjectCard.tsx:8,10-11`; `apps/atlas/tests/browser/production-project-create.spec.mjs:158` | `home-projects.ts` supplies the waiting state and two metrics (`publishedFacts`, `uploadedPrds`). The production adapter hard-codes status label/tone and adds a local `for extraction: Waiting` metric. A fresh desktop/mobile capture displays the third tile redundantly beneath the same waiting status badge, and the browser test asserts three metric tiles. | Render the status from the accepted `project.state` using presentation-only label mapping and render only the metrics supplied by the accepted view model; remove the locally invented waiting metric. Keep the card layout readable with the remaining metrics and add an assertion for the contract's actual metric set. |

## Advisory observations

- The card includes a disabled Share button with an accessible explanation. It has no sharing handler or fixture authority, so it does not implement the ticket's excluded production-sharing capability.
- Full lint and type-check failures are recorded above; targeted lint and all applicable build/test suites pass.

## Decision

The prior CK-005 card-layout finding is resolved: the shared presentation restores the icon/text grid and current desktop/mobile renders are readable. The implementation has one distinct, implementation-repairable defect: the production adapter adds an unprojected “Waiting” metric and hard-codes the waiting presentation instead of representing the accepted view model as required by PCC-005.

Result: `CHANGES_REQUIRED`. Keep PCC-005 at `awaiting_review`; remediate CK-001 within the frozen view-model boundary, then request the next bounded CK round. Do not advance PCC-006.

