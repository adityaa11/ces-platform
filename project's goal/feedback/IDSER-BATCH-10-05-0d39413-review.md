# CK review: IDSER-010-05 / IDSER-BATCH-10-05

- **Ticket:** `IDSER-010-05-staged-result-replay-restart.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `0d39413c9538b9d3481afd2f9a66e638d7f54771` (`test(idser): complete staged replay checkpoint`)
- **Review type:** First consolidated CK review
- **Result:** `CHANGES_REQUIRED`
- **Predecessor:** IDSER-010-04 `PASS` at `91c2405` (verified at `91c2405`)

## Review target and scope

The ticket explicitly names IDSER-010-05 / IDSER-BATCH-10-05. Its frozen state is `awaiting_review`; the committed GO checkpoint records the same state and targets commit `0d39413`. The reviewed ticket, GO checkpoint and implementation files are unchanged in the worktree. Other local changes do not overlap this review target. The named predecessor is recorded PASS.

Review authority is the frozen ticket's three Review Contract rows and its explicit mandatory negatives/direct regression boundaries. This review does not reopen predecessor tickets or broaden Scenario H into general retry, concurrency, or deployment work.

## Review Contract traversal

| Row | Authority | CK status | Evidence |
|---|---|---|---|
| RC-010-05-01 | Ticket row 20: durable staging before trusted delivery; worker interruption; resumed delivery must byte-equate at the approved envelope boundary. | IMPLEMENTED_UNPROVEN | Fresh Scenario H run persisted the staged row and retained the same envelope across worker interruption. It did not capture or fingerprint the envelope received by Atlas after restart; see CK-001.a. |
| RC-010-05-02 | Ticket row 21: acknowledgement loss/restart must keep the provider call count at one while retrying delivery and eventually clear the delivered stage. | PROVEN | Fresh Scenario H observed one structured-provider event for the execution, provider total 26 before and 29 after the one OCR/extraction/reconciliation path, and eventual outbox cleanup. |
| RC-010-05-03 | Ticket row 22 and security negatives at row 26: identical replay has singular logical effects; conflicting fingerprint and stale lease are rejected without mutation; IDs, counts, and job remain singular. | PROVEN | Fresh Scenario H recorded generation 1 to 3; the conflicting-key insert and stale claimant left winning/control rows unchanged; final state was completed with expected/completed counts 1/1 and one extraction result, candidate, evidence, relationship, and completed job. The conflicting execution identity was rejected at the durable key boundary. |

## Validation and evidence

- Ran `node apps/agents-bridge/tests/idser-010-compose.mjs` against the committed checkpoint. It exited successfully and reported controlled Compose scenarios A/B/C/D/E/F/H passed.
- Fresh Scenario H evidence: execution `124a14f5-6469-4f26-a9e8-7dfcac6887ae`; idempotency key `semantic:124a14f5-6469-4f26-a9e8-7dfcac6887ae`; staged lease generation `1`, resumed generation `3`; provider structured-call totals `26 -> 29`; staged envelope fingerprint `6cae2d18b87cb1ba8ef46486193ceb9b8f2aadab8500de7a15df72ad1468d6b8`; final singular effects as recorded above.
- The GO checkpoint records passing worker typecheck, migration checks, script syntax checks, Compose configuration, and diff whitespace checks. These were inspected as checkpoint evidence and were not independently rerun during CK.
- The GO checkpoint's recorded run identifiers differ from this fresh run. The fresh run supplies current evidence for the binary observations; no review target ambiguity resulted.

## Frozen Finding Closure Matrix

### CK-001 — Resumed trusted delivery is not observed at the envelope boundary

**Ticket authority:** IDSER-010-05, Review Contract row RC-010-05-01, exact oracle: “PASS iff durable staged record survives interruption and the resumed delivery byte-equates at the approved envelope boundary.” The ticket's authority/outcome at row 10 also requires resumption from authoritative durable state.

**Unsatisfied evidence:** In `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario H, the assertion around line 300 deep-compares the durable outbox envelope before and after stopping the worker. The later assertion waits for bundle completion, while the emitted hash around line 318 fingerprints only the pre-restart staged envelope. No observation captures the payload actually delivered to the trusted Atlas result boundary after restart. Therefore persisted-stage survival is proven, but the exact resumed-delivery equality required by RC-010-05-01 is not.

#### CK-001.a

- **Exact ticket authority:** RC-010-05-01, ticket row 20.
- **Unsatisfied evidence:** No post-restart observation of the envelope received by Atlas is compared with the staged envelope; the current hash covers the staged value only.
- **Observable correction/proof:** In Scenario H, capture the actual resumed request envelope at the controlled trusted Atlas result boundary and assert it equals the durable pre-stop staged envelope at the ticket-approved boundary. Report or retain the compared fingerprint/equality assertion in the Compose evidence.
- **Binary closure oracle:** **RESOLVED** only when a passing run of `node apps/agents-bridge/tests/idser-010-compose.mjs` proves that the real resumed worker's captured Atlas-bound envelope equals the pre-interruption staged envelope. **UNRESOLVED** if the evidence still compares only outbox reads or reports only a pre-restart hash.
- **Exact evidence location/validation:** Scenario H in `apps/agents-bridge/tests/idser-010-compose.mjs`, with captured result-boundary observation and passing output from the named command.
- **Direct-regression boundary:** Scenario H's staged-result delivery after the controlled worker stop/restart; do not reopen earlier scenarios or require unrelated retry/provider behavior.

## Scope-change observations

None. The required correction stays within the ticket's existing Compose restart harness and result-boundary observation.

## Decision

`IDSER-BATCH-10-05` receives `CHANGES_REQUIRED` for `CK-001.a` only. RC-010-05-02 and RC-010-05-03 are proven and frozen as resolved for any bounded remediation. This first review does not authorize CFC or advance the ticket state.
