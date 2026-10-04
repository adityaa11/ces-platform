# SEMSPIKE-006 remediated semantic IR live qualification

- **Ticket / batch:** `SEMSPIKE-006` / `SEMSPIKE-BATCH-06`
- **Execution identity:** `SEMSPIKE-006-remediated-20261004`
- **Authorized remediation baseline:** `2da8577` — `fix(semir): flatten provider wire unions`
- **Previous live qualification:** `c31a757`, retained as frozen `ENVIRONMENT_BLOCKED`
- **Terminal result:** `ENVIRONMENT_BLOCKED`
- **Executed:** 2026-10-04
- **Live artifacts:** `packages/atlas-contracts/.atlas-data/semantic-ir-spike-006/live-remediated-20261004/` (ignored)

## Frozen identity

| Item | Frozen value |
| --- | --- |
| Provider / model | Groq / `openai/gpt-oss-120b` |
| Request mode | non-streaming, `reasoning_effort: medium`, strict JSON Schema |
| Prompt SHA-256 | `6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144` |
| Provider-wire schema SHA-256 | `c068619d837da782e7c9c6f508de7a876e31bb6b3e096fa1a454e9503e5f908f` |
| Source subset | 12 frozen context-free SEMIR-001 units, including the three independent `may` contrasts |
| Request shape | exactly two independent authenticated calls; no retry, fallback, repair, or result sharing |

The established offline SEMIR-001 through SEMIR-004 and provider-wire compatibility gates remained the prerequisite evidence. The only implementation difference from the earlier blocked run was the authorized provider-wire remediation at `2da8577`.

## Run matrix

| Run | HTTP | Provider response / semantic execution | Latency / tokens | Outcome |
| --- | ---: | --- | --- | --- |
| 1 | 400 | Groq rejected strict output after truncating a failed generation to 2 results; the schema requires 12. No provider-wire payload was returned. | 7,394 ms / unavailable | pre-semantic provider rejection |
| 2 | 429 | Groq rejected the independent request on the model TPM limit. No provider-wire payload was returned. | 283 ms / unavailable | pre-semantic provider/environment rejection |

Run 2 used the same frozen request identity and received no Run 1 output. Neither call was retried, altered, repaired, or routed to a fallback.

## Sanitized provider diagnostics

- Run 1: `invalid_request_error` / `json_validate_failed`; Groq reported that maximum completion tokens were reached before a valid document could be generated and that `/results` had 2 items where the strict schema requires 12.
- Run 2: `tokens` / `rate_limit_exceeded`; Groq reported the on-demand TPM limit for `openai/gpt-oss-120b`.

The ignored run records retain bounded, sanitized diagnostics and provider request IDs. They contain no API key, Authorization material, request headers, cookies, or environment dump.

## Results

- **STRUCTURAL RESULT:** Not reached. Neither provider response was HTTP-successful or supplied a provider-wire result. Provider-wire Zod validation, deterministic provider-wire-to-Atlas normalization, and Atlas Semantic IR Zod validation did not execute.
- **EVIDENCE RESULT:** Not reached. No parsed Atlas Semantic IR was eligible for source accounting or evidence validation.
- **SEMANTIC RESULT:** Not reached. None of the 12 cases entered the frozen semantic oracle. Therefore no case-level semantic-dimension failure is asserted, including for the three independently evaluated `may` contrasts.
- **CROSS-RUN STABILITY:** Not run. There are no two parsed semantic results to compare.
- **TERMINAL RESULT:** `ENVIRONMENT_BLOCKED`. Both authorized authenticated requests were rejected before semantic execution. This is neither a semantic failure nor a cross-run instability finding.

## Review Contract Closure

| Row | Required proof | Evidence | Status |
| --- | --- | --- | --- |
| `RC-SEMSPIKE-006-01` | Frozen identity and established offline gates before Run 1 | ignored `freeze.json`; authorized baseline `2da8577` | `PROVEN` |
| `RC-SEMSPIKE-006-02` | Exactly two independent frozen-profile calls, with no retry/fallback/repair | ignored `run-01.json`, `run-02.json`, and `summary.json` | `PROVEN` |
| `RC-SEMSPIKE-006-03` | Untouched outputs parse, or pre-semantic rejection is accurately recorded | sanitized HTTP 400 and HTTP 429 records; no payload eligible to parse | `PROVEN` |
| `RC-SEMSPIKE-006-04` | Accounting and evidence validation of parseable outputs | no provider-wire or Atlas IR output exists | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-05` | Frozen semantic oracle on parseable outputs | no case entered the oracle | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-06` | Critical-dimension comparison of two parseable outputs | no two semantic outputs exist | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-07` | Secret-safe ignored artifacts and diff hygiene | ignored artifact root; credential scan and `git diff --check` | `PROVEN` |

Internal readiness: READY_FOR_CK
