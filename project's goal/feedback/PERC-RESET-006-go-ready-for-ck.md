# PERC-RESET-006 GO Professional Safara PDF multimodal perception checkpoint

- **Ticket:** `PERC-RESET-006` — Professional Safara PDF multimodal perception E2E
- **Batch:** `PERC-RESET`
- **Authorized checkpoint:** `GO PERC-RESET-006`
- **Dependency:** PERC-RESET-005 approved by `PERC-RESET-BATCH-05-7ff0ebb-review.md`
- **Ticket state:** `awaiting_review`
- **Project:** `safara-professional-perception` (`156d4756-55cf-491f-9fa1-bea3c37ecb84`)
- **Date:** 2026-10-13
- **Scope:** Existing Project A source execution and persisted perception evidence only. No source edits, semantic execution, semantic-provider invocation, Master publication, or successor-ticket work.

## Real execution and source inventory

The immutable source remains `docs/example/Safara_Buyer_Business_PRD_Professional.pdf`: 314,167 bytes, 12 pages, `%PDF-` header, SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`.

Original-PDF visual inspection found four tables on pages 1, 4, 6, and 9 and five embedded visual regions on pages 3, 5, 7, 8, and 10. They are an operational flow, a quota chart, a payment-status flow, a document-status screen mockup, and a readiness decision flow. This is structural evidence only; it does not claim diagram understanding.

Execution `39cc9cad-9d74-4cfa-8eb6-9c435d03022e` has one authorized source grant, one logical perception execution, capability identity `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`, execution `completed`, member `perceived`, and Master `empty`.

The normalized v1 document has 12 pages, 254 text blocks, four tables, and five visual regions. Table grids preserve row/column coordinates, header flags, and spans. Examples: page 4 `docling-table-p4-2` is 4x5 with a header row; page 6 `docling-table-p6-3` is 5x4 with a header row; page 9 `docling-table-p9-4` is 7x3 with a header row. Every observed cell had `rowSpan=1` and `columnSpan=1`.

## Captured visual assets

Every normalized visual locator has an accepted Atlas-owned `derived/...` reference and one manifest bound to the source SHA, RUN-003 profile, page, locator, PNG media type, dimensions, byte size, and content SHA-256. Approved authority readback verified stored bytes against every manifest without emitting binary content.

| Page / locator | Asset reference | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| 3 / `docling-visual-p3-1` | `derived/4ed9d136-d6e1-431f-97f0-c7167a5a35a3` | 942x485 | 59,393 | `afeb88b5cb0f53dbdaaa041e245f0060fe669e1d0286af4d30665568365a7431` |
| 5 / `docling-visual-p5-2` | `derived/153792cf-7ac4-47e0-90db-f44a75a15a56` | 887x431 | 18,252 | `5c24f70e98908cfc024dd5a0b8c3d7815b9ef8a725eae9de945ada9c8f5529e1` |
| 7 / `docling-visual-p7-3` | `derived/a8d6fdf7-3df0-4ec3-a7c2-021fdc2a280e` | 873x328 | 30,526 | `d97817f6d847ab700e4a5beaf4afc99429a0068a4e942039c472f49bf9b5a6e6` |
| 8 / `docling-visual-p8-4` | `derived/e9041fa4-2095-4171-8073-506009c5763d` | 989x548 | 70,080 | `20c44029b8561fc64214fe208ae7a8600dfcd4dd4de36d379e8719f6d383b67c` |
| 10 / `docling-visual-p10-5` | `derived/b198c4f9-e155-4c8b-b7e2-43315bbc408f` | 888x311 | 31,762 | `6dba319cc17399e160e7ed7f406fba57c001f1e6bb2dc8d087f58ec5a378f42` |

## Validation

- `docker exec atlas-canonical-perception-atlas-1 node apps/atlas/scripts/derived-asset-cfc-qualification.mjs restart-readback safara-professional-perception` — passed; all five owner-authorized readbacks matched manifest sizes and SHA-256s; member remained `perceived`.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — passed 12/12; covers missing/foreign/duplicate descriptors, colliding references, rejected handoff, and no dangling accepted reference.
- `docker exec atlas-canonical-perception-atlas-1 sh -lc 'pnpm --filter @atlas/db test:derived-assets'` — passed 1/1; isolated temporary fixtures prove foreign, missing, misbound, corrupted, and altered asset data fail closed without an accepted dangling `assetRef`; fixtures clean up afterward.
- Read-only live query — one source grant, one execution, five accepted manifests, zero project semantic executions, zero semantic jobs, zero non-perception jobs, and no `base64` or `data:image` payload in persisted normalized cache or result replay.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-006-01 | Real execution proof 1 | One authorized grant and intended RUN-003 execution with image capture, table structure, no OCR, and normalized v1 | Project A grant/execution/cache query; approved PERC-RESET-004 route evidence; normalized v1 inventory | PROVEN |
| RC-PERC-RESET-006-02 | Real execution proof 2 | Truthful source and normalized page/locator/table inventory | Original PDF inspection; normalized query: 12 pages, 254 text blocks, tables on 1/4/6/9, visuals on 3/5/7/8/10; grid checks | PROVEN |
| RC-PERC-RESET-006-03 | Real execution proof 3 | Each captured visual has exact trusted derived asset and approved readback; no stored media binary | Five accepted manifests and owner-authorized authority readback; cache/replay payload check | PROVEN |
| RC-PERC-RESET-006-04 | Real execution proof 4 | Completed execution, perceived member, fresh RUN-003 identity, empty Master, and zero semantic activity | Read-only live state query: required states; semantic executions/jobs and non-perception jobs all zero | PROVEN |
| RC-PERC-RESET-006-05 | Real execution proof 5; binary oracle | Coverage is truthful; no diagram understanding or fabricated visual result claimed | Original visual inspection and matching five actual locators; no semantic claim in this record | PROVEN |
| RC-PERC-RESET-006-06 | Negative regression | Forged, foreign, missing, corrupt, or misbound evidence cannot yield accepted dangling asset or mutate Project A | Focused worker and derived-assets tests; isolated temporary fixtures clean up after validation | PROVEN |

Internal readiness: `READY_FOR_CK`.

This is an implementation readiness handoff only. It is not a CK `PASS` and does not authorize PERC-RESET-007.
