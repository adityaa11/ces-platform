# IDSER-010: Deterministic Compose and regression checkpoint — umbrella partition record

- **State:** `partitioned-planned`; IDSER-010 is no longer a GO target.
- **Original batch:** `IDSER-BATCH-10`; executable children use `IDSER-BATCH-10-01`, `-02`, `-03-01`, `-03-02`, `-04`, `-05`, and `-06`.
- **Baseline inspected:** `codex/new-atlas-backend` at `3a0ec9d9d95e52c0e9cd5b4b392d9a1b1596d4cf` on 2026-09-30. The planning input is SRC-IDSER-01 sections 39–44, especially 41.1–41.9 and scenarios A–H; AC-01–AC-40.
- **Depends on:** IDSER-001 through IDSER-008 and the complete IDSER-009 child/corrective series through IDSER-009-04 `PASS`.
- **Execution environment:** real Compose Atlas/PostgreSQL/pg-boss/Agents Bridge/worker/DocumentStore and explicit controlled Mistral responses.

## Disposition and execution order

This preserves the original IDSER-010 scope as the coverage authority. It is not executable. Each child starts only after its stated predecessor has CK `PASS`; the series is complete only when every executable child has CK `PASS`.

```text
approved IDSER-001..009 series
  -> 010-01 deterministic production-shaped single-document foundation
  -> 010-02 multi-document semantic sequencing and bounded reconciliation
  -> 010-03 (non-executable failure family)
       -> 010-03-01 creation/kickoff rollback proof
       -> 010-03-02 semantic failure-containment proof
  -> 010-04 concurrent bundle identity isolation
  -> 010-05 staged-result replay/restart fencing
  -> 010-06 integrated deterministic Compose and regression checkpoint
  -> IDSER-011 live Mistral checkpoint
```

`010-03` is a non-executable responsibility-family record. Its children are deliberately separate: creation/DocumentStore/enqueue rollback has an atomic transaction oracle, while semantic context/provider/result rejection has a terminal-state/no-successor oracle. Combining them would make CK and CFC decide unrelated authority surfaces.

## Parent Review Contract ledger and lossless ownership

| Planning ID / class | Original IDSER-010 authority and required behavior | Existing implementation authority | Executable proof child | Final integration owner | Security/review binding |
|---|---|---|---|---|---|
| 010-RC-01 `BOUNDARY,INTEGRATION` | Real authenticated create -> DocumentStore -> Atlas transaction -> pg-boss -> existing worker -> internal handoffs -> persistence, with controlled provider responses. | IDSER-003–008, BSS-006–009 | 010-01 | 010-06 | SEAM-010-01 / REV-010-01 |
| 010-RC-02 `BEHAVIOR,SCENARIO` | A and B: one-document normal and internal-conflict outcomes through the production dispatcher/MistralProvider boundary. | IDSER-005–008 | 010-01 | 010-06 | SEAM-010-01 |
| 010-RC-03 `BEHAVIOR,SCENARIO,INTEGRATION` | C, D and E: bounded prior context, relationship semantics, no order-derived truth, and D1 -> D2 -> D3 procedural ordering. | IDSER-006/007 | 010-02 | 010-06 | SEAM-010-02 / REV-010-02 |
| 010-RC-04 `FAILURE_RECOVERY` | Creation, DocumentStore, transaction, and initial enqueue failure leave no project graph or job. | PCC, IDSER-003, BSS-006/007 | 010-03-01 | 010-06 | SEAM-010-03 / REV-010-03 |
| 010-RC-05 `FAILURE_RECOVERY,NEGATIVE_CASE` | Context/result denial, provider/schema/evidence/inventory/reference rejection produce bounded failure, no false progress and no successor scheduling. Scenario G. | IDSER-004–008 | 010-03-02 | 010-06 | SEAM-010-04 / REV-010-04 |
| 010-RC-06 `CONCURRENCY,SECURITY` | F: concurrent authorized users/bundles never share identities, context, result, progress, or queue consumers. | IDSER-001/003/004/007 | 010-04 | 010-06 | SEAM-010-05 / REV-010-05 |
| 010-RC-07 `REPLAY,FAILURE_RECOVERY` | H: staged replay/restart, provider-call suppression, duplicate/fingerprint/lease fencing and exactly-once logical effects. | IDSER-004/005/008 | 010-05 | 010-06 | SEAM-010-06 / REV-010-06 |
| 010-RC-08 `REGRESSION,SECURITY,EVIDENCE` | PCC/BSS/auth/demo/CSP/browser preservation, empty Master/no downstream truth, secret-safe evidence, complete A–H/AC ledger. | approved predecessors plus children | 010-06 | 010-06 | SEAM-010-07 / REV-010-07 |

