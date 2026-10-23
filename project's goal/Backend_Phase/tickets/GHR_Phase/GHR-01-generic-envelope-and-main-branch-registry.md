# GHR-01 — Generic handoff envelope and directory-modular main → branch registry

- **State:** `planned`; derived from [Generic Handoff Router (GHR) — Implementation Context v0.6](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md). This ticket is not GO, CFC, CK PASS, route activation, or authorization to change predecessor contracts.
- **Phase:** GHR Test 1 (`can_continue=false` only).
- **Successors:** GHR-02 owns same-transaction accepted-NDV1 issuance and pointer-only pg-boss dispatch; GHR-03 owns the actual `semantic/batch-plan` receiver ingress and durable `parsed_only` ACK.
- **Dependencies:** existing `@atlas/contracts` Zod `4.4.3`; the existing `@atlas/db` `SemanticBatchPlanInput/v1` canonical parser/serializer. Do not reopen their approved contracts.

## Outcome

Create the generic, header-only GHR contract and the composable two-level registry foundation needed by Test 1. The generic router validates a fixed trusted header and a bounded `{ can_continue, payload }` wrapper, while the receiving domain remains the sole owner of business-payload parsing. Registry composition is `main → branch`, with a root index that imports only domain indexes.

This ticket deliberately stops before issuance, persistence, database migration, pg-boss enqueue/worker delivery, or receiver ACK. It creates no active route and no runtime handoff.

## Exact scope

1. Add `packages/atlas-contracts/src/ghr/generic-handoff-envelope.v1.schema.ts` with Zod strict schemas for `GenericHandoffEnvelope/v1`:
   - `header.protocol`, issuance/idempotency IDs, trusted `producer`, pinned `route`, `bodyContract`, `scope`, `correlation`, `integrity`, and offset-aware `issuedAt` exactly as defined by the v0.6 field dictionary.
   - An exact, two-key routed-body wrapper: `can_continue: boolean` and `payload: JsonObject`. The generic layer must not validate semantic or other domain payload fields.
   - Meaningful `.describe()` metadata on every leaf and parent container, stating purpose, trusted origin, and boundary rule. Metadata is documentation, not authentication or authorization.
2. Add generic raw-ingress guards, before Zod parsing, for UTF-8 envelope/header/body limits, depth, object/array cardinality, malformed or duplicate-key JSON, non-finite numbers, and forbidden/prototype-sensitive keys. For Test 1, the frozen limits are:
   - envelope: 75,776 bytes;
   - fixed header: 8,192 bytes;
   - wrapped body: 65,536 bytes;
   - nesting: 16; object properties: 128; array elements: 256.
3. Define generic registration and exact-resolution interfaces under `apps/agents-bridge/src/ghr/core/`, including `branch-registry.ts`, that can bind a registered `{ main, branch, policyVersion, handlerVersion, bodyContract.type, bodyContract.version }` without a wildcard, default, dynamic module path, or fallback handler.
4. Establish the frozen directory ownership and local composition seams:

   ```text
   apps/agents-bridge/src/ghr/
     core/
     routes/
       semantic/{branches,bodies,receivers,index.ts}
       reconciliation/{branches,bodies,receivers,index.ts}
       projection/{branches,bodies,receivers,index.ts}
     main-route-index.ts
   ```

   `main-route-index.ts` imports only the three domain indexes. The semantic index may expose only registration seams needed for the later `batch-plan` branch. Reconciliation and projection may be empty local registries; do not add inactive body contracts, fixtures, handlers, or runtime APIs.
5. Define the single prospective Test-1 registration shape only: `perception.acceptance` → `semantic/batch-plan`, `policyVersion=v1`, `handlerVersion=v1`, `SemanticBatchPlanInput/v1`, with `can_continue=false` reserved for later trusted issuance. Registration itself must not authorize a sender or activate delivery.
6. Preserve the semantic receiver boundary: a future `semantic/bodies/semantic-batch-plan-input.v1.ts` is an adapter to the existing `parseSemanticBatchPlanInputV1()` / `canonicalSemanticBatchPlanInputV1()` owner. Do not duplicate or move the five-field domain parser into generic GHR code.

