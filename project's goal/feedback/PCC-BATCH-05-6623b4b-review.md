# Review: PCC-005 / PCC-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-005-production-project-library-and-create-ui.md` / `PCC-BATCH-05`
- Reviewed commit: `6623b4b5e534986090d2edf191658da0be58b495` (`fix(atlas): derive production waiting metric from status (CK-001)`)
- Frozen ticket baseline: PCC-005 baseline `SRC-PCC-02`, `SRC-PCC-05`, `SRC-PCC-06`, and `SRC-PCC-07`; acceptance scope unchanged
- Review session: 3
- Review round: 2
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-05-36fe420-review.md` (session 3 Round 1, `CHANGES_REQUIRED`)
- Remediation commit: `6623b4b5e534986090d2edf191658da0be58b495`
- Result: `PASS`
- Convergence: `IMPROVING`

## Evidence

### Target and bounded scope

- `git rev-parse HEAD`: `6623b4b5e534986090d2edf191658da0be58b495`. PCC-005 remains `awaiting_review`; the tracked worktree is clean.
- The remediation commit changes only `ProductionProjectCard.tsx`, its production browser assertion, and the PCC-005 implementation-evidence appendix. The latter records the remediation evidence and does not alter frozen acceptance criteria.
- The user clarified that the third “Waiting / for extraction” metric is intentional to match the `/demo` card composition, and that it must derive from the status badge. This clarifies the expected presentation while keeping the accepted PCC-004 view-model state as production authority.
- `ProductionProjectCard` maps `project.state` to one `status` object, passes that object to the shared presentation as the badge, and derives the third metric's value and label from `status.label`. It no longer independently hard-codes the metric value or label. The browser assertion compares both metric cells with the rendered badge text.
- `/demo` retains its fixture-owned three metrics and existing behavior. The bounded remediation does not change the fixture adapter, persistence, authority, or shared card structure.
- The affected rendered state was inspected in fresh Playwright captures across light and dark desktop, tablet, mobile, and reflow. The badge and third metric agree in every capture; the three-item metric row remains legible and within the card at each size.

### Compose validation

| Exact command | Result |
|---|---|
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` | **9 passed, 0 failed, 0 skipped** (32.9s): production light/dark desktop, tablet, mobile, and reflow cases plus `/demo` fixture regression. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec eslint components/ProductionProjectCard.tsx tests/browser/production-project-create.spec.mjs` | Passed. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` | Build passed; **37 total, 36 passed, 0 failed, 1 intentional worker-runtime skip**. |

Round 1's broader Compose lint/type-check diagnostics remain recorded there and in the CFC checkpoint. This round changed only the badge-derived metric and its regression assertion; no lint or type diagnostic implicated either changed file.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | EXPLICIT: PCC-005 requires the production card to consume the accepted PCC-004 `ProjectCardViewModel`; the user's clarification authorizes the third metric to match `/demo` and requires it to derive from the status badge. | `apps/atlas/components/ProductionProjectCard.tsx`; `apps/atlas/tests/browser/production-project-create.spec.mjs` | The metric is generated from the same `status.label` passed to the badge; browser assertions compare both displayed metric fields to badge text. The 9-case browser suite and 36-test app suite pass, and desktop/mobile captures show a readable card. | Keep the intentional third metric synchronized with the badge by deriving its value and label from the shared status presentation source. Satisfied. |

## Advisory observations

None.

## Decision

CK-001 is resolved. The user-authorized three-metric production card remains consistent with the status badge, while `/demo` retains its fixture-owned data and behavior. No blocking findings or late discoveries remain in this bounded Round 2 review.

Result: `PASS`. PCC-005 remains at `awaiting_review`; this review does not advance PCC-006.
