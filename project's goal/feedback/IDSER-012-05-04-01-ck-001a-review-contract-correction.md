# CK review-contract correction: IDSER-012-05-04-01 / CK-001.a

- **Applies to:** `project's goal/feedback/IDSER-BATCH-12-05-04-01-3f2bc03-review.md`.
- **Authority reconciliation:** the frozen child ticket `RC-01205-0401-01..03`, parent `IDSER-012-05` `SR-01205-B2`, `T2`, and `C2`, and the operator architectural decision recorded with this correction.
- **Disposition:** append-only correction before CFC implementation. The original CK artifact remains historically intact.

## Authority finding

The child ticket authorizes only an *authorized source-read scope* for a
read-only v3 plan/handoff resolution boundary. The parent requires persisted
Atlas facts to remain authoritative and prohibits browser-session authority
from becoming durable execution authority. Neither source authorizes an
interactive v3 `resolve(scope, reference)` endpoint, a caller-provided v3
resource scope, or compatibility retention for a method with no production
consumer.

The approved accepted-document background pattern is a reusable receiving
boundary, not authority to copy that component's separately ticketed
interactive API into v3. Consequently, the CK-001.a instruction to preserve
the current interactive method and its Better Auth checks exceeds this
ticket's authority. Retaining it would create an unsupported semantic
execution path contrary to the operator decision.

## Narrow correction

Only the unsupported interactive-retention portion of `CK-001.a` is
superseded for effective closure. The following original obligations remain
active and unchanged:

- a session-independent, persisted-relationship v3 background redemption;
- verification of plan/handoff hashes and immutable content, accepted source,
  perception execution, cache, lifecycle, cancellation, locator membership,
  and selected accepted visual assets;
- an authenticated server-composed receiving boundary that authenticates the
  service before parsing or reference resolution;
- bounded metadata/identity output with no hydration, grant, mutation, or
  downstream execution; and
- the `CK-001.b` real PostgreSQL/no-effect proof and `CK-001.c` negative
  matrix.

### Corrected CK-001.a closure oracle

**PROVEN iff** `PostgresSemanticBatchV3ReferenceResolver` exposes only
`resolveBackground(reference)`, accepts no browser session or caller-provided
scope, derives project/workspace/bundle/document identity from one accepted
persisted join, and is redeemable only after service authentication through
`createInternalReceivingBoundary`. Its result is the bounded v3
reference/metadata shape; no document or media content is hydrated. The
persisted source/cache/lifecycle/immutable validation and the no-downstream
boundary remain direct regressions to check.

This correction does not weaken any ticket-derived obligation and does not
add a route, worker, provider call, GHR delivery, BSS admission, SEM
execution, or reconciliation behavior.

## CFC target

The active bounded CFC target is the corrected `CK-001.a` plus original
`CK-001.b` and `CK-001.c`. `READY_FOR_CK` is prohibited until all three have
their named proof. No shared governance skill was modified.
