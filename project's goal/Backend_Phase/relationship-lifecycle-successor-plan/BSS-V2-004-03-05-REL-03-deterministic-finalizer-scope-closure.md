# BSS-V2-004-03-05-REL-03 — deterministic finalizer successor

**State:** `approved`.

**Dependencies:** REL-02 CK PASS. `298021d` is the retained implementation baseline, not a historical-ticket closure. The historical `03-05` CK remains unchanged.

## Outcome and exact composition

Implement the successor composition that accepts the REL envelope, maintains `298021d` strict parsing/accounting/Atlas-owned derivation, and separates independently grounded canonical output from dependent draft-side interpretations. It is the only REL leaf allowed to integrate the sidecar port with worker staging/replay.

```ts
finalizeRelationshipExtractionEnvelope({
  envelope: unknown,
  sourceSlots: readonly TrustedFinalizationSlot[],
  provisionalRevisions: readonly ContextSourceRelationshipRevisionV1[],
  repository: ProvisionalRelationshipRepository,
  packetIdentity: RelationshipPacketIdentity,
  providerProvenance: ProviderProvenance,
  executionId: string,
  idempotencyKey: string,
}): Promise<{ canonicalResult: SemanticExtractionResult; sidecar: ProvisionalRelationshipStageV1 }>;
```

`packetIdentity` is constructed only at the authenticated extraction composition boundary from the validated semantic context and NormalizedDocument; its `executionId` is the document-perception execution ID, not the semantic replay execution ID. `providerProvenance` is projected only from the successful structured-provider transport response. Both values remain outside the provider envelope. The composition boundary checks scope/document/artifact/source-SHA agreement and exact slot/locator correspondence before it calls the REL-01 materializer.

First it strictly parses the new envelope and calls the REL-01 materializer. It validates every relationship `candidate_ref` against the strict nested `semantic_proposal` source-result candidate tuple. A candidate tuple not associated with an essential provisional relationship passes through the retained finalizer unchanged. A tuple associated with an essential provisional relationship creates exactly one immutable `DeferredDependentInterpretationV1` and is excluded from canonical candidate assertion output. A source with only deferred meaning is represented in the sidecar's source-accounting record, never as canonical `non_fact`; a source with both independent and dependent tuples still canonicalizes its independent tuples.

```text
DeferredDependentInterpretationV1 {
  deferred_interpretation_id = hash(execution, source slot, candidate index, relationship revision hash)
  relationship_revision_hash
  provider_candidate_tuple = { source_slot, candidate_index }
  source identity/evidence locators resolved locally
  proposed candidate meaning copied verbatim from the strict parsed proposal
  reason = "essential_provisional_relationship"
  canonical_candidate_id = null
}
```

After independent canonical IDs exist, an append-only binding is written only for an independently finalized candidate linked to a relationship. It contains the revision hash, derived candidate ID/evidence, `interpretation_state: "not_applied"` for optional provisional context or `"provisional_conditional"` only for a draft record. A deferred record never receives a fabricated canonical candidate ID. The canonical handoff envelope remains existing Semantic V1; the sidecar stages separately under the same execution/idempotency identity and must be recovered before redelivery. The only valid convergence is: both same-hash canonical result and sidecar exist, or neither is delivered; retry cannot append a different relationship/deferred identity.

`AcceptedContextEvidence` is removed from this successor path. Its two strings, or an `AuthorizedSourceRelationshipBinding` supplied as a substitute, fail `SOURCE_RELATIONSHIP_BLOCKED`; no provisional descriptor may add contextual evidence to a completed canonical assertion.

## Scope and expected files

| Path | Change |
| --- | --- |
| `apps/agents-bridge/src/semantic-extraction-finalizer.ts` | successor envelope finalizer; retain legacy export/path unchanged for legacy callers. |
| `apps/agents-bridge/src/semantic-worker.ts` | explicit opt-in composition and atomic/recoverable sidecar staging; no provider selection change. |
| `apps/agents-bridge/src/semantic-relationship-sidecar.ts` | REL-01 repository adapter boundary/composition only. |
| `apps/agents-bridge/tests/semantic-worker.test.ts` | independent/deferred/replay/cancellation/sidecar convergence cases. |
| `apps/agents-bridge/tests/semantic-relationship-finalizer.test.ts` | strict envelope, field origin, source accounting and no-promotion tests. |

No modification of `@atlas/contracts` result schema, canonical Semantic V1, provider adapters, `semantic-prompt.ts`, `semantic-source-packet.ts`, 08-02-01, migrations, live routes, reconciliation, admissions, review/publish code, or historical fixtures/tickets is allowed. A durable repository adapter requiring schema/migration is an `OWNERSHIP_CONFLICT_BLOCKED` handoff, not a silent REL-03 expansion.

## Frozen Review Contract

| Row | Binary PASS oracle |
| --- | --- |
| `RC-REL-03-01` | Malformed/fenced/enum-coerced envelope values, unknown fields, foreign/missing/duplicate slots, malformed candidate refs and untrusted relationship substitutions fail before canonical or sidecar staging; no repair occurs. |
| `RC-REL-03-02` | In a mixed source/result, independent candidates retain the exact `298021d` deterministic Semantic V1 path while each essential dependent tuple has one durable deferred record with exact revision dependency and no canonical assertion or `non_fact`. |
| `RC-REL-03-03` | Optional projected context cannot enrich canonical evidence; the old two-string shortcut, fabricated candidate ID, visual-owned candidate, accepted/confirmed/published claim, and whole-document block are all rejected/absent. |
| `RC-REL-03-04` | Replay, stale claimant, post-stage delivery failure and cancellation produce convergent sidecar/canonical results without duplicate revisions/bindings or another provider call; provider neutrality, reconciliation and D1 stop remain unchanged. |

## Required regression and CK handoff

Run focused bridge finalizer/worker suites, `@atlas/skills` legacy packet/prompt suite, provider-capability neutrality suite, replay/cancellation lane, and the D1 terminal regression. Record zero live provider calls/jobs/reservations/review/publication. CK PASS unlocks REL-04 only; it neither passes historical `CK-001.a/.b` nor asserts human acceptance/publication.
