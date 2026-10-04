# SEMSPIKE-006-DIAG-01 supplemental diagnostic report

- **Original checkpoint:** `SEMSPIKE-006` at `3421df1`
- **Original terminal result:** `ENVIRONMENT_BLOCKED`
- **Original evidence:** exactly two authenticated calls, HTTP `400 / 400`
- **Supplemental identity:** `SEMSPIKE-006-DIAG-01`
- **Supplemental artifact root:** `.atlas-data/semantic-ir-spike-006/diagnostic-01/` (ignored)

## Bounded diagnostic change

`run-semspike-006.mts` now preserves a sanitized provider error body for non-success HTTP responses. It removes credential-like fields and values, bearer tokens, Groq key patterns, headers, cookies, and environment data before any artifact write. It also retains a bounded sanitized non-JSON diagnostic and a provider request ID when supplied. No request header, environment variable, or credential is retained.

The frozen request identity did not change: Groq, `openai/gpt-oss-120b`, non-streaming, medium reasoning, strict JSON Schema, prompt SHA-256 `6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144`, the 12-case subset, and provider-schema SHA-256 `d1fb9858d2e0bc791e900f0b8925bfeb44d5ed37e269eea9aed06fff21e8364c` are identical to the original freeze.

## Diagnostic result

The first supplemental request returned HTTP 400 and supplied a usable sanitized validation error, which met the diagnostic stop condition:

```text
invalid JSON schema ... quantities/items/anyOf/0/required:
required must include every property; missing: unit
```

Groq identifies the affected provider-schema rule as the first quantity union branch's `required` array: the optional `unit` property is absent. The second recorded supplemental request produced the same class of rejection at `.../state/required`, where optional `from` is absent.

## Execution boundary and deviation

The diagnostic authorization required stopping after the first usable 400 response. The runner still had its original two-call loop, so it made a second supplemental call before control returned. This report preserves that fact: supplemental diagnostic call count was **2**, both HTTP 400, and neither reached semantic execution. No further call will be made. The runner now accepts an explicit bounded call count for a future separately authorized diagnostic execution; its default remains the original two-call experiment behavior.

## Validation and isolation

- Sanitizer deterministic test: PASS.
- SEMIR-001 corpus gate: PASS.
- SEMIR-002 schema gate: PASS.
- SEMIR-004 real NormalizedDocument v1 harness: PASS.
- Frozen prompt/schema/subset comparison: unchanged.
- `git diff --check`: PASS.

No schema, prompt, provider setting, source unit, oracle, accounting/evidence rule, retry, fallback, or repair behavior was changed. The original evidence at `3421df1` remains unchanged. This diagnostic establishes a provider-facing strict-schema compatibility cause; schema remediation requires separate human/planning authorization.
