# IDSER-012-01-02: Two-worker Docling perception composition and terminal NormalizedDocument v1

- **State:** `approved`
- **Review batch:** `IDSER-BATCH-12-01-02`
- **Dependencies:** IDSER-012-01-01 CK `PASS`; approved BSS-V2-004-01/02
- **Parent:** [IDSER-012-01](IDSER-012-01-fair-bounded-local-docling-perception.md)
- **Post-generation planning amendment:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21.7

## Outcome

Compose the accepted staged admission gate with an explicit 2/2/2 local execution profile, real persistent Docling concurrency, accepted `NormalizedDocument v1`, refill/replay/failure behavior, and a durable `perceived` terminal state for this phase.

## Owned behavior

- Split Bridge perception concurrency from unrelated background-provider concurrency.
- Use explicit Docling local engine controls with two local workers and one Uvicorn worker.
- Atlas permit / Bridge perception / Docling worker profile = 2/2/2.
- Fail readiness/qualification on an effective-profile mismatch.
- Accept exactly one valid normalized document on successful perception and move the member to `perceived`.
- Release capacity after completion/failure through the same gate.
- Treat `perceived` as a processing lifecycle state without inventing new user-facing truth.
- Create no semantic work.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120102-01 | Effective local runtime is explicitly 2 Atlas permits / 2 Bridge perception consumers / 2 Docling local workers / 1 Uvicorn worker. | PASS iff effective Compose + live engine inspection show those values, ignored controls are removed, and mismatch fails readiness/qualification. |
| RC-0120102-02 | Real concurrent load never transmits more than two perception calls to Docling. | PASS iff two calls can be held in flight and a third remains unadmitted until a durable terminal release. |
| RC-0120102-03 | Accepted perception terminates at one parser-valid `NormalizedDocument v1` and durable `perceived`. | PASS iff success produces one accepted cache/result, card/read lifecycle remains processing, and zero semantic execution/job exists. |
| RC-0120102-04 | Restart, duplicate delivery, acknowledgement loss and terminal failure preserve once-only perception effects and refill. | PASS iff no duplicate accepted result/cache, failed bundle becomes `needs_attention`, remaining failed-bundle pending work is ineligible, and another healthy bundle may use the released permit. |
| RC-0120102-05 | The exact two-worker Docling profile remains materially deterministic and within the accepted warm-route performance boundary or raises an explicit performance decision. | PASS iff concurrent and sequential controls preserve pages/content/IDs without concurrency corruption, resource observations are recorded, and no CUDA/remote service/second broker appears. |

## Validation and hard stop

