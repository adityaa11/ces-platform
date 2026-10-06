# IDSER-012-03: Semantic-ready reconciliation admission and keyed single writer

- **State:** `planned`; **Review batch:** `IDSER-BATCH-12-03`.
- **Predecessors:** IDSER-012-02 `PASS` and the accepted semantic extraction route.
- **Consumes:** document-local accepted extraction materialization and frozen trust/evidence contracts; it replaces only reconciliation execution ordering for the staged lifecycle.

## Authority and bounded outcome

Introduce an explicit `semantic_ready` lifecycle and reconciliation admission based on ready order, not manifest/upload order. For a semantic-ready document, reconciliation context consists of that document plus the bundle’s already durably reconciled knowledge snapshot. Use the stable bundle ID as a keyed serialization identity: one active reconciliation writer per bundle, while different bundles reconcile concurrently. Selection must no longer require `prior.sequence < current.sequence`; relationship semantics must remain directional and independent of processing order.

The target behavior permits A then C then B when those are the semantic-ready order, yielding reconciled snapshots A; A+C; A+C+B. All reconciliation result acceptance, evidence/source inventory validation, idempotency/replay/fencing and trusted Atlas mutation rules remain inherited and inspectable.

## Explicit non-authority

No global reconciler; no multiple writers for one bundle; no reintroduction of manifest order as truth priority; no semantic provider-capacity redesign; no perception-gate redesign; no user-plan policy; no Master/publication/CES/review decision work. Completion and project-card composition are reserved for IDSER-012-04.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-012-03-01 | Semantic-ready is durable, document-bound and drives reconciliation admission. | Out-of-order semantic-ready fixture. **PASS iff** A/C/B can reconcile in ready order, never before semantic acceptance, and restart does not lose/duplicate eligibility. |
| RC-012-03-02 | One writer operates per stable bundle ID; different bundles may progress concurrently. | Held writer plus same-bundle and cross-bundle contenders. **PASS iff** same-bundle work serializes without lost/double mutation and different bundle IDs are not globally blocked. |
| RC-012-03-03 | Context uses the reconciled set, not `sequence < current`; relationship direction is processing-order independent. | A/C/B and equivalent reordered fixture with focused selector/relationship tests. **PASS iff** authorized context and directional relationships are stable for the same reconciled facts, with no upload-order truth preference. |
| RC-012-03-04 | Reconciliation failure/replay preserves trusted state and permits safe recovery semantics. | Duplicate delivery, writer restart/lease loss and rejection cases. **PASS iff** one logical effect is persisted, no partial trusted mutation escapes, evidence/inventory checks remain enforced, and capacity/writer release occurs only at durable terminal boundaries. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-IDSER012-KEYED-WRITER` must expose the bundle identity, writer ownership/terminal transition and snapshot identity for review. `REV-IDSER012-04` verifies same-bundle exclusion, cross-bundle concurrency, snapshot provenance, order-independent relationship semantics and replay fencing. Do not convert these into an implicit global mutex or external broker.

Before CK, provide exact lifecycle/selector/acceptance evidence, writer-lock/lease observations, cross-bundle traces, and the out-of-order A/C/B proof. Record `Internal readiness: READY_FOR_CK`; IDSER-012-04 owns N/N completion and read-model composition.
