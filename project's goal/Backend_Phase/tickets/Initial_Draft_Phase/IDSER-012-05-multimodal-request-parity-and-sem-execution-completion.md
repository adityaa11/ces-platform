# IDSER-012-05 — Image-aware semantic batch planning and locator-only handoff

- **State:** `planned`; non-executable family/traceability map. Do not invoke GO/CK/CFC/HMN on the parent.
- **Family batch:** `IDSER-BATCH-12-05`.
- **Authoritative context:** [IDSER-012-05 implementation context](../../IDSER-012-05%20IMPLEMENTATION%20CONTEXT.md).
- **Planning baseline:** approved IDSER-012-04 shared source-packet, estimator, BSS prospective structural-fit, immutable persistence, GHR reference-only fixture, and read-only reconstruction.
- **Source baseline:** approved PERC-RESET RUN-003 accepted `NormalizedDocument V1` and verified Safara-derived media.

## Non-negotiable ownership boundary

**IDSER is the semantic batch planner, not the semantic executor.** For each proposed batch it assembles a complete, canonical *in-memory* SEM logical request, including selected text/table source slots and ordered selected visual descriptors; estimates request bytes, text/image input tokens, output reservation and BSS resource demand; determines structural fit; partitions; and persists **only reference-based immutable reconstruction metadata**.

Persistent `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` contain selected owned/context locators, source and accepted-media references/commitments, versions, identities, hashes, conservative measurements, and structural-fit provenance. They **never** contain a serialized SEM request, compiled prompt, provider JSON body, source text, table content, media bytes, base64, grants, credentials, or unbounded corpus material. A media manifest is composed transiently and committed by deterministic identity/hash, not stored as a copied provider payload. Re-read authoritative accepted derived-asset metadata when reconstructing.

IDSER supplies a **read-only reference-only reconstruction verifier** as the downstream handoff proof: under an authorized source-read boundary, a consumer can deterministically recompute the identical logical request, ordered selected visual manifest, hashes and resource measurements from persisted v3 locators and accepted `NormalizedDocument V1`. This is *not* SEM worker execution or authorization of provider send.

**SEM-CUTOVER owns:** adopting v3 handoffs in the ordinary SEM runtime; server execution identity, BSS admitted-work linkage, scoped grants, image-byte hydration and attachment, provider preflight and dispatch, response-envelope/prompt execution semantics, REL-03, parser, visual semantic finalizer, staging and replay. IDSER requires a compatible stable *composition/serialization-policy contract* for conservative sizing but does not implement or test provider requests over HTTP. No pipeline, estimator, serializer, capacity controller, job or GHR route is duplicated.

## Executable family and handoff disposition

| Sequence | Ticket | Work owned by IDSER |
| --- | --- | --- |
| 1 | [IDSER-012-05-01](IDSER-012-05-01-multimodal-canonical-composition-and-estimation.md) | Pure ephemeral image-aware canonical composition, owned/context selection, complete deterministic estimation |
| 2 | [IDSER-012-05-02](IDSER-012-05-02-multimodal-structural-fit-partition.md) | Image-aware BSS prospective structural-fit and deterministic batch assignment/disposition |
| 3 | [IDSER-012-05-03](IDSER-012-05-03-immutable-v3-multimodal-handoff.md) | Locator-only immutable plan/handoff v3; retire operational v1/v2; reference-only GHR validation |
| 4 | [IDSER-012-05-04](IDSER-012-05-04-authorized-multimodal-reconstruction.md) | Read-only reference/locator reconstruction verifier and exact logical request parity |
| 5 | [IDSER-012-05-07](IDSER-012-05-07-perc-reset-multimodal-terminal-qualification.md) | Real Safara canonical-data planner → v3 handoff → reference-only reconstruction qualification |

The previous [IDSER-012-05-05](IDSER-012-05-05-execution-authority-media-hydration-and-preflight.md) and [IDSER-012-05-06](IDSER-012-05-06-visual-semantic-result-completion.md) are **superseded/non-executable in IDSER**, retained as explicit SEM-CUTOVER ownership notes. No GO/CK/CFC/HMN for those two IDSER tickets. Their former runtime and semantic-result rows are **not** IDSER acceptance conditions or proofs that SEM is implemented; the downstream SEM-CUTOVER owner must freeze its own acceptance before execution.

Dependencies: `-05-02` after `-05-01` CK PASS; `-05-03` after `-05-02` PASS; `-05-04` after `-05-03` PASS; terminal `-05-07` after `-05-01` through `-05-04` PASS only. Parent remains non-executable. Each active child enters GO only by explicit invocation and is reviewed solely against its frozen rows; CFC/HMN remain bounded to child governance.

## Terminal family acceptance — amended and authoritative

