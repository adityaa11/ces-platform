# PERC-RESET-001 GO blocker record

- **Ticket:** `PERC-RESET-001` — Docker inventory and reset (preserve downloaded Docling models)
- **Batch:** `PERC-RESET`
- **State:** `planned` (not eligible for `awaiting_review`)
- **Date:** 2026-10-12
- **Terminal:** `BLOCKED`
- **Authorized checkpoint:** explicit `GO PERC-RESET-001`
- **Docker context:** `desktop-linux` (Docker Desktop local Linux engine, server `29.8.0`)
- **Repository:** branch `codex/new-atlas-backend`, HEAD `b7bee3d5341350eae39264a21fd1df315528f052`, with pre-existing unrelated dirty/untracked REL-03 and planning paths preserved unchanged.

## Blocking conditions

1. A separate, active REL-03 qualification workload is running on the selected engine:
   - container: `bfd11cd5a5d07d2a77ef37043b148479b32e61c4bda196e0b88582ada350ae76` (`atlas-rel03-qualified-postgres-1`)
   - project: `atlas-rel03-qualified`
   - volume: `atlas-rel03-qualified_postgres-data`
   - host configuration: `C:\Temp\atlas-rel03-qualified\docker-compose.yml`

   The frozen ticket expressly protects the REL-03 uncommitted candidate and requires `BLOCKED` for an unrelated critical workload. Its PostgreSQL data was not stopped, inspected for content, or altered.

2. The actual Docling cache mounts are durable Docker volumes, but none contains a file. Every listed volume was mounted read-only into a one-shot, non-Compose shell using the already local pinned Serve image; each reported `files=0` and `4.0K /cache`:

   - `atlas-perception-lab_docling-models`
   - `ces-platform_docling-models`
   - `idser-012-01-03-01-qualification_docling-models`
   - `idser-012-01-03-02-cfc-capacity_docling-models`
   - `idser-012-01-03-02-cfc-semantic-evidence_docling-models`
   - `idser-012-01-03-02-qualification_docling-models`
   - `idser-012-01-03-02_docling-models`

   Consequently, the downloaded model files required by the ticket cannot be established as safely preserved independent of a container writable layer. The pinned Serve image and every stopped Docling container/cache volume were left intact. No model download or Compose boot occurred.

## Source-corpus guard

| File | Bytes | SHA-256 | Header |
| --- | ---: | --- | --- |
| `Safara_Buyer_Business_PRD_Professional.pdf` | 314167 | `2F537E8BB7EA4F69FB906AF03D0265E2A986A0F15C2DBEDBBACE5328CD40E7DF` | `%PDF-` |
| `Safara_PRD_01_Foundation.pdf` | 114181 | `4A7AA8C90DD2F045ED1D37F73D69C5372FBDBEEDC76EDFA151CBD1AE88D370CC` | `%PDF-` |
| `Safara_PRD_02_Finance_Documents.pdf` | 112316 | `527BCF9926FDB760E706B2505812531AACD6520B8D7F647A70B230983F48188C` | `%PDF-` |
| `Safara_PRD_03_Readiness_Manifest_Reporting.pdf` | 115773 | `0B4944C0A1171223020A7E0C76E73CF4FF02E5513AE62FCEB9E43D5FD8CB720F` | `%PDF-` |

All four source PDFs remain at `C:\Workspace\atlas\ces-platform\docs\example`; no host source, `.env`, bind target, or Git path was modified.

## Protected Docker identities

- Pinned Serve image: `sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`
- Repo digest: `quay.io/docling-project/docling-serve-cpu@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`
- Stopped Docling containers remain untouched. Their recorded `/root/.cache` mounts resolve to the seven empty cache volumes above.

## Executed observations

All commands below exited `0`; none removed, stopped, renamed, rebuilt, pulled, or started a Docker resource.

```text
docker context ls
docker context show
docker version
docker info
docker compose ls -a
docker ps -a --no-trunc
docker image ls -a --digests --no-trunc
docker volume ls
docker network ls --no-trunc
docker system df -v
docker inspect <running container>
docker inspect <each Docling container>
docker volume inspect <each cache-candidate volume>
docker image inspect quay.io/docling-project/docling-serve-cpu@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7
docker run --rm --mount type=volume,src=<each docling-models volume>,dst=/cache,readonly --entrypoint /bin/sh quay.io/docling-project/docling-serve-cpu@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7 -lc 'find /cache -type f; du -sh /cache'
```

No Docker deletion command was executed. In particular, no `compose down -v`, `volume prune`, `system prune --volumes`, `rm`, `rmi`, or network/cache-prune command was issued.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-001-01 | Scope step 1; binary oracle | Preserve Git/host data and verify all four immutable PDFs | Repository/PDF observation above; SHA-256 and `%PDF-` headers verified | PROVEN |
| RC-PERC-RESET-001-02 | Scope step 2; `SEC-PERC-RESET-BOUNDARY-01` / `TRUST-01` | Correct daemon/context, full inventory, and no unrelated critical workload crossed | `docker context ls/show`, `docker info`, Compose/container/image/volume/network/system inventories; active REL-03 PostgreSQL identified | PROVEN |
| RC-PERC-RESET-001-03 | Scope steps 3–4; binary oracle | Verify actual downloaded model files in durable protected cache or bind mount before deletion | All seven actual `/root/.cache` volume mounts inspected read-only; all are empty. Pinned image and containers retained. | BLOCKED_ENVIRONMENT |
| RC-PERC-RESET-001-04 | Scope step 5; binary oracle | Remove all obsolete unprotected Docker resources with explicit accounting | Not attempted: removal could cross the active protected REL-03 workload and cannot proceed while cache preservation is unverified | BLOCKED_ENVIRONMENT |
| RC-PERC-RESET-001-05 | Scope step 6; required evidence | Post-reset zero obsolete runtime resources, only documented protected cache/image exceptions | Not reachable because RC-003 and RC-004 are blocked; post-reset inventory intentionally not claimed | BLOCKED_ENVIRONMENT |

Internal readiness: `NOT_READY_FOR_CK`. This is not a CK `PASS` and does not authorize PERC-RESET-002. A human/planning decision is required to stop or otherwise preserve the active REL-03 workload and to establish a safe, durable location for the downloaded Docling weights before rerunning this exact GO ticket.