## Required invariants

- Only an eventual trusted issuer can establish producer identity, route authority, policy/handler pins, scope, idempotency identity, body bytes/hash, and the continuation value. `safeParse()` cannot authenticate a producer or authorize a route.
- `bodySha256` binds the exact canonical wrapped body bytes, including `can_continue`; it is integrity evidence, not message authentication. For later Test-1 use, wrapper bytes must be exactly `{"can_continue":false,"payload":<existing canonical SemanticBatchPlanInput/v1 bytes>}`—not a reserialized parse result.
- `can_continue` is mandatory, has no default or coercion, and Test 1 permits only `false`. Do not add a `true` code path or tests. Future behavior is not part of this ticket.
- Provider/model routing (`apps/agents-bridge/src/route-registry.ts`) and BSS capacity/admission registries remain separate systems with separate authority.
- Payloads, logs, fixtures, and diagnostics must exclude raw PDFs/media, prompts, provider responses, credentials, source storage keys, and other confidential body dumps.

## Explicit non-goals

- No GHR intent/route-policy/delivery tables, migrations, database roles, issuer implementation, `PostgresPerceptionAuthority.deliver()` modification, transactional pg-boss job, outbox, poller, trigger, worker, delivery lease, or ACK.
- No `semantic/batch-plan` receiver, `parsed_only` receipt, `resolveBackground()` call, IDSER planning, BSS read/admission, SEM work, reconciliation, projection, provider call, or downstream handoff.
- No body schemas/fixtures for future semantic batch execution, reconciliation, or projection routes; no body union or giant routing switch.
- No manual replay, reissue, mode promotion, or an alternative queue/transport.

## Affected interfaces and expected ownership

