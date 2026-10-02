# BSS-V2-BATCH-04 GO Flash-Lite schema-compatibility update

- **Ticket:** BSS-V2-004
- **State:** `planned` (not eligible for `awaiting_review`)
- **Date:** 2026-10-02
- **Human-authorized pinned target:** `gemini-3.5-flash-lite` for structured,
  chat, and perception.

## Bounded retry result

The newly configured model passed the separate source-free Bridge minimal probe:
the redacted observation records `gemini-3.5-flash-lite`, `generateContent`,
finite latency, and usage metadata. The full qualification harness then passed
its own minimal stage but failed at the exact same `extraction` stage with
redacted `invalid_request` before any output was generated.

This is a second currently entitled Flash model with the same current Atlas
schema incompatibility. It corroborates the existing BSS-V2-004 schema blocker;
it does not qualify the route, permit a schema downgrade, or authorize route
activation. No provider payload, credential, authorization header, prompt,
source grant, or raw PDF was recorded.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| RC-BSSV2-004-01 | Review Contract row 01 | Real minimal inference, non-zero entitlement, pinned identity | `qualification:gemini-minimal` passed for `gemini-3.5-flash-lite` with usage present | PROVEN |
| RC-BSSV2-004-02 | Review Contract row 02 | Extraction and reconciliation pass complete Atlas v1 validation | Exact extraction schema returns `invalid_request` before generation | BLOCKED_AUTHORITY |
| RC-BSSV2-004-03 | Review Contract row 03 | Live synthetic-PDF result normalizes to `NormalizedDocument v1` | Qualification stops at required extraction proof; no substitute evidence | BLOCKED_AUTHORITY |
| RC-BSSV2-004-04 | Review Contract row 04 | Redacted usage, latency, 429 classification, evaluation evidence | Minimal usage/latency recorded; route-level observations remain unavailable | BLOCKED_AUTHORITY |
| RC-BSSV2-004-05 | Review Contract row 05 | Only passed routes active; Mistral inactive | No Gemini route became active | PROVEN |

Internal readiness: NOT_READY_FOR_CK. The model target is now explicitly
authorized, but the frozen ticket still cannot select a reduced schema or a
different provider contract. A planning decision is required before another
qualification strategy can proceed.
