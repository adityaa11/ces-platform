# IDSER-012-04: Staged pipeline composition and regression checkpoint

- **State:** `planned`; **Review batch:** `IDSER-BATCH-12-04`.
- **Predecessors:** IDSER-012-01, IDSER-012-02 and IDSER-012-03 `PASS`.
- **Consumes:** approved child contracts as frozen interfaces. A material child-owned defect is `SCOPE_CHANGE`, not a catch-all repair.

## Authority and bounded outcome

Own the final production-shaped composition proof for the staged pipeline: explicit staged-policy cutover, fair perception, document-local semantic progression, durable semantic-ready backlog, keyed reconciliation, N/N completion, failure containment, truthful project-card lifecycle projection, restart/replay/fencing, cross-bundle/multi-user isolation and Ready for Review only after every required document is reconciled. Preserve no Master mutation or downstream truth authority.

The checkpoint must also prove that historical/non-staged bundles remain readable and are not silently adopted by the new scheduler, while no incompatible legacy active scheduler coexists with staged production admission.

## Explicit non-authority

Do not add lifecycle, worker, queue, schema, selector, capacity, source-grant or relationship behavior. This checkpoint may repair only a small integration harness/assertion defect it introduced. It does not relax child proof, introduce an unqualified provider run, create a legacy adoption mechanism, or turn absence of evidence/skipped tests into success.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-012-04-01 | The full staged route composes fair perception, document-local semantic progression, durable semantic-ready ordering and keyed reconciliation across multiple bundles. | Registered deterministic Compose scenario with A(4), B(5), C(2), held provider stages and out-of-order semantic readiness. **PASS iff** perception capacity stays <=2, idle capacity is borrowed fairly, semantic work is document-local, ready turns persist, and same-bundle reconciliation remains one-writer while other bundles progress. |
| RC-012-04-02 | Project/read-model lifecycle remains truthful through `pending`, `perception_queued`, `perceiving`, `perceived`, `extracting`, `semantic_ready`, `reconciling`, `completed` and `needs_attention`. | Repository + deterministic card projection fixtures across partial and failure states. **PASS iff** all active intermediate states remain visible as processing/extracting rather than disappearing, technical failure remains bounded, and no partial state is projected as Ready for Review. |
| RC-012-04-03 | Only all-N reconciled, integrity-valid members complete a bundle and reach Ready for Review. | Success, partial, perception-failure, extraction-failure and reconciliation-failure cases. **PASS iff** N/N requires all inherited perception/extraction/reconciliation/evidence/reference gates, all members are completed, no active/failed stage remains, and Master stays unchanged. |
| RC-012-04-04 | Restart/replay/acknowledgement loss and concurrent bundles preserve once-only effects, fair capacity and keyed-writer isolation. | Worker/Docling restart, duplicate delivery, staged-result replay and multi-user/bundle composition fixtures. **PASS iff** no over-admission, duplicate cache/candidate/relationship/completion, ready-turn duplication, cross-bundle mutation or leaked writer ownership occurs. |
| RC-012-04-05 | Cutover and inherited trust/operational boundaries remain intact. | Staged-policy/legacy fixtures, BSS-006, BSS-009, BSS-V2-004, IDSER-010-04/05, permissions, Compose health/migrations and `git diff --check`. **PASS iff** historical bundles are not silently adopted, incompatible active legacy scheduling prevents staged activation, Bridge remains denied trusted Atlas writes, no second broker/source transport appears, every required command reports pass or a classified non-pass, and Master/revision/HEAD/publication/CES/chat truth state remains absent. |

## Security, repair and handoff

**Security readiness: applicable.** `REV-IDSER012-01` through `REV-IDSER012-04` are all mandatory, with redacted runtime/config/resource, cutover, grant/permission/payload, fairness/replay, semantic-ready and keyed-writer provenance evidence. Required negatives include second-broker absence, Bridge trusted-write denial, no raw source transport, no mixed active schedulers, no order-as-truth, no global reconciliation lock, no relationship direction inversion and no secret disclosure.

Before `awaiting_review`, record child evidence links, exact commands/counts, health/migration outcomes, scoped IDs, admission/ready turns, DB/queue observations, card assertions, legacy/staged cutover observations and limitations. `Internal readiness: READY_FOR_CK` means the staged lifecycle composition is ready for one bounded final CK decision.
