# Canonical Perception Baseline v1

- **Status:** `READY_FOR_CK`; this successor baseline becomes effective only after independent PERC-RESET-008 CK `PASS`.
- **Authority:** PERC-RESET-008, parent context §8A, and HMN-PERC-RESET-008-001.
- **Reviewed implementation predecessor:** `06b67dd347542aa6ff2df020354c98b3764188c1`.
- **Canonical Compose:** `atlas-canonical-perception` with `docker-compose.yml` only; no qualification overlay participates.

## Current supported contract

The sole normal route is `docling-run-003-capture` / `atlas.document.perceive`:

```text
capability identity: docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1
option profile:     atlas-digital-pdf-run-003-capture-v1
Docling image:      quay.io/docling-project/docling-serve-cpu:v1.36.0@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7
artifact path:      /opt/app-root/src/.cache/docling/models (image embedded)
```

The embedded baseline is 103 files, `871M`, fingerprint `01ba86056ff361a5b5efb51a570ea8041e9c48acb2ed1e4107e3265a662ccf45`, calculated by:

```sh
find "$DOCLING_SERVE_ARTIFACTS_PATH" -type f -exec sha256sum {} + | LC_ALL=C sort | sha256sum
```

No Docling cache volume is mounted; `/root/.cache` has zero files and is not model-preservation evidence. Restart logs confirm the artifact path is valid and no model weights are downloaded at runtime. Supported input is bounded digital PDF text/table capture and actual visual capture; OCR-only/scanned inputs and diagram/chart/image semantic interpretation are unsupported.

## Accepted manual corpus and durable state

| Project | Original PDF | SHA-256 | Result |
| --- | --- | --- | --- |
| A `safara-professional-perception` | `Safara_Buyer_Business_PRD_Professional.pdf` | `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df` | One RUN-003 execution/cache; `perceived`; 12 pages, 254 text blocks, 4 tables, 5 visuals and 5 verified derived assets. |
| B `safara-run003-three-pdf-07199fff2bcc` | `Safara_PRD_01_Foundation.pdf` | `4a7aa8c90dd2f045ed1d37f73d69c5372fbdbeedc76edfa151cbd1ae88d370cc` | `perceived`; 73 text blocks, 2 tables, 0 visuals/assets. |
| B | `Safara_PRD_02_Finance_Documents.pdf` | `527bcf9926fdb760e706b2505812531aacd6520b8d7f647a70b230983f48188c` | `perceived`; 68 text blocks, 3 tables, 0 visuals/assets. |
| B | `Safara_PRD_03_Readiness_Manifest_Reporting.pdf` | `0b4944c0a1171223020a7e0c76e73cf4ff02e5513ae62fceb9e43d5fd8cb720f` | `perceived`; 88 text blocks, 1 table, 0 visuals/assets. |

Both projects retain one empty Master and one Initial Draft. Post-restart, Project A's five authorized derived-asset readbacks match each persisted manifest; Project B retains three distinct executions/caches. Both project-scoped semantic execution counts and `pgboss` background-execution jobs are zero. Positive successor examples are Project A's table-plus-captured-visual case and Project B's three text/table zero-visual cases.

## Manual Windows PowerShell quickstart

From `C:\Workspace\atlas\ces-platform`:

```powershell
docker compose -p atlas-canonical-perception -f docker-compose.yml config --quiet
docker compose -p atlas-canonical-perception -f docker-compose.yml up --build --detach
docker compose -p atlas-canonical-perception -f docker-compose.yml ps
docker compose -p atlas-canonical-perception -f docker-compose.yml restart
docker compose -p atlas-canonical-perception -f docker-compose.yml ps
```

Atlas is `http://localhost:3001`; Bridge is `http://localhost:3002`. Do not use qualification Compose files or `down -v`. The effective resources are the canonical network, `atlas-data`, `postgres-data`, seven Compose containers (two completed init containers), pinned Docling and PostgreSQL images, and canonical built images. The post-restart inventory found no unexpected residue.

## Supersession and successor obligations

```text
SUPERSEDED_PERCEPTION_REGRESSION_BASELINE=atlas-digital-pdf-no-ocr-v1
CURRENT_PERCEPTION_REGRESSION_BASELINE=atlas-digital-pdf-run-003-capture-v1
OLD_PERCEPTION_BACKWARD_COMPATIBILITY_REQUIRED=false
EFFECTIVE_AFTER=PERC-RESET-008 independent CK PASS
```

Only old path/profile/byte parity is retired. `NormalizedDocument V1`, immutable source/provenance, ownership, empty-Master boundary, ordering/staged admission, source grants, exact derived-asset integrity when visuals exist, valid zero-visual output, replay/idempotency/fencing, `perceived` termination, and zero premature semantic activity remain live obligations.

### Frozen downstream conflict ledger / HMN amendment request

No inspected frozen downstream clause explicitly names `atlas-digital-pdf-no-ocr-v1`, the old route/profile, or old-route byte parity. `BSS-V2-004-03-08-03-03`, `RC-03` (both sized-bundle draft and Stack_Setup_V2 planned copies) broadly requires that “perception remain compatible” in its final legacy baseline rerun. It does not identify retired behavior, so this record does not waive or classify it as a conflict. Before that planned ticket runs, request a narrow HMN clarification that its perception evidence uses this RUN-003 baseline and the live shared guarantees above.
