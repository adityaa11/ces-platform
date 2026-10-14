# SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE — Qualified deferred semantic acceptance

**Status:** `approved` — **Size:** M, bounded prerequisite — **Batch:** `SEM-CUTOVER` — **Owner:** Atlas semantic acceptance and lifecycle only. **Order:** after `SEM-CUTOVER-007` independent CK `PASS`; before `SEM-CUTOVER-007A` GO. **Authority:** user HMN approval `HMN-SEM-CUTOVER-007A-001`, including revisions 001 and 002 (`RC-007A-E2E`).

## Outcome

Add the smallest Atlas-owned, authenticated acceptance route for a hash-bound stepwise composite outcome. It supports exactly two truthful outcomes:

1. `partial_accepted`: a non-null Semantic V1 canonical subset is accepted under the existing candidate/evidence rules; its canonical inventory plus persisted qualified deferred coverage partitions every eligible normalized locator exactly once.
2. `qualified_deferred`: no Semantic V1 result, candidate, reconciliation execution, or delivery envelope is created. The exact composite hash, relationship-revision-set hash, sidecar hash, and complete deferred coverage are persisted under a distinct reviewable disposition.

This ticket does not implement the ordinary stepwise worker, source/media grants, relationship methodology, REL-03 storage, durable Bridge handoff, provider transport, D1 scheduling, publication, Master mutation, or user-review UX.

## Frozen lifecycle contract

### Accepted input

The new internal Atlas route accepts a service-authenticated `QualifiedStepwiseAcceptanceInput` with the execution scope, immutable composite identity (`compositeHash`, `relationshipRevisionSetHash`, `provisionalSidecarHash`), and a complete source-coverage projection. It accepts no raw provider response, credentials, prompt/source text, or image bytes.

`partial_accepted` additionally carries the validated canonical extraction envelope. `qualified_deferred` carries no Semantic V1 result or provider envelope. Both inputs are fingerprinted from their canonical JSON and are idempotent only for the same execution and identical fingerprint.

### Source accounting

- Atlas derives eligible locators from the currently bound normalized document; caller-supplied coverage cannot add, omit, or substitute a locator.
- Each canonical inventory entry remains subject to existing evidence, candidate, duplicate, and source-grounding validation.
- Every deferred coverage entry must name exactly one eligible locator and use the qualified deferred classification `essential_dependent_deferred`.
- Canonical inventory locators and deferred coverage locators must be disjoint; their union must equal the eligible locator set exactly once. A duplicate, unknown, missing, or unqualified entry is rejected atomically.
- Deferred material is not rewritten as `non_fact`, included in Semantic V1 source inventory, used as accepted relationship meaning, or silently dropped.

### Materialization and lifecycle

- A partial outcome materializes only canonical candidates/evidence and persists its deferred accounting. It may enqueue reconciliation only when canonical candidates were materialized; reconciliation consumes only those materialized candidates.
- A fully deferred outcome persists only the deferred-acceptance record and transitions the document member to `qualified_deferred`. It creates no Semantic V1 extraction result, candidate, evidence, knowledge-index mapping, reconciliation execution, or automatic reconciliation job.
- `qualified_deferred` is a reviewable terminal member state, not `completed`, `needs_attention`, technical failure, or successful extraction. A bundle with one or more qualified-deferred members transitions to terminal `qualified_deferred` only after every member is either normally completed or qualified deferred; its Initial Draft stays `draft` and Master stays `empty`.
- A normal all-completed bundle retains the existing `ready_for_review` route unchanged. A partial outcome with canonical candidates follows that existing reconciliation path; it does not itself complete the member or bundle.

## Exact implementation ownership

