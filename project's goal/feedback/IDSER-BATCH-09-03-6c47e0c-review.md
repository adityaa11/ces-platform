# CK review: IDSER-009-03 / IDSER-BATCH-09-03

- **Ticket:** `IDSER-009-03-production-project-card-presentation.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `6c47e0cb87298a1460d3f5596cd2f5a6fbfda54a` (`feat(atlas): render production lifecycle card states`)
- **Review target:** explicit GO handoff commit at HEAD; ticket and checkpoint both identify this handoff. The target component/test files have no post-commit edits.
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Status | Evidence and review |
|---|---|---|---|
| RC-009-03-01 | IDSER-009-03, “Review contract and proof”: each supplied approved state renders exact state/progress/Master/metric content; component/render tests use one fixed model per state. | IMPLEMENTED_UNPROVEN | `production-project-card-presentation.test.mjs` supplies fixed states to the adapter and checks its label/metrics mapping. It does not render `ProductionProjectCard` or assert rendered progress, Master, and metrics. See CK-001.a. |
| RC-009-03-02 | IDSER-009-03, “Outcome” and review row: status is understandable without color alone; progress/status/action have accessible names and semantics; the disabled action has a truthful reason. | IMPLEMENTED_UNPROVEN | `ProjectCardPresentation.tsx` contains visible status text, a labelled native `<progress>`, and disabled action markup with a description. The submitted suite checks source patterns rather than rendered semantics or accessible names. See CK-001.b. |
| RC-009-03-03 | IDSER-009-03, “Review contract and proof”: failure display is bounded and safe; unavailable action does not imply a review/workspace route or `/demo` authority; component negative assertions. | PROVEN | `toProductionProjectCardPresentation` exposes only the approved attention reason for `needs-attention`; the test verifies this state gate. Its source assertions check the production adapter boundary for URL/fetch/timer/local-storage behavior. The rendered failure text is fixed by the browser-safe model type. |
| RC-009-03-04 | IDSER-009-03, “Review contract and proof”: existing shared card composition and keyboard/focus behavior remain consumable; focused component interaction/render regression. | IMPLEMENTED_UNPROVEN | The implementation continues to use `ProjectCardPresentation` and the existing action components/styles. Submitted assertions read JSX source and do not exercise the production composition or keyboard/focus behavior. See CK-001.c. |

## Validation and evidence inspected

- `docker compose ps` — PostgreSQL, Atlas, Agents Bridge, and Agents Bridge worker reported healthy.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/production-project-card-presentation.test.mjs'` — passed, 2/2 tests, 0 failures, 0 skips.
- Inspected the frozen ticket, GO checkpoint, committed implementation diff, production presentation components, adapter, focused test, shared fixture card, and existing rendered HTML test. The focused test verifies adapter output and JSX source patterns; the existing rendered HTML test exercises the `/demo` fixture card and does not render `ProductionProjectCard`.
- The GO checkpoint additionally records a build, full app suite, lint, and `git diff --check` as passed. CK did not rerun those commands; they do not supply the missing production component proof.
- Commit identity and status: `HEAD` is the reviewed implementation commit. The reviewed component and test files have no working-tree modifications. Unrelated generated and feedback files are present in the working tree and are outside this checkpoint.

## Frozen Finding Closure Matrix

### CK-001 — Required production component proof is absent

The presentation implementation appears to provide the approved model values, semantic elements, bounded failure notice, and shared card composition. The committed focused suite does not prove the component/render obligations frozen by the ticket. This is one consolidated finding; its clauses are limited to the missing proof in RC-009-03-01, RC-009-03-02, and RC-009-03-04.

#### CK-001.a — Exact approved content in rendered production cards

- **Ticket authority:** IDSER-009-03, “Review contract and proof,” row `RC-009-03-01`: each supplied approved state renders its exact state/progress/Master/metric content without local reinterpretation, proven by component/render tests with one fixed model per state. “Hard stop” requires component/render proof for all rows before review.
- **Unsatisfied evidence:** `apps/atlas/tests/production-project-card-presentation.test.mjs` invokes only `toProductionProjectCardPresentation`; its assertions do not render the production component or observe the progress, Master, and metric content in rendered output.
- **Observable correction:** add and run component/render assertions for one fixed approved `ProjectCardViewModel` per lifecycle state, covering the exact status, progress value/label, Master content, and metrics supplied to the production card.
- **Binary closure oracle:** **PASS** only if the focused Compose component/render test output shows all four fixed models rendered by `ProductionProjectCard` with each supplied state, progress, Master, and metric value/label observable as specified; otherwise **FAIL**. Evidence location: committed component/render test and its executed output. Direct-regression boundary: state/progress/Master/metric mapping and rendering in `ProductionProjectCard`, its adapter, and the shared presentation component.

#### CK-001.b — Rendered accessible status, progress, and unavailable action

- **Ticket authority:** IDSER-009-03, “Outcome” and “Review contract and proof,” row `RC-009-03-02`: status must be understandable without color alone; progress, status, and action need accessible names and semantics without noisy refresh announcements; disabled action must give a truthful reason.
- **Unsatisfied evidence:** current test uses regular-expression checks against JSX source. It does not inspect rendered output or prove the computed accessible names, semantics, truthful description association, or absence of noisy live refresh announcements.
- **Observable correction:** add and run semantic rendered assertions showing visible and accessible status information, correctly named progress and action, the disabled action’s associated truthful reason, and static status presentation that does not assert a noisy live announcement contract.
- **Binary closure oracle:** **PASS** only if focused rendered semantic assertions demonstrate those ticket-listed names, semantics, and reason for the production card, with no noisy status announcement behavior; otherwise **FAIL**. Evidence location: committed semantic render/accessibility assertions and their executed output. Direct-regression boundary: accessible production status/progress/action rendering and the description relationship in `ProductionProjectCard` and `ProjectCardPresentation`.

#### CK-001.c — Shared composition and keyboard/focus regression

- **Ticket authority:** IDSER-009-03, “Review contract and proof,” row `RC-009-03-04`: preserve existing shared card composition and keyboard/focus behavior for the approved model, proven by focused component interaction/render regression.
- **Unsatisfied evidence:** the committed suite verifies only source patterns and does not render or interact with the production card using the shared presentation component. The recorded full app suite is not identified as a production-card interaction/render assertion and cannot substitute for the named focused proof.
- **Observable correction:** add and run a focused production-card render/interaction regression using an approved model that demonstrates consumption of the shared card composition and preserves the applicable keyboard/focus contract, including that unavailable actions remain disabled and expose no unintended navigation.
- **Binary closure oracle:** **PASS** only if the focused component interaction/render test output demonstrates the production card’s shared composition and the applicable keyboard/focus behavior for the approved model, including disabled unavailable actions with no unintended navigation; otherwise **FAIL**. Evidence location: committed focused component test and its executed output. Direct-regression boundary: production-card composition and keyboard/focus/action behavior needed for this ticket; no shell, responsive, theme, authenticated browser, or `/demo` regression requirement is added.

## Scope-change observations

None. No new provider, runtime, deployment, product, or architecture decision is needed to close this finding.

## Decision

`CHANGES_REQUIRED`. The committed implementation has a passing adapter-focused test and appears locally bounded, but the frozen ticket explicitly requires rendered component/accessibility proof and a focused component interaction/render regression. CK-001.a through CK-001.c freeze the complete ticket-authorized closure target. A bounded presentation test repair can address these clauses; no work outside them is authorized by this review.
