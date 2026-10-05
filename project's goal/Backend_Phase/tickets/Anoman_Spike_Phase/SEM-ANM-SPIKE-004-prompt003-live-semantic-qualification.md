# SEM-ANM-SPIKE-004: PROMPT-003 live semantic qualification

- **State:** `awaiting_review`
- **Review batch:** `SEM-ANM-SPIKE-BATCH-004`
- **Implementation context:** [SEM-ANM-SPIKE-004 PROMPT-003 live qualification context](../../SEM-ANM-SPIKE-004-PROMPT003-live-semantic-qualification-implementation-context.md)
- **Predecessor:** CK `PASS` for the integrated `SEM-ANM-PROMPT-003` checkpoint; consume only the exact approved prompt, provider schema, Zod reference, provenance, and policy artifacts.
- **Start gate:** PROMPT-003 CK approval and approval-commit reachability are verified; every required artifact hash and the exact S1-S4 payload hash match; PROMPT-003 offline gates and SPIKE-004 local gates pass; root `.env` and the evidence directory are ignored; `ANOMAN_API_KEY` is available from root `.env`; and explicit `go` authorizes exactly two live calls.

## Outcome and bounded question

Determine whether the exact CK-approved PROMPT-003 system prompt, with its
approved cross-field composition remediation and no other semantic request
change, makes the same Anoman `gemini-2.5-flash` route pass the frozen S1-S4
semantic oracle in two independent calls while preserving the already-passing
S1-S3 behavior.

This is a controlled continuation of `SEM-ANM-SPIKE-003`. SPIKE-003 remains a
historical terminal `FAIL`: both PROMPT-002 calls passed S1-S3 and failed S4
with `kind=condition`, `needs_resolution=false`, and no clarification
questions. Do not rewrite its ticket, feedback, code, or evidence.

```text
CK-approved PROMPT-003 artifacts
  -> Anoman / gemini-2.5-flash / response_format=json_object
  -> optional removal of one complete outer Markdown JSON fence
  -> JSON.parse
  -> exact atlasProviderExtractionProposalV1Schema validation
  -> exact S1-S4 source-slot accounting
  -> unchanged SPIKE-003 semantic oracle
  -> two-run comparison with historical SPIKE-003
  -> terminal result and CK handoff
```

This ticket ends before Atlas finalization. It does not qualify every semantic
kind, Safara, production traffic, reconciliation, persistence, BSS, or a
production route.

## Frozen predecessor and artifact identity

PROMPT-003 is an immutable predecessor. Do not reconstruct, paraphrase,
regenerate, or patch its prompt. Consume the live system prompt only from
`scripts/sem-anm-prompt003/generated/system-prompt.txt`, provider schema from
`scripts/sem-anm-prompt003/generated/provider-schema.json`, and provenance
from `scripts/sem-anm-prompt003/generated/prompt-provenance.json`. Use the
unchanged Zod authority at
`scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts`.

Before each provider call, assert these exact SHA-256 identities:

| Artifact | Required SHA-256 |
| --- | --- |
| Frozen Atlas Semantic V1 Zod reference | `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083` |
| PROMPT-002 predecessor system prompt | `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5` |
| Provider schema | `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b` |
| PROMPT-003 system prompt | `da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1` |
| PROMPT-003 prompt provenance | `90e9e3b6a6607dedd4c135c485dbfc9223741a6200be6bd28519d4bb7f4b5200` |
| Cross-field policy body | `2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10` |

Any missing approval or hash mismatch is a hard stop before provider use.
Do not use the manual diagnostic prompt or introduce another semantic
variable, including fixture/oracle wording, model, temperature, response
format, route, examples, extra user instructions, schema, or semantic repair.

## Frozen route, fixture, and oracle

Use exactly two equivalent authenticated calls with no retry, fallback,
correction, or third call:

| Setting | Frozen value |
| --- | --- |
| Gateway / endpoint | Anoman AI / `https://api.anoman.io/v1/chat/completions` |
| Model | `gemini-2.5-flash` |
| Streaming / temperature | `false` / `0` |
| Response format | `{ "type": "json_object" }` |
| Credential | `ANOMAN_API_KEY` from repository-root `.env` |
| Calls | Exactly two independent calls |

