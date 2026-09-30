# IDSER-BATCH-09-03-02 supplemental CK contract-correction freeze

- **Ticket:** `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
- **Batch:** `IDSER-BATCH-09-03-02`
- **Review type:** planning-authorized corrected closure freeze
- **Ticket state:** `awaiting_review`
- **Implementation checkpoint:** `746ba16fb734ae1dd245172cc6d0edb27746365b`
- **Original CK artifact:** `project's goal/feedback/IDSER-BATCH-09-03-02-746ba16-review.md`
- **Current interrupted CFC record:** `project's goal/feedback/IDSER-BATCH-09-03-02-cfc-not-ready.md`
- **Planning decision:** `project's goal/feedback/IDSER-009-03-02-review-contract-correction.md`
- **Result:** `REVIEW_CONTRACT_GAP`

## Purpose and preservation

The planning decision corrects a proof-surface sizing error in the current ticket. The original GO checkpoint, CK result, all historical clause IDs, and the `CFC_NOT_READY_FOR_CK` record remain preserved and are not rewritten. In particular, historical `CK-002.b` records the then-required full authenticated production-card sequence; it is not a failure silently erased from history.

The current corrected ticket transfers that final card sequence to IDSER-009-04 and freezes only its directly ticket-derived persisted lifecycle authorities below. This artifact neither evaluates the current uncommitted CFC changes nor claims a clause proven. It does not reopen or strengthen any predecessor contract.

## Supplemental frozen closure matrix

| Supplemental clause | Exact corrected-ticket authority | Unresolved proof condition | Binary closure oracle and evidence |
|---|---|---|---|
| CK-SUP-009-03-02-A | RC-A; “Preserve IDSER-003 transactional kickoff.” | The corrected contract consumes the approved creation authority but requires focused evidence that it still persists the four pre-activation facts and rolls back atomically. | **PASS iff** `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository'` passes assertions that an independently observed successful committed graph has `bundle=waiting`, D1 member `perception_queued`, `X=0`, and one durably queued matching D1 job, while controlled enqueue/transaction failure leaves no committed graph or matching job. Existing project-repository evidence may be consumed; no broader IDSER-003 suite is required. **Direct-regression boundary:** project-create transaction and D1 kickoff only. |
| CK-SUP-009-03-02-B | RC-B; “Frozen lifecycle rule and selected seam.” | Exact first authenticated redemption must be proven as the sole activation authority at `PostgresPerceptionAuthority.redeem()`. | **PASS iff** `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:perception-authority'` passes an assertion that valid exact-scope first redemption, in its protected-source transaction, changes only its bound bundle `waiting -> processing` and member `perception_queued -> perceiving`, retains `X=0`, sets each `started_at` once, and leaves no committed pre-transaction activation. **Direct-regression boundary:** source-grant redemption and bound bundle/member transition only. |
| CK-SUP-009-03-02-C | RC-C; “Activation, replay, and negative authority.” | The actual source-grant boundary needs a table-driven target-plus-control before/after matrix for applicable invalid, stale, terminal, scope, and replay cases. | **PASS iff** the same focused Compose authority command passes table-driven assertions covering: unbound execution/member; wrong bundle or scope; artifact/document/source mismatch; stale execution; expired or missing persisted grant; terminal execution; terminal bundle/member; unrelated control lifecycle; duplicate valid redemption; and valid replay after member progress. Each negative snapshot must show relevant execution state, target bundle state/start time/completed count, target member state/start time, and unrelated control bundle/member unchanged. Valid replay must be idempotent without resetting timestamps, progress, advanced state, or controls. **Direct-regression boundary:** grant validation and lifecycle activation transaction only; no semantic/pipeline redesign. |

## Historical matrix preservation

Original `CK-001.a`, `CK-002.a`, and `CK-002.b` retain their original artifact wording and recorded statuses. The corrected ticket authority supersedes only the future closure applicability of the prior card-surface condition in `CK-002.b`; it does not modify history or make a production-card assertion optional in IDSER-009-04.

## Validation performed

No implementation or runtime validation was performed for this freeze. It establishes objective closure oracles for the corrected ticket only.

## Decision and handoff

Record `REVIEW_CONTRACT_GAP`. The three supplemental clauses are frozen as unresolved. A later, newer HMN authorization may select only these clauses for a single evidence-remediation CFC cycle. This artifact itself authorizes neither code changes nor a CK PASS decision.
