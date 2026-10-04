# SEMSPIKE-007 — Anthropic Claude Sonnet 5.5 qualification

- **Ticket / batch:** `SEMSPIKE-007` / `SEMSPIKE-BATCH-07`
- **Ticket state:** `awaiting_review`
- **Terminal result:** `ENVIRONMENT_BLOCKED`
- **Runner commit:** `68cd835977b648269c13f22959e8ad1071ca16fe`
- **Provider / model / SDK:** Anthropic / `claude-sonnet-5-5` / `@anthropic-ai/sdk` `0.131.0`
- **Sanitized artifact root:** `.atlas-data/semantic-ir-spike-007/anthropic-sonnet-5-5/` (ignored)

## Frozen identity

| Item | Value |
| --- | --- |
| Semantic prompt SHA-256 | `6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144` |
| Ordered 12-source subset SHA-256 | `8c7f0cc691b17032eb740510a782025e45a7563c2156cd112967e19e41e847b5` |
| Anthropic helper schema SHA-256 | `9fcc89abf4c04b375ae357c3494802d87d7e76cc0fed40d2be0737d661d28851` |
| Profile | `max_tokens: 16000`; adaptive thinking; `effort: high`; non-streaming; retries `0`; no fallback; no repair |
| Provider calls before release | `0` |

The offline release gate passed: SEMIR-001 through SEMIR-004, post-`2da8577`
provider-wire round trip, Anthropic helper-schema compatibility (19 closed
objects; no reported incompatible constructs), frozen source/prompt identity,
two-run isolation, sanitizer coverage, ignored artifact path, and `git diff --check`.

## Two-run matrix

| Run | Authenticated call | Stop reason | Latency | Input / output tokens | Result |
| --- | --- | --- | ---: | --- | --- |
| 01 | Yes | Not produced | 712 ms | Not produced | Provider rejected before semantic generation |
| 02 | Yes | Not produced | 445 ms | Not produced | Provider rejected before semantic generation |

Both requests used the same frozen profile and were independent. No retry,
fallback, continuation, batching, repair, prompt/schema/source-order change,
or Run 1 output sharing occurred. The sanitized provider diagnostic for each
call reports insufficient account credit. No response reached structural,
normalization, evidence-grounding, semantic-oracle, or stability evaluation.

## STRUCTURAL RESULT

`NOT_RUN` — no structured response was generated.

## EVIDENCE RESULT

`NOT_RUN` — no response entered source accounting or evidence grounding.

## SEMANTIC RESULT

`NOT_RUN` — no response entered the unchanged SEMIR-003 semantic oracle.

## CROSS-RUN STABILITY

`NOT_RUN` — neither call produced an evaluable semantic result.

## TERMINAL RESULT

`ENVIRONMENT_BLOCKED` — the Anthropic account rejected both authenticated
requests for insufficient API credit before meaningful semantic execution.
This result makes no claim about Atlas Semantic IR feasibility.

## Security and scope

Only the frozen controlled 12-source fixture was constructed for the request.
The adapter uses `messages.parse(...)` with `zodOutputFormat(envelopeSchema)`;
the original provider-wire Zod schema would validate any parsed response before
deterministic normalization and the unchanged Atlas validation/oracle sequence.
Artifacts contain only hashes, configuration, safe metrics, and sanitized
provider diagnostics; an artifact scan found no credential, header, cookie, or
environment data. No production route, persistence, semantic authority, or
SEMSPIKE-006 artifact was changed. SEMSPIKE-006 remains unchanged and frozen.

## Review Contract Closure

| Row | Required proof | Evidence | Status |
| --- | --- | --- | --- |
| `RC-SEMSPIKE-007-01` | Frozen semantic authority and sibling evidence preserved | Frozen prompt/subset fingerprints; scoped implementation diff | `PROVEN` |
| `RC-SEMSPIKE-007-02` | Official SDK structured-output transport with original local wire validation | `scripts/semantic-ir-v0/run-semspike-007.mts`; offline gate | `PROVEN` |
| `RC-SEMSPIKE-007-03` | All offline gates pass before provider use | Runner offline output; `providerCallsBeforeRelease: 0` | `PROVEN` |
| `RC-SEMSPIKE-007-04` | Exactly two isolated calls with frozen profile | `run-01.json`, `run-02.json`, and two-run matrix | `PROVEN` |
| `RC-SEMSPIKE-007-05` | Validate each applicable structured result without repair | No structured result exists because both calls were pre-execution environment rejections | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-007-06` | Apply oracle and cross-run stability to completed results | No completed semantic result exists because both calls were pre-execution environment rejections | `NOT_APPLICABLE` |
| `RC-SEMSPIKE-007-07` | Truthful sanitized terminal evidence, isolation, and hygiene | Ignored artifact inspection; sanitizer gate; `git diff --check` | `PROVEN` |

Internal readiness: `READY_FOR_CK`
