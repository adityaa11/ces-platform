# SEMSPIKE-004 minimal semantic envelope feasibility

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-04`
- **Terminal result:** `FAIL`
- **GO authorization:** `HMN-SEMSPIKE-004-002 — AUTHORIZE_DIAGNOSTIC_PREDECESSOR_STATE_BYPASS`
- **S4 oracle clarification:** `HMN-SEMSPIKE-004-001 — CLARIFY_S4_ENVELOPE_SEMANTICS`
- **Branch / starting commit:** `codex/new-atlas-backend` / `d7015104ca355c7c99489445be52dfdb8b1f1f44`
- **Implementation commit:** `39b06dd` (`SEMSPIKE-004 minimal semantic envelope diagnostic`)
- **Worktree state:** the shared worktree contained unrelated pre-existing modified/untracked files; they were preserved and excluded. The implementation commit contains only SEMSPIKE-004 context, ticket, and isolated runner paths. Run evidence is ignored under `.atlas-data/`.

## Scope and authorization

SEMSPIKE-004 tested whether the minimal JSON envelope retained the frozen
S1-S4 meaning under ordinary unconstrained generation. Both human
authorizations above were applied only within this ticket: the first clarifies
that S4 is judged across `meaning`, `qualifications`, and `unspecified`; the
second permits this diagnostic to proceed regardless of predecessor workflow
states. No predecessor state or artifact was changed.

The experiment made exactly two authenticated Groq calls. It did not retry,
repair, change the prompt, use provider-enforced JSON Schema, or use tools or
function calls. The terminal `FAIL` is a completed diagnostic outcome.

## Frozen configuration and integrity

| Item | Recorded value |
| --- | --- |
| Provider / model | Groq / `openai/gpt-oss-120b` |
| Stream / tools / functions | `false` / none / none |
| Reasoning effort | `medium` |
| `response_format` / JSON Schema | omitted / omitted |
| Structured-output mode | none |
| Instruction SHA-256 | `c80d619bf5272fd104029e1b466b1b597deeaf16d8e67b47658ff7cb78c90edd` (matched before calls) |
| User message | JSON `{ "sources": [...] }` containing only S1-S4 slot/text data |
| Fixture | Real `parseNormalizedDocument(...)` succeeded; four exact sources; SHA-256 `3feffb8c3b02f53c3c21c02fd021ff309779db5962e30c4d8d91f102dab78292` |

The same frozen instruction, fixture, user message, model, reasoning effort,
and request mode were used for both calls. The S4 oracle examples remain
evaluation-only and were not sent to GPT-OSS.

## Two live runs

| Run | HTTP | Latency | Input / output tokens | Envelope | Semantic oracle |
| ---: | ---: | ---: | ---: | --- | --- |
| 1 | 200 | 2,263 ms | 595 / 802 | PASS | FAIL (S1: `unspecified` was non-empty) |
| 2 | 200 | 2,591 ms | 595 / 959 | PASS | FAIL (S1: `unspecified` was non-empty) |

Raw responses, parsed envelopes, normalized fixture, and redacted run records
are retained under ignored `.atlas-data/groq-semantic-spike-004/`. The local
parser preserved provider text and performed only JSON/container validation;
it did not repair, move, infer, or semantically post-process any content.

## Semantic outcome matrix

| Slot | Run 1 | Run 2 | Evaluation |
| --- | --- | --- | --- |
| S1 | Proposition preserved; `unspecified` described order contents, quantity, and type. | Proposition preserved; `unspecified` described submission time/method and order contents. | **FAIL both.** The frozen S1 container oracle requires `unspecified` to be empty; these details are outside the bounded source proposition. |
| S2 | Preserved customer, purchase, maximum two products, one order. | Preserved customer, purchase, maximum two products, single order. | PASS. Extra `unspecified` text describes gaps and does not supply answers or weaken the exact cap/scope. |
| S3 | Structural heading; empty meaning and arrays. | Structural heading; empty meaning and arrays. | PASS. |
| S4 | `meaning` preserves “may be required before processing”; `unspecified` says trigger circumstances remain open. | `meaning` preserves “may be required before processing”; `qualifications` explicitly distinguishes possibility from certainty. | PASS under `HMN-SEMSPIKE-004-001`: possibility and temporal ordering are preserved across the observation, without making “before processing” the applicability condition or inventing an answer. Field placement is not required; empty `unspecified` would have been allowed. |

The decisive failure is S1's explicit `unspecified = []` expectation. Both
authenticated outputs instead added non-empty, out-of-scope unknowns. Because
the S1-S4 oracle must be satisfied in both runs, this is `FAIL`, even though
the transport envelope and S4 primary diagnostic target passed.

## Safely quoted provider outputs

### Run 1

```json
{
  "observations": [
    { "slot": "S1", "structural_only": false, "meaning": "The customer submits an order.", "qualifications": [], "unspecified": ["The contents, quantity, and type of items in the order are not specified."] },
    { "slot": "S2", "structural_only": false, "meaning": "A customer may only purchase a maximum of two products in one order.", "qualifications": [], "unspecified": ["What constitutes a \"product\" and what happens if the limit is exceeded are not specified."] },
    { "slot": "S3", "structural_only": true, "meaning": "", "qualifications": [], "unspecified": [] },
    { "slot": "S4", "structural_only": false, "meaning": "Approval may be required before processing.", "qualifications": [], "unspecified": ["The type of approval, who must give it, and the circumstances that trigger the requirement are not specified.", "What \"processing\" entails is not specified."] }
  ]
}
```

### Run 2

```json
{
  "observations": [
    { "slot": "S1", "structural_only": false, "meaning": "The customer submits an order.", "qualifications": [], "unspecified": ["The text does not specify when the order is submitted, how it is submitted, or what the order contains."] },
    { "slot": "S2", "structural_only": false, "meaning": "A customer may only purchase a maximum of two products in a single order.", "qualifications": [], "unspecified": ["The text does not specify which products are covered, whether the limit applies per customer per day, or any possible exceptions."] },
    { "slot": "S3", "structural_only": true, "meaning": "", "qualifications": [], "unspecified": [] },
    { "slot": "S4", "structural_only": false, "meaning": "Approval may be required before processing.", "qualifications": ["The requirement for approval is expressed as a possibility rather than a certainty."], "unspecified": ["The text does not specify who must give approval, what type of approval is needed, or what processing entails."] }
  ]
}
```

## Comparison with frozen baselines

| Stage | Recorded evidence | Result and limit |
| --- | --- | --- |
| SEMSPIKE-003 | Atlas-oriented structured contract; both runs made S4 a resolved rule without a question. | `FAIL`; unchanged comparison baseline. |
| SEMTRACE-001 structured attempt | Earlier strict structured trace yielded only one structurally valid response and was recorded `ENVIRONMENT_BLOCKED`. | Superseded for the raw-comprehension question by its separately authorized free-form execution; original artifact remains unchanged. |
| SEMTRACE-001 corrected free-form execution | Two ordinary-language runs preserved S1-S4, including possible approval before processing and unspecified applicability. | `PASS` recorded in `SEMTRACE-001-freeform-raw-comprehension.md`, still `awaiting_review` at this checkpoint. Used only as frozen evidence; predecessor-state bypass was authorized. |
| SEMSPIKE-004 | Two unconstrained model requests returned valid minimal envelopes; both added non-empty S1 `unspecified` content. | `FAIL`; this experiment does not demonstrate complete S1-S4 preservation inside the envelope. |

The result answers the bounded question: adding a minimal JSON container
preserved the S4 uncertainty/temporal distinction in these runs, but did not
preserve the complete S1-S4 oracle because the model populated S1 `unspecified`
with extra details. It does not prove Atlas extraction readiness or justify
prompt/schema changes.

## Validation and credential safety

```text
node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike-004/test.mts
PASS — real normalized fixture, exact instruction hash, source-only user payload, envelope and negative checks

