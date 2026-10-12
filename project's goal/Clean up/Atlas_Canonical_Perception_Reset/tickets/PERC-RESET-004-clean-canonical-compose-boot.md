# PERC-RESET-004 — First clean canonical Compose boot

**Stage:** 4/8 · **Type:** one-environment bring-up · **Dependencies:** 001–003 reviewed · **GO:** `GO PERC-RESET-004` only.

## Outcome

Reconstruct **one and only one** canonical Atlas local Compose stack after the reset **while reusing the already downloaded Docling model cache**. Other application/DB/source/derived images and volumes may be fresh. Do not recreate any prior test/qualification Compose project. This stack must remain for the user's later manual run.

## Actions

1. Confirm post-001 engine has no obsolete resources; its **only permitted nonempty resources** are the protected Docling model-cache volume(s)/pinned image(s) identified in 001. List planned services/volumes and use one documented project name (prefer `atlas-canonical-perception`).
2. Run `docker compose -p atlas-canonical-perception -f docker-compose.yml config` and inspect effective routes, flags, terminal identity and volumes. In particular, make the canonical `docling-serve` mount the **actual preserved model cache** under `/root/.cache`, via an explicitly resolved Docker volume name or a verified data-preserving migration to one canonical named volume. A new blank project-prefixed cache volume alongside an orphaned old cache is not a PASS. No overlay; no test-only `qualificationOnly`; no fault proxies.
3. Build/pull from pinned configuration and start normal services: PostgreSQL; required migrations and pg-boss bootstrap; Atlas; Bridge; Bridge worker; private Docling Serve. Do not add a semantic worker service or second Docling process.
4. Confirm only one normal perception route and RUN-003 is the active worker profile at runtime (not just in YAML), including Docling image request option identity, version/readiness and accepted asset-store mount. Verify no other perception provider route is enabled.
5. Check the fresh DB has migrations and **no old user projects, document/source caches, derived assets, test jobs or historical semantic executions**. Do not seed old data.
6. Verify preserved Docling model files are visible/readable to the new canonical Docling container and warmup uses them. Check provenance/content/size or appropriate stable identifiers before and after attachment. **Do not deliberately re-download model weights**; if the canonical container cannot reuse the cache, stop with a specific cache attachment/migration defect. The pinned Docling Serve image may be reused. No separate legacy Docling container may remain running.

## Binary oracle

**PASS:** one Compose project; healthy services; clean persisted database; one RUN-003 route with `qualificationOnly=false`; exact D1 profile/cache identity; old Docling model cache verified attached to the canonical service, without an extra legacy stack or unnecessary model download; no old qualification containers/volumes except the now canonicalized protected cache; no semantic jobs. **FAIL/BLOCKED:** wrong image/route, dirty old data, failed migrations, unready Docling, second route, accidental use of overlay.

## Artifacts

Canonical Compose project name; `docker compose ... config` redacted relevant subset; service names, images and mounted volumes; preserved-to-canonical model-cache mapping, file verification and readiness/warmup logs; DB empty baseline counts; precise start/stop/restart commands (PowerShell); zero-semantic-state query results.

**Boundary:** no manual project creation until ticket 005; no REL/semantic execution. **Terminal:** `READY_FOR_CK` / `CHANGES_REQUIRED` / `BLOCKED`.

## User-authorized ticket amendment — image-embedded model baseline

This bounded amendment applies to this checkpoint because PERC-RESET-001
records no preserved nonempty Docling model-cache volume. It supersedes the
parent context's PERC-RESET-004 cache-reattachment premise only for that
condition; it does not authorize deleting or disregarding any verified
nonempty protected cache. See `project's goal/feedback/PERC-RESET-004-ticket-amendment-001.md`.

For this checkpoint, the approved digest-pinned Docling image's embedded model
directory is the immutable model baseline. The effective `docling-serve`
configuration must use the image's configured
`/opt/app-root/src/.cache/docling/models` path, with no blank cache volume
presented as preserved weights. Before canonical startup, inspect the exact
image with networking disabled and record image identity, file count, total
size, and the sorted per-file SHA-256 fingerprint. Run a disposable
network-disabled warmup from that exact image with
`DOCLING_SERVE_LOAD_MODELS_AT_BOOT=true`,
`DOCLING_SERVE_ENABLE_REMOTE_SERVICES=false`, and no mounted model cache; it
must become ready without downloading weights. After canonical startup,
verify the running container's image, configured path, file count, size, and
fingerprint match the pre-start baseline and record readiness/no-download
evidence.

The binary oracle's model condition is amended accordingly: prove the embedded
baseline is readable and used by both offline warmup and canonical Docling;
no `docling-models` volume or `/root/.cache` mount is required. All other
service, route, database, one-project, no-overlay, and perception-only
conditions remain unchanged. The parent context and historical PERC-RESET-001
records are not rewritten.