| Interface / location | Change or preservation requirement |
| --- | --- |
| `packages/atlas-contracts/src/ghr/generic-handoff-envelope.v1.schema.ts` | New generic envelope/wrapper schema and transport guards; no domain payload schema imports. |
| `apps/agents-bridge/src/ghr/core/branch-registry.ts` | New typed registration/exact-lookup seam, with immutable version pins represented in its interface. |
| `apps/agents-bridge/src/ghr/routes/*/index.ts` + `main-route-index.ts` | Domain-local registry composition; root imports only domain indexes. |
| `packages/atlas-db/src/semantic-batch-plan-input.ts` | Preserve the existing canonical five-field parser/serializer as the future semantic adapter's sole authority. |
| `apps/agents-bridge/src/route-registry.ts` | Preserve as provider/model routing; do not reuse it for GHR. |

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-01-RC-01 | Strict Zod schemas accept only the documented v1 header and exact two-field wrapper; every leaf and parent has a meaningful `.describe()`. Unknown keys, missing fields, wrong protocol, malformed timestamp, and wrapper coercion/defaulting fail. | Schema behavior tests and a description-coverage assertion mapped to the v0.6 field dictionary. |
| GHR-01-RC-02 | Generic pre-parse guards reject duplicate-key, malformed, non-finite, prototype-sensitive, oversized, over-depth, over-wide JSON before Zod. Exactly enforce the six frozen generic limits. | Raw-byte and adversarial JSON tests; boundary-value fixtures. |
| GHR-01-RC-03 | A body hash is verified over the original exact wrapped-body bytes, including `can_continue`; changing bytes or hash fails. The 2,048-byte semantic payload and 2,081-byte false-wrapper limits are represented as future Test-1 route constraints without parsing semantic fields in generic GHR. | Byte-parity/hash mutation tests and source-boundary test proving no semantic-field inspection. |
| GHR-01-RC-04 | Main index imports only domain indexes; each domain owns local `branches`, `bodies`, `receivers`, and `index.ts`; exact semantic branch lookup permits no wildcard, fallback, dynamic module path, or provider-route-registry reuse. | Composition test plus static source-boundary assertions. |
| GHR-01-RC-05 | The registration interface can express the pinned first Test-1 route and rejects mismatched/unknown main, branch, policy, handler, or body-contract version. Registration alone does not issue or deliver a handoff. | Typed/unit registration tests and zero-side-effect oracle. |
| GHR-01-RC-06 | Test execution creates no migrations, writes, queues, jobs, worker dispatches, receipts, semantic resolver calls, BSS/IDSER/SEM work, provider calls, reconciliation, or projection effects. | Non-inert integration/static dependency test and focused typecheck. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-01-B1` — Atlas acceptance/issuer will own trusted provenance, route authorization, scope and immutable issuance; `GHR-01-B2` — the semantic domain owns the existing five-field parser; `GHR-01-B3` — BSS/provider routing is distinct from process handoff routing.
- **Trust boundaries:** `GHR-01-T1` — untrusted raw JSON crosses generic ingress guards before schema parsing; `GHR-01-T2` — a future trusted issuer supplies identity, route pins, scope, body bytes/hash and continuation mode; `GHR-01-T3` — GHR forwards opaque payloads to a receiver-owned parser.
- **Sensitive assets:** `GHR-01-A1` — route/policy/handler identifiers, scope, idempotency keys and exact body digest/bytes are delivery authority or integrity-sensitive metadata; `GHR-01-A2` — raw source/media, provider secrets and payload content must not enter GHR metadata or diagnostics.
- **Identity context:** `GHR-01-I1` — preserve explicit producer execution identity and trusted issuer context in the contract; never derive either from caller JSON.
- **Extension seams:** `GHR-01-S1` — typed exact branch registry retains policy/handler/body-contract pins for later issuer and revocation checks; `GHR-01-S2` — raw-byte ingress guard remains independent of Zod; `GHR-01-S3` — local domain indexes retain receiver-specific authorization/parser attachment points.
- **Prohibited couplings:** `GHR-01-C1` — no generic domain-payload union or semantic-field inspection; `GHR-01-C2` — no reuse of provider/model or BSS registries; `GHR-01-C3` — no client-supplied destination/function/module-path/queue selection; `GHR-01-C4` — no hash-as-authentication assumption.
- **Verification seams:** `GHR-01-V1` — adversarial raw JSON/limit tests; `GHR-01-V2` — exact body-byte/hash mutation tests; `GHR-01-V3` — static composition/dependency checks; `GHR-01-V4` — zero-side-effect test.
- **Unresolved security policy:** cross-service authentication, anti-replay, and message authentication are intentionally deferred. If the protected single Atlas PostgreSQL transaction/worker realm changes, a later ticket must qualify mTLS and/or keyed message authentication; do not invent it here.
- **Planning findings:** none within this bounded schema/registry scope.
- **Review bindings:** `GHR-01-RB-01` verifies `GHR-01-T1`/`GHR-01-V1` with pre-parse adversarial tests; `GHR-01-RB-02` verifies `GHR-01-T2`, `GHR-01-I1`, and `GHR-01-C4` with provenance-vs-Zod and byte-hash tests; `GHR-01-RB-03` verifies `GHR-01-T3` and `GHR-01-C1..C3` with source-boundary/composition tests; `GHR-01-RB-04` verifies `GHR-01-V4` with the zero-side-effect oracle.

## Hard stop

Stop and return a planning finding if the generic schema requires importing a domain payload parser, if the root registry cannot remain an imports-only composition layer, if exact pinned lookup needs a fallback/wildcard, or if the frozen byte/raw-JSON checks cannot be performed before Zod. Do not replace the existing semantic parser, add a second transport, or broaden authority to make this ticket fit.
