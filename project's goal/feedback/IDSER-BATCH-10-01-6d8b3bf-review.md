# CK review: IDSER-010-01 / IDSER-BATCH-10-01

- **Ticket:** `IDSER-010-01-deterministic-production-single-document-foundation.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `6d8b3bf3f8fa2feea37f9a55756f897a3e546a14` (`test(idser): prove deterministic single-document foundation`)
- **Review target:** The ticket's GO checkpoint says the implementation commit is this handoff commit. `HEAD` is `6d8b3bf`; the committed ticket and authorized harness files are unchanged in the worktree. The Compose overlay is marked modified but has no content diff. Other dirty and untracked files do not change this checkpoint target.
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Status | Evidence and review |
|---|---|---|---|
| RC-010-01-01 | IDSER-010-01 review row `RC-010-01-01`: authenticated creation and the actual production DocumentStore, pg-boss, BSS-009, worker, Atlas context/result routes, dispatcher and `MistralProvider`; explicit secret-free mock; no alternate semantic authority. | PROVEN | The committed Compose harness starts the normal topology plus the controlled provider overlay, creates through authenticated `/api/projects`, waits for ready bundles and two completed semantic executions, observes OCR/structured provider calls, and verifies Bridge has no Atlas schema usage. The ticket records the focused boundary/permission suites as passing. |
| RC-010-01-02 | IDSER-010-01 review row `RC-010-01-02`: Scenario A has valid full extraction/reconciliation results, candidate/evidence/provenance, resolved IDs, then reaches 1/1 and ready. | IMPLEMENTED_UNPROVEN | `idser-010-compose.mjs` checks ready, 1/1, candidate/evidence counts, relationship count, empty Master, and two completed executions. It does not assert the persisted full extraction/reconciliation results, provenance, or that their referenced IDs resolve in the scoped bundle. See CK-001.a. |
| RC-010-01-03 | IDSER-010-01 review row `RC-010-01-03`: Scenario B retains two source-grounded candidates and an unresolved internal relationship, does not promote a winner or fabricate `Needs attention`, and reaches ready. | IMPLEMENTED_UNPROVEN | The harness checks two unresolved candidate rows, a `contradicts` relationship count, empty Master and ready workspace. It does not assert the persisted relationship's unresolved flag or the required Ready for review project-card/read-model result. See CK-001.b. |
| RC-010-01-04 | IDSER-010-01 review row `RC-010-01-04` and Security/handoff: versioned skills, unknown-skill fail-closed, bounded identities, Bridge direct-DB denial, and no production TestRuntime. | PROVEN | The checkpoint records the focused contract, skills, core, DB permission, DB semantic-authority and Bridge semantic suites as passing. The new actual-process harness verifies Bridge schema denial and observes the two semantic executions and controlled provider calls. No contrary implementation evidence was found in the reviewed commit. |

## Validation and evidence inspected

- Inspected the frozen IDSER-010-01 ticket, its GO checkpoint and review contract, the shared Atlas Review Contract, commit `6d8b3bf`, and the committed harness and controlled provider fixture.
- Inspected `.codex-tools/idser-010-final.out` and `.codex-tools/idser-010-test-7.out`; each records `IDSER-010-01 controlled Compose scenarios A/B passed.` These are submitted run logs, not commands rerun by CK.
- The ticket's GO record reports `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose`, `@atlas/agents-bridge test:semantic` (5 tests), `@atlas/contracts test` (11), `@atlas/skills test` (1), `@atlas/core test` (19), `@atlas/db test:permissions` (1), and `@atlas/db test:semantic-authority` (1) passed. It also records both `node --check` commands passed. CK inspected this recorded evidence and did not rerun those commands.
- Reviewed the committed harness assertions: it confirms bundle/workspace completion and counts, but does not read full extraction/reconciliation result payloads or provenance, resolve their IDs, inspect the project-card read model, or assert `requires_resolution` on the conflict relationship.
- Review-target identity: although the worktree contains unrelated modifications and untracked artifacts, no changed content overlaps the committed ticket or harness. The referenced Compose overlay has no textual diff, so these items do not make the reviewed commit ambiguous.

## Frozen Finding Closure Matrix

### CK-001 — The single-document harness omits required persisted semantic and card observations

#### CK-001.a — Scenario A does not prove complete validated results, provenance, and resolved identities

- **Ticket authority:** IDSER-010-01 review row `RC-010-01-02`: “persists valid full extraction/reconciliation results, candidate/evidence rows and provenance,” and its proof requires resolved IDs and DB state.
- **Unsatisfied evidence:** The committed `apps/agents-bridge/tests/idser-010-compose.mjs` queries candidate, evidence, relationship and execution counts plus bundle/workspace state. It never reads the extraction or reconciliation result records, their provenance, or the identities they reference. The two completed execution count alone does not demonstrate that the full validated results and their references persisted correctly.
- **Observable correction:** Extend the Scenario A database assertions to inspect the persisted extraction and reconciliation results and provenance, and prove the result/evidence/candidate/document/bundle identities resolve within the same project bundle. Keep the existing 1/1, ready, candidate/evidence and empty-Master checks.
- **Binary closure oracle:** **PASS** only if the committed focused Compose harness and its executed output demonstrate, for Scenario A, full persisted extraction and reconciliation results with provenance and resolved scoped identities, alongside the existing 1/1 ready outcome and candidate/evidence assertions. Evidence location: the Scenario A assertions in `apps/agents-bridge/tests/idser-010-compose.mjs` and output of `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose`. Direct-regression boundary: the single-document extraction/reconciliation persistence and completion path; no multi-document or deferred failure/replay scenarios.

#### CK-001.b — Scenario B does not prove an unresolved relationship or the Ready for review card/read model

- **Ticket authority:** IDSER-010-01 review row `RC-010-01-03`: two conflicting candidates persist with an unresolved relationship and the bundle is ready without promoting a winner or fabricating `Needs attention`. The ticket Outcome and row `RC-010-01-02` require a Ready for review project card; row `RC-010-01-03` requires the completed conflict bundle to be ready.
- **Unsatisfied evidence:** The Scenario B harness asserts a `contradicts` relationship count, but not that the relationship requires resolution. It queries the workspace state and Master state directly, but makes no project-card/read-model request or assertion demonstrating Ready for review for the conflict case.
- **Observable correction:** Assert the persisted conflict relationship is unresolved using its authoritative stored state, and assert the production project-card/read-model response for both single-document scenarios represents the ready bundle as Ready for review without `Needs attention`.
- **Binary closure oracle:** **PASS** only if the committed focused Compose output shows Scenario B's `contradicts` relationship persisted as unresolved and the production project-card/read-model presents the completed 1/1 conflict bundle as Ready for review, with no fabricated `Needs attention`; retain the current two-candidate, empty-Master and ready-workspace checks. Evidence location: the Scenario B relationship assertions and project-card/read-model assertions in `apps/agents-bridge/tests/idser-010-compose.mjs` (or a directly invoked existing production route within that harness), plus its executed Compose output. Direct-regression boundary: only the single-document conflict persistence and ready-card projection; no new lifecycle states or multi-document behavior.

## Scope-change observations

None identified.

## Decision

`CHANGES_REQUIRED`. CK-001.a and CK-001.b are the complete ticket-authorized closure target. The submitted Compose logs show scenarios A/B completed, and the GO record reports its required focused suites passing, but neither substitutes for the specific persisted-result, provenance, identity, unresolved-relationship, and Ready for review card observations required by the frozen ticket.
