# IDSER-012-03-01-03 — Background accepted-document read via BSS-V2-007

- **State:** `approved`; CK PASS recorded for reviewed commit `719b9d121340a5388805d284d6263c2a549a6790`.
- **Batch:** `IDSER-BATCH-12-03-01-03`.
- **Dependencies:** `IDSER-012-03-01-01`, `IDSER-012-03-01-02` CK PASS (historically preserved); `BSS-V2-007` CK PASS. `BSS-V2-008` and live GHR remain future and are **not** needed to qualify this non-delivering resolver.
- **Parent:** [IDSER-012-03-01](IDSER-012-03-01-ghr-body-contract-accepted-document-resolver.md).

## Frozen runtime and access decision — 2026-10-19

**Consumer:** Atlas-managed `agents-bridge` internal processing service, authenticated through the BSS-V2-007 `createInternalReceivingBoundary`, composed by the trusted Atlas server with `AGENTS_BRIDGE_SERVICE_CREDENTIAL`. No independent GHR-delivery identity is asserted.

**Scope of authorization:** a valid authenticated service may read only an *accepted, currently eligible perception result* matching all five fields in `SemanticBatchPlanInput/v1`. This is **service-wide eligible-document redemption**, not a per-GHR-job assignment. The document ref and hash identify work for verification but are never credentials. The resource owner checks actual persisted facts on **every** read. No newly minted source grant, planning permit, policy registry or auth SQL table.

**No live receiving/GHR HTTP route required by this ticket.** The trusted non-delivering fixture calls the BSS-wrapped Atlas-owned resolver in-process. Future GHR ingress/worker composition is separately authorized. Do not force a new Agents Bridge → Atlas network hop or runnable semantic planner into this ticket.

## Exact code ownership

1. `packages/atlas-db/src/semantic-batch-plan-input.ts`: add `resolveBackground(input: SemanticBatchPlanInputV1): Promise<AcceptedDocumentPlannerResultV1>` to the **same** `PostgresAcceptedSemanticBatchPlanDocumentResolver`. Retain `resolve(scope: AcceptedDocumentResolverScope, input)` unchanged for interactive Better Auth authorization. Extract/reuse the same accepted-document result validation (normalization, fingerprint, exact media manifests and explicit REL unavailable); do not create another exported resolver.
2. `packages/atlas-db/src/index.ts`: update exports **only if needed**; the resolver class is already exported. No new database role/privilege.
3. `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts`: extend the existing real PostgreSQL accepted RUN-003-style fixture; keep all existing interactive tests and their CK oracle.
4. Add the smallest integration test/composition file in Atlas test infrastructure to wire `createInternalReceivingBoundary({ serviceCredential, parseBody: parseSemanticBatchPlanInputV1, redeem: (body) => resolver.resolveBackground(body) })` and test authenticated/unauthenticated calls. The existing strict parser must receive the original bounded canonical JSON string, not a reserialized loosely parsed object. No production GHR HTTP handler or new worker is required.

## Background SQL — binding row predicates

Use the same Atlas-owned, parameterized document-execution-cache-member join as existing `resolve`, but derive `project_id`, `workspace_id`, `bundle_id`, and `document_id` **from authoritative joined database rows** rather than untrusted GHR body or a browser session. In the background selector:
- `execution.id = input.perceptionExecutionId`;
- `execution.state='completed'`;
- `execution.contract_version='v1'`;
- `execution.completion_fingerprint=input.normalizedDocumentFingerprint`;
- `document.id=member.document_id=execution.artifact_id`;
- `member.perception_execution_id=execution.id`;
- `bundle.id=member.bundle_id`, with project/workspace matching member and document;
- `member.state='perceived'` and `bundle.state='processing'`;
- `execution.source_sha256=document.source_sha256=input.sourceSha256`;
- `cache.cache_key=input.normalizedDocumentRef`, `cache.contract_version='v1'`, `cache.capability='atlas.document.perceive'`, `cache.capability_identity=execution.capability_identity`, `cache.source_sha256=document.source_sha256`, `cache.invalidated_at IS NULL`;
- `LIMIT 2` and reject unless exactly **one** row is returned.

There is **no** `JOIN auth."session"` or `JOIN atlas.project_member` in the background SQL, and no arbitrary `callerUserId` / `callerSessionToken` substitute. These joins remain mandatory for the existing interactive selector. The two selectors share the one post-lookup `NormalizedDocument V1` and media acceptance validator; no independent semantic truth path.

Reject unless normalized fields and computed `normalizedFingerprint(normalized)` match request version/execution/document/source/completion identity; preserve the approved exact `derived_assets` ↔ `visualRegions` equality and accepted derived manifests check. Return **exactly** the current `AcceptedDocumentPlannerResultV1` structure with authoritative database scope, source and bounded media metadata; REL stays `{state:"unavailable"}`. No media bytes or storage keys.

Cancellation/revocation in this iteration is **only what existing persisted eligibility reflects**: execution cancellation or noncompleted state, changed member/bundle lifecycle, invalidated cache, missing/unauthorized media. Do NOT claim an independent GHR job-revocation ledger exists or invent one. Logout has no effect on the background eligibility query, but an expired session still denies the interactive `resolve`.

## CK Review Contract

| ID | PASS iff |
| --- | --- |
| RC-012030103-01 | One BSS-V2-007 `receive` composition authenticates the existing Bridge credential *before* canonical five-field parsing and Atlas background redemption; invalid credential yields zero parser and resolver calls. |
| RC-012030103-02 | A real accepted persisted document with exact execution/member/bundle/source/cache/media facts resolves after user session logout/expiry. The existing interactive `resolve` still denies expired/missing session. |
| RC-012030103-03 | The background reader derives scope entirely from trusted joined rows. Foreign/mismatched source, cache ref, fingerprint, execution, wrong version, missing/invalid media, state cancellation, unaccepted member or nonprocessing bundle fails closed. Test independent source/hash changes and cross-document substitution. |
| RC-012030103-04 | Shared post-lookup normalized/media validator produces the same bounded `AcceptedDocumentPlannerResultV1` shape as interactive redemption; no duplicate content store, no fake REL, source grant or path exposure, and no Bridge SQL access. |
| RC-012030103-05 | BSS-v2-007 + true PostgreSQL acceptance is exercised in a non-inert positive integration; exact rejected cases and forbidden-effect counters prove **zero** GHR issue/dispatch/ack, planner publication, BSS read/admission/attempt/reservation, SEM/provider execution, semantic/reconciliation/publication mutation. Original `-01-02` approved evidence is unchanged. |

## Explicit hard stop

Only an authenticated, *eligible accepted-document read* is qualified. The fixture is **not** GHR delivery, cannot authenticate a producer, cannot prove a specific job assignment, and does not start a semantic batch-planning worker. Subsequent `IDSER-012-03-02` tickets may consume the verified result after `01-03` CK PASS; real GHR receipt/assignments and producer authorization remain separately owned.