Reuse qualified transport behavior from
`scripts/sem-anm-spike002/anoman-client.mts` (or a thin re-export), the exact
SPIKE-003 fixture and payload construction, normalizer from
`scripts/sem-anm-spike003/normalize-provider-output.mts`, and oracle from
`scripts/sem-anm-spike003/semantic-oracle.mts`. Do not alter SPIKE-002 or
SPIKE-003 files to support this ticket.

The S1-S4 source statements and user payload must be byte-identical to
SPIKE-003:

```text
S1:
The customer submits an order.

S2:
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.

S3:
3.2 Purchase Rules

S4:
Approval may be required before processing.
```

Assert the exact UTF-8 user-payload SHA-256 before both calls:
`e0e674749c0917f1e9e5bb8ffbc1d0059d8f9421d7b7f830a1c7994b303a8f65`.
Do not send expected kinds, oracle rules, answer hints, manual results,
historical provider output, Run 1 output, or this implementation context to
the provider.

Validate each response with the exact existing
`atlasProviderExtractionProposalV1Schema` from the frozen Zod reference. Do
not create a looser response schema or change the semantic contract. Require
S1-S4 exactly once and reject missing, duplicate, unknown, or renamed slots.
The only permitted pre-parse normalization is removing one complete outer
Markdown JSON fence that wraps the entire response. Then use `JSON.parse`,
the exact Zod schema, exact source accounting, and the unchanged oracle, in
that order. Do not extract prose-prefixed JSON, repair malformed JSON, map
enums, rewrite fields, or ask the provider to self-correct.

The unchanged SPIKE-003 oracle requires:

| Slot | Required result |
| --- | --- |
| S1 | One resolved `workflow_step`, no questions; preserve customer, submit/submission, and order. |
| S2 | One resolved `rule` or `constraint` candidate retaining customer, purchase, “hanya boleh” normative meaning, maximum direction, exact value 2, product, and one-order scope together. Reject false splitting into detached propositions. |
| S3 | `non_fact`, no candidates, non-empty reason, no questions. |
| S4 | One `rule`, `needs_resolution=true`, exactly one clarification question; preserve approval, possible/may-be-required modality, and before-processing timing; ask only for the missing applicability condition. |

For S4 reject `condition` or `unresolved` kinds, resolved output,
certain-required modality, missing or multiple questions, invented triggers,
thresholds or approvers, and implementation-detail questions. Do not make
S4 easier or tighten S1-S3. The provider output remains an untrusted proposal;
stop before Atlas finalization, `parseSemanticExtractionResult(...)`,
reconciliation, persistence, BSS, or production routing.

## Required local gates

Before either live call, prove locally:

- PROMPT-003 integrated ticket set has CK `PASS`, its approval commit is reachable, and all hashes above match.
- Exact user-payload hash matches before both requests.
- The frozen Zod authority accepts a valid local proposal and rejects malformed data.
- Source accounting accepts S1-S4 once each and rejects missing, duplicate, and unknown slots.
- The unchanged outer-fence normalizer accepts only one complete outer fence and rejects disallowed repair cases.
- The unchanged oracle passes positive fixtures and rejects material semantic negatives.
- Root `.env` and `.atlas-data/sem-anm-spike004/` are ignored; missing `ANOMAN_API_KEY` fails closed; secret-redaction checks pass.
- PROMPT-003 offline gates pass:
  `node scripts/sem-anm-prompt003/prompt-compiler.test.mts`,
  `node scripts/sem-anm-prompt003/differential-artifacts.test.mts`, and
  `node scripts/sem-anm-prompt003/qualification.test.mts`.
- The SPIKE-004 local test gate passes.

No provider call is allowed while any applicable local gate fails. Once live
execution begins, complete the second authorized call unless a genuine
environment or safety blocker prevents it. Never exceed the two-call limit.

## Implementation and evidence

Keep implementation isolated under `scripts/sem-anm-spike004/`, reusing
frozen fixture, transport, normalizer, schema, and oracle behavior wherever
possible. Live evidence is ignored and written only under
`.atlas-data/sem-anm-spike004/`; do not overwrite or commit raw evidence.
Prescribed outputs include:

```text
scripts/sem-anm-spike004/**
.atlas-data/sem-anm-spike004/run-config.json
.atlas-data/sem-anm-spike004/live-run-1.json
.atlas-data/sem-anm-spike004/live-run-2.json
.atlas-data/sem-anm-spike004/semantic-run-matrix.json
.atlas-data/sem-anm-spike004/comparison-with-spike003.json
.atlas-data/sem-anm-spike004/summary.json
project's goal/feedback/SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md
```

Each per-run record must preserve, before semantic normalization, run number,
HTTP status, latency, served model, finish reason, exact raw message content,
fence-removal flag, post-fence JSON, parsed proposal, Zod result,
source-accounting result, per-slot oracle result, and validation errors.
Record available provider telemetry without inventing absent values, along
with all request identity hashes and route settings. Never persist the API
key, Authorization header, complete `.env`, or unrelated environment secrets.
Redaction-scan raw content and report evidence.

The comparison artifact records only committed SPIKE-003 historical facts
and the two new outcomes. It answers whether S4 changed from FAIL to PASS in
both runs, S1-S3 stayed PASS, the same route was used, and the intended
PROMPT-003 hash was used. Do not claim causality beyond this frozen corpus and
route.

Record exactly one terminal result:

- `PASS`: both calls complete and pass provider inference, parsing, exact Zod validation, source accounting, and every S1-S4 invariant without repair.
- `PASS_WITH_LIMITS`: all PASS correctness conditions hold with an observed operational limitation such as fence dependence, material latency/cost, or non-correctness-breaking routing behavior.
- `FAIL`: meaningful inference executes but either run fails parsing, validation, accounting, or semantics, or repair would be required.
- `ENVIRONMENT_BLOCKED`: missing credentials, entitlement, rate limiting, provider/network outage, or environment failure prevents meaningful inference.

One semantic failure is enough for terminal `FAIL`. An environment block is
not semantic `FAIL`. A terminal `FAIL` may still be a correctly implemented
and CK-approved experiment record.

## Acceptance and review contract

