# PERC-RESET-001 GO closure

- **Ticket:** `PERC-RESET-001` — Docker inventory and reset (preserve downloaded Docling models)
- **Batch:** `PERC-RESET`
- **State:** `awaiting_review`
- **Review target:** this documentation-and-evidence checkpoint
- **Base GO blocker:** `fe37082` / `PERC-RESET-001-go-blocked.md` (preserved unchanged)
- **HMN authorities:** `HMN-PERC-RESET-001-001` (`cf97048`) and `HMN-PERC-RESET-001-002`
- **Scope amendment:** the local pinned Docling Serve image is optional and may be absent; actual model readiness is explicitly deferred to PERC-RESET-004.

## Bounded implementation

On the confirmed `desktop-linux` engine, GO removed the entire existing Atlas and REL-03 Docker runtime: 39 containers, 25 volumes, seven custom networks, 81 images, and all build cache. The initially detected REL-03 PostgreSQL workload and every inspected empty Docling cache volume were deleted under HMN-001. No Compose project, service, model download, semantic action, or successor ticket was started.

The original cache inspection proved every actual `docling-models` volume was empty before deletion, so no downloaded model file was present in a cache volume or represented as preserved. The local pinned Serve image was also deleted in the cleanup. HMN-002 amends this frozen ticket so retaining that image is an optional reuse optimization rather than an acceptance condition. This closure makes no claim that a Docling model is ready; PERC-RESET-004 must establish that separately.

`PERC-RESET-001-go-execution-blocked.md` retains the original image-retention failure and exact cleanup record unchanged. This closure supersedes only its terminal status under the explicit HMN-002 ticket amendment.

## Validation evidence

```text
docker context show
# desktop-linux

docker ps -aq
# zero containers

docker volume ls -q
# zero volumes

docker network ls --format '{{.Name}}|{{.Driver}}|{{.Scope}}'
# bridge|bridge|local
# host|host|local
# none|null|local

docker image ls -aq
# zero images

docker compose ls -aq
# zero projects

docker system df -v
# zero image/container/volume usage; build cache 0B
```

The four protected host PDFs were re-hashed after cleanup:

| File | SHA-256 | Header |
| --- | --- | --- |
| `Safara_Buyer_Business_PRD_Professional.pdf` | `2F537E8BB7EA4F69FB906AF03D0265E2A986A0F15C2DBEDBBACE5328CD40E7DF` | `%PDF-` |
| `Safara_PRD_01_Foundation.pdf` | `4A7AA8C90DD2F045ED1D37F73D69C5372FBDBEEDC76EDFA151CBD1AE88D370CC` | `%PDF-` |
| `Safara_PRD_02_Finance_Documents.pdf` | `527BCF9926FDB760E706B2505812531AACD6520B8D7F647A70B230983F48188C` | `%PDF-` |
| `Safara_PRD_03_Readiness_Manifest_Reporting.pdf` | `0B4944C0A1171223020A7E0C76E73CF4FF02E5513AE62FCEB9E43D5FD8CB720F` | `%PDF-` |

The cleanup did not alter Git branches, the dirty REL-03 candidate/source/evidence, `.env` files, repository configuration, bind targets, or any source PDF. `git diff --check` for the amended ticket passed.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-001-01 | Scope step 1; binary oracle | Preserve Git/host data and all four PDFs | Pre/post corpus hashes above; only Docker resources and ticket/evidence artifacts changed | PROVEN |
| RC-PERC-RESET-001-02 | Scope step 2; HMN-001 | Correct engine/context; inventory and bounded target selection | `docker context show` = `desktop-linux`; pre-removal Compose/labels inventory in execution record; no unrelated workload remained | PROVEN |
| RC-PERC-RESET-001-03 | Scope steps 3–4 as amended by HMN-002 | Protect actual model files if present; otherwise record empty cache state without claiming readiness | Read-only inspection recorded seven actual `/root/.cache` volumes, each `files=0`, `4.0K`; all then deleted under HMN-001. No model readiness is claimed. | PROVEN |
| RC-PERC-RESET-001-04 | Scope step 5; HMN-001 | Explicitly remove obsolete runtime resources with accounting, no unscoped protected-cache prune | Execution record lists exact container/volume/network targets; `docker rm -f`, `docker volume rm`, `docker image rm`, `docker network rm`, and `docker builder prune --all --force` exited 0. | PROVEN |
| RC-PERC-RESET-001-05 | Scope step 6; updated terminal oracle amended by HMN-002 | No legacy Atlas/REL-03 resources; only built-in networks and optional image/cache exceptions remain | Post-reset `ps`, `volume ls`, `image ls`, `compose ls`, network inventory, and `system df -v` all show the required clean state. | PROVEN |

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`. GO stops here; PERC-RESET-002 is not authorized or started.
