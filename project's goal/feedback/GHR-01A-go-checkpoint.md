# GHR-01A GO checkpoint

- **Ticket:** GHR-01A — Generic envelope, raw ingress, and byte-integrity contract
- **State:** `awaiting_review`
- **Implementation/review target:** `900373cc` — `feat(contracts): add generic handoff raw ingress`
- **Authority:** [GHR-01A frozen ticket](../Backend_Phase/tickets/GHR_Phase/GHR-01A-generic-envelope-raw-ingress-and-byte-integrity.md) and its incorporated [GHR v0.6 §3.1–§3.1c](../Backend_Phase/atlas-generic-handoff-router-implementation-context-v0.6-review.md)
- **Dependencies:** none; `@atlas/contracts` Zod `4.4.3` only. No predecessor ticket is consumed.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| GHR-01A-RC-01 | Strict v0.6 fixed header and exact `{ can_continue, payload }` wrapper; every leaf/container has a meaningful description. Unknown/missing keys, wrong protocol, malformed offset timestamp, default/coercion, and non-object payload fail. | `generic-handoff-envelope.v1.schema.ts` exports only strict Zod schemas and types. `ghr-generic-handoff-envelope.test.ts` verifies fixed-shape positive/negative cases and explicit description coverage for every field/container. | PROVEN |
| GHR-01A-RC-02 | Raw UTF-8 ingress rejects malformed, duplicate-key, non-finite, prototype-sensitive, oversized, over-depth, and over-wide JSON before Zod at every frozen boundary. | The package-local raw reader runs before `safeParse`, rejects dangerous keys and duplicate members, and captures raw spans. Tests prove guard independence from the schema and accept/reject the 75,776 / 8,192 / 65,536-byte, depth-16, object-128, and array-256 boundaries. | PROVEN |
| GHR-01A-RC-03 | SHA-256 is checked over the original wrapped-body bytes including `can_continue`; body/digest mutations fail; generic code has no semantic parser dependency. | Raw ingress returns the unmodified body byte slice, `sha256GenericHandoffBody` hashes it, and parsing compares it with `header.integrity.bodySha256`. Tests prove byte parity (including escaped bytes), body/digest mutation rejection, and static absence of `@atlas/db`, `SemanticBatchPlanInput`, pg-boss, and resolver coupling. | PROVEN |
| GHR-01A-RC-04 | Package-local execution creates no persistence, migration, queue, worker, receipt, resolver, or domain side effects. | Changed runtime surface is confined to `packages/atlas-contracts`; source-boundary oracle passes. No application, database, migration, or dispatch path is changed. | PROVEN |

## Validation record

```text
pnpm --filter @atlas/contracts typecheck
pnpm --filter @atlas/contracts test
git diff --check
```

All commands passed. The focused test suite includes raw adversarial and exact-boundary cases, strict-schema/description coverage, original-byte hashing and mutation cases, plus the package-local dependency/side-effect oracle. Tests use the current required `can_continue=false` mode only; no continuation, issuer, registry, transport, or receiving-domain behavior was added.

## Scope and handoff

The implementation adds only the generic `@atlas/contracts` GHR schema/raw-ingress contract, its public exports, and focused tests. It does not add a route, issuer, dispatch, persistence, semantic parser, receiver, or `true`-mode implementation.

Internal readiness: READY_FOR_CK
