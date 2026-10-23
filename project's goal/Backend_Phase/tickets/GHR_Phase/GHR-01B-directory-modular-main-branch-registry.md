# GHR-01B — Directory-modular main → branch registry foundation

- **State:** `awaiting_review`; implementation/review target `0212ee83` (`feat(bridge): add GHR branch registry foundation`). See the [GO checkpoint](../../../feedback/GHR-01B-go-checkpoint.md). Second replacement for [GHR-01 split manifest](GHR-01-generic-envelope-and-main-branch-registry.md). Derived from [GHR implementation context v0.6](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md). This state is not CK PASS, route activation, or authorization to change predecessor contracts.
- **Phase:** GHR Test 1 foundation; `can_continue=false` remains the sole current mode.
- **Dependency:** GHR-01A CK PASS. Consume its generic types/contract only; do not reopen its raw-ingress or byte-integrity implementation.
- **Successors:** GHR-02 owns trusted same-transaction issuance and pointer-only pg-boss dispatch. GHR-03 owns the first actual semantic route, body adapter, receiver, and durable `parsed_only` ACK.

## Outcome

Create the application-layer composition and exact-registration foundation for GHR without a deliverable route. The root index maps main domains only; each domain owns its local registry seam. The sole Test-1 route can be represented in a type/unit test, but no production branch, receiver, body adapter, issuer, or delivery is registered or activated here.

## Exact scope

1. Add `apps/agents-bridge/src/ghr/core/branch-registry.ts` and minimal supporting generic types. Its interface resolves a registered binding by exact `{ main, branch, producer process key, policyVersion, handlerVersion, bodyContract.type, bodyContract.version }` only.
2. Establish the frozen directory seams:

   ```text
   apps/agents-bridge/src/ghr/
     core/
     routes/
       semantic/{branches,bodies,receivers,index.ts}
       reconciliation/{branches,bodies,receivers,index.ts}
       projection/{branches,bodies,receivers,index.ts}
     main-route-index.ts
   ```

   `main-route-index.ts` imports only the three domain `index.ts` modules. Each local index owns only its own local registry. Empty reconciliation/projection registries are allowed, but no inactive body contract, branch, receiver, fixture, or runtime API is added for them.
3. Prove the interface can exactly represent only the prospective first-Test-1 binding: `perception.acceptance` → `semantic/batch-plan`, `policyVersion=v1`, `handlerVersion=v1`, `SemanticBatchPlanInput/v1`, with `can_continue=false` reserved for the future issuer, a 2,048-byte canonical payload bound, and a 2,081-byte exact false-wrapper bound. Those route constraints are metadata only here; GHR-03 enforces payload syntax with the existing canonical parser. That test representation is not a runtime registration and cannot authorize a sender or activate delivery.
4. Reject unknown/mismatched main, branch, producer, policy pin, handler pin, or body-contract type/version. There is no wildcard, default, fallthrough, dynamic import/module path, client-selected destination, queue name, or fallback handler.
5. Keep the semantic body/receiver boundary empty for GHR-03: it alone adds `semantic/branches/batch-plan.route.ts`, `semantic/bodies/semantic-batch-plan-input.v1.ts`, and `semantic/receivers/batch-plan.receiver.ts`. Preserve `@atlas/db`'s canonical parser as that future adapter's sole authority.

## Required invariants

- A registry is an allowlist-shaped composition seam, not issuer authorization, delivery activation, or a source of trusted identity. Only GHR-02's future issuer may authorize and persist a route transition.
- The registry neither parses generic raw bytes nor semantic payloads. It consumes GHR-01A types; it does not reimplement its schemas, limits, guards, or hashing.
- `apps/agents-bridge/src/route-registry.ts` remains provider/model routing, and BSS registries remain capacity/admission systems. Neither is reused or altered.
- No domain payload, raw body, PDF/media, prompt, provider response, credential, or source-storage key enters registry metadata or diagnostics.

## Explicit non-goals

- No generic schema/raw parser/hash implementation, persistence, migration, database role, issuer, acceptance-path change, queue/job/worker, dispatcher, transport, delivery lease, receipt, or ACK.
- No actual `semantic/batch-plan` branch/receiver/body adapter, parser call, `resolveBackground()`, IDSER/BSS/SEM work, reconciliation, projection, or downstream handoff.
- No `can_continue=true` code, test, fixture, activation gate, manual replay, reissue, mode promotion, or alternative queue/transport.

## Binary review contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-01B-RC-01 | The root imports only the three domain indexes; every domain owns local `branches`, `bodies`, `receivers`, and `index.ts`; no giant switch, body union, or core import of a domain parser exists. | Composition test and static source-boundary assertions. |
| GHR-01B-RC-02 | Exact lookup/type registration can express the sole prospective Test-1 binding, including the 2,048-byte payload and 2,081-byte exact false-wrapper bounds, and rejects every mismatched/unknown selector. It permits no wildcard, fallback, dynamic module path, provider-route-registry reuse, authorization, or delivery side effect. | Typed/unit tests and zero-side-effect oracle. |
| GHR-01B-RC-03 | Test execution creates no migrations/writes, queues/jobs, dispatches, receipts, resolver calls, or domain/provider/reconciliation/projection effects. | Focused typecheck/test and non-inert static dependency check. |

## Security readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-01B-B1` trusted issuer retains transition authorization and immutable pins; `GHR-01B-B2` GHR-01A owns raw ingress/integrity; `GHR-01B-B3` receiving domains retain payload parsers.
- **Trust boundaries:** `GHR-01B-T1` a type/registry match is not producer authentication or route authorization; `GHR-01B-T2` the registry forwards no payload and has no execution capability.
- **Sensitive assets:** `GHR-01B-A1` route/policy/handler/body-contract pins and symbolic destination identity; `GHR-01B-A2` prohibited body/secret content absent from registry metadata.
- **Identity context:** `GHR-01B-I1` preserve explicit producer-process and version-pin fields for later issuer/revocation checks; never derive them from a caller-selected route.
- **Extension seams:** `GHR-01B-S1` exact typed lookup supports future revocation/policy checks; `GHR-01B-S2` local domain indexes provide receiver-owned attachment points; `GHR-01B-S3` root-only domain composition prevents a global business-payload union.
- **Prohibited couplings:** `GHR-01B-C1` no provider/BSS registry reuse; `GHR-01B-C2` no body parser/core coupling; `GHR-01B-C3` no dynamic destination/function/module/queue selection; `GHR-01B-C4` no activation or dispatch behavior.
- **Verification seams:** `GHR-01B-V1` static import/composition tests; `GHR-01B-V2` exact-selector negative tests; `GHR-01B-V3` zero-side-effect check.
- **Unresolved security policy:** cross-service authentication, anti-replay, and keyed message authentication remain deferred.
- **Planning findings:** none; a need for a live receiver, an authorized transition, or dynamic/fallback resolution is a hard stop.
- **Review bindings:** `GHR-01B-RB-01` verifies `T1/I1/S1/C1..C3` through exact-selector and source-boundary tests; `GHR-01B-RB-02` verifies `T2/V3/C4` through the zero-side-effect oracle.

## Hard stop

Return a planning finding if root composition requires a domain parser, a first route must become live to prove the registry, exact pinned lookup needs a fallback/wildcard, or an acceptance/dispatch side effect is required. Do not add an adapter, receiver, dispatcher, issuer, or queue merely to make this ticket fit.
