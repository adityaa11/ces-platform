# SEM-ANM-SPIKE-003: SEM-ANM-PROMPT-002 live semantic qualification

- **State:** `awaiting_review`
- **Review batch:** `SEM-ANM-SPIKE-BATCH-003`
- **Implementation context:** [SEM-ANM-SPIKE-003 PROMPT-002 live qualification context](../../SEM-ANM-SPIKE-003-PROMPT002-live-semantic-qualification-implementation-context-v2.md)
- **Predecessor:** CK `PASS` for the integrated `SEM-ANM-PROMPT-002` checkpoint; consume only its exact generated prompt, provider schema, frozen Zod reference, and approved hashes.
- **Start gate:** Predecessor CK approval and artifact hashes are verified; the frozen S1-S4 fixture and affected local gates pass; repository-root `.env` contains `ANOMAN_API_KEY`; `.env` and the evidence directory are ignored; and explicit `go` authorizes exactly two live calls.

## Outcome and bounded question

Determine whether the exact CK-approved PROMPT-002 system prompt and
provider-facing schema, sent through Anoman AI's already-qualified
`gemini-2.5-flash` `json_object` route, produce source-faithful proposals for
the same S1-S4 corpus without imposing a false `rule XOR constraint`
assumption.

This is a new, bounded qualification. Historical `SEM-ANM-SPIKE-002` remains
the record for PROMPT-001 and its frozen terminal `FAIL`; do not rewrite or
reuse its prompt, schema, semantic oracle, S2 constraint-only expectation, or
evidence. A failed provider result is a valid completed outcome.

```text
CK-approved PROMPT-002 prompt + provider schema + exact frozen Zod authority
  -> Anoman / gemini-2.5-flash / response_format=json_object
  -> optional removal of one complete outer Markdown JSON fence
  -> JSON.parse
  -> exact atlasProviderExtractionProposalV1Schema validation
  -> exact S1-S4 source-slot accounting
  -> frozen PROMPT-002 semantic oracle
  -> terminal result and CK handoff
```

Stop after provider semantics are qualified. Do not run
`parseSemanticExtractionResult(...)`, add deterministic Atlas finalization,
integrate reconciliation, or activate a production route.

## Frozen predecessor and artifact identity

Before either call, verify recorded CK `PASS` for PROMPT-002 and load or
reproduce the exact approved artifacts. Assert these SHA-256 values over the
artifact bytes:

| Artifact | Required SHA-256 |
| --- | --- |
| Frozen Zod reference | `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083` |
| Provider schema | `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b` |
| System prompt | `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5` |
| Provenance | `27bb968c000d82897857f8076f7dfab1e04abaffcab2bed798c4fb8dc451f8c4` |

Consume the prompt artifact at
`scripts/sem-anm-prompt002/generated/system-prompt.txt` and import
`atlasProviderExtractionProposalV1Schema` from
`scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts`. Keep the
predecessor immutable. Any missing approval or hash mismatch is a local hard
stop before provider use. Do not regenerate semantic wording, edit
`.describe(...)`, patch the prompt/schema, copy a looser schema, or use any
PROMPT-001 semantic authority.

## Frozen provider and credential profile

| Setting | Frozen value |
| --- | --- |
| Gateway / endpoint | Anoman AI / `https://api.anoman.io/v1/chat/completions` |
| Model | `gemini-2.5-flash` |
| Streaming / temperature | `false` / `0` |
| Response format | `{ "type": "json_object" }` |
| Calls | Exactly two equivalent authenticated calls |
| Fallback, retry, correction | None |
| Credential source | `ANOMAN_API_KEY` from repository-root `.env` |

Do not use a different provider, model, route, response mode, tool, or function
calling. Load the key without hard-coding, printing, persisting, or committing
it. Never print or persist Authorization, the complete `.env`, or unrelated
environment secrets. Fail closed if the key is missing and verify `.env`
remains ignored. Do not require a second shell-only credential when `.env` is
available.

## Fixture and user payload

Reuse only the same four source statements used in historical SPIKE-002:

| Slot | Exact source |
| --- | --- |
| S1 | `The customer submits an order.` |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` |
| S3 | `3.2 Purchase Rules` |
| S4 | `Approval may be required before processing.` |

The request payload contains only these slot identities and source text. Do
not provide semantic kinds, expected answers, oracle rules, examples, manual
answers, prior provider outputs, or Run 1 content. Use a spike-local
`NormalizedDocument v1` boundary only if useful for source preparation; this
ticket does not qualify the Atlas finalizer.

## Request, output, and validation contract

Both calls must use identical system-prompt bytes and hash, provider schema
bytes and hash, model, temperature, response format, fixture, source slots,
user payload, normalizer, Zod validator, and oracle. Run 1 output must not
influence Run 2. Do not add a third call without explicit HMN authorization.

Validate with the exact frozen `atlasProviderExtractionProposalV1Schema`. The
expected root has `version = "v1"` and `source_results[]`; each source result
has `slot`, `classification`, `candidates[]`, `non_fact_reason`, and
`questions[]`. Each candidate has `semantic_key`, `kind`, `payload`,
`normalized_meaning`, and `needs_resolution`. Do not create a second live
response schema.

The only permitted pre-parse normalization is removal of one complete outer
Markdown JSON fence when it wraps the entire provider content. Then call
`JSON.parse`. Do not extract JSON from prose, repair JSON, rename keys, map
enums, rewrite payload, or ask the provider to correct output. Malformed
content fails.

Require source slots `S1`, `S2`, `S3`, and `S4` exactly once. Reject a missing,
duplicate, unknown, or renamed slot. For `candidate`, require at least one
candidate and `non_fact_reason = null`. For `non_fact`, require zero candidates,
a non-empty reason, and zero questions. Never convert missing model output to
`non_fact`.

## Frozen semantic oracle

Judge material meaning, not exact wording. Comparison-only normalization may
trim, lowercase, collapse repeated whitespace, remove harmless surrounding
punctuation, remove one leading English article (`a`, `an`, or `the`), and use
a small source-anchored grammatical inflection check when needed. Never mutate
raw response content, JSON passed to Zod, validated proposals, or evidence.
Do not use another LLM, embeddings, fuzzy search, or semantic repair.

| Slot | Required result |
| --- | --- |
| S1 | `candidate`; exactly one candidate; `kind=workflow_step`; `needs_resolution=false`; no questions. Across `normalized_meaning` and payload, preserve customer, submit/submission, and order. |
| S2 | `candidate`; exactly one candidate; `needs_resolution=false`. Primary kind may be `rule` or `constraint`; across `normalized_meaning` and recursively present payload fields, preserve customer, purchase, normative/permission meaning of “hanya boleh”, maximum direction, exact value 2, product, and per-one-order scope in the same candidate. |
| S3 | `non_fact`; no candidates; non-empty reason; no questions. Do not extract a business proposition from the heading. |
| S4 | `candidate`; exactly one candidate; `kind=rule`; `needs_resolution=true`; exactly one material clarification question. Preserve approval, possible/may-be-required modality, and approval before processing. Ask only for the missing applicability condition. |

S2 must remain a single proposition; reject a detached broad permission and
constraint, loss of any listed facet, maximum 3, minimum 2, per-customer scope,
or an invented eligibility condition. This `rule`/`constraint` allowance comes
from PROMPT-002's primary-kind plus overlapping-facets semantics; it does not
revise SPIKE-002's historical oracle.

For S4, `before processing` expresses temporal order and is not the missing
applicability trigger. Reject certain `required` modality, `permitted`, a
resolved result without support, an invented threshold/approver/trigger, a
question about implementation detail, or `kind=unresolved`. Ask only when or
under what condition approval is required.

## Local gates before live calls

Before either call, prove locally:

- PROMPT-002 CK approval and all four artifact hashes match.
- The exact Zod authority accepts a valid local proposal and rejects malformed
  data.
- Source accounting accepts S1-S4 once each and rejects missing, duplicate,
  and unknown slots.
- The outer-fence normalizer accepts an allowed whole-response fence and
  rejects prose or other repair cases.
- Positive S1-S4 oracle cases pass and material negative cases fail.
- Root `.env` is ignored; missing-key behavior fails closed; secret-redaction
  checks pass; and `.atlas-data/sem-anm-spike003/` is ignored.

Do not spend a provider call until every applicable local gate passes.

## Evidence and telemetry

Write ignored evidence only under `.atlas-data/sem-anm-spike003/`, such as:

```text
run-config.json
live-run-1.json
live-run-2.json
semantic-run-matrix.json
summary.json
```

Each run record preserves, secret-safely and before semantic normalization,
the exact raw `choices[0].message.content`, HTTP status, served model, finish
reason, whether a fence was removed, post-fence JSON text, parsed proposal,
Zod result, source-accounting result, per-slot oracle result, and available
Anoman telemetry. If retaining the response envelope, sanitize it and exclude
credentials, Authorization, request headers, the full `.env`, and unrelated
secrets. Never overwrite raw content with normalized or parsed output.

Record available latency, prompt/completion/reasoning/text/total token counts,
`_anoman.weighted_tokens`, `_anoman.cost_usd`, routing mode, gateway region,
provider type/region, guardrail summary, and cache metadata. Also record
prompt, schema, fixture, and user-payload hashes. Do not infer missing telemetry
or treat a missing cost as zero.

Reuse only the mechanical transport behavior from
`scripts/sem-anm-spike002/` where appropriate: safe `.env` loading, endpoint and
model configuration, safe request construction, telemetry extraction,
outer-fence normalization, and secret-safe evidence writing. Keep SPIKE-002
code and artifacts unchanged. Prefer isolated implementation code under
`scripts/sem-anm-spike003/`.

## Review Contract

| ID | Requirement | Evidence / pass condition |
| --- | --- | --- |
| `RC-ANM3-001` | Consume exact CK-approved PROMPT-002 artifacts. | CK evidence and all four exact hashes match before both calls. |
| `RC-ANM3-002` | Use the frozen provider Zod authority. | Both outputs are parsed by the imported exact schema; no duplicate loose schema. |
| `RC-ANM3-003` | Use the frozen Anoman route profile. | Both request records show Gemini 2.5 Flash, temperature 0, non-streaming `json_object`, and no fallback. |
| `RC-ANM3-004` | Load credential safely from root `.env`. | Missing-key path fails closed; `.env` ignore and redaction checks pass. |
| `RC-ANM3-005` | Complete exactly two equivalent calls. | Two isolated call records; Run 1 does not affect Run 2; no retry or third call. |
| `RC-ANM3-006` | Limit transport normalization to one complete outer JSON fence. | Normalizer tests and raw/post-fence evidence show no other repair. |
| `RC-ANM3-007` | Validate each response with exact Zod schema. | Per-run parse/validation records and malformed local negatives. |
| `RC-ANM3-008` | Account for S1-S4 exactly once. | Per-run accounting evidence rejects missing, duplicate, unknown, or renamed slots. |
| `RC-ANM3-009` | Preserve S1 workflow-step meaning. | One resolved workflow step preserves customer, submission, and order with no questions. |
| `RC-ANM3-010` | Preserve S2 as one combined normative and bounded proposition. | One candidate retains all facets; primary kind is `rule` or `constraint`; no false exclusivity. |
| `RC-ANM3-011` | Classify S3 as non-fact. | Zero candidates, non-empty reason, zero questions. |
| `RC-ANM3-012` | Preserve S4 rule, modality, ordering, and unresolved applicability. | One specific rule, one material applicability question, no invented trigger. |
| `RC-ANM3-013` | Prohibit semantic repair and scope expansion. | Diff and run evidence show no prompt/schema mutation, retries, fallback, third call, finalizer, parser integration, or production work. |
| `RC-ANM3-014` | Preserve safe raw content and telemetry. | Exact raw message content precedes normalization; available telemetry and redaction review recorded. |
| `RC-ANM3-014A` | Keep oracle surface normalization bounded and non-mutating. | Article/inflection positives pass; material meaning negatives fail; proposal bytes remain unchanged. |
| `RC-ANM3-015` | Preserve historical PROMPT-001 and SPIKE-002 artifacts. | No changes to their prompt, schema, oracle, code, results, or evidence. |
| `RC-ANM3-016` | Keep the spike before Atlas finalization. | No `parseSemanticExtractionResult(...)`, Atlas finalizer, reconciliation, persistence, or BSS production integration. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-ANM3-IB-01` | PROMPT-002 artifacts and accepted Atlas authorities remain unchanged; provider output remains a proposal with no Atlas truth authority. |
| `SR-ANM3-TB-01` | Treat external provider content as untrusted through raw capture, narrow normalization, exact Zod validation, source accounting, and oracle evaluation. |
| `SR-ANM3-SA-01` | Keep `ANOMAN_API_KEY`, Authorization, `.env` contents, unrelated secrets, and confidential material out of logs, evidence, reports, and commits. |
| `SR-ANM3-ID-01` | Preserve attributable hashes for predecessor artifacts, route configuration, fixture, payload, both calls, and terminal result. |
| `SR-ANM3-ES-01` | Keep request construction, raw response capture, normalization, telemetry, validation, accounting, oracle, and reporting independently inspectable. |
| `SR-ANM3-PC-01` | Do not mutate predecessor semantics, weaken validation, repair meaning, retry/fallback, transfer Atlas authority, or couple to finalization/reconciliation/production. |
| `SR-ANM3-VS-01` | Verify approval and hashes, credentials/redaction, exact two-call isolation, parse/accounting, S1-S4 meaning, telemetry, and evidence integrity. |
| `SR-ANM3-UP-01` | Provider retention, production privacy, durable residency guarantees, economics limits, and broader provider policy remain unresolved by this spike. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-ANM3-RB-01` | `SR-ANM3-IB-01`, `SR-ANM3-TB-01`, `SR-ANM3-PC-01` | Did only the frozen fixture cross the provider boundary, and did output remain untrusted through the complete validation/oracle chain without authority transfer? | Request manifest, raw response records, Zod/accounting/oracle evidence, scope diff (`RC-ANM3-002`, `-005`..`-013`, `-016`). |
| `SR-ANM3-RB-02` | `SR-ANM3-ID-01`, `SR-ANM3-ES-01`, `SR-ANM3-VS-01` | Are both runs tied to the exact approved predecessor and independently inspectable from request through terminal result? | CK reference, artifact and payload hashes, per-run records, matrix, local gate output (`RC-ANM3-001`..`-008`, `-014`). |
| `SR-ANM3-RB-03` | `SR-ANM3-SA-01` | Are credentials and unrelated secrets excluded from logs, persisted evidence, reports, and diffs? | `.env` ignore proof, missing-key/redaction checks, evidence and diff inspection (`RC-ANM3-004`, `-014`). |
| `SR-ANM3-RB-04` | `SR-ANM3-PC-01`, `SR-ANM3-UP-01` | Does the result state the bounded qualification outcome without implying production readiness or resolving out-of-scope provider policy? | Scope audit, terminal classification, limitations, and next-step recommendation (`RC-ANM3-013`, `-015`, `-016`). |

## Terminal classification and handoff

Record exactly one result:

- `PASS`: both equivalent calls complete; hashes match; exact Zod validation
  and exact source accounting pass; every S1-S4 invariant holds; no semantic
  repair occurs.
- `PASS_WITH_LIMITS`: all PASS correctness requirements hold, with an observed
  operational limitation such as latency, token/cost overhead, fence
  dependence, or non-correctness-breaking routing behavior.
- `FAIL`: inference executes but output, validation, accounting, or semantics
  fail, or semantic repair would be needed.
- `ENVIRONMENT_BLOCKED`: credential, entitlement/rate, outage, network, or
  environment failure prevents meaningful inference.

Record the result and evidence summary in
`project's goal/feedback/SEM-ANM-SPIKE-003-prompt002-live-semantic-qualification.md`,
set the ticket to `awaiting_review`, and stop for CK. No result authorizes
broader Safara coverage, all-16-kind live coverage, Atlas finalization,
`parseSemanticExtractionResult(...)`, reconciliation, `BSS-V2-004-03`, or
production routing. Those require separately bounded planning and
authorization.
