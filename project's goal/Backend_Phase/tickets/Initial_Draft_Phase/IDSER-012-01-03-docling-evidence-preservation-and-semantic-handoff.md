# IDSER-012-01-03: Docling evidence preservation and offline semantic handoff

- **State:** `planned`; planning only, not GO.
- **Review batch:** `IDSER-BATCH-12-01-03`.
- **Dependencies:** `IDSER-012-01-02` CK `PASS`; approved BSS-V2-004-02 and BSS-V2-004-03-03 boundaries.
- **Parent:** [IDSER-012-01](IDSER-012-01-fair-bounded-local-docling-perception.md)
- **Planning authority:** [RUN-003 evidence-preservation context](../../IDSER-012-01-03-docling-evidence-preservation-implementation-context.md).

## Outcome

For an already authorized original PDF, preserve the qualified RUN-003 text, table, and picture evidence through a complete `NormalizedDocument v1`, Atlas-owned durable derived-image storage, and an authorized offline retrieval seam.  The terminal state remains `perceived`; no semantic job, provider call, aggregation, UI, or new source admission occurs.

```text
authorized source PDF -> RUN-003 capture -> complete V1 evidence
 -> verified Atlas-owned derived assets -> accepted perceived -> offline read only -> STOP
```

## Partition and gates

`IDSER-012-01-03-01` qualifies the profile and deterministic source mapping. `IDSER-012-01-03-02` consumes that mapping to establish durable asset transfer, acceptance, replay, and bounded resolver behavior. Neither child independently establishes a production-complete pipeline. `-03-01` exposes a bounded transient visual-capture descriptor carrying validated bytes, source/profile/page/locator/geometry and integrity metadata; `-03-02` consumes it for Atlas-controlled persistence and durable pointer issuance, without a second Docling parser. RUN-003 normal staged activation is forbidden until `-03-02` CK PASS; retain the previous approved route or fail closed.

```text
IDSER-012-01-02 CK PASS
  -> IDSER-012-01-03-01 CK PASS
  -> IDSER-012-01-03-02 CK PASS
  -> IDSER-012-02-01 planning/execution eligibility
```

## Frozen evidence and planning reconciliation

Planning was reconciled at `codex/new-atlas-backend` / `5ac41a5ccb1901f75a8a213f6c683dd057bc931a`. The RUN-002/RUN-003 laboratory artifacts are accessible under `C:\Workspace\atlas-perception-lab\raw Docling response`; they are evidence to identify and fixture, never overwrite. Current code confirms the stated gaps: the adapter uses `include_images=false` and `image_export_mode=placeholder`; table mapping depends on optional top-level text/markdown; V1 permits `derived/` references; cache metadata records references but not durable bytes; and the local store only accepts `documents/<UUID>` keys.

## Shared non-authority

Do not change the two-permit/two-Bridge/two-Docling/one-Uvicorn CPU profile, Docling privacy/network boundary, source admission, source-grant authority, semantic contract meaning, reconciliation, Sources UI, or legacy tickets. Do not use OCR, full-page images, VLM/Granite, GPU, remote AI, a new storage service/broker, a V2 normalized contract, binary/base64 in replay JSON, or shared-DB qualification evidence.

## Shared review contract

| Rows | Binary closure owner |
| --- | --- |
| RC-01, RC-02, RC-03, RC-05, RC-07, RC-10, RC-12 | `-03-01` |
| RC-04, RC-06, RC-08, RC-09, RC-11, RC-13, RC-14 | `-03-02` |

Every applicable row requires concrete fixture and isolated integration evidence. A missing fixture, bound violation, lossless-table decision, geometry discrepancy, or unresolved retention decision is `BLOCKED`/human decision, never PASS.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-0120103-ATLAS-OWNERSHIP` keeps storage, metadata, acceptance, and source authority in Atlas; `BOUNDARY-0120103-BRIDGE` keeps Bridge without Atlas filesystem/DB privilege; `BOUNDARY-0120103-PRIVATE-DOCLING` retains the pinned private CPU route; `BOUNDARY-0120103-ADMISSION` preserves original-PDF-only admission.
- **Trust boundaries:** `TRUST-0120103-RAW-DOCLING` covers untrusted raw response to validated mapping; `TRUST-0120103-BINARY-HANDOFF` covers bounded Bridge-to-Atlas image transfer; `TRUST-0120103-ASSET-READ` covers authorized read-only evidence resolution.
- **Sensitive assets / identity:** `ASSET-0120103-PDF-EVIDENCE`, `ASSET-0120103-DERIVED-BYTES`, and `ASSET-0120103-GRANT` must remain out of logs/replay metadata. `IDENTITY-0120103-EVIDENCE` binds original document/source hash, profile identity, execution, page, visual locator, asset reference, hash, size, and media type.
- **Extension seams:** `SEAM-0120103-PROFILE`, `SEAM-0120103-LOCATOR`, `SEAM-0120103-DERIVED-STORE`, `SEAM-0120103-MANIFEST`, and `SEAM-0120103-RESOLVER` retain future policy attachment points.
- **Prohibited couplings:** `COUPLING-0120103-BRIDGE-FILESYSTEM`, `COUPLING-0120103-DERIVED-AS-SOURCE`, `COUPLING-0120103-BINARY-REPLAY`, `COUPLING-0120103-PATH-LEAK`, and `COUPLING-0120103-SEMANTIC-EARLY` are forbidden.
- **Unresolved policy:** `SEC-GAP-0120103-RETENTION` (orphan/historical asset retention) and `SEC-GAP-0120103-PRODUCTION-OBJECT-STORE` remain explicit human-authority decisions.
- **Review bindings:** `REV-READY-0120103-01` verifies `TRUST-0120103-RAW-DOCLING` and profile/mapper integrity; `REV-READY-0120103-02` verifies `TRUST-0120103-BINARY-HANDOFF` under crash/replay/conflict cases; `REV-READY-0120103-03` verifies `TRUST-0120103-ASSET-READ` and non-recursive admission using foreign/tampered/path negatives.

## Required planning amendments

This ticket set amends the parent umbrella to place evidence preservation between `-01-02` and semantic planning, and makes `IDSER-012-02-01` depend on `-03-02` CK `PASS`. It does not renumber or rewrite historical implementation/CK records.

## Workflow evidence

Each child must maintain a compact closure ledger: current HEAD, effective profile/identity and limits, fixture hashes/counts, isolated Compose/DB commands, storage/replay observations, negative results, and the explicit zero-semantic-job/call count. Reach `READY_FOR_CK` only when every child row is closed; this document grants no GO.
