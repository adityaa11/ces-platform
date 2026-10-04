# SEMTRACE-001 free-form raw-comprehension execution

- **State:** `awaiting_review`
- **Review batch:** `SEMTRACE-BATCH-01`
- **Terminal result:** `PASS`
- **Authorization:** `HMN-SEMTRACE-001-002 — AUTHORIZE_FREEFORM_SEMANTIC_TRACE`

## Authorization and historical evidence

This is the human-authorized corrected execution. It supersedes the structured
semantic-trace method only for the raw-comprehension question: strict JSON
Schema, semantic fields/enums, structural validation, and the former frozen
instruction hash were not used.

The earlier [SEMTRACE-001 structured-trace attempt](SEMTRACE-001-raw-semantic-understanding.md)
at commit `c5bfb3c` is preserved unchanged as historical evidence and is
superseded for the raw-comprehension question by `HMN-SEMTRACE-001-002`. Its
`ENVIRONMENT_BLOCKED` result is not used as a blocker or as this execution's
semantic verdict. SEMSPIKE-001/002/003 remain untouched; SEMSPIKE-003 is only
the frozen S4 comparison baseline and remains `awaiting_review`.

## Frozen configuration and input integrity

| Item | Value |
| --- | --- |
| Provider / model | Groq / `openai/gpt-oss-120b` |
| Stream / tools | non-streaming / none |
| Reasoning effort | `medium` |
| Structured output | none — no `response_format`, JSON Schema, tools, or function calls |
| Free-form instruction SHA-256 | `ddc7905618e90d913abc70902316dac581cf6620dc9b9d3d42fb509be7db8033` |
| User boundary | data-only exact S1–S4 text, sent as ordinary source lines with no oracle or answer hint |
| Fixture | real `parseNormalizedDocument(...)` validation, four sources, SHA-256 `3feffb8c3b02f53c3c21c02fd021ff309779db5962e30c4d8d91f102dab78292` |

The free-form instruction is the verbatim `HMN-SEMTRACE-001-002` instruction.
No outside knowledge, adaptive retry, semantic repair, Atlas finalization, or
provider/model/configuration substitution occurred.

## Two equivalent live executions

| Run | HTTP | Latency | Input/output tokens | Result |
| ---: | ---: | ---: | ---: | --- |
| 1 | 200 | 1,482 ms | 339 / 489 | Valid ordinary-language response |
| 2 | 200 | 1,409 ms | 339 / 440 | Valid ordinary-language response |

Redacted request metadata, fixture, metrics, and exact responses are retained
only under ignored `.atlas-data/groq-semantic-trace-001-freeform/`.

## Safely quoted provider responses and semantic evaluation

### Run 1

> **S1:** The text says that a customer carries out the action of submitting an order.
>
> **S2:** The text says that a customer is allowed to purchase no more than two products in a single order; buying more than two products in one order is not permitted.
>
> **S3:** This is just a heading or label—“3.2 Purchase Rules.” It identifies a section but does not itself make any factual claim or rule.
>
> **S4:** The text states that it is possible that approval will have to be obtained before processing; approval might be required, but the text does not say that it always is required.

### Run 2

> **S1:** The statement says that a customer performs the action of submitting an order. It simply records that the customer sends in an order; no other conditions or qualifiers are attached.
>
> **S2:** This sentence states a restriction: a customer is allowed to buy no more than two products in a single order. In other words, the maximum number of products that any one customer may include in one order is two.
>
> **S3:** “3.2 Purchase Rules” is a heading or label. As a structural element, it does not itself convey any business fact or rule; it merely indicates that the following section will concern purchase rules.
>
> **S4:** This sentence indicates that approval might be needed before something is processed. It does not say that approval is definitely required; rather, it leaves open the possibility that approval could be required, depending on circumstances that are not specified.

| Source | Required raw meaning | Run 1 | Run 2 |
| --- | --- | --- | --- |
| S1 | Customer submits an order; certain positive statement | Preserved | Preserved |
| S2 | Customer, purchase, maximum exactly 2 products, per-order scope | Preserved | Preserved |
| S3 | Structural heading, not a business proposition | Preserved | Preserved |
| S4 | Possible—not certain—approval requirement; approval precedes processing; source leaves applicability unspecified | Preserved: “possible”, “before processing”, and not always required | Preserved: “might”, “before…processed”, and unspecified circumstances |

The runs differ only in ordinary wording and degree of explanation; neither
materially changes the source meaning. Both distinguish possibility from a
certain unconditional requirement. Neither creates an Atlas disposition,
semantic field, or deterministic semantic representation.

## Comparison and bounded conclusion

The frozen SEMSPIKE-003 baseline converted S4 into a resolved rule with no
question-bearing uncertainty. In contrast, both free-form responses preserve
S4's possibility and the lack of a specified applicability trigger while
retaining the temporal ordering. This is evidence consistent with H2
(representation/contract loss) rather than a basic model-comprehension failure
for this bounded S1–S4 example.

This does not establish production readiness, Atlas semantic correctness,
large-PRD extraction, reconciliation, or an approved replacement architecture.
The only permitted next action supported by this `PASS` is a separately
authored proposal for a neutral-observation-to-deterministic-Atlas-compiler
experiment.

## Review Contract Closure

| Row | Authority and required proof | Evidence | Status |
| --- | --- | --- | --- |
| RC-SEMTRACE-FREEFORM-01 | `HMN-SEMTRACE-001-002`: fixed Groq/model/medium/non-streaming configuration, exact S1–S4, data-only request, verbatim free-form instruction | `fixture.mts`, `groq-client.mts`, local harness, and both redacted metrics | PROVEN |
| RC-SEMTRACE-FREEFORM-02 | Remove all provider-enforced semantic representation | `groq-client.mts` sends no `response_format`, schema, tool, or function-call field; both responses are ordinary text | PROVEN |
| RC-SEMTRACE-FREEFORM-03 | Exactly two equivalent authenticated live calls without adaptive retry | Two HTTP 200 metrics above and ignored run records | PROVEN |
| RC-SEMTRACE-FREEFORM-04 | Evaluate natural-language S1–S4 meaning, especially all three S4 distinctions | Safely quoted responses and per-run matrix above | PROVEN |
| RC-SEMTRACE-FREEFORM-05 | Preserve prior structured attempt, isolation, and credential/header safety | Historical report retained; isolated script/evidence path; no credential or header value is recorded | PROVEN |

## Validation and handoff

```text
node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-trace-001-freeform/test.mts
PASS — real fixture parser, exact data-only boundary, free-form instruction, and absence of JSON Schema text

node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-trace-001-freeform/run.mts
PASS — two HTTP 200 ordinary-language Groq responses
```

Credential/header safety: confirmed. `GROQ_API_KEY` is read only from the
execution environment; no credential or Authorization value is logged,
persisted, or committed.

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`.
