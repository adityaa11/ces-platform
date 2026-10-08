# IDSER-012-01-03-01: Qualified Docling capture and deterministic evidence mapping

- **State:** `approved`.
- **Review batch:** `IDSER-BATCH-12-01-03-01`.
- **Dependencies:** `IDSER-012-01-02` CK `PASS`.
- **Parent:** [IDSER-012-01-03](IDSER-012-01-03-docling-evidence-preservation-and-semantic-handoff.md)

## Planning clarification history

- **2026-10-09, human planning authorization:** This amendment clarifies the
  execution mechanism for existing `RC-012010301-05`; it does not add,
  remove, renumber, or strengthen any Review Contract row. The active GO owns
  the bounded qualification-only seam below and remains subject to every
  existing outcome, forbidden-behavior, and activation-gate boundary.

## Outcome

Qualify a distinct RUN-003 capture-only identity and deterministically map its source-grounded text, tables, and pictures into `NormalizedDocument v1` evidence suitable for the later storage child. The mapper must expose bounded, in-process validated visual-capture descriptors for the storage child, not mint a replayable `derived/...` pointer before an Atlas-verified asset manifest exists. This child must not make an asset durable, accept a document with a figure pointer, activate the image-enabled profile for ordinary staged admission, or run semantic work.

## Owned behavior

- Register one coherent, pinned CPU standard PDF profile: PDF→JSON; no OCR; accurate table structure; embedded images; no page images, descriptions, classifications, chart extraction, code/formula enrichment, GPU, or remote service. Preserve Docling Serve `1.36.0`, runtime `2.132.0`, existing 2/2/2/1 capacity, and all effective response/request limits.
- Requalify route registry, adapter options, Compose/config identity, capability identity, cache provenance, and invalidation behavior together. Keep RUN-003 production activation gated until `-03-02` CK PASS; prior approved routes stay in force or the new route fails closed. Old image-disabled cache results cannot silently mix with the new profile.
- Map all source-grounded `texts[]`, `tables[].data.grid`/cell metadata, and `pictures[]`; assign deterministic unique IDs compliant with both V1 and Semantic V1, retaining a debug/qualification correspondence without changing V1 unnecessarily.
- Specify and fixture-test the transient descriptor handoff to `-03-02`: Docling source reference, original document/source SHA, qualified profile, page, Atlas locator, geometry, validated decoded image bytes, media type, dimensions, byte count, and hash. No bytes enter NormalizedDocument V1, replay JSON or logs; `-03-02` must not re-run Docling or implement a competing mapper.
- Preserve pages, ordering, validated geometry in one documented Atlas coordinate system, source labels/captions as text evidence, and picture provenance. Never infer diagram relationships, chart values, or captions.
- Fail closed on malformed page/provenance/geometry/ID, duplicate identity, unsupported media/metadata, unrepresentable materially complex table, or any relevant observed element that is neither mapped nor explicitly accounted for.

## Forbidden behavior

No production rollout of the image-enabled route, Atlas derived-store write, Bridge filesystem mount, binary handoff/replay redesign, semantic context/provider call/job, source-admission change, V2 contract, table-image default, or acceptance-state change belongs here. A fixture success is not real source-grant/storage/concurrency proof.

## Review Contract

