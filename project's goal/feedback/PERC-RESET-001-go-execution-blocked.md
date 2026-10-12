# PERC-RESET-001 GO execution/closure record — blocked

- **Ticket:** `PERC-RESET-001` — Docker inventory and reset (preserve downloaded Docling models)
- **Authorization consumed:** `HMN-PERC-RESET-001-001` (`project's goal/feedback/PERC-RESET-001-hmn-001.md`)
- **Prior blocker record:** `project's goal/feedback/PERC-RESET-001-go-blocked.md` (unchanged)
- **Current HEAD before this record:** `cf97048`
- **Terminal:** `BLOCKED`
- **Internal readiness:** `NOT_READY_FOR_CK`

## Result

The authorized Docker reset completed on the confirmed `desktop-linux` context: no containers, volumes, custom networks, Compose projects, images, or build cache remain. The four protected Safara PDFs remain unchanged.

This record cannot claim `READY_FOR_CK`: the explicitly protected pinned Docling Serve image was removed during the image-cleanup enumeration. The cleanup script compared Docker's 12-character image IDs to the full SHA-256 identifier, mistakenly treating the protected image as removable. The post-reset inspection proves that the image is absent. No pull/re-download was attempted because neither the frozen ticket nor the HMN authorization permits replacing a resource that was required to be preserved.

## Pre-reset destructive targets and outcomes

All pre-reset containers were labeled Atlas/REL-03 Compose resources; no genuinely unrelated container was found. `docker rm -f` exited `0` for all 39:

```text
atlas-rel03-qualified-atlas-migrate-1
atlas-rel03-qualified-postgres-1
ces-platform-agents-bridge-pgboss-bootstrap-1
ces-platform-atlas-migrate-1
ces-platform-agents-bridge-worker-1
ces-platform-atlas-1
ces-platform-docling-serve-1
ces-platform-agents-bridge-1
ces-platform-postgres-1
atlas-perception-lab-docling-serve-1
atlas-perception-lab-atlas-1
atlas-perception-lab-postgres-1
atlas-perception-lab-agents-bridge-worker-1
atlas-perception-lab-agents-bridge-1
atlas-perception-lab-agents-bridge-pgboss-bootstrap-1
atlas-perception-lab-atlas-migrate-1
idser-012-01-03-01-qualification-qualification-1
idser-012-01-03-01-qualification-docling-serve-1
idser-012-01-03-02-{agents-bridge,agents-bridge-pgboss-bootstrap,agents-bridge-worker,atlas,atlas-migrate,docling-serve,postgres}-1
idser-012-01-03-02-qualification-{agents-bridge,agents-bridge-pgboss-bootstrap,agents-bridge-worker,atlas,atlas-migrate,docling-serve,postgres}-1
idser-012-01-03-02-cfc-semantic-evidence-{agents-bridge,agents-bridge-pgboss-bootstrap,agents-bridge-worker,atlas,atlas-migrate,docling-serve,postgres}-1
```

`docker volume rm` exited `0` for all 25 explicit volume names:

```text
atlas-perception-lab_{atlas-data,docling-models,lab-evidence,postgres-data}
atlas-rel03-qualified_postgres-data
ces-platform_{atlas-data,docling-models,postgres-data}
d947fed244a218df8d1622f5712184a9b0a96ea11c7a0b8542b8319e713b0a8a
idser-012-01-03-01-qualification_docling-models
idser-012-01-03-02_{atlas-data,docling-models,lab-evidence,postgres-data}
idser-012-01-03-02-qualification_{atlas-data,docling-models,lab-evidence,postgres-data}
idser-012-01-03-02-cfc-semantic-evidence_{atlas-data,docling-models,postgres-data}
idser-012-01-03-02-cfc-capacity_{atlas-data,docling-models,lab-evidence,postgres-data}
```

`docker network rm` exited `0` for all seven custom networks:

```text
atlas-perception-lab_default
atlas-rel03-qualified_default
ces-platform_default
idser-012-01-03-01-qualification_default
idser-012-01-03-02_default
idser-012-01-03-02-qualification_default
idser-012-01-03-02-cfc-semantic-evidence_default
```

`docker image rm` exited `0` for all 81 pre-reset image IDs. This includes the accidentally removed protected ID `sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7` (the former `quay.io/docling-project/docling-serve-cpu@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`). `docker builder prune --all --force` exited `0`; post-reset build cache is `0B`.

## Post-reset validation

```text
docker context show
# desktop-linux

docker ps -a
# no containers

docker volume ls
# no volumes

docker network ls
# only bridge, host, none

docker image ls -a --digests
# no images

docker compose ls -a
# no Compose projects

docker system df -v
# images, containers, volumes empty; build cache 0B

docker image inspect sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7
# exit 1: No such image
```

The host corpus was re-hashed after cleanup:

| File | SHA-256 | Header |
| --- | --- | --- |
| `Safara_Buyer_Business_PRD_Professional.pdf` | `2F537E8BB7EA4F69FB906AF03D0265E2A986A0F15C2DBEDBBACE5328CD40E7DF` | `%PDF-` |
| `Safara_PRD_01_Foundation.pdf` | `4A7AA8C90DD2F045ED1D37F73D69C5372FBDBEEDC76EDFA151CBD1AE88D370CC` | `%PDF-` |
| `Safara_PRD_02_Finance_Documents.pdf` | `527BCF9926FDB760E706B2505812531AACD6520B8D7F647A70B230983F48188C` | `%PDF-` |
| `Safara_PRD_03_Readiness_Manifest_Reporting.pdf` | `0B4944C0A1171223020A7E0C76E73CF4FF02E5513AE62FCEB9E43D5FD8CB720F` | `%PDF-` |

No Git path, REL-03 source/candidate/evidence, `.env`, host bind target, or PDF was deleted or modified by the Docker cleanup.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-001-01 | Scope step 1; binary oracle | Preserve Git/host data and verify four immutable PDFs | Pre/post SHA-256 and `%PDF-` evidence above; unrelated worktree content retained | PROVEN |
| RC-PERC-RESET-001-02 | Scope step 2; HMN-001 | Correct `desktop-linux` engine; delete only authorized Atlas/REL-03 runtime resources | Explicit labeled-container inventory and successful removal; post-reset context/inventory | PROVEN |
| RC-PERC-RESET-001-03 | Scope steps 3–4; HMN-001 | Delete only inspected empty cache volumes while retaining the local pinned Docling Serve image | All seven empty cache volumes deleted as authorized, but protected image was removed and post-inspection returns exit 1 | BLOCKED_AUTHORITY |
| RC-PERC-RESET-001-04 | Scope step 5; HMN-001 | Explicitly remove obsolete containers, volumes, images, custom networks and build cache | All listed runtime targets removed; no broad volume/system prune command used | PROVEN |
| RC-PERC-RESET-001-05 | Scope step 6; updated terminal oracle | No historical Atlas/REL-03 resources; only protected pinned image permitted to remain | Historical resources are absent, but required pinned image is absent rather than preserved | BLOCKED_AUTHORITY |

The exact remaining decision is whether a digest-pinned re-pull of the removed Serve image is authorized. Until then, this ticket must not advance, Compose must not be rebuilt, and PERC-RESET-002 must not start.
