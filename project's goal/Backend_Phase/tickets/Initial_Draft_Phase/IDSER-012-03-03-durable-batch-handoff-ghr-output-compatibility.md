# IDSER-012-03-03 — Durable semantic batch handoff and proposed GHR output compatibility

- **State:** `planned`; GO requires independent CK PASS of IDSER-012-03-01/-02.
- **Batch:** `IDSER-BATCH-12-03-03`.
- **Parent:** [IDSER-012-03](IDSER-012-03-semantic-batch-planner-ghr-contract-hard-stop.md).
- **Outcome:** atomic immutable document plan and **one durable `PlannedSemanticCorpusHandoff` per batch**, validated proposed output contract in a **non-delivering fixture receiver**. **HARD STOP before GHR/SEM/BSS execution.**

Persist a complete version/hash-bound document plan and N individual batch references atomically after qualifying -03-02's genuine accepted-source partition. Bind project/workspace/bundle/document, source SHA, accepted NormalizedDocument/cache/perception execution, granted assets/REL revisions, exact every eligible owned locator, context-only rights, deferred dependencies, semantic schema/estimator/provisional context limits and BSS source/enforcement/profile/plan versions. Every handoff binds its plan hash, batch ID, immutable scoped locator/media/REL refs/hashes and independently bounded `RequestResourceEnvelope`. No raw PDF/text, image bytes, prompt body, source storage keys, credentials or provider response in routing metadata.

Freeze/validate **proposed** Library GHR v0.3 §5.2 body (no actual GHR issuer/forward):
```ts
type SemanticBatchPlanReadyV1 = Readonly<{
  documentPlanRef: string;
  planHash: string;
  batchCount: number;
  batchHandoffRefs: readonly Readonly<{
    batchId: string;
    ref: string;
    hash: string;
  }>[];
}>;
```

Receiver owns exact-body strict schema with no additional properties, positive bounded `batchCount`, array length match, unique IDs, actual persisted plan/handoff hash/ref/scope/slot membership and complete once-only owned coverage. Too-large array is explicit blocker to a separately versioned manifest-pointer design, **not** an invented optional field. GHR later forwards this body opaque, but this ticket does not publish GHR outbox intent, dispatch or ack. Only GHR future owner may activate `semantic/batch-execution-intake`; SEM future owner validates batch corpus and registers N BSS logical jobs, never GHR fan-out.

Durability and retry: duplicate fixture input with same accepted fingerprints yields exactly same plan and N refs; conflict or stale policy/source/hash rejects or explicitly creates a newly authorized plan version. Prove concurrent race, mid-transaction crash, lost postcommit ack, cancellation and restart, with no visible completed plan missing a handoff; replan does not mutate old record.

## Frozen Review Contract

| ID | PASS iff |
| --- | --- |
| RC-0120303-01 | Real accepted source → exact five-field receiver parser → authorized resolver → actual BSS effective planning → deterministic one/many batch partition → atomically persisted plan + N handoffs. |
| RC-0120303-02 | Strict `SemanticBatchPlanReady/v1` non-executing receiver validates real stored plan and every bounded referenced batch; wrong/missing/extra/duplicate/foreign/stale member/hash/count/ownership rejects. |
| RC-0120303-03 | Replay, cancel, restart, crash-before-commit, ack loss, concurrent claim, changed source/asset/REL/profile and authorized structural replan preserve immutable prior versions, exact once-like durable logical effects and full source coverage. |
| RC-0120303-04 | Effective policy and provider provenance remain distinct (unknown RPD not unlimited), REL/visual/context/deferred and exact BSS profile/estimator versions remain bound to every published plan/handoff. |
| RC-0120303-05 | Non-inert positive committed plan/handoff controls plus exact **zero** GHR issue/outbox/forward/ack, BSS work/attempt/reservation/send, SEM intake/fragment, Atlas semantic candidate/evidence/index, reconciliation/Master/CES effects. |
| RC-0120303-06 | Fixture→real GHR delivery replacement boundary is clear; output body draft is not an activated GHR route or approved SEM intake, and no second limiter, send lane or OPEN-A acceptance is introduced. |

**HARD STOP:** document plan + N durable `PlannedSemanticCorpusHandoff` and a validated yet **unissued** `SemanticBatchPlanReady/v1` body. GHR route activation, SEM-CUTOVER batch intake, BSS provider admission, semantic acceptance and reconciliation require **separate** GO/CK and OPEN-A where relevant.
