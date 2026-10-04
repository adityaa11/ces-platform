# SEMSPIKE-006 semantic IR live qualification

- **Ticket / batch:** `SEMSPIKE-006` / `SEMSPIKE-BATCH-06`
- **Terminal result:** `ENVIRONMENT_BLOCKED`
- **Executed:** 2026-10-04
- **Live artifacts:** `.atlas-data/semantic-ir-spike-006/` (ignored)

## Frozen identity

| Item | Frozen value |
| --- | --- |
| Provider / model | Groq / `openai/gpt-oss-120b` |
| Request mode | non-streaming, `reasoning_effort: medium`, strict JSON Schema |
| Prompt SHA-256 | `6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144` |
| Source subset | 12 context-free SEMIR-001 units: simple proposition, obligation, permission, possibility, nested possibility plus obligation, prohibition, condition, unresolved actor, threshold, state transition, example, and non-semantic heading; includes all three `may` contrasts |
| Request shape | exactly two independent authenticated calls; authorized parsed `NormalizedDocument v1` slots only; no retry, fallback, repair, or result sharing |

The pre-call offline release gate passed: SEMIR-001 through SEMIR-004 have `PASS` evidence, and the executed SEMIR-004 harness confirmed the real NormalizedDocument route, 43 source-slot mappings, 19 semantic/evidence mutations, three accounting mutations, and required generated-schema descriptions.

## Run matrix

| Run | HTTP | Structural parse | Source/evidence | Semantic oracle | Timing / tokens | Outcome |
| --- | ---: | --- | --- | --- | --- | --- |
| 1 | 400 | not reached | not reached | not reached | 326 ms / unavailable | pre-semantic provider rejection |
| 2 | 400 | not reached | not reached | not reached | 200 ms / unavailable | pre-semantic provider rejection |

Both calls used the same frozen profile and prompt fingerprint. They were independent calls, and neither was retried or altered after the first rejection.

## Results

- **STRUCTURAL RESULT:** Not reached; neither response was accepted for structured-output parsing.
- **EVIDENCE RESULT:** Not reached; no provider output was eligible for source accounting or evidence validation.
- **SEMANTIC RESULT:** Not reached; no provider output was eligible for the frozen semantic oracle.
- **CROSS-RUN STABILITY:** Not run; there were no parsed live outputs to compare.
- **TERMINAL RESULT:** `ENVIRONMENT_BLOCKED`. Both frozen-route calls were rejected with HTTP 400 before semantic execution. This is not classified as an IR, evidence, semantic, or stability failure.

## Review Contract Closure

| Row | Required proof | Evidence | Status |
| --- | --- | --- | --- |
| `RC-SEMSPIKE-006-01` | Predecessor PASS gate and frozen identity before Run 1 | SEMIR-001/002/003 verification artifacts; `SEMIR-BATCH-04-fc68ebe-verification.md`; ignored `freeze.json` | `PROVEN` |
| `RC-SEMSPIKE-006-02` | Exactly two independent frozen-profile calls, with no retry/fallback/repair | ignored `run-01.json`, `run-02.json`, and `summary.json` | `PROVEN` |
| `RC-SEMSPIKE-006-03` | Untouched outputs parse, or terminal pre-semantic failure is accurately recorded | two redacted 400 run records | `PROVEN` |
| `RC-SEMSPIKE-006-04` | Accounting and evidence validation of parseable outputs | no parseable output exists because both requests were rejected before semantic execution | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-05` | Frozen semantic oracle on parseable outputs | no parseable output exists because both requests were rejected before semantic execution | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-06` | Critical-dimension comparison of two parseable outputs | no parseable output exists because both requests were rejected before semantic execution | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-006-07` | Secret-safe ignored artifacts, bounded report, affected checks, and diff hygiene | `.atlas-data/` is ignored; report contains no credential/header/source dump; offline gates and `git diff --check` pass | `PROVEN` |

Secret/redaction inspection: only the process environment received `GROQ_API_KEY`; no API key, authorization header, environment dump, or raw request was committed. Live artifacts store profile fingerprints, parsed-safe metadata, and redacted error text only.

## Limits and next planning recommendation

The 400 responses do not identify whether the rejection arose from provider schema compatibility, account capability, or another provider-side request prerequisite; no response body or credential was retained. **Next planning recommendation:** obtain a human-authorized, frozen-route environment compatibility decision before scheduling any separate qualification run.

Internal readiness: READY_FOR_CK
