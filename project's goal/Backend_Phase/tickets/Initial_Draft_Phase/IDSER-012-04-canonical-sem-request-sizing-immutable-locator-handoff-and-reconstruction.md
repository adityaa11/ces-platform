# IDSER-012-04 — Canonical SEM request sizing, immutable locator handoff, and reconstruction

- **State:** `planned`; non-executable family/traceability map. No GO, CK, CFC, or HMN workflow may select this parent.
- **Family batch:** `IDSER-BATCH-12-04`.
- **Predecessors:** the IDSER-012 semantic-batch-planner implementation family at its independently CK-approved terminal interfaces; PERC-RESET accepted `NormalizedDocument V1` evidence in `atlas-canonical-perception`; established Atlas immutable persistence, SEM source-packet, and authenticated BSS prospective-reader boundaries.
- **Source context:** [IDSER-012-04 implementation context](../../semantic-batch-planner-context/IDSER-012-04-implementation-context).
- **Target branch:** `codex/new-atlas-backend`.

## Split decision and executable children

This original ticket crosses seven independently changeable authority and verification seams: SEM packet construction, complete request estimation, BSS structural-fit partitioning, immutable v2 persistence, GHR compatibility, SEM reconstruction, and protected real-data qualification. A CFC finding in any one would otherwise reopen unrelated work, and the real-data proof requires all earlier seams. It is therefore too large for one GO → CK → CFC → HMN cycle.

| Order | Executable child | Sole implementation/proof seam | Frozen rows discharged |
| --- | --- | --- | --- |
| 1 | [IDSER-012-04-01](IDSER-012-04-01-canonical-sem-batch-packet-builder.md) | Additive shared SEM batch-packet construction, selection validation, and whole-document compatibility | `RC-01204-01` |
| 2 | [IDSER-012-04-02](IDSER-012-04-02-complete-sem-candidate-request-estimator.md) | Pure complete-candidate request measurement and frozen input/output accounting | `RC-01204-02` |
| 3 | [IDSER-012-04-03](IDSER-012-04-03-bss-structural-fit-corpus-partition.md) | Authenticated BSS structural-fit composition and deterministic partition/replan proposal | `RC-01204-03`, `RC-01204-04` |
| 4 | [IDSER-012-04-04](IDSER-012-04-04-immutable-v2-plan-handoff-persistence.md) | Strict v2 plan/handoff contracts and atomic immutable Atlas persistence | `RC-01204-05` |
| 5 | [IDSER-012-04-05](IDSER-012-04-05-ghr-reference-only-v2-compatibility.md) | Non-delivering GHR reference-body compatibility and v2 receiver dispatch | `RC-01204-06` |
| 6 | [IDSER-012-04-06](IDSER-012-04-06-read-only-sem-batch-reconstruction.md) | Read-only authorized SEM reconstruction and planned-hash integrity | `RC-01204-07` |
| 7 | [IDSER-012-04-07](IDSER-012-04-07-perc-reset-real-data-qualification.md) | Isolated PERC-RESET composition qualification and canonical no-mutation proof | `RC-01204-08` |

Every child requires its listed predecessor CK `PASS`; `-04-07` is the only family closure and requires all six earlier children. A child may reuse approved predecessor interfaces but must not repair their internals. CFC returns findings to the child owning the failed seam. HMN may resolve only a named, unresolved authority within that child and cannot activate GHR, BSS admission, a provider, semantic acceptance, reconciliation, or publication.

## Preserved family contract

All remaining sections remain binding family authority. They are allocated to the children above, are not weakened or reinterpreted by the split, and grant no direct implementation authority to this map.

## Outcome

Replace additive per-locator request sizing with deterministic measurement of one fully composed prospective SEM request for each candidate batch. Persist only the immutable, versioned locator metadata needed to reconstruct that request. GHR retains reference-only batch handoff compatibility; SEM can read the exact accepted document, rebuild the selected canonical packet through the shared SEM builder, and fail closed unless its SHA-256 matches the planned packet.

The terminal implementation state is ready for independent CK review, backed by an isolated real-data PERC-RESET qualification. It is **not** provider execution, production GHR delivery, semantic acceptance, reconciliation, or publication.

