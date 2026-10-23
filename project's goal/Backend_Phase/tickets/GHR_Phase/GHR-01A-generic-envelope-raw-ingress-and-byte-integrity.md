# GHR-01A — Generic envelope, raw ingress, and byte-integrity contract

- **State:** `planned`; first replacement for [GHR-01 split manifest](GHR-01-generic-envelope-and-main-branch-registry.md). Derived from [GHR implementation context v0.6](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md). Not GO, CFC, CK PASS, issuance, route activation, or authorization to alter predecessor contracts.
- **Phase:** GHR Test 1 foundation; the only current mode is `can_continue=false`.
- **Dependencies:** existing `@atlas/contracts` Zod `4.4.3`. The existing `@atlas/db` `SemanticBatchPlanInput/v1` parser/serializer is preserved but is not imported by this ticket.
- **Successor:** GHR-01B consumes only the exported generic contract/types after this ticket CK PASS.

## Outcome

Provide the fully described, strict `GenericHandoffEnvelope/v1` contract plus a raw-byte ingress boundary that validates generic JSON safely before Zod and verifies body integrity without inspecting a domain payload. This work is package-local to `@atlas/contracts`; it creates neither a GHR application registry nor a route.

## Exact scope

1. Add `packages/atlas-contracts/src/ghr/generic-handoff-envelope.v1.schema.ts` and a package-local raw-ingress helper as needed. Export strict Zod schemas and types for the fixed header and exact `{ can_continue, payload }` wrapper specified in v0.6 §3.1/§3.1a.
2. Every leaf and parent container has a meaningful `.describe()` that states purpose, trusted origin, and boundary rule. Descriptions document the contract; they do not authenticate a producer or authorize a route.
3. Before Zod parsing, reject malformed or duplicate-key JSON, non-finite numbers, forbidden/prototype-sensitive keys, excess UTF-8 bytes, nesting, object properties, or array elements. Enforce exactly: envelope 75,776 bytes; header 8,192; wrapper 65,536; depth 16; object properties 128; array elements 256.
4. Preserve original exact wrapped-body bytes for SHA-256 verification. The helper must bind `bodySha256` to the original body bytes, including `can_continue`; it must not hash a reserialized parse result or inspect semantic payload fields.
5. Export only generic contract/guard results required by later code. Do not add an issuer, route policy, registry, dispatcher, receiver adapter, database access, or queue surface.

## Required invariants

- `can_continue` is mandatory boolean with no default/coercion. All tests use `false`; no `true` code path, fixture, or test is permitted.
- `payload` is a bounded JSON object and remains opaque. The generic package must not import `@atlas/db`, `SemanticBatchPlanInput/v1`, or any domain payload parser.
- The first future route's 2,048-byte payload and 2,081-byte exact false-wrapper constraints are carried by GHR-01B's prospective registration metadata and enforced by the eventual receiver. GHR-01A enforces only the generic wrapper limit and must not parse semantic fields.
- Header field semantics, required/conditional status, and offset-aware `issuedAt` match v0.6 §3.1a exactly. Do not add or rename fields.
- Do not log raw bodies, PDFs/media, prompts, provider data, credentials, storage keys, or confidential payload dumps.

## Explicit non-goals

- No `apps/agents-bridge` GHR code, directory structure, registry, static route descriptor, root index, or provider-route-registry change.
- No persistence, migration, role/ACL change, issuer, `PostgresPerceptionAuthority.deliver()` change, pg-boss job/worker, delivery lease, ACK, or runtime handoff.
- No domain parser, receiver, resolver call, IDSER/BSS/SEM work, reconciliation, projection, body fixture, or manual replay/reissue/mode promotion.

## Binary review contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-01A-RC-01 | Strict schemas accept only the v0.6 fixed header and exact two-key wrapper; descriptions cover every leaf and container. Unknown/missing keys, wrong protocol, malformed offset timestamp, wrapper default/coercion, and non-object payload fail. | Schema behavior tests and a description-coverage assertion mapped to v0.6 §3.1a. |
| GHR-01A-RC-02 | Raw ingress rejects duplicate-key, malformed, non-finite, prototype-sensitive, oversized, over-depth, and over-wide JSON before Zod, at every frozen boundary. | Raw-byte adversarial and boundary-value tests that prove guard-before-schema ordering. |
| GHR-01A-RC-03 | SHA-256 verification uses original wrapped-body bytes (including `can_continue`); byte or digest mutation fails. The generic implementation neither parses nor imports semantic fields/parsers. | Byte-parity/hash-mutation tests plus static dependency/source-boundary assertions. |
| GHR-01A-RC-04 | Execution is package-local and creates no database writes/migrations, queues/jobs, worker dispatch, receipts, resolver calls, or domain side effects. | Focused typecheck/test and static side-effect oracle. |

## Security readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-01A-B1` trusted issuer owns provenance, route authority, scope and immutable issuance; `GHR-01A-B2` receiving domains own business payload parsing.
- **Trust boundaries:** `GHR-01A-T1` untrusted raw JSON crosses the raw guard before schema parsing; `GHR-01A-T2` schema-valid values remain unauthenticated until a future trusted issuer/dispatcher validates provenance.
- **Sensitive assets:** `GHR-01A-A1` immutable identities, route pins, scope, and exact body digest/bytes; `GHR-01A-A2` confidential body content that must not appear in diagnostics.
- **Identity context:** `GHR-01A-I1` preserve producer execution identity and trusted issuer context in the contract; never derive either from caller JSON.
- **Extension seams:** `GHR-01A-S1` raw guard stays independent of Zod; `GHR-01A-S2` raw wrapped-body bytes remain available for later trusted dispatch; `GHR-01A-S3` generic types do not depend on a receiver payload parser.
- **Prohibited couplings:** `GHR-01A-C1` no domain union/semantic inspection; `GHR-01A-C2` no hash-as-authentication claim; `GHR-01A-C3` no issuer, transport, or route-selection behavior.
- **Verification seams:** `GHR-01A-V1` adversarial raw JSON tests; `GHR-01A-V2` exact byte/hash mutation tests; `GHR-01A-V3` dependency and zero-side-effect checks.
- **Unresolved security policy:** cross-service authentication, anti-replay, and keyed message authentication remain deferred.
- **Planning findings:** none; a need to import a domain parser, reconstruct body bytes, or authorize an issuer is a hard stop.
- **Review bindings:** `GHR-01A-RB-01` verifies `T1/V1` via pre-parse adversarial tests; `GHR-01A-RB-02` verifies `T2/I1/C2` via provenance-vs-Zod and byte-hash tests; `GHR-01A-RB-03` verifies `V3/C1..C3` via static boundary and side-effect checks.

## Hard stop

Return a planning finding if frozen raw-byte checks cannot precede Zod, exact body bytes cannot be retained for hashing, the contract needs a domain-parser import, or Test-1 `false` only cannot be maintained. Do not broaden authority or introduce another transport to make the ticket fit.
