# SEM-CUTOVER-007 — Canonical offline stepwise worker composition and durable composite staging

**Status:** `planned` · **Size:** M · **Owner:** extraction-specific worker/composition seam, offline fake only · **Dependencies:** independently CK-approved SEM-006, the CK-qualified SEM-005 / SEM-006 / REL-03 predecessor preparation at `f95747a`, and independently CK-approved `REL-03-DURABLE-001`. Explicit GO is required; this ticket realignment is not implementation authorization.

## Exact objective

Replace only the legacy **extraction** invocation in `apps/agents-bridge/src/semantic-worker.ts` with one explicitly selected, injectable, offline stepwise successor path. Compose the normalized document, the stepwise source packet, one versioned relationship-envelope request, exact authorized ephemeral media when available, the provider-neutral capability/preflight boundary, one controlled fake structured request, strict REL qualification, SEM-006 projection, SEM-005 accounting, and the approved REL-03 durable composite winner. Preserve reconciliation's existing skill and string-message interface. No live provider route, admission reservation, normal D1 semantic job, or canonical production activation is enabled by this ticket.

The canonical RUN-003 D1 path must remain `perceived` with zero normal semantic jobs and zero provider requests. The offline successor is explicitly test-selectable/injectable only and must not be activated by ordinary D1 execution.

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

## Ordered extraction effects

The offline stepwise extraction flow is exactly:

1. Obtain the exact authorized extraction context.
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

`preflightMultimodalRequest()` is a structural request-spec/resource estimator, not admission permission. The controlled fake must receive exact source-derived visual identities and controlled bytes whose byte length, SHA-256 digest, media type, and dimensions are independently verified against the normalized-document visual locator and authorized media-resolution result before preflight or dispatch.

A normalized-document `assetRef` alone does not grant permission to retrieve image bytes. If no existing authorized media-resolution mechanism can provide the required bytes, distinguish the bounded offline fixture capability from the separately owned production hydration/grant contract and STOP before assuming production authority. No live provider call, unauthorized image hydration, admission reservation, media leakage, or credential leakage is allowed. Unknown image TPM must retain the approved `RESOURCE_ENVELOPE_BLOCKED` result; the fake must not invent zero-token accounting or treat preflight as admission.

## Review contract and evidence mapping

Preserve all six frozen review rows. Each row must be proven with an executable test plan at the current architecture:

| ID | PASS iff | Required evidence and negative |
|---|---|---|
| RC-007-01 | One explicit versioned stepwise extraction path handles deterministic text-only and image-bearing fixtures, with no legacy fallback. | `semantic-worker.test.ts` and the integration harness observe the selected profile/request path for both fixture classes; attempted old prompt/default or image-dependent fallback fails canonical admission. |
| RC-007-02 | The provider-neutral multipart fake receives exact authorized owned source/asset references and remains neutral across adapters. | Exact media identity, capability/preflight bounds, and pre-dispatch rejection are observed for wrong asset SHA, missing grant, unsupported capability, oversize, and unknown profile. `RESOURCE_ENVELOPE_BLOCKED` remains observable for unknown image TPM. |
| RC-007-03 | Strict REL envelope qualification, SEM-006 projection, SEM-005 accounting, and rejection of forged evidence occur before durable staging. | Positive ordinary/mixed/fully deferred cases use the approved APIs; forged relationship, uppercase schema, extra field, missing owned slot, substituted normalized document, and other named malformed evidence fail before `createSemanticCompositeReplay().stage()`. |
| RC-007-04 | Actual approved composite staging provides immutable winner replay, lease fencing, and instrumented offline recovery without duplicate effects. | `semantic-worker.integration.test.ts` uses isolated PostgreSQL for the real stage/recovery boundary, with positive controls and observations for stale claim, stage mismatch, delivery failure, cancellation, crash/restart, ack-loss, winner identity, and sidecar hash. The read-only durable replay integration remains prerequisite evidence; ordinary `createSemanticResultReplay()` is not a substitute. |
| RC-007-05 | Denied routes produce zero provider, admission, and job side effects under working non-inert counter fakes with positive controls. | Counters must show positive control increments and zero denied-route effects; empty arrays without an instrumented effect boundary do not count. |
| RC-007-06 | Normal canonical D1 remains `perceived`, with zero semantic jobs/provider requests and unchanged reconciliation. | The integration evidence observes the canonical D1 stop and unchanged reconciliation interface; no provider key/route enabling or new background execution is allowed. |

Compose and database tests use isolated resources only, never the accepted `atlas-canonical-perception` database/volumes. No external calls are permitted. Required evidence must include source/packet/provider/finalizer imports, resource bounds, service-credential redaction, durable replay, strict trace, and the real PostgreSQL staging/recovery observations. If a required observation needs a previously approved owner outside SEM-007, stop rather than weakening the row.

## Stopping conditions

If satisfying an existing RC requires modifying a previously approved owner outside SEM-007, STOP and record:

1. the exact missing API or incompatible contract;
2. the file/function owner;
3. the smallest reproducible failed composition; and
4. whether the failure blocks the offline fake path or only future live enablement.

Do not reopen `REL-03-DURABLE-001`, SEM-005, SEM-006, or the source-authority implementation without concrete evidence of a genuine defect. Do not create speculative follow-up tickets. Do not silently expand this ticket into provider activation, admission, live hydration, Atlas lifecycle changes, migration/schema changes, Master/publication, reconciliation changes, or normal D1 semantic execution.

## Terminal

After this ticket-only realignment, the planning decision is **`SEM-007_GO_READY`**: the ticket accurately consumes the approved predecessors, names explicit implementation ownership, and gives each frozen RC an executable architecture-aligned test plan. This is not implementation readiness evidence, GO, CK, CFC, or PASS.

Keep SEM-CUTOVER-007 `planned` until separately invoked GO and independent acceptance. No automatic GO, CFC, or CK is authorized by this ticket amendment.
