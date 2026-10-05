# SEM-ANM-SPIKE-002 prompt001 live semantic qualification

- **Ticket:** `SEM-ANM-SPIKE-002`
- **Review batch:** `SEM-ANM-SPIKE-BATCH-002`
- **Ticket state:** `awaiting_review`
- **Terminal result:** `FAIL`
- **GO authorization:** explicit user `GO SEM-ANM-SPIKE-002`
- **Review target:** this bounded implementation and evidence checkpoint; commit recorded by GO handoff
- **Predecessor:** `SEM-ANM-PROMPT-001`, CK `PASS` in `SEM-ANM-PROMPT-BATCH-001-42f5927-verification.md`; checkpoint `42f59279d5f599d4d9a580ee2fa9986124cc8361`
- **Accepted parser boundary:** `BSS-V2-004-02`, CK `PASS` at checkpoint `8a58d01a27985031b3961b3b1a002b83ed2144ad`

## Result

The exact approved generated prompt completed two equivalent Anoman
`gemini-2.5-flash` `json_object` runs. Both responses passed the approved
provider-facing Zod schema, S1-S4 source accounting, deterministic finalization,
and the unchanged `parseSemanticExtractionResult(...)` parser. The S2 oracle
failed in both runs: the provider represented the maximum-per-order purchase
constraint as a `rule`, where the frozen oracle requires `constraint`. The
provider output was not repaired. S1, S3, and S4 passed in both runs.

This is the ticket's valid negative qualification outcome. The route did not
reproduce all of the frozen manual S1-S4 behavior, so the terminal result is
`FAIL`; this is not a production-route approval.

## Frozen identities and fixture

| Item | Identity / result |
| --- | --- |
| Provider route | Anoman AI, `https://api.anoman.io/v1/chat/completions` |
| Model / mode | `gemini-2.5-flash`; non-streaming; temperature `0`; `json_object` |
| Generated prompt SHA-256 | `5927a2b78903bc043c214f984bbcf3e91fa1971d216b1dd3e088e009e9cc72c4` |
| Provider-facing JSON Schema SHA-256 | `b0316a004d4f1f94a0b9da240bfa730e3b1956e8f52808f3b6b07083dba97fa5` |
| NormalizedDocument fixture SHA-256 | `94a9bd457bd4a218f9ddd127e9af0f8560e90d7843b81462b8eddcfb5640f3a8` |
| User payload SHA-256 | Recorded in ignored run config and both run records |
| Fixture parser | Real `parseNormalizedDocument(...)` succeeded; only the four approved synthetic S1-S4 sources were sent |
| Credential source | Repository-root `.env`; ignored by Git; `ANOMAN_API_KEY` present and used; no credential or Authorization value recorded |
| Evidence | `.atlas-data/sem-anm-spike002/{run-config.json,live-run-1.json,live-run-2.json,semantic-run-matrix.json,summary.json}` (ignored) |

The two requests used identical system prompt, S1-S4 payload, provider, model,
temperature, response format, fixture, and validation path. Both returned the
same proposal. No retry, third call, fallback, prompt mutation, or semantic
repair occurred. Each raw response was wrapped in one matching outer Markdown
JSON fence; the only normalization was removal of that entire fence before
`JSON.parse`.

## Run matrix and manual-baseline comparison

| Slot | Successful manual / frozen baseline | Run 1 | Run 2 |
| --- | --- | --- | --- |
| S1 | Resolved workflow step: customer submits an order; no incidental clarification. | PASS; actor `The customer`, action `submits`, object `an order`. | Same as Run 1. |
| S2 | Resolved `constraint`: customer may buy a maximum of exactly 2 products per order. | FAIL; exact quantity, product, customer, scope, and resolved state retained, but kind was `rule`. | Same as Run 1. |
| S3 | Heading produces zero semantic units. | PASS; zero units. | Same as Run 1. |
| S4 | Manual behavior was 3/3: possible approval before processing, missing applicability left unresolved, neutral clarification. | PASS; possible rule, `before processing` temporal constraint, no applicability trigger, asks “Under what conditions is approval required?” | Same as Run 1. |

No byte-equal free-text comparison was required. Oracle tolerance accepted the
provider's harmless articles and surface phrasing. It did not accept S2's
material semantic-kind change.

## Safe telemetry

Both calls returned HTTP `200`, served model `gemini-2.5-flash`, finish reason
`stop`, and the same observed metrics:

| Metric | Each run |
| --- | ---: |
| Latency | 5,735 ms (run 1); 5,500 ms (run 2) |
| Prompt / completion tokens | 1,475 / 978 |
| Reasoning / text tokens | 463 / 515 |
| Total tokens | 2,453 |
| `_anoman.weighted_tokens` | 5,775 |
| `_anoman.cost_usd` | `$0.0028875` |
| Routing mode / region | `realtime` / `id` |
| Provider type / provider region | `cloud_direct` / `US` |
| Cache | miss; type `none` |
| Guardrails | credential DLP, injection, jailbreak, content, PII, policy, response credential DLP, response content, and output DLP all reported `pass` |

Gateway route region and provider region are recorded as separate observed
fields; no residency conclusion is inferred. Guardrail summaries retain only
the provider's status/mode/count output and contain no credential material.

## Validation

