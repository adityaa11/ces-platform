# SEM-CUTOVER-007 — Human-authorized contract clarification

- **Decision:** `SEM_007_GO_READY_AMENDED`
- **Ticket:** `SEM-CUTOVER-007`
- **Action:** bounded planning amendment only
- **Date:** 2026-10-14
- **Branch:** `codex/new-atlas-backend`
- **Inspected HEAD:** `bff430f243e834de0195a4d759d54790fb7bc115`
- **Workflow state:** `planned`

## Authorization and terminal boundary

The user explicitly authorized this ticket amendment to resolve the two
repeated GO authority blockers. This record does not authorize production
implementation, GO, CK, CFC, upstream-owner changes, queue suppression,
provider calls, canonical D1 semantic execution, or production activation.

Only the frozen SEM-007 ticket and this planning-decision record are in scope.
Existing tracked dirty work and unrelated untracked material are preserved.

## Inspected authority

- Latest blocked composition: `project's goal/feedback/SEM-CUTOVER-007-go-blocked-002.md`.
- Prior planning decisions: `SEM-CUTOVER-007-hmn-001.md` and
  `SEM-CUTOVER-007-hmn-002.md`.
- Frozen ticket amended:
  `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-007-offline-stepwise-worker-composition.md`.
- Shared Atlas Review Contract:
  `project's goal/atlas-go-ck-cfc-hmn-shared-review-contract-implementation-context.md`.
- Canonical D1 implementation:
  `packages/atlas-db/src/perception-authority.ts:210-243`.
- Current semantic context boundary:
  `packages/atlas-contracts/src/semantic.ts:29,35` and
  `packages/atlas-db/src/semantic-authority.ts:37-42`.
- Independent PERC-RESET-008 CK `PASS`:
  `project's goal/feedback/PERC-RESET-BATCH-08-9f31026-review.md`, reviewed
  commit `9f31026`.

## Clarification 1 — canonical staged D1

For `perception_admission_policy === "staged-fair-local-v1"`, the transaction
updates the member to `perceived`, completes the perception execution, and
returns at `perception-authority.ts:221` before the later historical semantic
execution creation and enqueue statements. Those separately guarded statements
are not, by their existence alone, an `RC-007-06` violation.

PERC-RESET-008 CK independently observed four accepted RUN-003 documents at
`perceived`, with zero semantic executions and zero background jobs. The
amended ticket therefore requires GO to prove the effective canonical policy
and route, zero semantic effects, and unchanged reconciliation. It explicitly
prohibits edits to `perception-authority.ts` and rejects another D1 blocker
based only on downstream enqueue statements. A real violation must be a
reproducible counterexample naming the effective policy, execution, code path,
and observed semantic job.

## Clarification 2 — explicit offline composition input

SEM-007 may compose a test-selectable, injected offline semantic qualification
context in SEM-007-owned files. The amended ticket requires that context to
contain:

- a complete validated bounded `NormalizedDocument V1` fixture;
- distinct synthetic semantic and perception execution identities;
- explicit synthetic project/workspace/bundle/document scope;
- complete owned source accounting and source-bound asset identities;
- independently controlled fake media authorization/resolution with verified
  bytes and identity metadata;
- qualified provisional/prior revisions, or explicit empty arrays; and
- deterministic fake provider responses and provenance.

The fixture scope must be verified before fake dispatch. Substituted or forged
documents, foreign sources/assets, invalid grants, malformed revisions, and
mismatched execution identities fail before provider, admission, job, durable,
or delivery effects. No worker-local default may grant authority.

This context is not production authorization, accepted relationship truth, or
evidence that `PostgresSemanticAuthority.redeem()` issued a canonical D1
context.

## Fixture and ownership boundary

Project A/B RUN-003 material remains read-only canonical perception evidence.
Full semantic processing of those projects is not required. Any smaller
derived fixture must have a distinct synthetic identity and complete accounting
of its actual owned source set; original complete-document identity must not be
preserved while omitting source units.

