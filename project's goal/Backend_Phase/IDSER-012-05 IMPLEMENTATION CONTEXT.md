# IDSER-012-05 — Implementation Context: Multimodal Request Parity and SEM Completion

- **State:** reference implementation context bound by the planned IDSER-012-05 parent and children. This document is not a stand-alone GO/CFC/CK authorization.
- **Goal:** One shared canonical selected request across IDSER planning, immutable v3 handoff, background SEM reconstruction, provider dispatch, and visual semantic result accounting.
- **Primary data source:** the **previously accepted canonical PERC-RESET Safara professional NormalizedDocument V1**. No reconstruction or fresh perception of a new Safara PDF is a substitute.
- **Canonical source authority:** `project's goal/feedback/CANONICAL-PERCEPTION-BASELINE-v1.md`; approved IDSER-012-04-07 real-data qualification.

## A. Exact source and Docker resource binding

`atlas-canonical-perception` is the Docker **Compose project**, not a single named volume. `docker-compose.yml` mounts project-owned `postgres-data` at `/var/lib/postgresql` (PostgreSQL accepted NormalizedDocument V1 and derived-media manifest) and `atlas-data` at `/workspace/.atlas-data` (retained PNG bytes). Resolve **actual** volume names and attached container IDs from the current Docker context via Compose and Docker inspection. Never infer an unverified physical volume name from the project label, or select similarly named previous test stacks.

The **sole mandatory real-data oracle** is the existing accepted RUN-003 output for:
- Project: `safara-professional-perception`.
- Original document: `Safara_Buyer_Business_PRD_Professional.pdf`.
- Source SHA-256: `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`.
- RUN-003 capability identity: `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`.
- Recorded terminal perception state: `perceived`.
- Recorded normalized evidence: **12 pages, 254 text blocks, 4 tables, 5 visual regions and 5 verified derived PNG assets**.

These are historical accepted baseline values, **not a claim of fresh inspection of the user's live Docker volumes**. Before testing, inspect the canonical Compose project, PostgreSQL and Atlas volume mounts read-only; select the accepted normalized document through the established Atlas resolver and verify its source SHA, normalized version `v1`, project/document/perception binding, accepted cache non-invalidation, terminal lifecycle, exact counts and five one-to-one distinct accepted PNG manifest entries with `accepted_at IS NOT NULL`. Verify PNG SHA-256, byte counts and dimensions via authorized read-only access to the corresponding canonical asset store. Record only sanitized fingerprints/counts/mount identities and exact verification status.

**Fail closed:** no fallback if the actual canonical Compose project, volume, accepted Safara cache, source hash, count, five accepted PNGs, or asset readback cannot be verified. Report `BLOCKED_CANONICAL_SAFARA_SOURCE` with the missing observation. Never use `docs/example`, `packages/atlas-fixtures/generated/safara-golden-bundle.json`, a mapping JSON fixture, another Safara PDF, new Docling conversion, synthetic NormalizedDocument, other qualification project's database, empty reseeded DB, or invented media hashes to claim canonical-source PASS. Those may only supplement **unit** tests.

## B. Canonical data must not be mutated by qualification

Before any write, use a PostgreSQL-supported **logical snapshot/backup** of the inspected canonical instance, restored into a **separately named isolated writable database/volume**. Recheck that the isolated copy retains the accepted Safara identity and all five derived-image manifest descriptors, with corresponding original bytes exposed through a safely authorized isolated read-only asset reader. Do not mount or share a live PostgreSQL data directory in a second server.

Do not change canonical `postgres-data` or `atlas-data`; do not run `docker compose down -v`, prune/reset/migrate canonical state, new PERC-RESET perception, external provider execution, GHR delivery, BSS admission/reservation, or semantic writes on canonical source. Prove pre/post canonical identities and no prohibited effects.

## C. Frozen source slot contract owned by IDSER-012-05-01

Before any request hash or immutable v3 record is frozen:

