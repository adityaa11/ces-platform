# IDSER-012-05 — Implementation context: image-aware batch planner and locator-only SEM handoff

- **Authority:** parent `IDSER-012-05` and active child frozen CK contracts. Reference implementation context; **not** stand-alone GO, CK, CFC or HMN authority.
- **Task owner:** IDSER semantic batch planner.
- **Downstream owner:** SEM-CUTOVER execution and semantic results; no implied implementation/acceptance under this IDSER family.
- **Goal:** size *complete* image-aware canonical SEM logical requests transiently, partition them under BSS prospective structural-fit, and persist only immutable v3 locator/hash/measurement commitments so an authorized SEM consumer can deterministically reconstruct precisely the same request.

## 1. In-memory request; locator-only persistence

IDSER selects accepted text/table source locators and independently owned/context-only visual locators. Using the existing shared provider-neutral canonical SEM request builder, it **temporarily** composes the complete logical request (system prompt and schema profile, source specification, slots, selected ordered media descriptors, all relevant framing). It measures the request bytes including image transport allowance, internal image-token estimate, text tokens, output reserve once, structural dimensions and BSS request resource envelope.

The transient request is discarded after planning/persistence. **Neither database nor GHR handoff stores a complete request or textual/body equivalent.** The durable plan/handoff v3 stores bounded references and commitments only:
- Scope/project/workspace/bundle/document, accepted source SHA, normalized document/perception references and fingerprint.
- Batch ID and deterministic ordered `ownedLocators`/`contextOnlyLocators`, including each visual region that is selected.
- Where necessary, an accepted-media locator/asset reference, plus ordered media-manifest hash bound to authoritative asset metadata; metadata for each visual is *rederived* from the accepted manifest (source/asset SHA-256, MIME, dimensions, byte length) during reconstruction. Avoid duplicating the full in-memory manifest or any media payload as durable content.
- Identity/version/hash of shared composer, prompt/schema, route/media/adapter serialization policy, estimator/configuration, immutable source specification and logical request; conservative full request bytes, text/image/total input tokens, reserved output, resource envelope, structural/BSS prospective identity and replay/cancellation ancestry.

Never store compiled prompt/schema body, source specification/content, text/table literals, rendered request JSON, raw PDF, visual PNG bytes, base64, grant, credential, provider body or response. No second request-body store, queue or semantic worker path.

## 2. Visual selection and estimator

An independently owned selected visual is `owned_source` for the future SEM extraction contract; context-only visual remains contextual. Pre-semantic `pending_unexamined_visual` is not a reason to exclude image metadata from *IDSER planning*. Both selected owned and context-only visual descriptors are counted **exactly once** based on selected locators and accepted media identities—not on `pending_authorized_media` role or `ready` status. All nonselected media must be excluded.

Compute text and image demand and conservative total serialized-request bytes using a shared canonical request/pinned adapter serialization-policy contract. The internal initial policy `ceil(width/768)*ceil(height/768)*516` image tokens is a versioned planning heuristic, not official vendor usage or capacity. `imageTpm: unknown` remains unknown, not an invented rate/quota or automatic block. Effective route image count, byte, width/height and BSS prospective structural constraints still enforce actual fit. Pure deterministic serializer-policy conformance (no fetch/provider/hydration) must detect unsafe undercounts and drift. If the necessary adapter framing policy cannot be established as stable and versioned, flag a dependency instead of guessing how SEM sends it.

## 3. Deterministic partition and handoff

For every candidate selection, construct the complete request **in memory**, use its actual conservative measurements for BSS structural-fit, then greedily/deterministically allocate selected eligible source units to batches or record explicit rejection/disposition. Do not attach every image to every batch, assign one owned locator twice or mark supported PNGs unexamined simply because provider-specific image TPM is unknown.

Use **only operational `ImmutableSemanticCorpusPlan/v3` + `PlannedSemanticCorpusHandoff/v3`**. Retire v1/v2 active writers and acceptance/execution paths; preserve old immutable historical data unmodified. Inventory and handle old unfinished work by explicit authorized disposition, never silent translation. `NormalizedDocument V1`, Semantic V1 and separately versioned GHR reference body are different contract namespaces.

GHR remains a **reference-only** validation carrier (plan/handoff IDs/hashes) with no new send path in IDSER. No BSS admission/reservation, provider call or SEM execution occurs in this family.

## 4. Read-only consumer parity within IDSER

