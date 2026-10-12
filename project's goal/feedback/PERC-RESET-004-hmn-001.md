# HMN Authorization: PERC-RESET-004 image-embedded model baseline recovery

- **Ticket:** `PERC-RESET-004`
- **Batch:** `PERC-RESET`
- **HMN authorization ID:** `HMN-PERC-RESET-004-001`
- **Invocation:** explicit user `HMN` delegation on 2026-10-13
- **Current workflow state:** initial GO is blocked before canonical startup by the impossible historical-cache reuse condition.
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-004-clean-canonical-compose-boot.md`
- **Current HEAD:** `a9124b2`
- **Relevant GO record:** `project's goal/feedback/PERC-RESET-004-go-blocked.md`
- **Relevant CK artifact:** none
- **Relevant CFC commit:** none
- **Prior HMN authorization:** none
- **Worktree state:** pre-existing unrelated semantic/REL/planning modifications and untracked files remain outside this authorization and are preserved.

## Diagnosis

The PERC-RESET-001 amendment-v1 qualification established that the historical
`docling-models` volumes were empty.  The PERC-RESET-004 GO record then
confirmed that the local engine has no retained cache volume, so a
project-prefixed `/root/.cache` volume would be blank and cannot satisfy the
frozen historical-reuse condition.

The user supplied an alternative, bounded baseline: the exact approved
digest-pinned Docling image contains model artifacts.  Read-only verification
against the local image, in an ephemeral `--network none` container, confirms:

| Property | Verified value |
| --- | --- |
| Image digest / image ID | `sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7` |
| Embedded artifact directory | `/opt/app-root/src/.cache/docling/models` |
| File count | `103` |
| Directory size | `871M` |
| Sorted per-file SHA-256 fingerprint | `01ba86056ff361a5b5efb51a570ea8041e9c48acb2ed1e4107e3265a662ccf45` |
| Image configuration | `DOCLING_SERVE_ARTIFACTS_PATH=/opt/app-root/src/.cache/docling/models` |
| Unmounted `/root/.cache` files | `0` |

The image's `docling_serve.orchestrator_factory` constructs
`DoclingConverterManagerConfig(artifacts_path=docling_serve_settings.artifacts_path)`.
The configured artifact path is therefore the embedded directory above.  The
current Compose `/root/.cache` mount is not the configured source for the
verified RUN-003 model set; it is auxiliary at best and incorrectly represents
the model baseline if used as preservation evidence.  This static result is
not runtime qualification: only the offline warmup below may establish that
the embedded artifacts fully satisfy the RUN-003 startup path.

## Ticket-authority trace

PERC-RESET-004 Actions 2, 4, and 6 require an explicit effective model
identity, visible/readable model files, a warmup without deliberate download,
and stopping for a cache-attachment defect if reuse is impossible.  The
binding context §3 requires the actual cache identity to be explicit and
forbids a blank project-prefixed cache standing in for preserved weights;
context §6 preserves the RUN-003 profile, image identity, and local-only
boundary.  The user explicitly authorizes this narrow planning amendment to
replace only the impossible historical-volume premise with a verified
image-embedded model baseline.  Historical PERC-RESET-001 records remain
unchanged and continue to state that no historical cache weights were
preserved.

## Decision

`RETURN_TO_GO` — resume the initial PERC-RESET-004 implementation only under
this amendment.  No CK finding or CFC cycle exists.  This authorization does
not issue a CK `PASS`, create `awaiting_review`, or authorize PERC-RESET-005.

## Authorized scope

- Treat the image digest plus the embedded-directory fingerprint above as the
  new immutable model baseline, instead of claiming historical-volume reuse.
- Make the canonical Compose configuration express that baseline directly:
  retain the approved image digest and its `DOCLING_SERVE_ARTIFACTS_PATH`; do
  not allocate a blank `docling-models:/root/.cache` volume as model storage.
  Remove the unused cache mount/volume only if needed to prevent that false
  baseline; do not change the approved RUN-003 route/profile or Docling image.
- Before canonical startup, re-run the image-digest, file-count, size, and
  sorted-list fingerprint inspection with networking disabled and record the
  exact result.
- Before canonical startup, run an ephemeral, network-disabled Docling Serve
  boot qualification from the exact image and embedded artifact path.  It must
  use `DOCLING_SERVE_LOAD_MODELS_AT_BOOT=true`, `DOCLING_SERVE_ENABLE_REMOTE_SERVICES=false`, and no mounted model cache; a missing-model, download, or
  startup error is a failure.  Capture the server-ready/model-load log and
  exit/timeout result.  This proves offline warmup before the canonical stack
  is started.
- During canonical startup, preserve the exact image digest.  Then compare
  the running `docling-serve` container's configured artifact path, file count,
  size, and sorted-list fingerprint to the pre-start baseline; retain the
  offline warmup and service-readiness logs.  Any mismatch, attempted download,
  or missing-model error remains `BLOCKED`.

## Required validation

GO must use the ticket's normal Compose-only harness after the preflight
offline warmup: one `atlas-canonical-perception` project, its required
PostgreSQL/migration/pg-boss/Atlas/Bridge/worker/private-Docling services, and
the normal RUN-003 effective route.  It must still prove clean DB state, no
legacy resources, no alternate perception route, and zero semantic state.
The amended model-specific evidence is additionally required at these points:

1. pre-start image identity and offline fingerprint;
2. successful network-disabled warmup with an explicit non-download failure
   rule; and
3. post-start in-container identity/fingerprint equality and normal-service
   readiness.

The offline warmup command may use a disposable Docker container only.  It
must be removed on exit and must not be a concurrently running legacy Docling
process when the canonical project is brought up.

## Forbidden work

Do not download additional model weights; change the approved RUN-003
profile, route, Docling image digest, or capability identity; use an overlay,
qualification stack, or fault proxy; create a semantic worker/service or
semantic execution; start canonical Compose during this planning amendment;
rewrite historical PERC-RESET records; begin PERC-RESET-005; or alter
unrelated worktree/Docker resources.

## Handoff

Expected next command: `GO PERC-RESET-004` under
`HMN-PERC-RESET-004-001`.  GO must record this authorization ID, complete the
amended ticket evidence and all still-applicable frozen rows, commit only its
authorized paths, set the ticket to `awaiting_review` only when every row is
proven, and then stop for independent CK.