| Command / observation | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/test.mts` | PASS; approved prompt hash reproduced. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/run.mts` | PASS; generated prompt/schema hashes match predecessor CK artifacts; coverage complete. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike002/test.mts` | PASS; schema/fixture/source slots, fence and JSON behavior, credential fail-closed behavior, positive surface tolerances, negative S1-S4 oracle cases (including generic-rule S2), no-mutation check, and real Atlas parser. |
| `node --check scripts/sem-anm-spike002/run.mts` | PASS. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike002/run.mts` | Exactly 2 calls; provider returned HTTP 200 twice; terminal result `FAIL` on S2 kind in both runs. |
| Root `.env` ignore and key-presence inspection | `.env` is ignored; key present. Inspection did not print or persist `.env`. |
| Evidence redaction inspection | Passed; run evidence contains no API key or Authorization header. Secret-safe writer redacts a bearer value before persisting any artifact. |
| `git diff --check` on the bounded checkpoint paths | PASS. |

## Review Contract Closure

| ID | Ticket authority and pass condition | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-ANM2-001` | Ticket §2 / start gate: consume immutable predecessor only after CK `PASS`. | Predecessor CK verification and checkpoint identity above; approved prompt/schema artifacts and hashes match. | PROVEN |
| `RC-ANM2-002` | Ticket §§4, 15: exact approved generated prompt used in both runs. | Both run records assert the approved SHA-256 immediately before request. | PROVEN |
| `RC-ANM2-003` | Ticket §§12, 18: same approved provider-facing Zod schema validates output. | Both run records: schema hash matches; Zod `PASS`. | PROVEN |
| `RC-ANM2-004` | Ticket §7 / security binding: root `.env` credential loaded fail-closed and kept secret. | `.env` ignore/key-presence inspection; missing-key local test; two HTTP 200 calls; redaction scan; no key/header in source or artifacts. | PROVEN |
| `RC-ANM2-005` | Ticket §6 / frozen profile: Anoman `gemini-2.5-flash`, temperature 0, non-streaming `json_object`. | Same recorded request configuration and served model in both run records. | PROVEN |
| `RC-ANM2-006` | Ticket §11: only matching whole-response JSON fence may be removed. | Local positive/negative normalizer tests; both raw responses had one complete allowed fence, removed before JSON parse. | PROVEN |
| `RC-ANM2-007` | Ticket §15: exactly two equivalent authenticated runs, no retry/fallback/semantic repair. | Two run artifacts, identical config/prompt/payload hashes; both HTTP 200; proposal preserved unchanged. | PROVEN |
| `RC-ANM2-008` | Ticket §§9, 13, 19: frozen S1-S4 semantic invariants are evaluated with bounded tolerance. | Per-run oracle matrix: S1/S3/S4 pass; S2 fails because `rule` was emitted instead of required `constraint`, in both runs. This is the ticket-authorized terminal `FAIL`, not a conformance claim. | PROVEN |
| `RC-ANM2-009` | Ticket §14: deterministic finalization reaches unchanged `atlas.semantic.extract/v1`. | Both run records: finalizer completed and real `parseSemanticExtractionResult(...)` passed. | PROVEN |
| `RC-ANM2-010` | Ticket §16: compare generated prompt to successful manual baseline by meaning. | Run matrix above: S1, S3, S4 preserved; S2's category differs materially. | PROVEN |
| `RC-ANM2-011` | Ticket §17: preserve available usage, latency, routing, guardrail, cache, prompt/schema evidence safely. | Per-run telemetry and hashes recorded above and under ignored `.atlas-data/sem-anm-spike002/`. | PROVEN |
| `RC-ANM2-012` | Ticket §§20, 25: keep predecessor, prompt, schema, route, and call budget frozen. | Bounded diff; two calls; hashes/config identical; predecessor artifacts unchanged. | PROVEN |
| `RC-ANM2-013` | Ticket §13.1: oracle normalization is deterministic, bounded, comparison-only, and non-mutating. | Surface positive/material negative tests; `proposalUnmodified=true` in both run records; finalizer stores validated provider fields unchanged. | PROVEN |
| `RC-ANM2-014` | Ticket §18 / hygiene: affected checks, ignored evidence, secret scan, and whitespace check. | Focused commands above pass; evidence ignored; no credential/header leak; bounded `git diff --check` passes. | PROVEN |

## Security review bindings

| Binding | Evidence and disposition |
| --- | --- |
| `SR-ANM2-RB-01` | Only the parsed, synthetic S1-S4 fixture crossed the provider boundary; responses remained untrusted through same-schema validation, source accounting, finalization, Atlas parsing, and oracle evaluation. |
| `SR-ANM2-RB-02` | Predecessor, prompt, schema, fixture, payload, route, and each call have recorded identities and telemetry. |
| `SR-ANM2-RB-03` | `.env` is ignored; missing credential fails closed; source/artifacts/reports contain no key or Authorization value. |
| `SR-ANM2-RB-04` | Request/client, normalization, Zod validation, accounting, finalizer, parser, and oracle are separate seams; no semantic repair or Atlas authority transfer occurs. |
| `SR-ANM2-RB-05` | Exactly two ticket-configured calls and all required local/live observations are recorded. Operational observations are reported without residency or economics claims beyond the returned metrics. |

## Terminal decision and next step

`FAIL`: the route completed both calls, but both outputs materially misclassified
S2 as `rule` instead of `constraint`. No semantic repair or further request was
made. The approved prompt builder and its artifacts remain unchanged. The next
step is CK review of this frozen qualification result; any prompt remediation,
additional live call, or production-route work requires separately authorized
scope.
