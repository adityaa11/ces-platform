# GO checkpoint: IDSER-012-03-01-02 / IDSER-BATCH-12-03-01-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-01-02-authorized-accepted-document-resolver.md`
- **State:** `awaiting_review`
- **Predecessor:** `IDSER-012-03-01-01` CK `PASS` at `81c19e61b6e248f64542fddaf1e5be963c1bf7d5`, recorded in `IDSER-BATCH-12-03-01-01-81c19e6-review.md`.

## Bounded implementation

- Added `PostgresAcceptedSemanticBatchPlanDocumentResolver`, an Atlas-only SELECT adapter that accepts the independently parsed five-field body plus an authenticated session and explicit project/workspace/bundle/document scope.
- The resolver checks the current auth session, project membership, accepted `perceived` member, `processing` bundle, completed execution, source SHA, cache key/version/capability identity, cache freshness, completion fingerprint, normalized-document fingerprint, and each accepted derived-media manifest/link.
- Its typed result contains the qualified normalized document, source identity and manifest metadata only. It never returns storage keys or bytes; REL is `{ state: "unavailable" }` because no separately accepted REL authority exists.
- No planner publication, BSS interaction, persistence, GHR route/issuer, SEM/provider call, cache/asset mutation, or reconciliation behavior was added.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-012030102-01` | Frozen row 01; security readiness `SR-012030102-T1/T2` | Actual `-01-01` accepted fixture flows through real parser and authenticated scoped resolver; execution, source, fingerprint, lifecycle and media grants are independently checked. | `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` creates persisted RUN-003 accepted rows and an accepted visual manifest, derives/parses the fixture, then redeems through the resolver. | `PROVEN` |
| `RC-012030102-02` | Frozen row 02; `SR-012030102-R1` | Foreign scope, changed body fields, stale cache/fingerprint, cancellation, expired authorization, and missing/foreign media fail closed without document leakage. | Same persisted integration test asserts each named rejection against the real resolver. | `PROVEN` |
| `RC-012030102-03` | Frozen row 03; outcome and hard stop | Result is bounded and typed; no second header/domain contract; REL is explicit unavailable rather than fabricated. | Resolver result type and integration assertions for source metadata, locator-bound media metadata, and `rel: { state: "unavailable" }`. | `PROVEN` |
| `RC-012030102-04` | Frozen row 04; `SR-012030102-R2` | Positive and reject reads create zero planner/BSS/GHR/SEM/provider/cache/asset/semantic/reconciliation effects. | Resolver is SELECT-only; integration test snapshots cache and semantic/reconciliation counts across positive and rejection scenarios. | `PROVEN` |

Validation executed with local `DATABASE_URL` from `.env`:

```text
pnpm --filter @atlas/db typecheck
# PASS
pnpm --filter @atlas/db test:semantic-batch-plan-input
# PASS: 1 test, 1 pass, 0 failures, 0 skips
git diff --check
# PASS
```

Internal readiness: READY_FOR_CK
