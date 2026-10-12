# PERC-RESET-003 — RUN-003 zero-visual validity and exact asset coverage

**Stage:** 3/8 · **Type:** narrow perception worker/authority correction · **Dependency:** 002 · **GO:** `GO PERC-RESET-003` only.

**Workflow state:** `approved` — independent CK `PASS` is recorded in `project's goal/feedback/PERC-RESET-BATCH-03-888b7ca-verification.md`.

## Outcome

A no-picture digital PDF **must succeed** under the same image-capable RUN-003 profile. A picture-bearing PDF **must not succeed** with missing, mismatched or fabricated derived assets.

## Existing candidate defects to confirm

- `apps/agents-bridge/src/document-perception-worker.ts` currently checks `!perceived.transientVisualDescriptors?.length` as an error when RUN-003 requests asset handoff.
- `packages/atlas-db/src/perception-authority.ts` currently checks `!assets.length` during RUN-003 acceptance.

Distinguish **zero visual regions** (valid) from **visuals present but descriptors missing** (invalid). Validate total visual-region-to-derived-asset cardinality, not simply `assets.length > 0`. The result must keep one exact page/locator/source/profile/media hash binding per captured visual. A zero-visual document still receives RUN-003 source/profile/cache identity and `derivedAssets=[]`.

## Allowed work

Correct these two perception seams and their focused test fixtures only. Preserve source grant checks, exact bytes/hashes, bounded verified derived-store write/readback, manifest and normalized-cache atomicity, replay, D1 terminal semantics and no indirect job creation. No new OCR, caption, chart classification, fallback, semantic schema or storage backend.

## Binary review contract

- **R3-01:** RUN-003 `textBlocks` with zero `visualRegions` and zero descriptors → normalized result valid, no derived-asset handoff calls.
- **R3-02:** RUN-003 tables with zero pictures → valid structural table output; no forced visual evidence.
- **R3-03:** RUN-003 N captured visuals → N bound descriptors/refs and exactly verified associated assets, without collisions or cross-document mismatches.
- **R3-04:** visual with missing descriptor, missing assetRef, foreign source SHA, wrong page/locator, altered bytes, hash/length/media mismatch → rejects before accepted `perceived`; no silent dropping.
- **R3-05:** any accepted result remains cached by exact RUN-003 identity, without semantic jobs or new source documents.

## Evidence

Focused worker and DB authority tests with explicit positive and negative controls. No arbitrary retries. Keep the Docker engine clean until 004; defer real full-Compose proof to 006/007. **Terminal:** `READY_FOR_CK` / `CHANGES_REQUIRED` / `BLOCKED`.