Run real warm two-concurrent repository-approved digital PDFs plus A/B/C lifecycle composition, restart/readiness/failure and inherited BSS-006/BSS-009/BSS-V2-004 regressions. Hard stop at `perceived`; no semantic scheduling.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-0120102-SOURCE-GRANT` retains BSS-009 exact-byte authorization; `BOUNDARY-0120102-PRIVATE-DOCLING` keeps Docling Compose-private and credential-minimal; `BOUNDARY-0120102-ATLAS-ACCEPTANCE` keeps normalized-result and lifecycle acceptance in Atlas; `BOUNDARY-0120102-PGBOSS` retains pg-boss lifecycle/replay authority.
- **Trust boundaries:** `TRUST-0120102-BRIDGE-DOCLING` is the authorized-byte call into the private processor; `TRUST-0120102-RESULT-ACCEPTANCE` is the untrusted Docling output through deterministic mapping and parser validation into one accepted result.
- **Sensitive assets:** `ASSET-0120102-DOCUMENT` covers exact authorized PDF bytes; `ASSET-0120102-NORMALIZED` covers normalized content and locators.
- **Identity context:** `IDENTITY-0120102-PERCEPTION` binds project, bundle, document, execution, grant, Docling profile identity, accepted result, and replay/fencing identity.
- **Extension seams:** `SEAM-0120102-CONCURRENCY-CONFIG`, `SEAM-0120102-RUNTIME-READINESS`, `SEAM-0120102-RESULT-VALIDATION`, and `SEAM-0120102-TERMINAL-REFILL` preserve later resource/security policy attachment points.
- **Prohibited couplings:** `COUPLING-0120102-SHARED-WORKER-KNOB` forbids one Bridge knob from coupling local perception to provider work; `COUPLING-0120102-IGNORED-DOCLING-CONTROL` forbids configuration claims without live inspection; `COUPLING-0120102-PUBLIC-DOCLING` forbids public/remote exposure; `COUPLING-0120102-SEMANTIC-RELEASE` forbids semantic work in this child.
- **Verification seams:** `VERIFY-0120102-EFFECTIVE-PROFILE` records effective Compose/engine identity; `VERIFY-0120102-CONCURRENT-LIMIT` instruments in-flight calls; `VERIFY-0120102-REPLAY-FAILURE` covers duplicate/ack-loss/failure and refill; `VERIFY-0120102-CONTENT-DETERMINISM` compares concurrent/sequential normalized output.
- **Unresolved security policy:** `SEC-GAP-0120102-HOST-PROFILE` leaves production-host sizing and multi-host/GPU/OCR qualification unresolved.
- **Review bindings:** `REV-READY-0120102-01` verifies both trust boundaries with grant, network isolation, parser, and role evidence; `REV-READY-0120102-02` verifies concurrency/readiness seams with effective-runtime inspection and a held-third-call test; `REV-READY-0120102-03` verifies replay/failure identity, zero semantic jobs, and prohibited infrastructure couplings.

## Workflow evidence

Implementation must close every Review Contract row, record exact Compose health, image/profile identity, commands/counts, scoped DB/queue observations, and redacted resource evidence in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| RC-0120102-01 | Outcome and RC-01: effective profile is 2 Atlas permits / 2 Bridge perception consumers / 2 Docling local conversions / 1 Uvicorn worker; invalid profile fails. | `node apps/agents-bridge/tests/idser-012-01-02-qualification.mjs` (fresh isolated Compose) inspected `DOCLING_SERVE_WORKERS=1`, `DOCLING_LOCAL_CONVERSION_CONCURRENCY=2`, CPU-only and remote-services-disabled environment; Bridge profile was background 1 / perception 2; an attempted perception concurrency of 3 was rejected. | PROVEN |
| RC-0120102-02 | RC-02: two real Docling calls may be held, with a third unadmitted until terminal release. | Qualification held two real upstream conversions: Atlas nonterminal 2, pg-boss active 2, proxy active/peak 2. The third member had no execution, grant, or job; one terminal completion refilled it while peak remained 2. | PROVEN |
| RC-0120102-03 | RC-03: one parser-valid `NormalizedDocument v1`, durable `perceived`, processing card/read lifecycle, and no semantic execution/job. | Qualification observed each held success at `perceived` + completed perception, one accepted cache/result, parser-valid `v1` pages, bundle `processing`, and zero semantic executions/jobs. `tests/perception-integration.test.ts` and `tests/perception-negative.integration.test.ts` also passed. | PROVEN |
| RC-0120102-04 | RC-04: acknowledgement loss, duplicate delivery, restart, terminal failure, and refill preserve once-only effects. | Qualification replayed acknowledgement loss then duplicate delivery with unchanged fingerprint and admission turn (5 -> 5); restart held at most two nonterminal executions and all three items converged; controlled terminal failure left exactly one `needs_attention` member and one unadmitted pending member, then a healthy bundle refilled to `perceived`. The isolated `test:staged-perception-admission` suite and worker atomicity integration passed. | PROVEN |
| RC-0120102-05 | RC-05: approved PDFs stay materially deterministic under the exact profile, within warm-route boundary, with resource and infrastructure observations. | Qualification matched normalized material hashes for sequential and concurrent controls. Sequential durations were 4439ms/4720ms; concurrent calls were 4876ms/5088ms with 5089ms wall time and peak 2. Container observations show the private Docling service only; CUDA was unavailable. | PROVEN |

Validation executed:

```text
node apps/agents-bridge/tests/idser-012-01-02-qualification.mjs
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db typecheck
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/worker.integration.test.ts
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-negative.integration.test.ts
POSTGRES_PORT=15432 docker compose -p idser012-regression -f docker-compose.yml ... test:staged-perception-admission
git diff --check
```

All listed commands passed. The staged-admission regression used a fresh Compose PostgreSQL volume and Bridge bootstrap so the singleton two-permit gate could not be affected by development-stack work.

Internal readiness: READY_FOR_CK
