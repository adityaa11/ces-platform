# SEM-CUTOVER-007 — Canonical offline stepwise worker composition and durable composite staging

**Explicit human-authorized amendment (2026-10-14):** This bounded planning amendment resolves the repeated D1 authority and offline-composition blockers recorded in `project's goal/feedback/SEM-CUTOVER-007-go-blocked-002.md`, after `HMN-SEM-CUTOVER-007-001` and `HMN-SEM-CUTOVER-007-002`. It is not GO, CK, CFC, production implementation, or upstream-owner authorization.

**Status:** `awaiting_review` · **Size:** M · **Owner:** extraction-specific worker/composition seam, offline fake only · **Dependencies:** independently CK-approved SEM-006, the CK-qualified SEM-005 / SEM-006 / REL-03 predecessor preparation at `f95747a`, and independently CK-approved `REL-03-DURABLE-001`. Explicit GO is required; this ticket realignment is not implementation authorization.

## Exact objective

Replace only the legacy **extraction** invocation in `apps/agents-bridge/src/semantic-worker.ts` with one explicitly selected, injectable, offline stepwise successor path. Compose the normalized document, the stepwise source packet, one versioned relationship-envelope request, exact authorized ephemeral media when available, the provider-neutral capability/preflight boundary, one controlled fake structured request, strict REL qualification, SEM-006 projection, SEM-005 accounting, and the approved REL-03 durable composite winner. Preserve reconciliation's existing skill and string-message interface. No live provider route, admission reservation, normal D1 semantic job, or canonical production activation is enabled by this ticket.

The canonical RUN-003 D1 path must remain `perceived` with zero normal semantic jobs and zero provider requests. The offline successor is explicitly test-selectable/injectable only and must not be activated by ordinary D1 execution.

## Canonical RUN-003 D1 interpretation (`RC-007-06`)

`RC-007-06` tests the actual canonical RUN-003 staged route. In
`packages/atlas-db/src/perception-authority.ts:210-243`, when the locked
`perception_admission_policy` is `staged-fair-local-v1`, the transaction
records the member as `perceived`, completes the perception execution, and
returns at line 221 before the later historical semantic-execution creation
and queue-enqueue statements. The downstream statements remain separately
guarded historical continuation code; their existence is not by itself a
violation of `RC-007-06`.

The independently reviewed PERC-RESET-008 CK `PASS` at `9f31026` is read-only
evidence of this canonical behavior: four accepted RUN-003 documents remained
`perceived`, with zero semantic executions and zero background jobs. SEM-007
must preserve that route and reconciliation behavior. No queue suppression,
route change, or edit to `perception-authority.ts` is authorized here.

GO must prove the effective canonical policy/route and the required zero
semantic effects using the named regression observations. GO/CK must not issue
another `RC-007-06` blocker solely because the downstream enqueue statements
exist. If an actual canonical staged D1 execution reaches those statements,
the checkpoint must stop and provide a reproducible counterexample identifying
the effective policy, semantic execution, code path, and observed semantic job.

## Approved prerequisite authority

SEM-007 consumes the following as read-only, already qualified interfaces and evidence. It does not reopen, re-review, or modify them.

| Prerequisite | Approved evidence consumed by SEM-007 |
|---|---|
| `SEM-CUTOVER-006` | Independently CK-approved at reviewed remediation commit `0d8a8a1`; verification: `project's goal/feedback/SEM-CUTOVER-006-0d8a8a1-verification.md`. The finalizer/context-authority boundary is closed for this dependency. |
| SEM-005 / SEM-006 / REL-03 qualified predecessor preparation | CK `PASS` at `f95747a`; verification: `project's goal/feedback/REL-03-DURABLE-001-f95747a-verification.md`. The qualified preparation, projection, and accounting contracts are consumed without reconstructing their rules in the worker. |
| `REL-03-DURABLE-001` | Independently CK-approved at `7657d92`; approved ticket status is committed at `caaaf21`; verification: `project's goal/feedback/REL-03-DURABLE-001-7657d92-verification.md`. The durable composite interface is the SEM-007 staging boundary. |

The earlier prerequisite wording that durable composite staging was not yet qualified is superseded for this ticket. Historical tickets and review artifacts remain unchanged.

## Approved durable interface binding

The current `runSemanticJob()` uses the legacy `SemanticReplay.stage(idempotencyKey, executionId, envelope, lease)` ordinary-result interface. SEM-007 must not treat that interface as the durable composite API.

The extraction successor must explicitly use the approved APIs:

