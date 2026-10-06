# CK review: IDSER-010-02 / IDSER-BATCH-10-02

- **Ticket:** `IDSER-010-02-multi-document-semantic-sequencing.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `4361daf4c7a38a88616dee101713cfc352804e43` (`test(idser): prove multi-document semantic sequencing`)
- **Review target:** The GO checkpoint records commit `4361daf` and `HEAD` matches it. The dirty tracked and untracked files do not overlap the committed ticket, GO checkpoint, Compose harness, or controlled Mistral fixture, so they do not make this target ambiguous.
- **Predecessor:** IDSER-010-01 post-CFC verification records `PASS` at `1259109`.
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Status | Evidence and review |
|---|---|---|---|
| RC-010-02-01 | IDSER-010-02 row `RC-010-02-01`: C persists `supports` and `duplicates`; D persists an unresolved `contradicts`; all ten relationship types remain candidates and resolve only to authorized candidates/evidence. | IMPLEMENTED_UNPROVEN | The focused PostgreSQL acceptance suite passed and its assertions cover the ten relationship values, candidate accounting, authorized reference rejection, and no candidate promotion. The production-shaped Compose harness includes the C/D assertions, but the required run timed out during its first multi-document C fixture before those assertions completed. |
| RC-010-02-02 | IDSER-010-02 row `RC-010-02-02`: same-bundle completed-prior selection, complete current accounting, cross-scope rejection, stable count/byte/overflow metadata without truncation. | PROVEN | `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts` asserts same-bundle prior selection, rejection of invented/unselected/foreign targets and missing current-candidate accounting, stable repeated IDs/metadata, UTF-8 byte fitting, count/byte overflow metadata, and failure rather than dropping current candidates. The focused Compose PostgreSQL command passed (1 test, 0 failures). |
| RC-010-02-03 | IDSER-010-02 row `RC-010-02-03`: E proves D2 is not scheduled before D1 acceptance and D3 not before D2; acceptance and next enqueue are atomic. | IMPLEMENTED_UNPROVEN | The focused PostgreSQL suite passed its injected enqueue rollback, D1→D2→D3 history, and one-job assertions. The required three-document Compose evidence did not execute: the harness timed out in C before reaching E. |
| RC-010-02-04 | IDSER-010-02 row `RC-010-02-04`: only a fully reconciled N/N bundle completes; validated results, relationships, evidence and source inventory remain addressable. | IMPLEMENTED_UNPROVEN | The focused reconciliation PostgreSQL suite passed final-gate negative cases for missing/incomplete stages and invalid evidence, plus successful final acceptance. The ticket also names the existing focused extraction suite: its recorded run failed both tests (one accepted-result replay assertion and one stale perception grant). The harness contains E assertions for N/N completion and the production card, but the Compose run failed before E, so required production-shaped multi-document proof is absent. |

## Validation and evidence inspected

- Inspected the frozen IDSER-010-02 ticket, its GO checkpoint, the shared Atlas Review Contract, predecessor verification, reviewed commit, Compose harness, controlled provider fixture, and focused PostgreSQL acceptance suite.
- `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` — **failed**. It timed out at `apps/agents-bridge/tests/idser-010-compose.mjs:86` while waiting for the first multi-document project to become ready. The run had passed its single-document A/B cases, but never reached the later multi-document assertions.
- During the failed run, the live database showed the first `scenario-c-supports` bundle at `expected_document_count=2`, `completed_document_count=0`; D1 was completed and D2 was `needs_attention` with a failed perception execution. Its perception queue job was completed. This is diagnostic evidence of the stalled C fixture; no ticket requirement is inferred from the queue/job inspection itself.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — passed (1 test, 0 failures, 0 skipped).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` — failed (2 tests, 0 passed). Failures: the accepted-result replay assertion at `tests/extraction-acceptance.integration.test.ts:139` and stale perception source redemption at `:239`.
- The submitted GO checkpoint reports both commands as passing, but the available `.codex-tools/idser-010-test-7.out` and `.codex-tools/idser-010-final.out` logs contain only the earlier `IDSER-010-01 controlled Compose scenarios A/B passed.` output. They do not evidence this commit's C/D/E run.

## Frozen Finding Closure Matrix

### CK-001 — The multi-document Compose checkpoint does not complete its C/D/E proof

#### CK-001.a — C and D relationship composition is not proven in the production-shaped harness

