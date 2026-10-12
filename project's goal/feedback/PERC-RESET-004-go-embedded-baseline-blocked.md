# PERC-RESET-004 GO embedded-baseline blocker record

- **Ticket:** `PERC-RESET-004` — First clean canonical Compose boot
- **Batch:** `PERC-RESET`
- **Authorized checkpoint:** `GO PERC-RESET-004` under `HMN-PERC-RESET-004-001`
- **Base commit:** `15d1dd0` (`docs(perc): authorize embedded model baseline`)
- **Date:** 2026-10-13
- **Terminal:** `BLOCKED`
- **Ticket state:** `planned` (not eligible for `awaiting_review`)

## Stop condition

The HMN amendment makes equality with its immutable image-embedded model
fingerprint a prerequisite to the disposable network-disabled warmup and to
canonical Compose startup.  The local approved digest is present, and its
embedded directory has the expected path, file count, and apparent size, but
the reproducible sorted per-file checksum fingerprint differs from the
authorized value.  The amendment requires GO to stop when model fingerprints
differ; no alternate fingerprint convention, image, cache volume, download, or
runtime workaround is authorized.

## Read-only/disposable preflight evidence

Docker context: `desktop-linux`.

Exact local image reference inspected:

```text
quay.io/docling-project/docling-serve-cpu:v1.36.0@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7
image ID: sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7
repo digest: quay.io/docling-project/docling-serve-cpu@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7
image size: 7.53GB
DOCLING_SERVE_ARTIFACTS_PATH=/opt/app-root/src/.cache/docling/models
```

An ephemeral `docker run --rm --network none --entrypoint /bin/sh` inspection
of the unmounted image (no model-cache mount) reported:

```text
ARTIFACT_PATH=/opt/app-root/src/.cache/docling/models
FILE_COUNT=103
DIRECTORY_SIZE=871M
ROOT_CACHE_FILE_COUNT=0
```

The following deterministic sorted per-file SHA-256 fingerprint command was
used from the artifact directory:

```sh
find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum | sha256sum
```

Observed value:

```text
ef8cf9e5f49a10b4d884e8a8577808d5fc3236be9d028ba8511eae9912407dae
```

The amendment requires:

```text
01ba86056ff361a5b5efb51a570ea8041e9c48acb2ed1e4107e3265a662ccf45
```

Two additional conventional sorted per-file serializations were also checked
read-only in a separate `--rm --network none` container and each produced
`7204864c356a0a4487acd775e6b9a00f7dbd2f6edb6efcdd90dab0f7da4b91a3`;
neither equals the authorized fingerprint.  They are diagnostic only and do
not replace the amendment's baseline.

## Not performed

- The required model-loading warmup was **not started**: no model-load/readiness
  log or exit/timeout result exists because the pre-warmup fingerprint stop
  rule fired.
- Canonical Compose was **not started**; no services, migrations, pg-boss
  bootstrap, routes, or database checks were run.
- `docker-compose.yml` remains unchanged and retains its existing
  `docling-models:/root/.cache` definition; GO did not alter it because the
  amendment permits alignment only after successful offline warmup.
- No `docling-models` volume was created, no model weights or image layers were
  downloaded, and no Docker resource was removed.
- No semantic execution or PERC-RESET-005 work was started.

## Review Contract Closure

| Row | Ticket/amendment authority | Required proof | Evidence | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-004-01 | Actions 1–2; HMN embedded baseline | One effective canonical project and explicit static plan | `docker compose -p atlas-canonical-perception -f docker-compose.yml config --format json`; current static plan still exposes the forbidden blank cache volume | IMPLEMENTED_UNPROVEN |
| RC-PERC-RESET-004-02 | Actions 2 and 4; context §6 | One normal RUN-003 route, non-qualification runtime mode, and D1/profile identity | Prior static configuration remains available; runtime proof not reached | IMPLEMENTED_UNPROVEN |
| RC-PERC-RESET-004-03 | Actions 3–6; HMN required validation 1–3 | Approved image baseline, successful offline warmup, canonical service fingerprint equality | Exact digest/path/count/size verified, but fingerprint mismatch recorded above | BLOCKED_ENVIRONMENT |
| RC-PERC-RESET-004-04 | Actions 3–5; artifacts | Healthy canonical services, migrations/pg-boss, fresh DB, no old state | Forbidden to start after RC-03 fingerprint mismatch | BLOCKED_ENVIRONMENT |
| RC-PERC-RESET-004-05 | Action 6; HMN embedded-baseline amendment | Visible/readable model files, no-download warmup, pre/post identity equality | Embedded files inspected network-disabled; warmup and post-start comparison are prohibited by the mismatch stop rule | BLOCKED_ENVIRONMENT |

Internal readiness: `NOT_READY_FOR_CK`.

## Required authority

Human/planning authority must resolve the mismatch between the immutable
fingerprint recorded in `HMN-PERC-RESET-004-001` and the exact locally pinned
image digest before GO can resume.  This GO record does not authorize changing
the fingerprint, accepting an alternate calculation, pulling another image,
creating a cache volume, or proceeding with a warmup/startup.