- `buildStepwiseSourcePacket()`;
- `buildStepwiseRelationshipEnvelopeRequest()`;
- `prepareQualifiedStepwiseSemanticPreparation()`;
- `projectQualifiedStepwiseSemanticResult()`;
- `prepareQualifiedStepwiseSemanticCompositeAccounting()`;
- `verifyQualifiedStepwiseSemanticPreparation()`;
- `semanticCompositeHash()`; and
- `createSemanticCompositeReplay().load()` / `.stage()`.

The durable stage input must contain exactly the bounded identity and qualified preparation required by the approved interface:

- `idempotencyKey`;
- semantic `executionId`;
- the actual fenced lease `owner` and `generation`;
- `QualifiedSemanticCompositePreparation`; and
- the exact `compositeHash` calculated from that qualified preparation and sanitized immutable winner.

`QualifiedSemanticCompositePreparation` must retain the approved accounting, exact versioned request, parsed provider proposal, canonical Semantic V1 result or genuine `null`, and the original REL-03 qualification inputs. The worker must use those predecessor APIs; it must not reconstruct relationship validation, classification, nullable finalization, deferred-meaning qualification, or composite accounting inside the worker or a new worker-local substitute. Perception execution identity and semantic execution identity remain distinct and must be preserved through the source snapshot, accounting scope, request, and durable winner.

The exact request and parsed proposal are qualification inputs for the bounded preparation/verifier; the persistable sidecar remains the approved sanitized accounting projection. Do not store a full provider-response body or source/media bytes in the persistable sidecar merely to support re-verification.

## Authorized offline semantic qualification context

SEM-007 is an offline-only worker-composition ticket. Its tests may use a
test-selectable, explicitly injected semantic qualification context assembled
within SEM-007-owned files. The context is a fixture input to the offline
composition seam; it is not production authorization, accepted relationship
truth, or evidence that `PostgresSemanticAuthority.redeem()` issued a context
for a canonical D1 document.

The injected context must contain all of the following before fake provider
dispatch:

- one complete, validated, bounded `NormalizedDocument V1` fixture;
- a synthetic semantic execution ID distinct from the fixture's perception
  execution ID;
- explicit synthetic project, workspace, bundle, and document scope whose
  identities agree across the context, fixture, request, and winner;
- the fixture's complete owned source set and source-bound asset identities,
  where visual sources exist;
- an independently controlled fake media-authorization/resolution result,
  including the exact bytes and verified identity metadata required by the
  offline fake;
- existing qualified provisional/prior revisions where applicable, or
  explicit empty arrays when no prior revisions exist; and
- deterministic fake provider responses with explicit provider identity and
  provenance.

The context must be validated against its own frozen fixture scope before any
fake provider dispatch. A forged or substituted normalized document, foreign
source or asset, invalid media grant, malformed revision, or mismatched
perception/semantic execution identity must fail closed before provider,
admission, job, durable-stage, or delivery effects. No worker-local default
may silently grant authority or synthesize missing qualification inputs.

This test seam does not authorize changes to the semantic extraction contract,
`PostgresSemanticAuthority`, provider adapters, admission, or production
routes. The canonical D1 path remains the staged route described above.

## Fixture boundary

Use small, complete, deterministic offline fixtures for SEM-007 worker
composition. Project A and Project B from RUN-003 remain read-only canonical
perception evidence for provenance and D1-preservation observations; full
semantic processing of those projects is not required to close this ticket.

A smaller fixture derived from their examples must have a distinct synthetic
identity and complete accounting of its actual owned source set. Never retain
an original complete-document identity while omitting any original source
units. Every fixture source, visual locator, asset identity, scope identity,
execution identity, revision list, provider response, and provenance record
must belong to that synthetic fixture.

Do not implement semantic batching, source-context windows, per-batch resource
envelopes, or aggregation in SEM-007. Those belong to `IDSER-012-02-01` and
its successors.

## Ordered extraction effects

The offline stepwise extraction flow is exactly:

1. Obtain the exact test-selected injected offline qualification context, or
   the separately authorized context when a future owner supplies one.
2. Build the stepwise source packet from that context's normalized document.
3. Build one versioned stepwise relationship-envelope request.
4. Resolve only authorized ephemeral media for the controlled fake test.
5. Apply the provider-neutral profile, capability, and preflight bounds.
6. Dispatch one controlled offline fake structured request.
7. Strictly parse and qualify the returned relationship envelope.
8. Produce the SEM-006 canonical partial/`null` projection.
9. Produce and verify SEM-005 accounting.
10. Calculate the exact qualified durable composite identity.
11. Look up or stage one fenced immutable winner.
12. Exercise only the authorized offline continuation/recovery effects.