| ID | Requirement | PASS condition |
| --- | --- | --- |
| `RC-ANM4-001` | Consume exact CK-approved PROMPT-003 artifacts. | Approval and required hashes match before both calls. |
| `RC-ANM4-002` | Preserve the PROMPT-003-only experimental variable. | Compared with SPIKE-003, only the approved system-prompt bytes differ semantically. |
| `RC-ANM4-003` | Use exact frozen provider Zod authority. | Both outputs use existing `atlasProviderExtractionProposalV1Schema`; no duplicate loose schema. |
| `RC-ANM4-004` | Use exact frozen Anoman route. | Endpoint, model, temperature, stream, and response mode match SPIKE-003. |
| `RC-ANM4-005` | Use exact S1-S4 user payload. | Both payload byte sequences match the required hash. |
| `RC-ANM4-006` | Use exact SPIKE-003 semantic oracle. | Existing oracle is reused unchanged; no expectation drift. |
| `RC-ANM4-007` | Complete exactly two independent calls. | Two records; no retry, fallback, correction, or third call. |
| `RC-ANM4-008` | Limit output normalization to one complete outer JSON fence. | Raw/post-fence evidence and local negatives prove no other repair. |
| `RC-ANM4-009` | Validate exact source accounting. | S1-S4 each occur exactly once; missing, duplicate, unknown, or renamed slots fail. |
| `RC-ANM4-010` | Preserve S1. | Both runs satisfy the frozen S1 oracle. |
| `RC-ANM4-011` | Preserve S2. | Both runs satisfy the frozen combined normative/constraint oracle. |
| `RC-ANM4-012` | Preserve S3. | Both runs classify the heading as non-fact. |
| `RC-ANM4-013` | Verify S4 remediation. | Both runs produce one `rule`, unresolved applicability, one question, possible modality, and before-processing timing, without an invented trigger. |
| `RC-ANM4-014` | Prohibit semantic repair. | No rewrite, mapping, question injection, or self-correction occurs. |
| `RC-ANM4-015` | Preserve historical PROMPT-002, PROMPT-003, and SPIKE-003 artifacts. | No historical file, result, or evidence is rewritten. |
| `RC-ANM4-016` | Preserve safe attributable evidence. | Raw content, hashes, telemetry, oracle results, redaction review, and comparison are inspectable. |
| `RC-ANM4-017` | Remain before Atlas finalization. | No finalizer, reconciliation, persistence, BSS, or production routing work. |
| `RC-ANM4-018` | Stop for CK after bounded result. | Ticket/report enter `awaiting_review`; no automatic next-stage work. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-ANM4-IB-01` | PROMPT-003 artifacts are immutable request authority; provider output remains an untrusted proposal and never becomes accepted Atlas truth. |
| `SR-ANM4-TB-01` | Preserve the trust chain from raw external response through fence-only normalization, JSON parsing, exact Zod validation, source accounting, and frozen oracle. |
| `SR-ANM4-SA-01` | Keep `ANOMAN_API_KEY`, Authorization, `.env` content, unrelated secrets, and confidential data out of logs, evidence, reports, and commits. |
| `SR-ANM4-ID-01` | Attribute both runs to approval, prompt/schema/reference/provenance/policy hashes, fixture and payload hashes, provider profile, run number, and terminal result. |
| `SR-ANM4-ES-01` | Keep request building, raw response capture, normalization, telemetry, validation, accounting, oracle, and reporting independently inspectable. |
| `SR-ANM4-PC-01` | Do not mutate predecessor semantics, weaken validation, repair meaning, retry/fallback, transfer Atlas authority, or couple this spike to finalization, reconciliation, or production. |
| `SR-ANM4-VS-01` | Verify approval/hashes, credential handling/redaction, exact two-call isolation, parsing/accounting, S1-S4 meaning, telemetry, and evidence integrity. |
| `SR-ANM4-UP-01` | Provider retention, production privacy, durable residency, economics limits, and broader provider policy remain unresolved by this bounded spike. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-ANM4-RB-01` | `SR-ANM4-IB-01`, `SR-ANM4-TB-01`, `SR-ANM4-PC-01` | Did only the frozen approved prompt and fixture cross the provider boundary, with output treated as untrusted through validation and oracle evaluation and without authority transfer? | Request manifest, raw response records, Zod/accounting/oracle evidence, and scope diff (`RC-ANM4-002`..`009`, `-014`, `-017`). |
| `SR-ANM4-RB-02` | `SR-ANM4-ID-01`, `SR-ANM4-ES-01`, `SR-ANM4-VS-01` | Are both calls independently inspectable and attributable to the approved predecessor and frozen request? | Approval reference, hash records, per-run records, comparison, and local-gate output (`RC-ANM4-001`..`013`, `-016`). |
| `SR-ANM4-RB-03` | `SR-ANM4-SA-01` | Are credentials and unrelated secrets excluded from logs, persisted evidence, reports, and diffs? | `.env` ignore proof, missing-key/redaction checks, and evidence/diff inspection (`RC-ANM4-016`). |
| `SR-ANM4-RB-04` | `SR-ANM4-PC-01`, `SR-ANM4-UP-01` | Does the result state only the bounded qualification outcome and leave production/provider policy unresolved? | Scope audit, terminal classification, limitations, and stop state (`RC-ANM4-017`, `-018`). |

## Terminal handoff and hard stop

Record the result and evidence summary in
`project's goal/feedback/SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md`,
set this ticket to `awaiting_review`, and stop for CK. CK verifies the exact
PROMPT-003 artifacts and hashes, route/payload identity, unchanged oracle,
exactly two independent calls, fence-only normalization, Zod and slot
validation, per-slot outcomes, historical comparison, secret safety, no
repair, and no scope expansion.

CFC may correct implementation defects that invalidate this frozen
experiment, but may not alter semantic expectations or rerun provider calls
after the two-call boundary. A third call, retry after semantic failure,
provider/model/fixture/oracle/prompt/schema change, semantic repair, broader
coverage, or finalizer/production work requires explicit HMN authorization.
Stop after local gates, exactly two calls or a genuine environment block,
attributable evidence, comparison, terminal classification, and CK handoff.