- **Ticket authority:** IDSER-010-02 row `RC-010-02-01`, which requires C to persist `supports` and `duplicates`, D to persist an unresolved `contradicts`, and C/D to prove the production-shaped composition alongside the focused relationship-vocabulary cases.
- **Unsatisfied evidence:** The committed harness times out at line 86 on the first `scenario-c-supports` bundle. The live observation showed `0/2` completed and D2 `needs_attention` after a failed perception execution. The later `scenario-c-duplicates` and D fixtures therefore do not run. The passing focused database suite does not substitute for the ticket's C/D Compose evidence.
- **Observable correction:** Make the controlled multi-document Compose run complete C's support and duplicate fixtures and D's contradiction fixture, preserving the required candidate/evidence and unresolved states, then record the successful focused Compose output.
- **Binary closure oracle:** **PASS** only if `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` exits successfully and its committed harness/output proves C support and duplicate relationships, D's unresolved contradiction, authorized candidate/evidence references, and candidate-only state. Evidence location: the C/D assertions in `apps/agents-bridge/tests/idser-010-compose.mjs` and the executed output for the reviewed checkpoint. Direct-regression boundary: the controlled multi-document semantic relationship path and the C/D assertions; no failure-family, concurrency, replay, live-provider, or other deferred scenarios.

#### CK-001.b — The three-document D1→D2→D3 production-shaped sequence is not proven

- **Ticket authority:** IDSER-010-02 row `RC-010-02-03`, which names the three-document Compose fixture E and requires D2 to start only after D1 reconciliation acceptance and D3 only after D2, with persisted execution/job history. Atomic acceptance/enqueue failure behavior is separately covered by the focused PostgreSQL suite and passed.
- **Unsatisfied evidence:** The required Compose command exits before reaching E because the preceding C fixture times out. The source contains E ordering/job assertions, but there is no successful execution evidence for them.
- **Observable correction:** Complete the recorded three-document Compose scenario and retain evidence that each next document starts after its predecessor's reconciliation acceptance and that D3 has exactly one queued perception job after D2 commits.
- **Binary closure oracle:** **PASS** only if the focused Compose command exits successfully and its E assertions/output demonstrate the three completed members, ordered start/completion timestamps, D1→D2 and D2→D3 acceptance boundaries, and exactly one D3 perception job. Evidence location: E member and job assertions in `apps/agents-bridge/tests/idser-010-compose.mjs` plus its successful executed output; the already passing focused PostgreSQL enqueue rollback/history assertions remain the evidence for transaction atomicity. Direct-regression boundary: E sequencing, accepted reconciliation advancement, and next-job scheduling only.

#### CK-001.c — Final N/N readiness and addressable E results are not proven

- **Ticket authority:** IDSER-010-02 row `RC-010-02-04`, which requires a fully reconciled N/N bundle and addressable validated results, relationships, evidence and source inventory, with final E assertions.
- **Unsatisfied evidence:** The Compose run fails before E, so it supplies no production-shaped three-document ready outcome or E result/addressability observations. The focused reconciliation suite's successful final-gate fixture and negative cases do not prove extraction source-inventory acceptance; the named extraction-acceptance suite also failed. Neither substitutes for the ticket's final E assertions.
- **Observable correction:** Resolve the two failures in the ticket-named extraction-acceptance suite, complete E in the focused Compose run, and record the final N/N ready result with the ticket-named persisted semantic, relationship, evidence and inventory state addressable for the completed bundle.
- **Binary closure oracle:** **PASS** only if the focused `test:extraction-acceptance` and `test:reconciliation-acceptance` suites both pass, and the successful Compose output demonstrates E's expected and completed counts both equal three, all three members have both semantic stages completed, the bundle and production card are ready for review, and persisted results/relationships/evidence/source inventory are scoped and addressable. Evidence location: `packages/atlas-db/tests/extraction-acceptance.integration.test.ts`, `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts`, E assertions in `apps/agents-bridge/tests/idser-010-compose.mjs`, and successful command outputs. Direct-regression boundary: final reconciliation acceptance, addressability, bundle completion, and E's ready-card observation only.

## Scope-change observations

None identified.

## Decision

`CHANGES_REQUIRED`. CK-001.a through CK-001.c are the complete ticket-authorized closure target. The focused reconciliation PostgreSQL suite passes, including selector bounds and atomic acceptance behavior; the ticket-named extraction-acceptance suite fails both tests, and the authoritative multi-document Compose run fails in C before executing C's duplicate variant, D, or E. The review returns to human/planning authority under the bounded CK workflow.
