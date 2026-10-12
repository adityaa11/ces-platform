# PERC-RESET-001 — Docker inventory and reset (preserve downloaded Docling models)

**Stage:** 1/8 · **Type:** destructive environmental reset with explicit model-cache exception · **Dependency:** parent context v1.2 · **GO:** only explicit `GO PERC-RESET-001`.

**Workflow state:** `approved` — CK `PASS` under evidence-contract amendment v1; see `project's goal/feedback/PERC-RESET-BATCH-01-a653008-verification.md`. The original CK review remains unchanged, and historical evidence gaps remain accepted gaps.

## Outcome

Identify the actual local Docker context and remove **all obsolete Docker runtime resources**, including historical Atlas qualification stacks, images, volumes, custom networks and build cache, while **preserving already downloaded Docling model weights if they are actually present**. The pinned local Docling Serve image is an optional reuse optimization, not a protected-resource requirement; its absence does not make this ticket fail. A historical ticket reference does not protect anything else from deletion. No canonical services boot until PERC-RESET-004.

## Scope and steps

1. In `C:\Workspace\atlas\ces-platform`, record branch/HEAD/dirty state and confirm all four immutable Safara source PDFs (path, size, SHA-256, header). Preserve Git, REL-03 uncommitted candidate, `.env` and host bind mounts.
2. Inventory the actual Docker engine/context with `docker context ls`, `docker info`, `docker compose ls -a`, `docker ps -a`, `docker image ls -a --digests`, `docker volume ls`, `docker network ls`, `docker system df -v`, resource labels and container mount inspection. Check for unrelated critical workloads; wrong/unknown daemon or irreplaceable unrelated data -> `BLOCKED`.
3. **Identify real Docling model-cache ownership before deleting anything.** The old checked-in Compose mounts `docling-models` to `/root/.cache` in `docling-serve`, but the physical volume name may have a project prefix. Inspect actual container mounts, volume IDs/labels, cache contents and pinned Docling image ID/digest. Verify the downloaded model files are present and persist in a volume (or safe bind mount) independently of the container writable layer. Preserve every relevant cache volume until deduplicated with evidence.
4. Protect those actual model-cache volume IDs/names from deletion. The pinned Docling Serve image may be retained only as a local reuse optimization; it may be deleted without failing this ticket. **If model weights actually exist only in a container writable layer or their persistence is unverified, keep that container and return `BLOCKED`** rather than erasing the weights. Do not delete first and discover the problem later. When inspected cache volumes are empty, record that fact and do not claim model readiness.
5. Once cache persistence is verified, stop/remove every obsolete container, **including the old Docling container if safe**; remove all unprotected volumes and images; remove leftover nondefault networks and build cache. Use PowerShell-safe explicit enumeration/exclusions and empty-set handling. Log every command/exit code and removed/protected resource identifier. No unscoped prune/down command that could erase the protected volume. No new Compose boot or model download.
6. Verify no historical Atlas worker/DB/fault-proxy/qualification container remains; zero obsolete/unprotected containers, images and volumes. Verified non-empty Docling cache volume(s), if any, are the **only documented exceptions**. A pinned Docling image may remain or may be absent. Built-in networks may remain. Do not start a new service until PERC-RESET-004.

## Binary review oracle

**PASS:** correct engine/context; all four PDFs and Git/host data unchanged; any actual downloaded model files verified and protected; all obsolete runtime resources removed and accounted for; no running legacy worker/DB; post-reset resources consist only of verified non-empty protected Docling model-cache volume(s), if any, and built-in Docker internals. An absent pinned Serve image is permitted. **BLOCKED:** wrong daemon, critical unrelated workload, model weights actually present but cannot be safely preserved, inaccessible cache, permissions failure or partial purge; name exact identifiers. **CHANGES_REQUIRED:** incomplete or missing inventories/evidence without proven irreversible loss.

## Required evidence

Redacted pre/post engine inventories; actual Docling container/image/cache volume and mount IDs; evidence that any model files survived, or evidence that inspected cache volumes were empty and no model readiness is claimed; exact removed resource identifiers and commands/exit codes; four source SHA-256 values and Git status; confirmation all other Docker DB/source/derived test volumes were intentionally deleted. Explicitly carry any protected non-empty volume identity forward to ticket 004.

## Forbidden

Do not delete or re-download an actually present downloaded Docling model; do not remove a non-empty model cache through `docker compose down -v`, blanket `docker volume prune`, or `docker system prune --volumes`; no Git/PDF/host-folder changes; no source-code or RUN-003 changes; no semantic activity; no second Docker daemon/context switch. **Never report `READY_FOR_CK` if actual model weights were lost or the reset is partial.**

**Terminal:** `READY_FOR_CK` / `CHANGES_REQUIRED` / `BLOCKED`. Leave obsolete Docker resources cleared, with the protected Docling model cache ready for canonical reuse.