node --env-file=.env packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike-004/run.mts
2 authenticated HTTP 200 calls; valid envelopes; no retry or request mutation

git diff --cached --check
PASS — authorized SEMSPIKE-004 checkpoint paths
```

`GROQ_API_KEY` was loaded from the existing `.env` file only for execution;
its value was never printed, persisted, or committed. No API key or
Authorization header is present in the report or run records. Raw model text
is stored only in the ignored evidence directory. Spike code is isolated under
`scripts/groq-semantic-spike-004/` and is not imported by production code.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-SEMSPIKE-004-01` | Frozen instruction/hash, fixture, and source-only user payload. | `prompt.mts`, `fixture.mts`, parser test; expected SHA-256 matched before either call; four exact sources. | PROVEN |
| `RC-SEMSPIKE-004-02` | Two equivalent frozen Groq calls, unconstrained and tool-free. | `.atlas-data/groq-semantic-spike-004/run-{1,2}.record.json`; HTTP 200 twice with identical config, no `response_format`, tools, retry, or mutation. | PROVEN |
| `RC-SEMSPIKE-004-03` | Transport/container-only parsing, exact accounting, and non-repair behavior. | `parser.mts`, raw responses, and the listed jiti test; negative checks pass and raw text is preserved before parsing. | PROVEN |
| `RC-SEMSPIKE-004-04` | Evaluate both complete S1-S4 envelopes against the frozen oracle, including clarified S4 field-placement rule. | Outcome matrix and safely quoted raw outputs above; both S4 outputs pass the clarified oracle; both runs fail S1's required empty `unspecified`. | PROVEN — oracle evaluated; terminal semantic result is `FAIL`. |
| `RC-SEMSPIKE-004-05` | Truthful comparison to SEMSPIKE-003 and SEMTRACE-001. | Comparison table above reports actual predecessor outcomes/states and limits the conclusion to this fixture. | PROVEN |
| `RC-SEMSPIKE-004-06` | Isolation, credential safety, and recorded validation. | Isolated script/evidence paths, artifact inspection, listed jiti test and `git diff --cached --check`. | PROVEN |

Internal readiness: READY_FOR_CK. This is not a CK `PASS`.