## Authorized scope

### A. Shared canonical batch packet

Extend `buildStepwiseSourcePacket()` additively to construct a batch-scoped packet from a verified accepted `NormalizedDocument V1`, exact owned locator selection, authorized context-only selection, verified media identities, validated relationship inputs, and deterministic ordering.

- Preserve the existing whole-document behavior.
- Resolve and validate each selected locator; reject foreign, missing, duplicate, or invalid selections.
- Include exactly the selected source units, preserving original text/table content (including Docling grid metadata) and visual identity metadata without image-byte hydration or persistence.
- Return the canonical existing `sourceSpecification`, its exact UTF-8 serialization, and SHA-256. IDSER sizing and SEM reconstruction must use this same implementation; a second IDSER packet serializer is prohibited.

### B. Complete candidate-request estimator and partition

Measure a candidate as one complete prospective SEM request: actual SEM system prompt, canonical batch `sourceSpecification`, applicable response-schema and framing allowances, permitted selected-media accounting, and configured BSS-compatible safety margins. Fixed overhead is counted once per request.

Use the frozen accounting policy:

```text
estimatedTextTokens = ceil(textBearingRequestBytes / inputBytesPerToken)
estimatedInputTokens = estimatedTextTokens + estimatedImageTokens + inputTokenSafetyMargin
prospectiveTokenDemand = estimatedInputTokens + reservedOutputTokens

estimatedRequestBytes = systemPromptBytes + sourceSpecificationBytes
  + schemaAllowanceBytes + framingAllowanceBytes
  + mediaTransportAllowanceBytes + requestByteSafetyMargin
```

`reservedOutputTokens` comes from the BSS workload reservation, is excluded from `estimatedInputTokens`, and reaches the prospective BSS reader only through the established BSS accounting policy. The reader receives `estimatedInputTokens` as `inputTokens`; IDSER must never double-count output reservation or claim exact provider token usage.

Partition in established deterministic source order. For every eligible source unit or authorized indivisible group, build the complete temporary candidate packet, calculate its complete demand, and check BSS structural fit. Retain a fitting candidate; otherwise finalize the prior nonempty batch and retry in a fresh batch. A unit that cannot fit alone returns an explicit structural failure. No truncation, independent per-locator full-request estimate, transient TPM pressure, or provider-admission decision controls the partition.

Continue to use the authenticated BSS prospective reader for `maxInputTokens`, `maxRequestBytes`, route prompt limits, media constraints, and any separately established context-window checks. A structural fit is neither execution permission nor a current-TPM guarantee.

### C. Immutable v2 plan and reference-only handoff

Implement and strictly validate `ImmutableSemanticCorpusPlan/v2` and `PlannedSemanticCorpusHandoff/v2`, preserving immutable Atlas-owned parent/child persistence, source-scoped authorization, replay fencing, append-only behavior, and explicit v1/v2 parser dispatch.

The parent keeps current identity/provenance and aggregate fields, while its v2 inventory records only `locator`, `classification` (`eligible`, `deferred`, or `unexamined`), and an optional bounded reason. It must not fabricate per-locator complete-request demand.

Each v2 child handoff binds the plan and deterministic batch slot to exact `ownedLocators` and authorized `contextOnlyLocators`, `sourceSpecificationSha256`, packet/profile/estimator/configuration identity, `ConservativeLogicalRequestBytes/v1`, complete request bytes, distinct input/output accounting, request resource envelope, and bounded fit trace. Parsers reject unknown or corpus-content fields, stale/foreign or duplicated locators, malformed hashes, invalid order, numeric/accounting inconsistency, and incomplete or duplicate eligible ownership.

Reuse `atlas.semantic_corpus_plan`, `atlas.planned_semantic_corpus_handoff`, immutable JSONB conventions, and existing transaction/idempotency/cancellation/replan rules. Any migration is additive. Do not persist source text, table contents, serialized packet content, image bytes, provider request bodies, or a parallel storage subsystem.

