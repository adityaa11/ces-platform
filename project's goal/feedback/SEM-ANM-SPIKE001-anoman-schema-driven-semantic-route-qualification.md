# SEM-ANM-SPIKE001 — Anoman schema-driven semantic route qualification

- **Terminal result:** `ENVIRONMENT_BLOCKED`
- **Checkpoint:** `SEM-ANM-BATCH-001` GO checkpoint (this committed report and isolated spike).
- **Ticket / batch:** `SEM-ANM-SPIKE001` / `SEM-ANM-BATCH-001`
- **Provider profile:** Anoman `https://api.anoman.io/v1/chat/completions`, `gemini-2.5-flash`, non-streaming, temperature `0`, strict JSON Schema, no retry or fallback.
- **Credential source:** repository `.env`, key name `ANOMAN_API_KEY` (value neither read into evidence nor logged).

## Terminal evidence

Gate A could not make an authenticated request because `ANOMAN_API_KEY` was absent from repository `.env`. The runner failed closed before any network request or model inference. This is an external configuration blocker, so the classification is `ENVIRONMENT_BLOCKED`; it is not a provider-capability result. Gate B was correctly not started, and no fallback, prompt mutation, repair, or extra call was attempted.

The ignored, mode-`0600` artifacts are `.atlas-data/sem-anm-spike001/gate-a-transport.json` and `summary.json`. They record `http_status: null`, the secret-safe route/configuration fingerprints, and no credential material. No committed artifact contains the key or an authorization header.

## Deterministic evidence

- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike001/test.mts` — PASS.
- `git check-ignore -q .env` — PASS.
- `git diff --check -- scripts/sem-anm-spike001` — PASS.
- Gate A runner command: `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike001/run.mts` — exit 4 with the intentional terminal classification `ENVIRONMENT_BLOCKED`.

The deterministic harness proves the real `parseNormalizedDocument(...)` fixture boundary; Zod-authored strict transport and semantic schemas; strict request construction; exact S1–S4 source accounting; credential absence fail-closed behavior; telemetry sanitization; finalizer source identity and `parseSemanticExtractionResult(...)`; and the frozen S1–S4 negatives (including S4 required modality, temporal condition misuse, missing applicability information, and S1 submission-method overclarification).

## Live-call matrix

| Stage | Authorized calls | Calls completed | Result | Zod / final parser / oracle | Telemetry |
| --- | ---: | ---: | --- | --- | --- |
| Gate A strict transport | 1 | 0 | `ENVIRONMENT_BLOCKED` — key absent before request | Not run | No provider response available |
| Gate B semantic run 1 | 1, only after Gate A pass | 0 | Not applicable | Not run | Not applicable |
| Gate B semantic run 2 | 1, only after Gate A pass | 0 | Not applicable | Not run | Not applicable |

No usage, latency, cost, routing/region, guardrail, or cross-run telemetry exists because no provider call was possible. The fixture is synthetic and non-confidential. A gateway region was not inferred as a provider-processing region.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / outcome | Status |
| --- | --- | --- | --- |
| RC-ANM-001 | Real `NormalizedDocument v1` parser and deterministic S1–S4 slots | deterministic harness | PROVEN |
| RC-ANM-002 | `.env`-based key, fail closed, secret-safe artifacts | missing-key and sanitizer tests; ignore check | PROVEN |
| RC-ANM-003 | One real strict-schema Gate A call or bounded terminal evidence | safe Gate A record: local `.env` key absent before request | PROVEN (ticket-authorized `ENVIRONMENT_BLOCKED`) |
| RC-ANM-004 | Compact described Zod schema, distinct from Atlas authority | generated-schema inspection in harness | PROVEN |
| RC-ANM-005 | Two identical semantic runs after Gate A passes | Gate A terminally blocked; ticket requires no Gate B | NOT_APPLICABLE |
| RC-ANM-006 | Same Zod path and no semantic repair | deterministic original-schema and malformed-output checks; no live output exists | PROVEN (Gate B not applicable) |
| RC-ANM-007 | Deterministic unchanged-Atlas finalization | deterministic finalizer plus `parseSemanticExtractionResult(...)` | PROVEN (live finalization not applicable) |
| RC-ANM-008 | Safe live operational evidence | no live response exists; terminal Gate A record safely preserves the absence | NOT_APPLICABLE |
| RC-ANM-009 | No fallback, adaptive retry, or prompt mutation | frozen runner configuration/fingerprints; zero calls after gate block | PROVEN |
| RC-ANM-010 | Ignore, no secrets, affected tests and diff hygiene | checks above | PROVEN |

Internal readiness: READY_FOR_CK

## Recommendation

Restore a valid `ANOMAN_API_KEY` in the ignored repository `.env`, then run this unchanged frozen runner once under a fresh explicit GO authorization; do not substitute a route, model, schema, prompt, or call budget.
