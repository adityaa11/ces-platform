# IDSER-012-03 — GHR-compatible semantic batch planner and durable handoff hard stop

- **State:** `planned`; non-executable family/scope map, not a GO, CFC or CK authorization.
- **Successor of:** the entire *unimplemented* `IDSER-012-02` family (umbrella and -01..04); preserve `IDSER-012-01` approved perception and all historical CK/HMN evidence.
- **Selected scope, 2026-10-19:** “From an actual accepted NormalizedDocument V1, construct a temporary GHR-compatible `SemanticBatchPlanInput/v1` body fixture; freeze and implement the receiving-domain payload contract and strict parser; resolve its `normalizedDocumentRef` through an authorized read-only boundary to retrieve and verify the actual accepted NormalizedDocument V1; produce a deterministic, BSS-capacity-qualified, immutable document plan and durable per-batch `PlannedSemanticCorpusHandoff`; validate the proposed `SemanticBatchPlanReady/v1` output contract; and HARD STOP before GHR delivery, SEM-CUTOVER intake, provider admission, or downstream execution.”
- **Proposed handoff authority:** Library `atlas-generic-handoff-router-implementation-context-v0.3.md` §5.1/§5.2 (exact draft domain-body contracts). GHR itself is not built, GO-qualified or activated.
- **Predecessors:** approved IDSER-012-01 / PERC-RESET-008 accepted `NormalizedDocument v1` + `perceived` and Atlas-granted source/asset evidence; approved BSS-V2-005/006 contracts incl. BSS-V2-006-04-01..06 and BSS-V2-006-05-01..06. SEM-CUTOVER-007A remains sole later semantic methodology authority.
- **Supersession audit:** [full legacy RC disposition](IDSER-012-03-requirement-disposition.md). No historical requirement is silently deleted or deemed passed.

## Architecture and hard stop

```text
Existing accepted NormalizedDocument v1 in Atlas, durable perceived
  -> temporary, authentic-data-derived GHR body fixture
  -> STRICT receiver-owned SemanticBatchPlanInput/v1 parser
  -> Atlas-authorized read-only normalizedDocumentRef resolver
  -> verified document, source/perception/hash/grants/REL/media
  -> read real BSS-005 effective capacity/structural policy; optional qualified BSS-006 read
  -> IDSER semantic corpus partition (owned/context/REL/deferred) + resource envelopes
  -> atomic durable document plan + N immutable PlannedSemanticCorpusHandoff
  -> non-delivering, strict SemanticBatchPlanReady/v1 compatibility receiver
  -> HARD STOP: no GHR issue/forward; no SEM intake; no BSS attempts; no provider work
```

The *fixture* substitutes only for **future GHR delivery**. It neither mocks accepted document authority nor mocks the batch planner, policy provenance, resolver or durable output. The real GHR implementation later replaces delivery adapters only, subject to separate GO/CK and trusted issuer/route/transactional proof. Atlas's GHR generic header remains separate from the **semantic receiving-domain body**. A body ref/hash alone never authenticates producer, source or reader.

## Bounded children and CK sequence

| Ticket | Exclusive implemented boundary | Hard stop |
| --- | --- | --- |
| [IDSER-012-03-01](IDSER-012-03-01-ghr-body-contract-accepted-document-resolver.md) | Freeze exact five-field GHR v0.3 input body, strict semantic parser, fixture drawn from **actual persisted accepted** NormalizedDocument V1, authenticated scoped read-only resolver | Accepted resolved planner input; no partition |
| [IDSER-012-03-02](IDSER-012-03-02-bss-effective-capacity-corpus-partition.md) | Consume BSS actual authorized planning read/effective dimension policy, deterministic complete source partition, context/REL/media bounds, per-batch resource envelopes | Immutable qualified plan proposal; no durable publication |
| [IDSER-012-03-03](IDSER-012-03-03-durable-batch-handoff-ghr-output-compatibility.md) | Atomic versioned document plan + N durable handoffs; exact proposed GHR output body/fixture receiver validation and end-to-end negative proof | Published semantic batch handoff; no GHR/SEM/provider execution |