- `packages/atlas-contracts/src/semantic.ts`: bounded input schemas, parsers, source-coverage and composite-identity types, size limits, and canonical semantic acceptance fingerprint inputs.
- `packages/atlas-core/src/semantic-authority.ts` and `packages/atlas-core/src/semantic-internal-route.ts`: additive qualified-acceptance authority/handler seam and service-authenticated route. Existing extraction and reconciliation result routes remain compatible.
- `packages/atlas-core/src/project-repository.ts`: add the explicit persisted member and bundle lifecycle values; do not relabel them as technical failure or review-ready completion.
- `packages/atlas-db/migrations/0026_semantic_qualified_deferred_acceptance.sql`: durable deferred-acceptance projection, lifecycle constraints for `qualified_deferred`, and ownership/revocation grants. No `tenantId` or `documentVersion` field is added.
- `packages/atlas-db/src/semantic-authority.ts`: fenced execution state transition and idempotence for the new qualified route.
- `packages/atlas-db/src/extraction-acceptance.ts`: shared canonical-subset validation/materialization plus deferred coverage persistence; reconciliation only for materialized canonical candidates.
- `packages/atlas-db/src/project-repository.ts`: read and expose the new persisted lifecycle without guessing a completed count or Master effect.
- `apps/atlas/perception-internal.ts`: compose the route with the Atlas handler at `/internal/semantic/qualified-result` only.
- `apps/atlas/lib/home-projects.ts` and its focused tests: display the existing authorized lifecycle as deferred review/attention without presenting it as technical failure, published work, or ready-for-review completion.

The later `SEM-CUTOVER-007A` Bridge handoff owns its own subsequent migration and sends this contract only after its fenced composite winner exists. This ticket neither reaches into `bridge.semantic_composite_stage` nor writes Bridge tables.

## Review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-DA-01` | The qualified route is service-authenticated, scope-bound to the live extraction execution, and idempotent only for an identical hash-bound input. A foreign/stale/completed/cancelled execution, changed composite identity, or changed coverage rejects with zero acceptance effects. |
| `RC-DA-02` | For a partial outcome, existing canonical validation still governs every materialized candidate/evidence. Canonical inventory plus persisted qualified deferred coverage partitions the exact eligible locator set once; duplicate, missing, unknown, overlap, or unqualified coverage rejects atomically. |
| `RC-DA-03` | A valid partial outcome persists its deferred identity/coverage and only its independently supported canonical result/candidates. It enqueues reconciliation only for materialized canonical candidates; deferred sources never become `non_fact`, candidates, accepted relationships, or reconciliation input. |
| `RC-DA-04` | A valid fully deferred outcome writes a reviewable `qualified_deferred` record and terminal member/bundle lifecycle as applicable, while creating zero Semantic V1 result/envelope, candidate, evidence, knowledge-index, reconciliation execution, or job. Master and publication remain unchanged. |
| `RC-DA-05` | Lifecycle/read-model presentation distinguishes `qualified_deferred` from technical failure and normal `ready_for_review`; mixed bundles remain processing until all members reach a truthful terminal state, and a deferred terminal bundle leaves the Initial Draft and Master unchanged. |
| `RC-DA-06` | Existing all-canonical extraction acceptance and reconciliation remain unchanged, including their replay/idempotence, failure, and ready-for-review behavior. |

## Required validation

Use isolated PostgreSQL with registered migrations and the real Atlas internal route. The acceptance suite must cover:

1. A partial canonical result with one independently supported candidate and one qualified deferred source. Assert exact canonical-plus-deferred partition, persisted hashes/coverage, only the canonical candidate/evidence/index rows, and exactly the permitted reconciliation enqueue.
2. A fully deferred composite covering all eligible sources. Assert the reviewable deferred record/member and bundle disposition, exact hashes/coverage, and zero result/candidate/evidence/index/reconciliation/job/Master/publication effects.
3. Replays of each identical input; foreign scope, execution, source, composite/sidecar/revision hash, malformed coverage, canonical/deferred overlap, duplicate/unknown/missing locator, unqualified classification, and changed fingerprint negatives. Each negative proves atomic zero-effect behavior.
4. Existing full-canonical extraction acceptance and reconciliation integration tests unchanged.
5. Route/client redaction and lifecycle projection tests, including no conversion of qualified deferral to technical failure or successful completed processing.

`RC-007A-E2E` remains owned by the later main ticket. This prerequisite supplies its lifecycle acceptance dependency and must independently CK-pass before any `GO SEM-CUTOVER-007A`.

## Explicit prohibitions

- Do not add or fabricate `tenantId` or `documentVersion` fields or mappings.
- Do not alter the frozen eight-stage prompts, relationship method, provisional sidecar, REL-03 schema/history, RUN-003, D1 scheduling, publication, Master, or provider routes.
- Do not call an external provider, enable automatic semantic scheduling, or write unrelated worktree files.

## CK handoff

The GO checkpoint must provide an exact row-by-row closure ledger for `RC-DA-01` through `RC-DA-06`, migration proof, isolated PostgreSQL commands/output, route evidence, and `Internal readiness: READY_FOR_CK`. Only independent CK may issue `PASS`.
