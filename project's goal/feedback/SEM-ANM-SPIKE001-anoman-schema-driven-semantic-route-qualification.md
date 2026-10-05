# SEM-ANM-SPIKE001 — Anoman schema-driven semantic route qualification

- **Terminal result:** `FAIL`
- **Checkpoint:** `SEM-ANM-BATCH-001` GO checkpoint (this committed report and isolated spike).
- **Ticket / batch:** `SEM-ANM-SPIKE001` / `SEM-ANM-BATCH-001`
- **Provider profile:** Anoman `https://api.anoman.io/v1/chat/completions`, `gemini-2.5-flash`, non-streaming, temperature `0`, strict JSON Schema, no retry or fallback.
- **Credential source:** repository `.env`, key name `ANOMAN_API_KEY` (value neither read into evidence nor logged).

## Terminal evidence

The first runner invocation incorrectly resolved `.env` from the package working directory. The runner now resolves the repository-root `.env` relative to its own source file. The corrected Gate A call authenticated and reached Anoman, but its terminal content was not raw machine-parseable JSON. This is `STRICT_SCHEMA_MALFORMED_RESPONSE`, so the ticket-required classification is `FAIL`, not an environment block. Gate B was correctly not started, and no fallback, prompt mutation, repair, or extra call was attempted.

The ignored, mode-`0600` artifacts are `.atlas-data/sem-anm-spike001/gate-a-transport.json` and `summary.json`. They record the bounded failure, secret-safe route/configuration fingerprints, and no credential material. No committed artifact contains the key or an authorization header.

## HMN-SEM-ANM-SPIKE001-001 diagnostic rerun

The one additional diagnostic-only Gate A call authorized by `HMN-SEM-ANM-SPIKE001-001` used the unchanged request profile. Its ignored evidence is `.atlas-data/sem-anm-spike001/gate-a-diagnostic-rerun.json`.

- HTTP status: `200`
- Response model: `gemini-2.5-flash`
- Finish reason: `stop`
- Latency: `5440 ms`
- Usage: `{}` (no token fields exposed)
- Anoman routing: gateway region `id`; provider region `US`; provider type `cloud_direct`; served model `gemini-2.5-flash`; cache miss.
- Cost: `0.0016683` USD; `_anoman.billing` was `null` and is not interpreted as zero cost.
- Guardrails: all returned statuses passed; PII mode `redact`, output DLP mode `monitor`.

Exact `raw_message_content` returned before any parsing or normalization:

> Please provide the **supplied schema**!
>
> I cannot return the fixed qualification marker without seeing the schema you are referring to. The "fixed qualification marker" would be defined *within* that schema.
>
> Once you provide the schema (e.g., a JSON schema, XML schema, database table definition, or a description of its structure), I'll be happy to help you identify it.

This is prose, not Markdown-fenced JSON, truncation, or malformed JSON. It confirms the existing `STRICT_SCHEMA_MALFORMED_RESPONSE` / `FAIL` classification. The response indicates that the frozen strict-output schema was not made available to the model in this route/request shape; it does not authorize changing the profile or attempting another call.

## Deterministic evidence

- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike001/test.mts` — PASS.
- `git check-ignore -q .env` — PASS.
- `git diff --check -- scripts/sem-anm-spike001` — PASS.
- Gate A runner command: `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike001/run.mts` — exit 2 with terminal classification `FAIL` and Gate A sub-result `STRICT_SCHEMA_MALFORMED_RESPONSE`.

The deterministic harness proves the real `parseNormalizedDocument(...)` fixture boundary; Zod-authored strict transport and semantic schemas; strict request construction; exact S1–S4 source accounting; credential absence fail-closed behavior; telemetry sanitization; finalizer source identity and `parseSemanticExtractionResult(...)`; and the frozen S1–S4 negatives (including S4 required modality, temporal condition misuse, missing applicability information, and S1 submission-method overclarification).

## Live-call matrix

| Stage | Authorized calls | Calls completed | Result | Zod / final parser / oracle | Telemetry |
| --- | ---: | ---: | --- | --- | --- |
| Gate A strict transport | 1 | 1 | `STRICT_SCHEMA_MALFORMED_RESPONSE` — terminal content was not raw JSON | Not run after JSON parse failure | Bounded failure record only |
| Gate B semantic run 1 | 1, only after Gate A pass | 0 | Not applicable | Not run | Not applicable |
| Gate B semantic run 2 | 1, only after Gate A pass | 0 | Not applicable | Not run | Not applicable |

No usage, latency, cost, routing/region, guardrail, or cross-run telemetry was captured because Gate A terminal content did not pass the strict JSON boundary. The fixture is synthetic and non-confidential. A gateway region was not inferred as a provider-processing region.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / outcome | Status |
| --- | --- | --- | --- |
| RC-ANM-001 | Real `NormalizedDocument v1` parser and deterministic S1–S4 slots | deterministic harness | PROVEN |
| RC-ANM-002 | `.env`-based key, fail closed, secret-safe artifacts | missing-key and sanitizer tests; ignore check | PROVEN |
| RC-ANM-003 | One real strict-schema Gate A call or bounded terminal evidence | safe Gate A record: authenticated strict request returned non-JSON terminal content | PROVEN (ticket-authorized `FAIL`) |
| RC-ANM-004 | Compact described Zod schema, distinct from Atlas authority | generated-schema inspection in harness | PROVEN |
| RC-ANM-005 | Two identical semantic runs after Gate A passes | Gate A failed; ticket requires no Gate B | NOT_APPLICABLE |
| RC-ANM-006 | Same Zod path and no semantic repair | deterministic original-schema and malformed-output checks; malformed Gate A output failed closed | PROVEN (Gate B not applicable) |
| RC-ANM-007 | Deterministic unchanged-Atlas finalization | deterministic finalizer plus `parseSemanticExtractionResult(...)` | PROVEN (live finalization not applicable) |
| RC-ANM-008 | Safe live operational evidence | no live response exists; terminal Gate A record safely preserves the absence | NOT_APPLICABLE |
| RC-ANM-009 | No fallback, adaptive retry, or prompt mutation | frozen runner configuration/fingerprints; Gate A only, then hard stop | PROVEN |
| RC-ANM-010 | Ignore, no secrets, affected tests and diff hygiene | checks above | PROVEN |

Internal readiness: READY_FOR_CK

## Recommendation

Treat `gemini-2.5-flash` on the frozen Anoman strict-schema profile as not qualified. Do not weaken strict output, strip Markdown, repair JSON, retry, or substitute a route/model under this ticket.