Keep `SemanticBatchPlanReady/v1` reference-only (`documentPlanRef`, `planHash`, `batchCount`, `batchHandoffRefs`). Extend internal receiver version dispatch for persisted v2 records without changing the external body or activating GHR issue, forwarding, acknowledgement, or outbox behavior.

### D. Read-only SEM reconstruction and qualification

Provide the smallest SEM-facing read-only compatibility boundary required to prove the handoff: resolve an authorized v2 reference and parent, derive authorized document scope, retrieve the original accepted document through the established server-owned resolver, rebuild the exact selected packet with the shared builder, recompute its SHA-256, and fail closed on any mismatch. It must not rerun Docling, replace unavailable source, repartition a completed batch, invoke a provider, or activate a worker.

For the current `rel: { state: "unavailable" }` path, do not infer absence of relationships, invent authority, or add context-only locators. Preserve source-native headings/qualifiers/metadata; defer or block an essential dependency that cannot be preserved. A text/table batch can become structurally ready when other constraints permit. A visual batch with unusable image-token accounting remains explicitly `unexamined` or deferred and cannot make the document appear semantically complete.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01204-01` | Batch-scoped and whole-document SEM packet paths preserve canonical source content and deterministic byte-identical output for the same verified selections; invalid, foreign, missing, and duplicate locators fail; no second packet serializer exists. |
| `RC-01204-02` | Candidate sizing measures the actual complete canonical request, counts fixed overhead once, keeps output reservation separate from input tokens, uses BSS-compatible resource accounting, and never treats an additive per-locator estimate or exact provider usage as authoritative. |
| `RC-01204-03` | Greedy deterministic partitioning preserves exact once-only eligible ownership, authorized non-owning context selection, and explicit deferred/unexamined coverage; an indivisible oversize or unavailable essential relationship fails explicitly without truncation or mutation. |
| `RC-01204-04` | BSS prospective structural checks use the established authenticated reader and pinned policy/profile/estimator provenance; stale, inconsistent, unsupported, or double-counted accounting fails closed, while transient admission pressure never causes a replan. |
| `RC-01204-05` | v2 parent/handoff parsers, canonicalization, atomic persistence, rollback, replay, cancellation, and version dispatch are strict; v1 records retain their original hashes and behavior; no corpus content or unapproved storage/schema change is persisted. |
| `RC-01204-06` | GHR validates reference-only output against actual persisted v2 records; the composed path has zero GHR issue/outbox/forward/ack, BSS work/attempt/reservation/send, SEM provider call, semantic acceptance, reconciliation, publication, Master, or CES effects. |
| `RC-01204-07` | An authorized persisted batch reconstructs from the original accepted document through the shared SEM builder with byte-identical `sourceSpecification` and matching SHA-256; a hash mismatch is an integrity failure. |
| `RC-01204-08` | Isolated PostgreSQL qualification uses real accepted PERC-RESET documents, creates at least two valid text/table batches under a bounded test workload, preserves exact coverage and canonical-source no-mutation evidence, and leaves unqualified visuals explicitly non-ready. |

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-01204-B1` keeps Atlas as immutable plan/handoff owner, SEM as canonical source-packet owner, BSS as prospective structural-fit/admission owner, and GHR as a future reference carrier. `SR-01204-B2` preserves accepted-document resolution through the server-owned boundary and protected canonical PERC-RESET source evidence.
- **Trust boundaries:** `SR-01204-T1` verified accepted document plus authorized locator/relationship/media selection → in-memory canonical packet; `SR-01204-T2` planner estimate/provenance → BSS authenticated prospective structural read; `SR-01204-T3` immutable persisted locator metadata → authorized read-only SEM reconstruction; `SR-01204-T4` canonical PostgreSQL source → isolated writable qualification copy.
- **Sensitive assets and identity context:** `SR-01204-A1` covers accepted normalized corpus text/tables, media identity, source hashes, plan/handoff hashes, and route/profile/estimator identity. `SR-01204-I1` requires the existing service-authenticated resolver and BSS reader context to remain available; opaque refs or hashes alone never grant read or mutation authority.
- **Extension seams:** `SR-01204-E1` retains version-dispatched parser and immutable provenance seams for future policy; `SR-01204-E2` retains BSS’s separate planning versus admission surface; `SR-01204-E3` retains SEM preflight/fair-admission execution as a future consumer of verified reconstruction.
- **Prohibited couplings:** `SR-01204-C1` prohibits a second source-packet serializer, direct BSS-table access, a new quota/admission planner, direct Bridge mutation of Atlas truth, or a parallel corpus store. `SR-01204-C2` prohibits raw corpus/media/prompt/provider bodies, credentials, or canonical database dumps in metadata, Git, logs, or evidence. `SR-01204-C3` prohibits canonical-volume mutation, live provider work, activated GHR delivery, semantic acceptance, reconciliation, and publication.
- **Verification seams:** `SR-01204-V1` validates strict parser/hash/coverage/accounting fences and v1 preservation; `SR-01204-V2` observes scoped side-effect counters for the hard stop; `SR-01204-V3` records isolated-copy provenance and canonical no-mutation evidence without source or credential disclosure.
- **Unresolved security policy:** `SR-01204-U1` image-token accounting remains unavailable on the current route; visual work stays non-ready. `SR-01204-U2` relationship availability is not inferred from `rel.state = unavailable`; no new REL workflow is authorized.
- **Review bindings:** `SR-01204-R1` verifies `SR-01204-T1/T3` with deterministic reconstruction, hash-mismatch, foreign/stale selection, and exact-coverage tests (test and persisted-record evidence). `SR-01204-R2` verifies `SR-01204-T2/E2` with authenticated prospective-read and input/output accounting evidence (integration trace). `SR-01204-R3` verifies `SR-01204-T4/C2/C3` with compose/volume inspection, isolated database, no-mutation, and forbidden-side-effect evidence (environmental and counter evidence).

