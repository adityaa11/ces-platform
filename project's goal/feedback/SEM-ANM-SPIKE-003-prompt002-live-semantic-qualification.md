# SEM-ANM-SPIKE-003 GO checkpoint

- **Ticket / batch:** `SEM-ANM-SPIKE-003` / `SEM-ANM-SPIKE-BATCH-003`
- **Ticket state:** `awaiting_review`
- **Terminal classification:** `FAIL`
- **Predecessor:** PROMPT-002 integrated CK `PASS`, recorded in `SEM-ANM-PROMPT-002-BATCH-03-e2ccb5b-review.md` for `e2ccb5b9529d641eca0136d73fd55f2e6e308739`.
- **Evidence root:** ignored `.atlas-data/sem-anm-spike003/`; it contains the unmodified raw provider content before fence removal, parsed proposal, telemetry, and per-slot oracle results for both calls.

## Result

Exactly two equivalent authenticated Anoman `gemini-2.5-flash` calls ran with
`temperature: 0`, `stream: false`, and `response_format: { type: "json_object" }`.
Both returned HTTP 200, a complete outer JSON fence, exact Zod validation, and
exactly-once S1–S4 accounting. Both preserved S1, S2, and S3. Both failed S4:
the response classified it as a resolved `condition` with `needs_resolution:
false` and no question, rather than a `rule` that preserves the possible
modality and asks only for the missing applicability condition. No retry,
fallback, semantic repair, prompt/schema mutation, or third call occurred.

| Run | Status | Fence | Zod / accounting | S1 | S2 | S3 | S4 | Outcome |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | 200 | removed | PASS / PASS | PASS | PASS | PASS | FAIL | semantic oracle failed |
| 2 | 200 | removed | PASS / PASS | PASS | PASS | PASS | FAIL | semantic oracle failed |

The route recorded 6,882 ms and 6,655 ms latency respectively. Available
Anoman telemetry, routing metadata, costs, guardrail status, and cache metadata
are retained only in the ignored records. No credential or Authorization value
appears in those records or this report.

## Validation

| Command / observation | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/test.mts` | PASS — frozen reference and provider-schema projection. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/qualification.test.mts` | PASS — integrated PROMPT-002 artifact identity and qualification. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike003/test.mts` | PASS — four approved hashes, exact Zod positive/negative cases, accounting negatives, fence boundary, semantic oracle positives/material negatives, ignore and missing-key/redaction checks. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike003/run.mts` | Exit 1 as designed for terminal `FAIL`; made exactly two calls and persisted ignored evidence. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike003/reassess-evidence.mts` | PASS — data-only reassessment of preserved proposals; no provider call. |
| `git diff --check -- scripts/sem-anm-spike003` | PASS. |

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / outcome | Status |
| --- | --- | --- | --- |
| `RC-ANM3-001` | Exact approved artifacts and four hashes before calls. | Offline gate and run config: reference `67cd…c083`, schema `c478…14b`, prompt `8093…38c5`, provenance `27bb…f8c4`. | PROVEN |
| `RC-ANM3-002` | Imported exact provider Zod authority. | `atlasProviderExtractionProposalV1Schema` parses both preserved proposals; no local response schema. | PROVEN |
| `RC-ANM3-003`–`005` | Frozen route and exactly two isolated calls. | Both records show the frozen Anoman profile; two calls only, no fallback/retry. | PROVEN |
| `RC-ANM3-006`–`008` | Fence-only normalization, exact validation, and S1–S4 accounting. | Both complete fences removed; both JSON parses, Zod validates, and accounts exactly once. | PROVEN |
| `RC-ANM3-009` | S1 workflow-step meaning. | Both runs pass. | PROVEN |
| `RC-ANM3-010` | S2 combined normative/bounded proposition with allowed primary kind. | Both runs pass as one `constraint`, preserving customer, purchase, maximum 2 products, and one-order scope. | PROVEN |
| `RC-ANM3-011` | S3 non-fact. | Both runs pass. | PROVEN |
| `RC-ANM3-012` | S4 rule, possible modality, ordering, unresolved applicability question. | Both runs fail: resolved `condition`, no material clarification question. | PROVEN — ticket-required failure correctly observed |
| `RC-ANM3-013` | No repair, mutation, retry, fallback, third call, or scope expansion. | Runner/diff/evidence inspection confirms none. | PROVEN |
| `RC-ANM3-014` / `014A` | Raw safe evidence; bounded, non-mutating oracle normalization. | Raw contents precede fence removal; local article/inflection and material-negative tests pass; redaction scan passes. | PROVEN |
| `RC-ANM3-015`–`016` | Preserve historical work; no finalizer/production work. | Isolated new spike code and scope audit; no finalization, reconciliation, persistence, or BSS integration. | PROVEN |

Internal readiness: READY_FOR_CK. This records a complete terminal `FAIL`
experiment, not a self-issued CK `PASS`. The ticket is ready for CK review and
does not authorize another call, semantic repair, finalization, reconciliation,
or production routing.
