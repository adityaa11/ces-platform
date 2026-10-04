# SEMSPIKE-006 semantic IR live qualification

- **Ticket / batch:** `SEMSPIKE-006` / `SEMSPIKE-BATCH-06`
- **Terminal result:** `ENVIRONMENT_BLOCKED`
- **Executed:** 2026-10-04
- **Live artifacts:** `packages/atlas-contracts/.atlas-data/semantic-ir-spike-006/live-authorized-20261004/` (ignored)

## Frozen identity

| Item | Frozen value |
| --- | --- |
| Provider / model | Groq / `openai/gpt-oss-120b` |
| Request mode | non-streaming, `reasoning_effort: medium`, strict JSON Schema |
| Prompt SHA-256 | `6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144` |
| Provider-wire schema SHA-256 | `f1aac984ef15d93ca8f93b4eea9ed3dc79ae29e24f8cb9f0b1a9f6b44cf438bc` |
| Source subset | 12 frozen context-free SEMIR-001 units, including all three `may` contrasts |
| Request shape | exactly two independent authenticated calls; no retry, fallback, repair, or result sharing |

The offline SEMIR-001 through SEMIR-004 and provider-wire compatibility gates were established `PASS` before the two-call boundary.

## Run matrix

| Run | HTTP | Provider-wire / Atlas IR validation | Accounting / evidence | Semantic oracle | Latency / tokens | Outcome |
| --- | ---: | --- | --- | --- | --- | --- |
| 1 | 400 | not reached | not reached | not reached | 3,773 ms / unavailable | pre-semantic provider rejection |
| 2 | 400 | not reached | not reached | not reached | 230 ms / unavailable | pre-semantic provider rejection |

Both authenticated calls used the frozen profile, prompt fingerprint, schema fingerprint, and authorized slot manifest. Run 2 did not receive or use Run 1 output. Neither call was retried, repaired, or routed to a fallback.

## Sanitized provider diagnostic

Both runs reported the same `invalid_request_error` on `response_format`. Groq rejected the generated strict schema at `...qualifiers.properties.modality.anyOf[0].anyOf[1].properties.appliesTo.anyOf`: `variant 0: properties must be present (or set additionalProperties:false)`. The preserved sanitized run records include the provider request IDs, schema path, HTTP status, latency, and null token fields; they include no credential or authorization material.

## Results

- **STRUCTURAL RESULT:** Not reached. The provider rejected `response_format` before returning a provider-wire payload; provider-wire Zod validation, deterministic wire-to-Atlas normalization, and Atlas Semantic IR Zod validation did not execute.
- **EVIDENCE RESULT:** Not reached. No parsed Atlas Semantic IR was eligible for source accounting or evidence validation.
- **SEMANTIC RESULT:** Not reached. No case entered the frozen semantic oracle; therefore there are no failing semantic dimensions by case.
- **CROSS-RUN STABILITY:** Not run. There were no parsed live outputs to compare.
- **TERMINAL RESULT:** `ENVIRONMENT_BLOCKED`. Both frozen authenticated calls were rejected with HTTP 400 before semantic execution. This is not classified as an IR, evidence, semantic, or stability failure.

## Review Contract Closure

| Row | Required proof | Evidence | Status |
| --- | --- | --- | --- |
| `RC-SEMSPIKE-006-01` | Predecessor PASS gate and frozen identity before Run 1 | established offline gates; ignored `freeze.json` | `PROVEN` |
| `RC-SEMSPIKE-006-02` | Exactly two independent frozen-profile calls, with no retry/fallback/repair | ignored `run-01.json`, `run-02.json`, and `summary.json` | `PROVEN` |
| `RC-SEMSPIKE-006-03` | Untouched outputs parse, or terminal pre-semantic failure is accurately recorded | two sanitized HTTP 400 run records | `PROVEN` |
| `RC-SEMSPIKE-006-04` | Accounting and evidence validation of parseable outputs | no provider-wire or Atlas IR output exists | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-05` | Frozen semantic oracle on parseable outputs | no provider-wire or Atlas IR output exists | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-06` | Critical-dimension comparison of two parseable outputs | no provider-wire or Atlas IR output exists | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-07` | Secret-safe ignored artifacts, bounded report, and diff hygiene | ignored artifact root, sanitized errors, `git diff --check` | `PROVEN` |

Secret/redaction inspection: `.env` supplied the credential to the execution process only. The artifact root stores frozen metadata and sanitized diagnostics; no API key, authorization header, environment dump, raw request, provider-wire result, or normalized Atlas IR exists because the provider rejected both requests before response generation.

## Limit and next planning recommendation

The identical rejections demonstrate that the live Groq schema remains environmentally incompatible at the named `anyOf` location despite the completed offline provider-wire gate. **Next planning recommendation:** obtain a separate human authorization for any further provider-wire diagnosis or remediation; this qualification is frozen and does not authorize an inline schema change or another live run.

Internal readiness: READY_FOR_CK
