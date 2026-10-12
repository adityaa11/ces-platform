# BSS-V2-004-03-05 GO checkpoint

- **Ticket:** BSS-V2-004-03-05 — Deterministic extraction finalizer and provider-neutral worker composition
- **Batch:** BSS-V2-BATCH-04.03-05
- **State:** `awaiting_review`
- **Review target:** this bounded implementation commit
- **Predecessors:** BSS-V2-004-03-01 CK `PASS` (`BSS-V2-BATCH-04.03-01-472fd2c-supplemental-verification.md`); BSS-V2-004-03-02 CK `PASS` (`BSS-V2-BATCH-04.03-02-18bd83e-verification.md`); BSS-V2-004-03-03 CK `PASS` (`BSS-V2-BATCH-04.03-03-66a9c0f-verification.md`); BSS-V2-004-03-04 CK `PASS` (`BSS-V2-BATCH-04.03-04-dbd42f2-review.md`). The approved 08-01-01 through 08-02-06 interfaces are consumed without modifying their owners.

## Bounded implementation

Extraction now builds the existing provider-neutral source packet from the authorized `NormalizedDocument v1`, sends only the packet's immutable prompt, temporary source slots, and existing proposal schema to `StructuredReasoningProvider`, and finalizes the returned JSON-decoded proposal locally before staging.

`semantic-extraction-finalizer.ts` is pure. It strictly parses the existing provider proposal Zod, requires one and only one result for every supplied owned slot, rejects reference-context/foreign/dangling/duplicate slots, and derives all Atlas-local candidate and source-unit IDs, source wording, evidence, and inventory from trusted local slots. It then invokes canonical `parseSemanticExtractionResult()` before the existing replay stage. An accepted context binding may add evidence to its owning candidate but cannot create an independent contextual candidate or authorize a relationship.

No concrete provider, route ID, multipart cast, adapter, schema, grant, preflight, admission, reconciliation, or D1 lifecycle path changed. The reconciliation request still uses its prior production skill path. Source image bytes, secrets, and raw provider bodies are not persisted or recorded.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| RC-BSSV2-0040305-01 | Required proposal-to-result rules 1–3; Review Contract row 01. Strict proposal Zod, exact owned-slot coverage, and no provider-owned trusted locator/ID. | `tests/semantic-worker.test.ts` proves strict extra-field/uppercase-kind rejection plus missing, duplicate, foreign, and context-only slot failures. The finalizer accepts only parsed proposal fields and derives locators locally. | PROVEN |
| RC-BSSV2-0040305-02 | Required proposal-to-result rules 4–6; Review Contract row 02. Deterministic IDs, trusted wording/evidence/inventory, unchanged provider meaning, and accepted contextual dual evidence only. | The finalizer's repeat-run field-origin fixture verifies byte-stable locally derived IDs, exact table wording/excerpt, one shared candidate carrying accepted visual evidence, local inventory, and trusted question evidence. Canonical final parse is invoked on every finalized result; oversized unrepresentable wording/evidence fails closed. | PROVEN |
| RC-BSSV2-0040305-03 | Composition scope; Review Contract row 03. Legacy/default profile remains explicit and byte-stable; generic worker remains provider-neutral. | No prompt, source-packet, schema, provider-capability, or adapter source changed. Rebuilt Compose contracts/skills suites retain prompt-003 and stepwise coexistence assertions; Bridge static boundary test passes with no concrete-provider or provider-ID path in the worker/finalizer. | PROVEN |
| RC-BSSV2-0040305-04 | Composition/replay scope; Review Contract row 04. Preserve envelope, fencing, staged winner, cancellation/failure, preflight boundaries, and reconciliation. | Existing worker tests pass with the proposal-only fake: stage-before-delivery, no second provider call on replay, stale-winner redelivery, post-stage retry, and deterministic terminal handoff rejection. The pg-boss/HTTP/Atlas semantic-worker integration scenario passed with a proposal-shaped provider fixture. Multipart/preflight fake-effect tests and reconciliation/client regressions pass unchanged. | PROVEN |
| RC-BSSV2-0040305-05 | Offline-only scope; Review Contract row 05. Preserve D1 `perceived` stop with no semantic/admission activation. | Candidate diff is limited to Bridge extraction finalization and its tests; it changes no Atlas D1, perception, route, admission, or live-provider path. The isolated `idser-012-01-02-qualification` Compose terminal lane completed with the established `perceived`/zero-semantic-execution assertions. No live provider was configured or called. | PROVEN |

## Validation evidence

```text
docker compose run --rm --build --no-deps agents-bridge sh -lc "corepack pnpm --filter @atlas/contracts typecheck && corepack pnpm --filter @atlas/contracts test && corepack pnpm --filter @atlas/skills typecheck && corepack pnpm --filter @atlas/skills test && corepack pnpm --filter @atlas/agents-bridge typecheck && corepack pnpm --filter @atlas/agents-bridge test"
# PASS: contracts 14 tests; skills 18 tests; Bridge suite passed.

node apps/agents-bridge/tests/idser-012-01-02-qualification.mjs
# PASS: isolated D1 terminal/replay qualification; stack cleaned up after completion.

git diff --check
# PASS
```

The full Bridge suite reports its opt-in Compose/PostgreSQL lanes as skipped when no database URL is supplied; the semantic-worker integration lane was also run against the isolated PostgreSQL stack. The ordinary host package junctions are inaccessible, so the reproducible Compose image was the primary validation environment.

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`.
