# IDSER-012-03: Semantic-ready reconciliation admission and keyed single writer

- **State:** `planned`; **Review batch:** `IDSER-BATCH-12-03`.
- **Predecessors:** IDSER-012-02 `PASS`; production live reconciliation execution additionally requires BSS-V2-004-04 CK `PASS`. If BSS-V2-004-04 is not yet qualified, only deterministic/controlled-provider reconciliation implementation and proof may proceed; no live external reconciliation claim is permitted.
- **Consumes:** durable document-local `semantic_ready` materialization/turns, existing reconciliation schemas/taxonomy, IDSER-007 bounded context/result authority, IDSER-008 failure/completion rules and IDSER-010 replay/fencing contracts.
- **Execution environment:** deterministic/controlled provider for contract proof, plus the separately qualified live reconciliation route only when its BSS-V2 predecessor is PASS.

## Authority and bounded outcome

Consume semantic-ready work in **durable ready order**, not manifest/upload order, and enforce one active reconciliation writer per stable bundle ID.

Atlas owns reconciliation admission. The admission transaction locks the bundle's reconciliation-admission authority, verifies that no reconciliation execution for that staged bundle is currently active, selects the lowest unconsumed `semantic_ready_turn`, creates/enqueues exactly one `atlas.semantic.reconcile/v1` execution/job for that member, transitions it to `reconciling`, and commits. While that writer is active, later semantic-ready members remain durable backlog. Different bundle IDs use independent locks and may reconcile concurrently; there is no global reconciler.

After a reconciliation reaches a durable terminal boundary, the same Atlas authority decides the next step. Successful accepted reconciliation marks that member completed, updates bundle progress and admits at most the next semantic-ready member for the same bundle in the same safe transition. Terminal technical failure preserves IDSER-008: member/bundle become `needs_attention`, no later same-bundle reconciliation is admitted, while other bundles remain independent. Retry/replay/fencing before terminal failure stays under the inherited pg-boss/Bridge contracts.

### Reconciled-snapshot selection

Replace the current `prior.sequence < current.sequence` predicate for staged bundles. Reconciliation context consists of:

```text
current semantic-ready document candidates
+
bounded relevant candidates from documents whose reconciliation is already durably completed in this same bundle
```

Manifest sequence is not an eligibility or truth predicate. Deterministic retrieval may order already-reconciled neighbors by durable reconciliation/ready turn and stable semantic ID, but that order is retrieval order only. Existing candidate/context byte/count bounds, evidence provenance, exact authorized-context persistence/fingerprint and cross-bundle isolation remain mandatory.

The target flow may therefore be:

```text
A semantic_ready turn 1 -> reconcile A -> completed
C semantic_ready turn 2 -> reconcile against A + C -> completed
B semantic_ready turn 3 -> reconcile against A + C + B -> completed
```

### Directional relationship authority

The current staged redesign must not encode "current document" as relationship direction.

Preserve the existing relationship taxonomy and semantic meanings, but explicitly amend acceptance/accounting for staged reconciliation so **every current candidate must be accounted for without requiring it to occupy `source_candidate_id` for every non-`new` relationship**. For directional relationship types, source/target orientation follows the relationship's semantic meaning and a current candidate may therefore be the source or the target when required. A prior already-reconciled candidate may be the source of a relationship whose current candidate is the target. `new` remains an accounting assertion for a current candidate with no target.

The provider result schema/validator/acceptance layer may be changed only as needed to express and validate that order-independent endpoint authority. Every referenced endpoint must belong to the exact authorized context, every current candidate must still be deterministically accounted for, and replay/fingerprint/evidence requirements remain unchanged. Processing order, manifest sequence and "which candidate was current" may never invert `supersedes`, `refines`, `extends`, `supports` or any other directional meaning.

## Explicit non-authority

No global reconciler; no multiple writers for one bundle; no reintroduction of manifest order as truth priority; no semantic extraction/provider-capacity redesign; no perception-gate redesign; no customer/user priority; no Master/publication/CES/review-decision work. This ticket keeps the full reconciliation scope intentionally; a later implementation context may split it into executable children without weakening these frozen outcomes.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-012-03-01 | Reconciliation admission consumes `semantic_ready` members by durable ready turn and never admits more than one active writer for a bundle. | Held-writer fixture with several ready members in one bundle. **PASS iff** only the lowest ready turn is admitted, later turns remain backlog, restart preserves order, and a second same-bundle reconciliation job/execution cannot become active. |
| RC-012-03-02 | Different bundles reconcile concurrently without a global lock. | Hold bundle X writer while offering bundle X and bundle Y contenders. **PASS iff** X serializes, Y is independently admitted, and stable bundle IDs—not display/user names—key the exclusion boundary. |
| RC-012-03-03 | Context uses the durably reconciled set, not `sequence < current`, with the inherited bounds and exact snapshot authority. | A/C/B fixture plus scoped selector/context persistence inspection. **PASS iff** current candidates are complete, eligible prior candidates come only from already-reconciled same-bundle documents regardless manifest sequence, authorized context is bounded/fingerprinted, and upload order cannot grant truth precedence. |
| RC-012-03-04 | Relationship direction is semantic and processing-order independent while every current candidate remains accounted for. | Controlled directional fixtures where the semantic source is processed both before and after its counterpart, including a supersession/refinement-style case. **PASS iff** canonical source/target meaning does not invert with current-document order, current candidates are all accounted for, `new` remains current-only, and no endpoint outside the exact authorized context is accepted. |
| RC-012-03-05 | Reconciliation terminal success/failure and replay preserve one-writer state and trusted effects. | Duplicate delivery, acknowledgement loss, worker restart/lease loss, invalid result and terminal-failure cases. **PASS iff** one logical result/relationship/progress effect exists, no partial trusted mutation escapes, success may admit only the next ready turn, terminal failure blocks later same-bundle admission, and another bundle is unaffected. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-IDSER012-KEYED-WRITER` exposes bundle identity, writer ownership/terminal transition and backlog state; `SEAM-IDSER012-SEMANTIC-READY` supplies durable ready order; add `SEAM-IDSER012-RELATIONSHIP-DIRECTION` for endpoint orientation independent of current-document position. Required negatives include same-bundle double writer, global mutex, sequence-based prior eligibility, foreign endpoint, unaccounted current candidate, current-source-only directional validation, stale writer/replay mutation and live-provider use before BSS-V2-004-04 PASS.

Before CK, provide exact lifecycle/selector/acceptance evidence, ready-turn and writer-lock observations, cross-bundle traces, authorized snapshot fingerprints, relationship endpoint fixtures and the out-of-order A/C/B proof. Record `Internal readiness: READY_FOR_CK`; IDSER-012-04 owns N/N composition and final read-model/completion regression.
