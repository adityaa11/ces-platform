# IDSER-012-03-01 — Exact GHR body contract and authorized accepted-document resolver

- **State:** `planned`; GO not yet authorized.
- **Batch:** `IDSER-BATCH-12-03-01`.
- **Parent:** [IDSER-012-03](IDSER-012-03-semantic-batch-planner-ghr-contract-hard-stop.md).
- **Dependencies:** approved IDSER-012-01 / PERC-RESET-008 acceptance and derived-asset authority, GHR Library v0.3 §5.1 **proposed** input shape.
- **Outcome:** replaceable temporary **GHR-body fixture source** + production-quality receiving parser + authenticated read-only Atlas accepted-document resolver. **STOP before planning or any real GHR issue.**

## Exact receiver-owned body contract

```ts
type SemanticBatchPlanInputV1 = Readonly<{
  normalizedDocumentRef: string;           // accepted cache key: lowercase 64-hex
  perceptionExecutionId: string;           // nonempty, max 200
  sourceSha256: string;                     // lowercase 64-hex
  normalizedDocumentVersion: "v1";
  normalizedDocumentFingerprint: string;    // accepted completion fingerprint: lowercase 64-hex
}>;
```

All five fields required; no extra fields; bounded canonical JSON object, duplicate-key/prototype/oversize rejection, strict hash and version syntax. **GHR does not parse semantic fields**; receiving domain does. A temporary *trusted delivery-test context* supplies project/workspace/bundle/document and authenticated producer execution from server-known accepted fixture evidence, not from untrusted body or user-chosen routing header. Do not forge a `GenericHandoffEnvelope/v1`, issuer signature, policy grant or active GHR route.

Derive the fixture from an **actual persisted, accepted `NormalizedDocument V1`** with completed perception execution/fingerprint, durable `perceived`, original source SHA and asset references. Test against a qualified isolated accepted RUN-003 record or authorized read-only existing fixture record. A copy of matching JSON without Atlas accepted facts is **not** proof.

Parser returns a reference; **then** an Atlas-owned scoped resolver fetches the accepted normalized JSON from `normalized_document_cache` (or strictly equivalent already-authorized API), verifies cache key and all five body fields, accepted project/workspace/bundle/document/snapshot, source and media-manifest authority, expiration/cancellation/foreign scope, and supplies bounded source/REL/media refs to the planner. A hash is integrity binding, never access grant. No Bridge direct Atlas DB or storage privilege, raw media bytes, arbitrary storage path, implicit document recreation or fake accepted status.

## Final review clarifications — existing Atlas authority, not a parallel source route

- The input fixture must be built from accepted Atlas rows for `document_perception_execution` (`state='completed'`, `completion_fingerprint`), matching member `extraction_bundle_document.state='perceived'`, persisted `normalized_document_cache`, source `atlas.document`, and accepted derived manifests; the exact original authority/scope is frozen by the actual Atlas transaction. `cache_key` is SHA-256 of source SHA/version/capability/capability identity; `completion_fingerprint` instead fingerprints the canonical accepted NormalizedDocument JSON. **Do not compare those two distinct hashes as if equal or derive one from caller input**.
- This ticket **authorizes the narrow read-only resolver implementation if missing** *within Atlas's existing trusted boundary*: parameterized scoped lookup joining accepted execution/member/document/cache and accepted media manifests, authenticated caller/service identity with project/workspace/bundle/document ownership, and a response restricted to qualified normalized document and granted references. Use existing Atlas DB/store/read/auth conventions; a repository-backed SELECT is acceptable for Atlas owner if it demonstrably obeys least privilege. **Forbidden:** Bridge-side direct Atlas SQL, new independent document store, broad cache-list API, role widening, unauthenticated ref-only lookup, perception replay/reconversion, implicit GHR issuer/route, source/asset bytes in queue metadata. If those boundaries cannot be satisfied, STOP `NORMALIZED_DOCUMENT_AUTHORIZED_READ_GAP`.
- Distinguish invalidation/retention: a cache key or previously accepted media ref is not evidence the requested accepted version is *currently eligible*. Verify accepted lifecycle, corresponding completion fingerprint, source snapshot and grants at time of read; historical retained evidence remains readable only through its original authorized scope and does not silently qualify a current plan.
- The `NormalizedDocument v1` schema has source/page/block/table/visual locators but **no REL/provisional graph**. Do not demand one as a prerequisite merely because a ticket mentions REL. Provide separate exact granted REL input only if an existing authority can supply it, otherwise represent unavailable contextual dependencies honestly for the next planning leaf.
- Positive CK must use actual persisted accepted fixture rows and the real resolver, not only a mocked `resolve(ref)` implementation. The parser and resolver should expose one typed result to the planner, without exposing the generic GHR header as a second trusted domain contract.

## Frozen Review Contract

| ID | PASS iff |
| --- | --- |
| RC-0120301-01 | Fixture fields are derived from **real persisted accepted NormalizedDocument v1** + `perceived`, correct execution/completion fingerprint and granted assets, with reproducible source identity. |
| RC-0120301-02 | Exact v0.3 five-field `SemanticBatchPlanInput/v1` strict parser accepts qualified body and rejects missing/extra/duplicate/invalid/oversized/wrong-version bodies; no generic GHR header schema changes. |
| RC-0120301-03 | Actual authenticated read-only resolver redeems ref into the accepted document, rechecks trusted scope and all hashes/execution/lifecycle/media/REL grants; stale, foreign, altered, unaccepted and cross-document cases fail closed. |
| RC-0120301-04 | Fixture delivery can later be replaced by GHR receiver adapter with same parser and resolver; no fake trusted issuer or active route and no state-changing cache/asset read. |
| RC-0120301-05 | Non-inert test reads source; exactly zero planner publication, GHR issue/delivery, BSS attempt/reservation, SEM/provider call or Atlas semantic/reconciliation effects. |

**STOP:** if source resolution lacks a qualified authenticated Atlas boundary, report `NORMALIZED_DOCUMENT_AUTHORIZED_READ_GAP` to Atlas owner. Do not bypass. This leaf neither partitions nor persists semantic plans.
