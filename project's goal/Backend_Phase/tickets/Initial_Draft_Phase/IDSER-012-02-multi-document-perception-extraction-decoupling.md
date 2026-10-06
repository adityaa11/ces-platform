# IDSER-012-02: Multi-document perception and extraction decoupling

- **State:** `planned`; **Review batch:** `IDSER-BATCH-12-02`.
- **Predecessors:** IDSER-012-01 `PASS` and BSS-V2-004-03-07 CK `PASS` (therefore the production semantic-extraction route is qualified/released through the bounded D1 extraction checkpoint).
- **Consumes:** the accepted staged perception gate, BSS-009 perception authority, BSS-V2-004-03-07 provider-neutral extraction continuation and IDSER-006 extraction materialization; it explicitly amends only future staged sequencing.
- **Execution environment:** Compose staged-policy bundles with the accepted production extraction route or its ticket-authorized deterministic harnesses; no reconciliation execution is permitted.

## Authority and bounded outcome

Release the staged perception -> semantic extraction continuation while preserving document-local independence.

For each staged member:

```text
accepted perception / perceived
    -> exactly one same-document atlas.semantic.extract execution/job
    -> validated extraction materialization
    -> semantic_ready
    -> STOP
```

A newly accepted perception result may create the same document's extraction execution/job in the existing authority transaction. Any `perceived` members retained from the IDSER-012-01 foundation must be consumable idempotently at activation without a polling daemon or duplicate semantic jobs. Perception completion continues to invoke the fair gate independently so another PDF may enter Docling while earlier semantic work is queued/running.

This child is the semantic activation point for staged bundles. It supersedes the future procedural assumption that a document must reconcile before another document may be perceived/extracted. It does not revise historical ticket text/evidence.

Critically, staged extraction acceptance must no longer execute the current IDSER-006 continuation that immediately creates/enqueues `atlas.semantic.reconcile`. Instead, after complete source/evidence/candidate validation and materialization, it atomically:

- marks the member `semantic_ready`;
- assigns a durable, monotonic **per-bundle semantic-ready turn** under a bundle-scoped PostgreSQL lock;
- completes the extraction execution through the existing semantic authority/replay boundary; and
- creates **no reconciliation execution and no reconciliation pg-boss job**.

The semantic-ready turn is scheduling provenance only. It records the durable order in which extraction results became eligible for reconciliation and is never truth precedence. Stable ID tie-breaks remain available for corruption/repair diagnostics, but normal reconciliation admission consumes the monotonic turn.

Add `semantic_ready` to Core/DB member lifecycle validation and to the authorized project read model as an active processing state. Preserve `perceived`, `extracting`, and `semantic_ready` as broad project-card processing/extracting presentation; this ticket creates no new user-facing lifecycle label.

## Explicit non-authority

No change to the 2/2/2 perception profile or fairness algorithm unless a separately authorized predecessor repair is required; no external-provider quota redesign; no semantic fairness/priority policy; no ready-order reconciliation execution, keyed writer, reconciliation selector, relationship-direction implementation, bundle completion change, new broker or grant-lifetime extension. Do not create a reconciliation job as part of successful staged extraction.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-012-02-01 | Staged bundle members perceive/extract independently while 012-01 bounds/fairness remain intact. | Multi-document/multi-bundle fixture with execution history. **PASS iff** later members can be perceived/extracted while an earlier document's semantic/reconciliation state is incomplete and global perception admission never exceeds 2. |
| RC-012-02-02 | Accepted perception schedules only the same document's semantic extraction through the accepted provider-neutral authority. | Perception acceptance transaction, retained-`perceived` activation case and negative cross-document fixture. **PASS iff** each accepted/eligible normalized document creates one idempotent extraction execution/job for itself, with no cross-bundle/member identity mutation or provider-specific lifecycle branch. |
| RC-012-02-03 | Valid extraction ends durably at `semantic_ready` and does not enqueue reconciliation. | Extraction acceptance DB/queue inspection plus duplicate/restart cases. **PASS iff** candidates/evidence/index materialize once, member state is `semantic_ready`, extraction is completed once, reconciliation execution/job count is zero, and exact replay is a no-op. |
| RC-012-02-04 | Semantic-ready order is durable and deterministic under concurrent extraction completion. | Hold/release two same-bundle extraction deliveries concurrently and inspect the bundle lock/ready turns. **PASS iff** each ready member receives one distinct monotonic turn, restart preserves the order, and no wall-clock/upload sequence is used as truth priority. |
| RC-012-02-05 | Existing source/replay/failure/read-model contracts remain intact under decoupling. | Focused BSS-009, BSS-V2-004-03-07, IDSER-006/008/009-02 and IDSER-010-05 regressions. **PASS iff** grants remain JIT, failed bundles contain pending work, logical effects remain once-only, `perceived`/`semantic_ready` remain valid processing projections, and no false reconciliation/completion is produced. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-IDSER012-GRANT-JIT`, `SEAM-IDSER012-FAIR-ADMISSION` and staged cutover remain mandatory; add `SEAM-IDSER012-DOC-LOCAL-PROGRESSION` for member-bound perception-to-semantic handoff and `SEAM-IDSER012-SEMANTIC-READY` for the extraction-to-reconciliation hard stop. Required negatives include cross-document extraction kickoff, duplicate semantic job, provider-specific lifecycle scheduling, reconciliation enqueue after staged extraction, non-monotonic ready turn and malformed read-model state.

Before CK, record the lifecycle amendment, exact BSS-V2-004-03-07 predecessor evidence, transaction observations, queue/execution IDs, semantic-ready turns, project-card processing assertions and zero-reconciliation-job proof. `Internal readiness: READY_FOR_CK` means independent perception/extraction is proven and every valid staged extraction stops at `semantic_ready`. IDSER-012-03 alone may release reconciliation admission.