`IDSER-012-05-04` supplies a read-only reference reconstruction proof boundary, *not a SEM runtime worker*. Given v3 plan ID/hash + handoff ID/hash and authorized source-read scope, it re-resolves the accepted normalized document and derived-media metadata and invokes the **same pinned shared composer/estimator** to reconstruct the planned request **transiently**. Verify:
- Exact owned/context locators and deterministic slot/ordered media selection.
- Source specification/hash; logical-request/hash; ordered image manifest/hash.
- Composer/prompt/schema/route/estimator/config identity and exact conservative request bytes, image/text/total tokens, output reservation, resource envelope.
- Source/perception/asset fingerprint and immutable parent/handoff membership; cancellation/staleness/foreign/mixed versions reject.

`hash(planned in-memory logical request) == hash(reconstructed in-memory logical request)` and `hash(planned selected media manifest) == hash(reconstructed selected media manifest)`. This proves SEM **can** reproduce the request from locators; it does not imply SEM has yet implemented hydration, transport, response parsing or authenticated background execution. No request payload is persisted to achieve equality.

## 5. SEM-CUTOVER handoff — pending, not IDSER acceptance

The downstream SEM team/workflow must later integrate v3 reference-only handoff consumption with server execution principal, lifecycle/lease, BSS admitted-job handoff, verify full reconstruction, issue fresh scoped image grants, hydrate/verify **only** selected accepted PNGs, apply route/preflight and actual transport serializer, handle provider response schema, REL-03, visual semantic candidates/`non_fact`, finalizer/replay and no fabricated `source_wording`. Provider-visible envelope instructions and serialized HTTP body parity are SEM responsibilities. IDSER freezes the shared composer/transport-policy identity required for its sizing; it does **not** test fake HTTP fetch, ordinary SEM worker, grant redemption, provider success or semantic output.

Old `IDSER-012-05-05` and `-05-06` are superseded/non-executable ownership records. Their former runtime result and visual semantic acceptance does not block IDSER-012-05 CK and must be frozen by a separately authorized SEM-CUTOVER successor before SEM calls itself ready. The existing `SEM-CUTOVER` context is not silently changed by this IDSER documentation update.

## 6. Only canonical Safara PERC-RESET real-data oracle

Use actual *previously accepted* RUN-003 `NormalizedDocument V1` from Docker **Compose project `atlas-canonical-perception`**. This string identifies the Compose project, **not** one volume; inspect the real Compose-owned PostgreSQL `postgres-data` volume and asset `atlas-data` volume, their actual labels/mounts and active Docker context.

Required document: `Safara_Buyer_Business_PRD_Professional.pdf`, project `safara-professional-perception`, source SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, RUN-003 capability `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`. Historical accepted evidence: **12 pages, 254 text blocks, 4 tables, 5 visual regions, 5 distinct verified accepted PNG assets**, perception state `perceived`. These are **historical recorded counts**, not proof of the current local Docker contents: verify current source/cache/accepted manifests and original PNG identity via authorized read-only inspection before CK.

Protect canonical volumes. Use PostgreSQL-supported **logical snapshot restored to separate disposable writable database/volume** for v3 persistence/rollback/replay. Do not mount live canonical PG directory in another PostgreSQL instance or write/reset/migrate canonical data. No `down -v`, newly generated or newly perceived Safara, different Safara project/PDF, repository fixtures/golden JSON, synthetic normalized document or alternative Compose volume may satisfy terminal real-data qualification. If unavailable/mismatched, `BLOCKED_CANONICAL_SAFARA_SOURCE`, not PASS.

Terminal Safara proof is **in-memory mixed/image-aware planning -> v3 locator/hash-only persistence -> authorized read-only reconstruction parity**. All five visual units receive explicit disposition. Terminal CK PASS requires at least one verified actual Safara PNG selected in a structurally fitting in-memory batch. If none can be selected under valid approved policy, report exact BLOCKED source/structural-fit evidence, never PASS. Text/table/v3 and negative stale/foreign/reordering/config/version checks remain required. No SEM worker, provider transport, image attachment, semantic result or production queue work is part of this proof.

## 7. Exit criteria and scope safety

IDSER-012-05 closes only once CK approves active `-05-01`, `-05-02`, `-05-03`, `-05-04` and terminal `-05-07`, using exact canonical Safara source where required. Report:
- complete deterministic in-memory image-aware candidate sizing and BSS prospective fit;
- no durable request body or corpus/media payload;
- locator-only immutable v3 with old-version rejection;
- verified read-only reconstruction equality and all image-locator dispositions;
- unchanged canonical volumes, zero provider calls, zero GHR/BSS send/admission, zero SEM/REL/finalizer side effects;
- documented SEM-CUTOVER successor obligations without claiming downstream implementation.

No provider route activation, real requests, grants, persisted prompt, semantic publication, reconciliation, Master or CES change. If real-data access, serialization policy, source identity or reconstruction cannot be proved, STOP with explicit evidence rather than making new sources or fake PASS.