Each child needs explicit GO, evidence and independent CK. Parent is **never** an umbrella implementation GO.

## Frozen cross-owner rules

1. **Actual source not fake acceptance:** `normalizedDocumentRef` is an opaque cache reference to an accepted Atlas record. Resolver verifies source SHA, perception execution/fingerprint, normalized version, trusted project/workspace/bundle/document, authorization, asset grants and allowed accepted lifecycle state. A read gap is `NORMALIZED_DOCUMENT_AUTHORIZED_READ_GAP`, never direct Bridge SQL or fabricated approved snapshot.
2. **Exact GHR input:** `SemanticBatchPlanInput/v1` body has exactly `normalizedDocumentRef`, `perceptionExecutionId`, `sourceSha256`, `normalizedDocumentVersion`, `normalizedDocumentFingerprint`. No extra required fields or generic-header business keys. Receiver parser rejects unknown keys, invalid hashes and stale/foreign proofs.
3. **BSS capacity ownership:** BSS-005 supplies actual authenticated `CapacityPlanningSnapshot/v1` with structural limits, estimator and qualified prospective process/workload plus provider state and effective-enforcement versions. Do not recreate BSS planning/limiting in IDSER. For Anoman-like RPD unknown, only exact authorized `not_enforced` policy skips daily enforcement; never encode `0`, infinity, an invented daily reset or claim of unlimited provider quota. All enforced dimensions, output reservations, headroom, structural per-request limits and hard interactive reserve remain binding. Unknown mandatory, known zero, stale/revoked/foreign masks, unsupported required dimensions and missing real read fail closed.
4. **Immutable corpus and fit:** Stable structural/per-request fit determines number and composition of batches, not current remaining RPM/TPM/RPD windows. Every eligible locator is owned by one batch; bounded context-only repeats own zero; preserve original language, legends/conditions, REL direction/necessity, media grants and honest deferred dependencies. Transient 429/cooldown only delays later admission; verified structural downgrade requires versioned replan/BLOCKED, never mutation or truncation.
5. **Exact draft GHR output:** `SemanticBatchPlanReady/v1` holds `documentPlanRef`, `planHash`, `batchCount`, `batchHandoffRefs[{batchId,ref,hash}]`. Store document plan + N immutable per-batch handoffs **before** validating this output with a non-executing receiver. The proposed output contract remains inactive/future-owned until authorized by GHR and IDSER/SEM integration. No arrays of provider calls, raw corpus bytes, media bytes, prompts or secrets in GHR/BSS metadata.
6. **Absolute stop:** No GHR issuer/outbox/route/delivery/ack, GHR fan-out, SEM packet intake or prompt builder, BSS provider work/attempt/reservation/transport, semantic stage/acceptance, reconciliation, publication, Master, CES or project-truth effects. Test with non-inert persisted positive control and exact zero forbidden counters.

## GO/CK prerequisites and downstream ownership

`-03-01` requires demonstrably authorized real accepted-document read and evidence provenance; `-03-02` requires a **callable** BSS-005 effective planning read with legitimate prospective inactive-workload identity (if absent STOP `BSS_CAPACITY_CONSUMER_READ_GAP` / `CAPACITY_PROFILE_BOOTSTRAP_GAP`, owned by BSS), not an isolated BSS fixture. BSS-006 runtime constraint read is only mandatory if frozen GO makes it so; it is never a permit. `-03-03` proves restart/rollback/duplicates/cancellation/conflicting hashes/foreign media/structural replan and exact forbidden zero effects. No predecessor CK grants future execution.

Future separate GO/CK: GHR `semantic/batch-plan` real delivery and `semantic/batch-execution-intake` output delivery; SEM-owned batch intake/qualified stepwise engine; semantic BSS workload activation; one BSS-V2-006 per-attempt admitted outbound lane (no duplicate ordinary SEM provider sender); qualified batch acceptance/reconciliation preparation under unresolved `OPEN-A`. Superseded `IDSER-012-02-02..04` obligations are **deferred** to these future owners, not incorporated into the present planner scope.
