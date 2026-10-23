# GHR-01B GO checkpoint

- **Ticket:** GHR-01B — Directory-modular main → branch registry foundation
- **State:** `awaiting_review`
- **Implementation/review target:** `0212ee83` — `feat(bridge): add GHR branch registry foundation`
- **Authority:** [GHR-01B frozen ticket](../Backend_Phase/tickets/GHR_Phase/GHR-01B-directory-modular-main-branch-registry.md) and its incorporated [GHR v0.6 §§3.1c, 4.1–4.3, 9](../Backend_Phase/atlas-generic-handoff-router-implementation-context-v0.6-review.md)
- **Dependency:** GHR-01A CK `PASS` for `900373cc`, recorded in [its CK review](GHR-01A-900373c-review.md). This checkpoint consumes only its exported generic header types.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| GHR-01B-RC-01 | Root imports only the semantic, reconciliation, and projection indexes; each domain owns `branches`, `bodies`, `receivers`, and a local index; no giant switch/body union/core parser import. | `apps/agents-bridge/src/ghr/main-route-index.ts` has exactly the three domain-index imports. The three `routes/*/index.ts` files compose their own empty local registry. `apps/agents-bridge/tests/ghr-branch-registry.test.ts` statically asserts the root import set and all owned directories. | PROVEN |
| GHR-01B-RC-02 | Exact lookup/type registration represents only prospective `perception.acceptance` → `semantic/batch-plan`, pins `v1`/`v1` and `SemanticBatchPlanInput`/`v1`, records false-only 2,048-byte payload and 2,081-byte wrapper bounds, and rejects every mismatched/unknown selector. No wildcard, fallback, dynamic module path, provider/BSS reuse, authorization, or delivery side effect. | `apps/agents-bridge/src/ghr/core/branch-registry.ts` defines immutable six-pin lookup and inert registration metadata. The focused test represents the sole prospective binding, rejects main/branch/producer/policy/handler/body-contract mismatches, duplicate pins, and invalid bounds; it also checks prohibited imports/dynamic imports. No source registry registration exists. | PROVEN |
| GHR-01B-RC-03 | Typecheck/test execution has no migrations/writes, queue/job/dispatch/receipt/resolver calls, or domain/provider/reconciliation/projection effect. | `pnpm --filter @atlas/agents-bridge typecheck` passed. `pnpm --filter @atlas/agents-bridge test:ghr-01b` passed (3 tests), including the non-inert static dependency oracle that rejects DB, provider-route registry, pg-boss, queue, worker, dispatch, resolver, and dynamic-import coupling. The committed runtime surface is a pure in-memory map plus empty local compositions. | PROVEN |

## Validation record

```text
pnpm --filter @atlas/agents-bridge typecheck   PASS
pnpm --filter @atlas/agents-bridge test:ghr-01b   PASS (3 tests)
git diff --cached --check   PASS before commit 0212ee83
```

## Scope and handoff

The checkpoint adds only the inert directory seams, exact type/registry interface, empty domain-local registries, focused source-boundary tests, and the focused test command. It does not add a live route, semantic body adapter/parser, receiver, issuer, authorization, persistence, queue, worker, dispatcher, delivery, ACK, side effect, or `can_continue=true` behavior/test.

Internal readiness: READY_FOR_CK
