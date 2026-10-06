# IDSER-012-02: Multi-document perception and extraction decoupling

- **State:** `planned`; **Review batch:** `IDSER-BATCH-12-02`.
- **Predecessors:** IDSER-012-01 `PASS` and qualified/released production semantic-extraction route.
- **Consumes:** the accepted admission gate, BSS-009 perception authority and IDSER-006 extraction materialization; it explicitly amends only future procedural sequencing.

## Authority and bounded outcome

Activate independent member eligibility for new project bundles. Bundle members may enter the fair perception admission backlog without waiting for an earlier document’s semantic extraction or reconciliation. Accepted perception of a document atomically schedules that document’s existing semantic extraction; semantic jobs may progress independently according to their own inherited/provider-capacity contract. Perception terminal transitions invoke the same idempotent Atlas admission function so freed capacity refills without a polling daemon.

This child is the activation point that supersedes IDSER-003/007 and IDSER-010-02’s future D1-to-reconciliation-to-D2 procedural chain. It does not revise their approved text/evidence. Perception and semantic progression must remain document-local; reconciliation is not yet redesigned and must not be used to schedule the next perception.

## Explicit non-authority

No change to the 2/2/2 admission profile or fairness algorithm unless a separately authorized correction is required; no semantic-provider quota or semantic fairness design; no `semantic_ready` lifecycle state; no ready-order reconciliation, keyed writer, relationship direction redesign, completion/read-model changes, new broker or grant-lifetime extension. Do not execute full pipeline activation before the semantic route qualification predecessor is `PASS`.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-012-02-01 | Newly created bundle members are independently perception-eligible and admission retains 012-01 bounds/fairness. | Multi-document/multi-bundle fixture with execution history. **PASS iff** a later pending member can be admitted without prior semantic/reconciliation completion and global admitted work never exceeds 2. |
| RC-012-02-02 | Accepted perception schedules only the same document’s semantic extraction through the accepted authority. | Perception acceptance transaction and negative cross-document fixture. **PASS iff** one accepted normalized document creates one idempotent semantic execution/job for that document, with no cross-bundle/member identity mutation. |
| RC-012-02-03 | Perception refill is authoritative, idempotent and independent of reconciliation. | Acceptance, terminal failure/cancellation and duplicate-delivery/restart cases. **PASS iff** each transition safely invokes the gate, duplicate invocation cannot over-admit, and no reconciliation transition is required to make a pending member eligible. |
| RC-012-02-04 | Existing source/replay/failure contracts remain intact under decoupling. | Focused BSS-009, IDSER-006, IDSER-008 and IDSER-010-05 regressions. **PASS iff** grants remain JIT, failed bundles contain pending work, logical effects remain once-only, and no false semantic/reconciliation completion is produced. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-IDSER012-GRANT-JIT` and `SEAM-IDSER012-FAIR-ADMISSION` remain mandatory; add `SEAM-IDSER012-DOC-LOCAL-PROGRESSION` for member-bound perception-to-semantic handoff. `REV-IDSER012-02A` verifies no reconciliation coupling remains; `REV-IDSER012-02B` verifies document/bundle identity and grant authority under concurrent/replay paths. Per-user priority, semantic quotas and source-grant policy remain unresolved/non-authority.

Before CK, record an explicit lifecycle amendment statement, affected-future-rule coverage, transaction observations, queue/execution IDs, and the required predecessor qualification evidence. `Internal readiness: READY_FOR_CK` means only independent perception/extraction activation is proven. IDSER-012-03 alone may introduce semantic-ready reconciliation admission.