| ID | PASS iff |
| --- | --- |
| `RC-01205-01` | In-memory text-only, mixed, and image-only requests are canonically composed; selected owned/context PNGs count once; token/byte demand is deterministic, overflow-safe and includes output reservation once. |
| `RC-01205-02` | Accepted visuals are inventoried and deterministically allocated into fitting batches or explicitly fail-closed; no silent omission, duplicate ownership, count/size/dimension breach, or `imageTpm: unknown` auto-denial. |
| `RC-01205-03` | Persist only immutable locator/reference/hash/measurement metadata; v3 reconstruction from accepted data produces exactly the planned logical-request, source-specification and media-manifest hashes, ordered selection and resource measurements. |
| `RC-01205-04` | Read-only reconstruction verifies scope, source/asset integrity, profile/estimator/route policy identities, structural snapshot, immutable batch binding; stale, foreign, missing, reordered, changed or mixed-version input fails closed *before any SEM execution*. |
| `RC-01205-05` | Provider-specific image TPM stays `unknown` when unknown; IDSER uses a versioned internal image-token estimation policy rather than fabricated provider quota; BSS prospective structural-fit remains the boundary. |
| `RC-01205-06` | Formal downstream SEM-CUTOVER handoff is documented: exact v3 reference fields, reconstructed logical request/manifest contract, selected-only media expectation, and outstanding SEM-owned hydration/transport/semantic-result obligations. **No SEM execution PASS is implied.** |
| `RC-01205-07` | On a protected isolated logical copy of the **existing canonical Safara professional** accepted `NormalizedDocument V1`, all five actual visual locators and their verified accepted derived-media identities receive explicit planner disposition, and every persisted selected batch passes read-only exact parity. Synthetic-only proof cannot PASS. |
| `RC-01205-08` | Text/table planning, immutable replay/cancellation, source authorization, reference-only GHR validation, and BSS read-only policy protections continue; operational plan/handoff v1/v2 paths reject and v3 is sole active version. Zero live GHR/BSS admission, SEM work, provider calls, or canonical-volume writes. |

Terminal multimodal CK PASS requires at least one **actual accepted Safara PNG** selected in a fitting in-memory batch, with all five visuals dispositioned. If no verified real image fits under legitimate structural policy, report **BLOCKED_IMAGE_STRUCTURAL_FIT** (or the precise source/policy blocker), not CK PASS. No image hydration or SEM attachment is authorized.

## Canonical Safara PERC-RESET data binding

The only terminal real-data oracle is the existing accepted RUN-003 `Safara_Buyer_Business_PRD_Professional.pdf` of project `safara-professional-perception`, source SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`. Recorded historical counts: **12 pages / 254 text blocks / 4 tables / 5 visuals / 5 accepted verified PNG assets**. Reverify the actual Docker environment before any PASS.

`atlas-canonical-perception` is the **Docker Compose project** (not a single volume): inspect actual Compose-owned `postgres-data` for accepted `NormalizedDocument V1` and manifest, plus `atlas-data` for original derived assets. Source/manifest/asset identity must match using authorized read-only access. Do not replace with `docs/example`, golden bundles, synthetic fixtures, another Safara PDF/volume, or a new Docling run. A missing/mismatched source, mount, accepted cache, or image asset => `BLOCKED_CANONICAL_SAFARA_SOURCE`, not PASS.

Canonical volumes are protected. Only a PostgreSQL-supported logical snapshot restored to an isolated writable DB/volume may be used for v3 persistence/replay tests. Do not mount the live PG data directory in a second PG server, run `down -v`, migrate/reset canonical DB, or modify canonical image storage.

## One active immutable plan/handoff version

Only `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` remain operational. Remove/disable v1/v2 persistence and active validation/acceptance in the plan/GHR/reconstruction path. Reject mixed versions, never rewrite old immutable rows, and disposition in-flight old work through explicit authorized decision before cutover. Independent `NormalizedDocument V1`, Semantic V1 and the reference-only GHR body contract are separate namespaces; their `v1` labels do not imply legacy.

## SecurityReadiness and hard stops

- `SR-01205-B1`: BSS owns capacity/admission; IDSER only reads prospective structural policy.
- `SR-01205-B2`: Atlas accepted NormalizedDocument/media authority, immutable v3 locators and scope remain authoritative.
- `SR-01205-B3`: GHR remains reference-only; SEM owns runtime authority/media and semantic results.
- `SR-01205-T1`: accepted descriptors → transient sizing; `T2`: locators/hashes → authorized read-only reconstruction; `T3`: future SEM consumer boundary is an explicit unsatisfied downstream contract.
- `SR-01205-C1`: forbid durable request/source/media bytes, duplicate processing paths and unapproved capacity policy.
- `SR-01205-C2`: prohibit browser-session authority being treated as a durable SEM execution grant.
- `SR-01205-R1`: deterministic mixed/visual planning; `R2`: v3 immutable/reconstruction negatives; `R3`: real Safara isolated parity and no-side-effect evidence.
- `SR-01205-U1`: image token heuristic is internal accounting, never a stated Anoman quota.

Evidence contains only redacted identifiers, code commit, hashes, versions, counts, demands, BSS structural outcomes, accepted source metadata and no-effect checks. Exclude provider body, prompt, raw corpus, media bytes, base64, grants and credentials.

**Hard stop:** this family does not implement/authorize SEM hydration, provider call/preflight, parser/finalizer, worker dispatch, production GHR/BSS jobs, semantic publication, reconciliation, Master, or CES work.