## Required real-data qualification and hard stops

Use accepted `NormalizedDocument V1` evidence from the `atlas-canonical-perception` Compose project. Before access, inspect the running project/container and actual `postgres-data` volume identity; use the canonical database read-only for identities, counts, hashes, versions, and accepted states only. Create a PostgreSQL-supported logical backup/snapshot and restore it into an explicitly named isolated writable qualification database/volume. Apply v2 migrations, planning persistence, rollback, and replay tests only to that isolated copy.

The qualification must include a real text/table PERC-RESET document; actual SEM prompt/schema resolution; real canonical packet serialization and progressive sizing; deliberately bounded but valid BSS test policy yielding at least two batches; v2 atomic persistence; GHR reference-body validation; and per-batch read-only reconstruction/hash comparison. Use the recorded Safara fixtures only after current fingerprint/availability verification. Do not replace missing evidence with fabricated fixtures.

Stop the affected operation with precise evidence when accepted source or volume identity cannot be verified, isolated qualification would require canonical mutation, estimator/profile/accounting is inconsistent, essential relationship authority is absent, image-token accounting is required but unavailable, reconstruction hash differs, v1 would need rewriting, or the only path requires GHR/provider execution. A blocked visual case does not invalidate an independently qualified text/table path.

Never run destructive canonical Compose/volume operations, reset or clean the canonical database, apply unreviewed migrations to it, mount its live data directory into another running PostgreSQL instance, replace source documents with new conversion output, or commit dumps/document content to Git.

## Completion and handoff

Each child CK must have its allocated implementation evidence, not declarations alone. The terminal `-04-07` CK additionally requires source/policy/profile/estimator identities; sizing and fit traces; plan/handoff IDs and hashes from the isolated database; reference-body validation; reconstruction hash comparisons; canonical no-mutation evidence; and explicit zero provider-call/live-GHR-dispatch evidence. Evidence excludes source text, image bytes, prompts, and credentials.

Completion requires one normalized-document truth, one SEM packet builder, one conservative sizing path, one immutable locator handoff, and one BSS admission runtime. IDSER decides what structurally fits; GHR carries an immutable reference; SEM reconstructs the same corpus; BSS alone decides whether execution is permitted.

**Hard stop:** a CK `PASS` for any child, including the terminal family closure, does not authorize provider execution, GHR delivery, semantic acceptance, reconciliation, publication, Master, or CES. Those remain separately owned and require their own frozen scope and GO/CK authority.