Before any provider invocation in step 6, perform the appropriate winner/replay check. A committed winner must be loaded and continued without another provider attempt. No relationship append, downstream provisional-sidecar persistence, canonical completion, ordinary delivery, or other delivery effect may precede the complete qualified durable stage in step 11.

The focused negative matrix must attempt to substitute a different normalized document after the authorized context has been retrieved. The substitution must fail closed before provider dispatch or durable staging. This negative protects the worker composition boundary and does not reopen the pure predecessor source-authentication contract.

## Durable staging versus delivery

`createSemanticCompositeReplay()` stores and reloads one immutable composite winner. It is not interchangeable with `createSemanticResultReplay()` or `AtlasSemanticClient.deliver()`.

- Do not convert `canonicalResult: null` into an empty Semantic V1 object.
- Do not deliver fully deferred interpretation as accepted canonical meaning.
- Do not acknowledge, delete, or replace the durable composite winner merely because a transport operation completed.
- Use a bounded, instrumented offline continuation/delivery harness where necessary to exercise recovery, lease fencing, ack-loss, cancellation, and delivery-failure boundaries without claiming Atlas result acceptance.
- Preserve existing production semantic result-delivery behavior outside this offline successor lane.

The SEM-007 harness must prove the durable winner through isolated PostgreSQL and the approved composite replay API. Pure fake counters do not replace actual staging/recovery database evidence. If a fully deferred outcome requires changing an Atlas result-acceptance or lifecycle contract, STOP and identify the future owning boundary: the Atlas semantic result acceptance/lifecycle owner around `createSemanticInternalRoutes` / `PostgresSemanticAuthority`, in a separately authorized future ticket. Do not silently change that contract in SEM-007.

## Implementation ownership and permitted paths

Only a separately invoked GO may modify the following SEM-007-owned paths for extraction-specific worker composition, composition-root integration, and focused proof:

- `apps/agents-bridge/src/semantic-worker.ts` — extraction successor selection and ordered worker effects;
- `apps/agents-bridge/src/worker-main.ts` — explicit offline composition-root injection/test selection, without activating live routes;
- `apps/agents-bridge/tests/semantic-worker.test.ts` — focused worker unit and negative tests;
- `apps/agents-bridge/tests/semantic-worker.integration.test.ts` — bounded worker integration, isolated PostgreSQL, counters, and D1-stop observations; and
- one new helper only if necessary: `apps/agents-bridge/src/semantic-offline-stepwise-composition.ts`, explicitly owned by SEM-007 and limited to this composition. No additional helper ownership is implied.

The existing SEM-007 implementation allowlist is otherwise unchanged. In
particular, SEM-007 must not modify:

- `packages/atlas-db/src/perception-authority.ts`;
- `packages/atlas-db/src/semantic-authority.ts`;
- shared semantic production contracts;
- provider adapters;
- approved REL-03, SEM-005, or SEM-006 code;
- durable replay implementation or harness;
- production admission, batch planner, or database migrations/schema.

Approved predecessors, unrelated dirty work, and unrelated untracked worktree
material must be preserved.

The following are approved read-only dependencies and may be inspected or called, but are not SEM-007 mutation scope:

- `apps/agents-bridge/src/semantic-composite-replay.ts`;
- `apps/agents-bridge/src/semantic-relationship-interoperability-bridge.ts`;
- `apps/agents-bridge/src/semantic-extraction-finalizer.ts`;
- `apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts`;
- `apps/agents-bridge/tests/semantic-relationship-interoperability-bridge.test.ts`;
- `apps/agents-bridge/src/provider-capabilities.ts`, including the existing `preflightMultimodalRequest()` boundary; and
- the approved `@atlas/skills` stepwise packet, request, and qualified accounting APIs and their tests.

Do not assume authorization to modify `apps/agents-bridge/src/worker.ts`, provider adapters, provider-neutral shared capability contracts, route/admission code, Atlas semantic authority, database migrations, SQL schema, `semantic-composite-replay.ts`, or any other durable replay owner. Do not modify reconciliation's skill or string-message interface. If a permitted composition cannot be completed without one of those owners, apply the stopping conditions below.

## Multimodal fake authority

`preflightMultimodalRequest()` is a structural request-spec/resource estimator, not admission permission. The controlled fake must receive exact source-derived visual identities and controlled bytes whose byte length, SHA-256 digest, media type, and dimensions are independently verified against the normalized-document visual locator and the independently controlled fake media-authorization/resolution result before preflight or dispatch.