1. A verified selected **independently owned** `visual_region` is an extraction-eligible `owned_source`; `pending_unexamined_visual` may remain as a pre-extraction semantic examination status, **not an attachment denial**.
2. A selected **context-only** `visual_region` stays `context_only_reference`; it may be attached and charged for, but cannot independently own a semantic source result or gain contextual trust automatically.
3. Both owned and context selected images are included exactly once in canonical ordered manifest and token/byte estimate using selected locator + accepted asset identity, **independent** of `role === pending_authorized_media` or `status === ready`.
4. Source slots, roles, pending status, source specification and media manifest hashes are deterministic. Later `-05-06` parser/finalizer work must consume the same frozen semantics without changing the source packet/plan hashes. Incompatibility requires explicit HMN before freeze.

## D. Single request sizing and Anoman serializer parity

IDSER uses a single shared provider-neutral composer to select exact text, tables and images. Full input tokens include the internally versioned image estimate; the initial 768-pixel tile and 516-token-per-tile heuristic is **not an official provider rate/quota**. `imageTpm: unknown` remains unknown and cannot solely block image attachment. Enforce effective route image count/size/dimension/media limits and output reservation once under existing BSS authority.

The provider adapter's actual Anoman serialization policy must be used as the conformance oracle with fake fetch: compare the complete in-memory JSON body containing model, multipart messages, base64/data URL, response_format, temperature, stream and framing to the metadata-only conservative planned bytes. Enforce `actualSerializedRequestBytes <= plannedConservativeRequestBytes` per batch, without persisting sensitive bodies. Pin/check route, adapter, image capability, estimator and configuration policy identity; changed effective transport/limit must fail closed before dispatch, not silently use a different bound or fallback to text-only.

## E. One active plan/handoff version

Only `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` are operational in IDSER/GHR/SEM. Retire v1/v2 writers, readers, version-switching execution and old reconstruction/fallback. Historical old records stay immutable, but cannot be accepted or dispatched; inventory any unfinished old work and require authorized disposition. `NormalizedDocument V1`, `Semantic V1` and independent reference-body version namespaces are distinct and do not become legacy merely because immutable plans move to v3.

## F. Ordinary SEM execution and semantic result acceptance

The ordinary SEM worker—not a test-only pure composer—must take the server-authorized **exact selected v3 batch** through reconstruction, selected-only scoped grant issuance, hydration, preflight, and fake provider transport. A cached normalized document with five images cannot cause a smaller selected batch to hydrate or attach all five. Retried execution uses fresh scoped grants; no whole-document replay or legacy plan fallback.

Parser, REL-03, finalizer, staging and replay must accept owned visual `candidate` and genuine bounded `non_fact` results with trusted `visual_region` locator evidence, including image-only sources with **no label/text** and optional absent `source_wording`; they must not invent captions, treat extraction failure as `non_fact`, allow foreign results or elevate context-only visual ownership.

Terminal `-05-07` performs end-to-end composition on an **isolated copy of the actual canonical Safara accepted data and corresponding five PNG bytes**, with fake network/structured responses only. Capture exact redacted planned/reconstructed/dispatched logical request hashes, selected image order, image token/byte accounting, actual serialized body bytes, source-result/replay evidence, and negative route/config drift cases. Assert no canonical write or provider/BSS/GHR live side effect.

## G. Exit criteria

No family CK PASS without: fresh live canonical source/mount/PNG verification; isolated-copy integrity; deterministic selected-image source/role contract; complete resource sizing and adapter conformance; v3-only persisted handoff; selected-image server-authorized ordinary-worker attachment under fake transport; visual semantic-result processing; stale/foreign/config-drift and old-version negative proof; zero prohibited canonical effects.

If any part is inaccessible, unsafe, unverified or inconsistent, report explicit BLOCKED/CHANGES_REQUIRED. **Never substitute other datasets or declare terminal qualification based on synthetic source fixtures alone.**
