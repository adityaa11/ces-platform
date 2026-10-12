# PERC-RESET-004 ticket amendment 001 — image-embedded model baseline

- **Ticket:** `PERC-RESET-004`
- **Batch:** `PERC-RESET`
- **Authority:** user's explicit instruction on 2026-10-13 to establish the
  authoritative ticket amendment from the checkpoint's documented embedded
  baseline, record its review target, and resume CK
- **Scope:** only PERC-RESET-004's Docling model-baseline and corresponding
  proof condition
- **Applies to:** the checkpoint whose implementation commit is
  `e03e3dca6eae79a35a02f2f7fa3999c8da911e`
- **Mirrored ticket paths:**
  - `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-004-clean-canonical-compose-boot.md`
  - `project's goal/Clean up/Atlas_Canonical_Perception_Reset/tickets/PERC-RESET-004-clean-canonical-compose-boot.md`

## Reason

PERC-RESET-001 records no preserved nonempty Docling model-cache volume. The
original PERC-RESET-004 cache-reattachment condition therefore cannot be met by
the available reset state. The GO checkpoint records a different, bounded
baseline: the model artifacts embedded in the exact approved digest-pinned
Docling image. This amendment makes that baseline part of the frozen ticket
contract for this checkpoint.

## Amended requirement

Use the exact approved image
`quay.io/docling-project/docling-serve-cpu:v1.36.0@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`
and its embedded artifact directory
`/opt/app-root/src/.cache/docling/models` as the immutable model baseline.
Before canonical startup, verify the image identity, file count, total size,
and sorted per-file SHA-256 fingerprint with networking disabled. Warm the
exact image in a disposable network-disabled container, with
`DOCLING_SERVE_LOAD_MODELS_AT_BOOT=true`,
`DOCLING_SERVE_ENABLE_REMOTE_SERVICES=false`, and no model-cache mount; require
server readiness and evidence that no download was attempted. After canonical
startup, verify the running service's image identity, configured path, file
count, total size, and fingerprint match the pre-start baseline and retain
service readiness/no-download evidence.

The effective configuration must not present an empty cache volume as
preserved weights. A `docling-models` volume or `/root/.cache` mount is not
required for this amended baseline. This exception applies only when no
verified nonempty protected cache exists; it does not authorize deleting or
ignoring one if found.

All other PERC-RESET-004 requirements remain in force, including the canonical
Compose project, healthy services, single RUN-003 route, runtime identity,
fresh database, no semantic activity, no overlay, and perception-only boundary.
The parent context and historical PERC-RESET-001 records remain unchanged.

## Checkpoint evidence carried forward

The GO checkpoint records image ID equal to the approved digest, 103 files,
871M total size, and fingerprint
`01ba86056ff361a5b5efb51a570ea8041e9c48acb2ed1e4107e3265a662ccf45`. It also
records a disposable `--network none` warmup that returned HTTP 200 and logged
model readiness without weight downloads, followed by matching canonical
container path/fingerprint and no-download logs. CK must independently assess
that evidence against this amended requirement.

This amendment is the planning authority for the model-baseline substitution.
It does not rely on or imply a separate `HMN-PERC-RESET-004-002` artifact.