A normalized-document `assetRef` alone does not grant permission to retrieve image bytes. If no existing authorized media-resolution mechanism can provide the required bytes, distinguish the bounded offline fixture capability from the separately owned production hydration/grant contract and STOP before assuming production authority. No live provider call, unauthorized image hydration, admission reservation, media leakage, or credential leakage is allowed. Unknown image TPM must retain the approved `RESOURCE_ENVELOPE_BLOCKED` result; the fake must not invent zero-token accounting or treat preflight as admission.

## Review contract and evidence mapping

Preserve all six frozen review rows. Each row must be proven with an executable test plan at the current architecture:

| ID | PASS iff | Required evidence and negative |
|---|---|---|
| RC-007-01 | One explicit injectable versioned stepwise worker path handles complete bounded deterministic text-only and image-bearing fixtures, with no legacy fallback. | One focused worker path in the SEM-007-owned tests selects the injected offline context and observes the selected profile/request for both fixture classes; attempted old prompt/default or image-dependent fallback fails. |
| RC-007-02 | The provider-neutral multipart fake receives exact authorized owned source/asset references and remains neutral across adapters. | An independently controlled fake media-authorization/resolution result is verified, then exact multipart preflight and pre-dispatch negatives observe wrong asset SHA, missing/invalid grant, unsupported capability, oversize, and unknown profile. `RESOURCE_ENVELOPE_BLOCKED` remains observable for unknown image TPM. |
| RC-007-03 | The actual approved REL-03 -> SEM-006 -> SEM-005 qualification path handles ordinary, mixed, and fully deferred/null outcomes before durable staging, and rejects forged evidence. | Positive cases use the approved APIs; forged relationship, uppercase schema, extra field, missing owned slot, substituted normalized document, malformed revision, foreign source/asset, and mismatched execution identity fail before `createSemanticCompositeReplay().stage()`. |
| RC-007-04 | SEM-007-owned worker integration provides actual approved composite staging, immutable winner replay, lease fencing, and observable offline recovery without duplicate effects. | `semantic-worker.integration.test.ts` uses real isolated PostgreSQL for the worker-to-approved-composite boundary, with observations for stale claim, stage mismatch, delivery failure, cancellation, crash/restart, ack-loss, winner identity, and sidecar hash. Approved REL-03 evidence remains predecessor evidence, not a substitute for this worker proof. |
| RC-007-05 | Denied routes produce zero provider, admission, and job side effects under working non-inert counter fakes with positive controls. | Counter positive controls must increment and denied-route counters must remain zero for provider, admission, and job effects; empty arrays without an instrumented effect boundary do not count. |
| RC-007-06 | The effective canonical staged RUN-003 D1 route remains `perceived`, with zero semantic jobs/provider calls and unchanged reconciliation. | The integration evidence identifies the effective `staged-fair-local-v1` policy/route, observes the line-221 terminal return behavior and unchanged reconciliation, and proves zero semantic executions/jobs/provider calls. The separately guarded downstream enqueue statements are not a violation unless a reproducible canonical staged counterexample reaches them. |

Compose and database tests use isolated resources only, never the accepted `atlas-canonical-perception` database/volumes. No external calls are permitted. Required evidence must include source/packet/provider/finalizer imports, resource bounds, service-credential redaction, durable replay, strict trace, and the real PostgreSQL staging/recovery observations. If a required observation needs a previously approved owner outside SEM-007, stop rather than weakening the row.

## Stopping conditions

If satisfying an existing RC requires modifying a previously approved owner outside SEM-007, STOP and record:

1. the exact missing API or incompatible contract;
2. the file/function owner;
3. the smallest reproducible failed composition; and
4. whether the failure blocks the offline fake path or only future live enablement.

Do not reopen `REL-03-DURABLE-001`, SEM-005, SEM-006, or the source-authority implementation without concrete evidence of a genuine defect. Do not create speculative follow-up tickets. Do not silently expand this ticket into provider activation, admission, live hydration, Atlas lifecycle changes, migration/schema changes, Master/publication, reconciliation changes, or normal D1 semantic execution.

## Terminal

After this explicitly authorized ticket-only amendment, the terminal planning decision is **`SEM_007_GO_READY_AMENDED`**: the ticket expressly covers the offline fixture seam, canonical staged-D1 interpretation, exact fixture boundary, ownership prohibitions, and executable evidence methods for all six preserved RC rows. This is not implementation readiness evidence, GO, CK, CFC, or PASS.

Keep SEM-CUTOVER-007 `awaiting_review` pending separately invoked independent CK acceptance. No automatic GO, CFC, or CK is authorized by this ticket amendment.