The deterministic provider boundary remains fixed across all children: the existing production dispatcher, `MistralProvider` capability, pg-boss, worker, authenticated Atlas context/result routes and persistence execute; only the endpoint/configuration is controlled. No child may add TestRuntime semantic authority, a second OCR path/worker/queue, a fixture authority, silent mock fallback, or a credential requirement for deterministic CI.

## Scenario ownership

| Scenario | Production authority exercised and predecessor behavior consumed | Primary proof child / mandatory observations | Final observation |
|---|---|---|---|
| A — one PRD, no conflict | authenticated create, BSS-009 perception, semantic worker/Atlas acceptance and completion | 010-01; real IDs, provider calls, candidates/evidence, 1/1 and ready | 010-06 |
| B — one PRD, internal conflict | same one-document route plus extraction/reconciliation uncertainty | 010-01; two candidates, unresolved relation, ready without truth promotion | 010-06 |
| C — support/duplicate | D2 reconciliation against D1 selected incoming state | 010-02; bounded D1 context and persistent `supports`/`duplicates` | 010-06 |
| D — contradiction | multi-document reconciliation/acceptance | 010-02; `contradicts`, requires resolution, no winner/order priority | 010-06 |
| E — three-document order | reconciliation acceptance atomically releases only the next perception job | 010-02; DB/queue history shows D2 after D1 and D3 after D2 | 010-06 |
| F — concurrent users/bundles | membership, scoped context/result and pg-boss consumption | 010-04; two independent IDs, queues, contexts, results and counts | 010-06 |
| G — invalid semantic output | semantic context/result authority and terminal lifecycle | 010-03-02; rejection, no persisted partial result/progress/successor and `Needs attention` | 010-06 |
| H — replay/restart | Bridge outbox, Atlas idempotency and worker lease fencing | 010-05; staged envelope, call count, duplicate IDs/jobs/counts and stale lease observations | 010-06 |

## AC-01–AC-40 deterministic verification ledger

The implementation owner column remains the approved primary owner recorded in the Initial Draft README; this table names one concrete IDSER-010 verification owner, never “shared” or “later.” `010-06` consumes prior child evidence and re-observes only the composed checkpoints named in its contract.

