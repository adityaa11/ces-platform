# BSS-V2-BATCH-04 GO schema-compatibility blocker

- **Ticket:** BSS-V2-004
- **State:** `planned` (not eligible for `awaiting_review`)
- **Date:** 2026-10-02
- **Pinned target:** `gemini-3.8-flash` for structured, chat, and perception.

## Bounded live evidence

The configured credential and pinned model passed a source-free minimal
inference through the exact Bridge adapter. The redacted result identified
`gemini-3.8-flash`, `generateContent`, non-zero usage metadata, and a finite
latency. This proves the prior 503 did not establish missing entitlement or an
invalid model identity.

The full harness then sent the projected current Atlas extraction schema using
the same legacy GenerateContent structured-output shape that passed the minimal
probe. It failed before generation with the redacted `invalid_request` code at
the `extraction` step. The record intentionally contains no provider body,
credential, headers, prompts, source material, or raw PDF.

Locally, the provider projection removes Gemini-unsupported JSON Schema
keywords while Bridge retains complete Atlas-side validation. The remaining
projected extraction schema is 2,602 bytes with maximum nesting depth 10.
Gemini documents that very large or deeply nested structured-output schemas may
be rejected. A one-shot current `responseFormat` diagnostic was also rejected
at minimal inference and was reverted; it is not the compatible route.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| RC-BSSV2-004-01 | Review Contract row 01 | Real minimal inference, non-zero entitlement, pinned identity | `qualification:gemini-minimal` returned successful `gemini-3.8-flash` `generateContent` with usage present | PROVEN |
| RC-BSSV2-004-02 | Review Contract row 02 | Extraction and reconciliation pass complete Atlas v1 validation | Exact Atlas extraction schema is rejected before generation; weakening it or changing provider target is not authorized | BLOCKED_AUTHORITY |
| RC-BSSV2-004-03 | Review Contract row 03 | Live synthetic-PDF result normalizes to `NormalizedDocument v1` | Harness terminates at the required extraction qualification before perception; no substitute proof used | BLOCKED_AUTHORITY |
| RC-BSSV2-004-04 | Review Contract row 04 | Redacted usage, latency, 429 classification, evaluation evidence | Minimal usage and latency are redacted and recorded; completed capability-route observations remain unavailable | BLOCKED_AUTHORITY |
| RC-BSSV2-004-05 | Review Contract row 05 | Only passed routes active; Mistral inactive | No Gemini route was enabled; existing Mistral route remains inactive | PROVEN |

## Required planning decision

The frozen ticket requires the actual current Atlas schema plus complete
validation. The pinned route cannot currently accept that schema. The next
step requires human/planning authority to choose whether to change the accepted
schema/contract or authorize a different qualified target. This GO run does
neither. No route is activated and `READY_FOR_CK` is not claimed.