| Row | Required behavior | PASS iff |
| --- | --- | --- |
| RC-012010301-01 / RC-01 | Exact RUN-003 profile has a new qualified identity. | Effective adapter/route/config/runtime inspection proves every frozen setting/version and a mismatch fails readiness. |
| RC-012010301-02 / RC-02 | Text/table mapping is complete and deterministic. | Safara fixtures account for 254 texts, 4 tables, and 69 cells with order, headers/spans, readable exact-source table content, and fail-closed complex-table coverage. |
| RC-012010301-03 / RC-03 | Figure mapping is source-grounded only. | Five figures map to pages 3/5/7/8/10 with valid IDs, labels/captions separately preserved where sourced, usable geometry, and zero invented meaning. |
| RC-012010301-04 / RC-05 | Locators and excerpts cross both contracts. | Repeat mapping yields stable unique compliant IDs; exact text/table excerpts resolve from trusted normalized content; Docling `self_ref` is never used directly where invalid. |
| RC-012010301-05 / RC-07 | Qualified profile stays within frozen bounds. | Isolated sequential/two-concurrent real-PDF evidence records response/payload/resource limits and held-third behavior; any exceeded limit is a human decision. |
| RC-012010301-06 / RC-10 | Profile/cache evidence is isolated. | Profile, route, capability identity, cache key/provenance, and invalidation tests reject cross-profile mixing and retain an explicit historical-evidence decision. |
| RC-012010301-07 / RC-12 | Geometry, order, and provenance survive mapping. | Repeated fixtures verify page/order/reference correspondence and documented coordinate conversion; wrong origin/dimensions fail qualification. |

| RC-012010301-08 | Bounded transient visual handoff is defined. | All five Safara figures yield validated, source-bound transient descriptors; no binary or premature asset reference enters replayable V1 output. |
| RC-012010301-09 | No premature profile activation. | Before `-03-02` CK PASS, image-enabled normal staged admission cannot accept missing visual assets; previous approved route remains or the new route fails closed. |

## Required negatives and evidence

Use the frozen RUN-002/RUN-003 artifacts for mapper fixtures and repository-approved digital PDFs for isolated real Compose proof. Cover missing/invalid pages, duplicate/invalid IDs, absent grid, malformed cells, unsupported complex layout, malformed figure bytes/metadata, bad bounds/coordinates, profile mismatch, profile cache collision, and over-limit raw response. Record profile identity, raw fixture hashes, item accounting, and zero semantic calls/jobs. Do not touch the shared developer DB.

### Qualification-only RUN-003 execution seam

The ticket owns the smallest isolated Compose/test entrypoint needed to execute
the actual RUN-003 Docling adapter and deterministic mapper against real
digital PDFs. It is qualification-only, never an ordinary production
perception route. It uses the frozen CPU Docling configuration and preserves
the approved 2/2/2/1 composition, timeouts, payload limits, and route
identities.

The entrypoint must exercise sequential conversion, two concurrent real
conversions, and a held third request with observable real Docling concurrency
and bounded resource behavior. It must not submit mapped results to Atlas
perception-result acceptance, create production perception or semantic jobs,
bypass or weaken the RUN-003 production activation gate, persist derived
images, issue durable asset references, or implement `IDSER-012-01-03-02`.
Use isolated resources only: do not modify the running `atlas-perception-lab`
stack or shared developer database.

This seam establishes direct Docling conversion-capacity evidence only. It
does not independently prove the Atlas two-permit admission behavior already
qualified by `IDSER-012-01-02`. Frozen RUN-003 fixtures remain the evidence
for exact mapping fidelity; the real Compose run independently establishes
runtime behavior.

## Security Refactor Readiness

**Status:** `applicable`.

- `TRUST-012010301-RAW` is raw Docling JSON/image content crossing into deterministic validation; `ASSET-012010301-SOURCE-EVIDENCE` is source-grounded text/table/picture material.
- `IDENTITY-012010301-MAPPING` binds source SHA, qualified profile/capability identity, page, original element correspondence, and emitted locator.
- `SEAM-012010301-PROFILE`, `SEAM-012010301-GEOMETRY`, and `SEAM-012010301-EXCERPT` must remain explicit and testable.
- `COUPLING-012010301-SELFREF`, `COUPLING-012010301-SILENT-LOSS`, and `COUPLING-012010301-VISUAL-MEANING` are forbidden.
- `REV-READY-012010301-01` verifies profile/cache identity and effective runtime evidence; `REV-READY-012010301-02` verifies mapping/accounting/geometry/excerpt negatives and source-only semantics.

## CK handoff

Provide fixture/real-route closure for all nine rows, the effective profile identity, and the unresolved lossless-table or historical-retention decision if any. Mark `READY_FOR_CK`; do not advance to `-03-02` without CK `PASS`.