| AC | Primary approved implementation owner | IDSER-010 verification child | Authoritative proof / final owner |
|---|---|---|---|
| 01 | PCC, IDSER-009 | 010-06 | production create/demo/auth regression; 010-06 |
| 02 | IDSER-003 | 010-01 | authenticated creation/bundle observation; 010-06 |
| 03 | IDSER-001/003/004 | 010-04 | same-display-name isolation fixture; 010-06 |
| 04 | IDSER-001 | 010-01 | focused bundle/domain regression; 010-06 |
| 05 | IDSER-003 | 010-03-01 | transactional kickoff/rollback proof; 010-06 |
| 06 | IDSER-003/006 | 010-01 | production perception route observation; 010-06 |
| 07 | IDSER-005 | 010-01 | existing worker/process observation; 010-06 |
| 08 | IDSER-002/005 | 010-01 | production semantic queue observation; 010-06 |
| 09 | IDSER-005 | 010-01 | dispatcher/TestRuntime-negative proof; 010-06 |
| 10 | IDSER-002 | 010-01 | production skill/provider-boundary suite; 010-06 |
| 11 | IDSER-002/004 | 010-01 | bounded job/context shape assertion; 010-06 |
| 12 | IDSER-004 | 010-01 | authenticated context/result route/Bridge denial; 010-06 |
| 13 | IDSER-002/006 | 010-01 | A/B extraction candidate/evidence outcome; 010-06 |
| 14 | IDSER-006 | 010-03-02 | invalid output/reference rejection proof; 010-06 |
| 15 | IDSER-001/006 | 010-01 | full-result/candidate/evidence persistence; 010-06 |
| 16 | IDSER-001 | 010-01 | focused JSONB/relational store regression; 010-06 |
| 17 | IDSER-006/007 | 010-02 | bounded selector/index proof; 010-06 |
| 18 | IDSER-007 | 010-02 | same/cross-document reconciliation scenarios; 010-06 |
| 19 | IDSER-002/007 | 010-02 | all ten relationship-type focused fixtures; 010-06 |
| 20 | IDSER-002/007 | 010-02 | no order-derived winner/supersession assertion; 010-06 |
| 21 | IDSER-007 | 010-02 | current-accounting/cross-scope rejection proof; 010-06 |
| 22 | IDSER-001/007 | 010-02 | full reconciliation/relationship persistence; 010-06 |
| 23 | IDSER-007 | 010-02 | E sequencing proof; 010-06 |
| 24 | IDSER-003/006/007 | 010-02 | accepted-stage/next-job transaction proof; 010-06 |
| 25 | IDSER-004/005/008 | 010-05 | staged replay/fingerprint/lease proof; 010-06 |
| 26 | IDSER-007/009 | 010-02 | reconciliation-only count advancement; 010-06 |
| 27 | IDSER-008/009 | 010-01 | B remains reviewable/ready; 010-06 |
| 28 | IDSER-004/005/008 | 010-03-02 | G bounded failure/no false progress; 010-06 |
| 29 | IDSER-008 | 010-02 | final completion gate after E; 010-06 |
| 30 | IDSER-009 | 010-06 | persisted card regression; 010-06 |
| 31 | IDSER-008/010 | 010-06 | downstream-state absence query; 010-06 |
| 32 | IDSER-008/010 | 010-06 | Master-empty across outcomes; 010-06 |
| 33 | IDSER-001/006/007 | 010-02 | provenance/inventory focused suite; 010-06 |
| 34 | IDSER-006/007 | 010-02 | bounded retrieval proof; 010-06 |
| 35 | IDSER-006/007 | 010-02 | stable IDs/evidence/relationships proof; 010-06 |
| 36 | IDSER-001/004/010 | 010-01 | Bridge DB permission/context-route denial; 010-06 |
| 37 | IDSER-003/010 | 010-03-01 | DocumentStore rollback/non-substitution regression; 010-06 |
| 38 | IDSER-003/005/010 | 010-01 | pg-boss worker/queue boundary; 010-06 |
| 39 | IDSER-009/010 | 010-06 | required regression matrix; 010-06 |
| 40 | IDSER-010 | 010-06 | composed A–H, evidence and hard-stop checkpoint; 010-06 |

## Security, regression and negative-authority ownership

| Parent seam / binding | Owner and preserved evidence |
|---|---|
| `SEAM-010-01` / `REV-010-01` production-shaped controlled-provider boundary | 010-01: explicit endpoint/config, MistralProvider/dispatcher/worker/route proof, no TestRuntime or silent fallback. |
| `SEAM-010-02` / `REV-010-02` semantic bounded-context and relationship authority | 010-02: selected-neighborhood bytes/counts/overflow, evidence inventory and reference validation. |
| `SEAM-010-03` / `REV-010-03` creation and kickoff atomicity | 010-03-01: before/after DB and pg-boss rollback observations. |
| `SEAM-010-04` / `REV-010-04` semantic failure containment | 010-03-02: denial/rejection snapshots, bounded failure and no successor. |
| `SEAM-010-05` / `REV-010-05` identity and test-consumer isolation | 010-04: two-user/two-bundle scoped DB/queue/context/result observations. |
| `SEAM-010-06` / `REV-010-06` replay and restart | 010-05: durable stage, provider call count, lease/fingerprint and exactly-once observations. |
| `SEAM-010-07` / `REV-010-07` honest composed evidence | 010-06: regression commands/counts/skips, secret-safe records, empty Master and absence of downstream truth. |

No child owns a live credential or real-provider proof: IDSER-011 retains AC-41–44 and is the only live Mistral checkpoint.

## Sizing and final-integration self-check

All executable children answer **YES** to the required sizing questions: GO can enumerate their finite RC rows and use one dominant proof topology; the hard stop requires all local rows `PROVEN`; CK receives one bounded authority decision; ordinary CFC repairs remain in the named seam/harness; and HMN may select only one missing assertion, fixture, or boundary interpretation within that seam. Explicit local exclusions prevent sibling authority from being reopened.

The final integration simulation found no unowned production prerequisite: 010-01 owns the real deterministic boundary, 010-02 semantic sequencing/bounds, 010-03-01/02 the distinct rollback and semantic-failure oracles, 010-04 identity isolation, and 010-05 replay/fencing. Therefore 010-06 is composition/evidence only; a substantial implementation, lifecycle, persistence, worker, concurrency, or replay discovery there is a planning `SCOPE_CHANGE` or a new corrective child, not hidden 010-06 work.

This planning record authorizes no production implementation, GO, CK, CFC, or HMN action.