SEM-007 does not implement semantic batching, source-context windows,
per-batch resource envelopes, or aggregation; those remain with
`IDSER-012-02-01` and successors. The existing implementation allowlist is
preserved, and the amendment explicitly excludes perception authority, semantic
authority, shared semantic production contracts, provider adapters, approved
REL-03/SEM-005/SEM-006 code, durable replay, admission, batch planning, and
migrations/schema.

## Review Contract closure

The exact six rows `RC-007-01` through `RC-007-06` remain present and are not
removed, weakened, or supplemented. Only their evidence methods are clarified:

- `RC-007-01`: one explicit injectable stepwise worker path for complete
  bounded text and image fixtures.
- `RC-007-02`: authorized fake media resolution, exact multipart preflight,
  and pre-dispatch negatives.
- `RC-007-03`: approved REL-03 -> SEM-006 -> SEM-005 qualification, including
  ordinary, mixed, and null outcomes plus forged-evidence rejection.
- `RC-007-04`: SEM-007-owned worker integration with real isolated PostgreSQL,
  immutable composite winner, fencing, and observable recovery; predecessor
  REL-03 evidence is not a substitute.
- `RC-007-05`: non-inert positive-control effects and zero denied-route
  provider/admission/job side effects.
- `RC-007-06`: canonical staged D1 remains `perceived`, with zero semantic
  jobs/provider calls and unchanged reconciliation.

The amended ticket remains the single shared acceptance contract for later GO,
CK, and any explicitly authorized CFC.

## SecurityReadiness

- **status:** `applicable`
- **inheritedBoundaries:** `SR-007-B1` — canonical D1 admission and semantic
  authority remain outside SEM-007; `SR-007-B2` — approved REL/SEM predecessor
  and durable replay interfaces are consumed read-only.
- **trustBoundaries:** `SR-007-T1` — injected offline context to fake provider
  dispatch; `SR-007-T2` — perception execution identity to distinct synthetic
  semantic execution identity; `SR-007-T3` — source/asset grant to ephemeral
  media bytes.
- **sensitiveAssets:** `SR-007-A1` — normalized document and source/asset
  identities; `SR-007-A2` — media bytes and grant metadata; `SR-007-A3` —
  qualified relationship/revision inputs and durable winner identity.
- **identityContext:** `SR-007-I1` — fixture scope, source accounting, asset
  binding, and both execution identities must agree before dispatch.
- **extensionSeams:** `SR-007-E1` — injected qualification context is the
  explicit offline seam; `SR-007-E2` — media authorization remains attachable
  to a separately owned production contract.
- **prohibitedCouplings:** `SR-007-C1` — no worker-local authority defaults;
  `SR-007-C2` — no D1 route/admission/queue edits; `SR-007-C3` — no provider,
  replay, schema, or predecessor-owner mutation.
- **verificationSeams:** `SR-007-V1` — pre-dispatch fixture-scope and identity
  validation; `SR-007-V2` — zero-effect denied-route counters; `SR-007-V3` —
  canonical staged-D1 zero-job/provider observations; `SR-007-V4` — isolated
  PostgreSQL composite winner/recovery observations.
- **unresolvedSecurityPolicy:** production media hydration/grant behavior and
  live admission/resource policy remain intentionally outside SEM-007.
- **reviewBindings:** `SRB-007-01` verifies `SR-007-I1` via RC-007-02/03;
  `SRB-007-02` verifies `SR-007-C2` via RC-007-06; `SRB-007-03` verifies
  `SR-007-V4` via RC-007-04.

## Terminal decision

`SEM_007_GO_READY_AMENDED` is returned because the offline fixture seam,
canonical staged-D1 interpretation, exact fixture boundary, preserved ownership
limits, and all six original review rows are expressly covered by the amended
ticket. No GO is executed automatically.

If a separately invoked GO cannot compose the approved API even with the
explicit offline injection, it must return `HUMAN_DECISION_REQUIRED` with the
smallest reproducible counterexample naming the missing API/owner, effective
scope, code path, and failed observation.
