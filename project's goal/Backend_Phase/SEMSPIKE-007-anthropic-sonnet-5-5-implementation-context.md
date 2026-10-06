# SEMSPIKE-007 — Anthropic Claude Sonnet 5.5 Semantic IR Qualification
## Implementation Context

**Status:** implementation context / planning authority  
**Target branch:** `codex/new-atlas-backend`  
**Baseline checkpoint:** `68cd835` (`SEMSPIKE-006` remediated live qualification frozen)  
**Relevant provider-wire remediation:** `2da8577` (`fix(semir): flatten provider wire unions`)  
**Provider under test:** Anthropic Claude API  
**Model:** `claude-sonnet-5-5`  
**Purpose:** determine whether the existing Atlas Semantic IR qualification can reach and pass semantic evaluation on a production-grade provider without the Groq Free execution-capacity constraints.

---

## 1. Why SEMSPIKE-007 exists

`SEMSPIKE-006` did **not** establish that Atlas Semantic IR is semantically infeasible.

The final Groq run at `68cd835` was frozen as `ENVIRONMENT_BLOCKED`:

- Run 1: strict structured generation began but was truncated before all 12 results were produced.
- Run 2: HTTP 429 TPM rate-limit rejection.
- No complete provider-wire result reached the Atlas semantic oracle.
- Therefore no semantic PASS/FAIL conclusion exists for the 12-case Semantic IR qualification.

`SEMSPIKE-007` is a **sibling provider qualification**, not a remediation of SEMSPIKE-006 and not a redesign of SEMIR.

The experiment asks:

> Can `claude-sonnet-5-5`, using Anthropic's official structured-output API and a materially larger execution envelope, produce the existing 12-case Semantic IR correctly and consistently?

This ticket intentionally keeps the current Semantic IR heavy. It is meant to separate:

1. **provider/environment capacity**, from
2. **Atlas semantic-model feasibility**.

Do not compact, redesign, batch, or weaken the Semantic IR in this ticket.

---

## 2. Predecessor / workflow rule

`SEMSPIKE-006` does **not** need to be `PASS`.

Its frozen `ENVIRONMENT_BLOCKED` result at `68cd835` is valid predecessor evidence for creating this sibling experiment.

Explicit planning authorization:

- `SEMSPIKE-007` may proceed even though `SEMSPIKE-006` is not semantically PASS.
- Do not reinterpret or overwrite any SEMSPIKE-006 artifact.
- Do not reopen SEMSPIKE-006.
- Normal GO → CK → CFC/HMN governance applies to SEMSPIKE-007 after it exists; this is only a predecessor-bypass for creating the new provider qualification.

---

## 3. Frozen semantic authority

SEMSPIKE-007 must reuse the existing SEMIR semantic authority unchanged.

Do **not** change:

- SEMIR-001 corpus meanings;
- SEMIR-002 Atlas Semantic IR;
- SEMIR-003 oracle;
- semantic mutation expectations;
- source-accounting rules;
- evidence-grounding rules;
- modality meanings;
- polarity meanings;
- condition vs trigger distinction;
- temporal semantics;
- quantity semantics;
- state semantics;
- unresolved-aspect semantics;
- discourse-role semantics;
- the 12 qualification cases;
- the semantic instruction body.

The LLM remains an **untrusted semantic proposer**. It does not create canonical Atlas truth.

---

## 4. Frozen 12-case subset

Use exactly the same subset as the final SEMSPIKE-006 runner:

```text
SEMIR-001-021
SEMIR-001-003
SEMIR-001-002
SEMIR-001-006
SEMIR-001-007
SEMIR-001-004
SEMIR-001-009
SEMIR-001-022
SEMIR-001-010
SEMIR-001-020
SEMIR-001-035
SEMIR-001-038
```

These cases deliberately cover:

- simple proposition;
- obligation;
- permission;
- possibility;
- possibility + nested obligation + unresolved applicability;
- prohibition / negative force;
- explicit condition/scope;
- missing actor;
- threshold/quantity;
- state transition;
- example vs universal rule;
- genuinely non-semantic heading.

The three important `may` contrasts remain:

```text
Users may export reports.
Reports may contain personal information.
Approval may be required before processing.
```

No case may be removed because it is difficult or expensive.

---

## 5. Frozen semantic prompt

Reuse the SEMSPIKE-006 semantic instruction body exactly:

```text
Extract only meaning supported by the authorized source units. Represent each meaningful source as one or more propositions. Preserve modality, polarity, conditions, triggers, temporal relationships, quantities, scope, state, discourse role, and unresolved aspects independently when supported. Do not strengthen or weaken the source. Permission, possibility, obligation, prohibition, and recommendation are distinct. When an essential component is missing, preserve known meaning and identify the missing component as unresolved; do not invent it. Preserve examples and non-semantic structure as such. Use only evidence from the authorized source text. Do not canonicalize terminology, reconcile project truth, resolve conflicts, infer authority, or repair ambiguity.
```

Expected existing SHA-256:

```text
6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144
```

Before live execution, assert this fingerprint.

Do not add fixture-specific hints.

Do not add examples containing the expected answers.

Do not add special wording for `SEMIR-001-007`.

Provider-specific transport configuration is allowed; semantic prompting changes are not.

---

## 6. Provider profile

Freeze the following profile before the first live call:

```text
provider: Anthropic
endpoint family: official Claude Messages API
model: claude-sonnet-5-5
streaming: false
thinking: adaptive
effort: high
structured output: JSON Schema
max_tokens: 16000
retries: 0
fallback: false
semantic repair: false
temperature: omitted
top_p: omitted
top_k: omitted
```

Claude Sonnet 5.5 rejects non-default sampling parameters, so do not set `temperature`, `top_p`, or `top_k`.

Use:

```ts
thinking: { type: "adaptive" }

output_config: {
  effort: "high",
  format: ...
}
```

`max_tokens: 16000` is a frozen ceiling, not a target. Billing/usage evidence must record actual tokens consumed.

If a pre-live offline calculation proves that `16000` cannot structurally contain the expected 12-result envelope, return to planning authority **before making a provider call**. Do not silently raise it.

---

## 7. Anthropic SDK / structured-output boundary

Prefer Anthropic's official TypeScript SDK.

Expected dependency:

```text
@anthropic-ai/sdk
```

Use the official Zod structured-output helper:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
```

Use `client.messages.parse(...)` with:

```ts
output_config: {
  effort: "high",
  format: zodOutputFormat(envelopeSchema),
}
```

Do **not** use the deprecated raw `output_format` request parameter.

Do **not** send the Groq-specific serialized `providerJsonSchema` directly to Anthropic.

The semantic contract should come from the existing Zod provider-wire schema, while Anthropic's helper performs the provider-specific schema transformation.

This preserves the architecture:

```text
Atlas Semantic IR
        ↓
existing provider-wire Zod contract
        ↓
Anthropic zodOutputFormat transformation
        ↓
Claude structured output
        ↓
provider-wire Zod validation
        ↓
existing deterministic wire → Atlas normalization
        ↓
unchanged Atlas Semantic IR validation
```

Provider transport may differ. Semantic meaning may not.

---

## 8. Why use the existing provider-wire result shape

For SEMSPIKE-007, keep the existing full provider-wire result representation.

Do not introduce a compact semantic payload yet.

This is intentional.

SEMSPIKE-007 is meant to answer whether the current heavy SEMIR qualification succeeds when the provider is not constrained by the Groq Free environment.

Changing both provider **and** output representation would make the result ambiguous.

If the current representation later proves unnecessarily expensive, that is a separate architecture ticket/spike.

---

## 9. Anthropic schema compatibility gate

Anthropic Structured Outputs accepts a JSON Schema subset.

Before any authenticated generation call, prove offline that the schema produced for Anthropic is compatible.

At minimum check for:

- every object has `additionalProperties: false`;
- no recursive schema;
- no external `$ref`;
- no unsupported numeric constraints;
- no unsupported `minLength` / `maxLength`;
- no unsupported array constraints such as `maxItems`;
- `minItems` is only `0` or `1` where present;
- no unsupported `allOf` + `$ref` combination;
- all `anyOf` variants are structurally valid;
- the transformed schema remains capable of representing every existing known-good fixture.

Important:

The current Zod envelope uses a 12-result length constraint. Anthropic's provider schema does not support arbitrary `maxItems`. The official SDK helper may remove/translate unsupported constraints for provider compatibility while local Zod validation continues enforcing the original schema.

Do not weaken the **local** envelope requirement:

```text
results.length === 12
```

Provider-side schema transformation is transport adaptation, not semantic weakening.

---

## 10. Request payload

The model receives only:

1. the frozen semantic system instruction;
2. the 12 authorized source slots/texts;
3. the structured-output schema.

The user content must retain the existing shape conceptually:

```json
{
  "sources": [
    {
      "sourceSlot": "...",
      "text": "..."
    }
  ]
}
```

Do **not** send:

- SEMIR expected dimensions;
- oracle answers;
- prohibited interpretations;
- known-good fixtures;
- mutation fixtures;
- case-specific labels;
- semantic expected outputs.

The oracle remains strictly post-response.

---

## 11. Credential handling

Credential:

```text
ANTHROPIC_API_KEY
```

Requirements:

- process environment only;
- never committed;
- never written into artifacts;
- never printed;
- never included in sanitized diagnostics;
- never persist request headers;
- never dump the process environment.

Add/retain deterministic sanitizer coverage for:

- `x-api-key`;
- Authorization-like values;
- Anthropic key patterns;
- cookies;
- request headers;
- environment data.

Ignored artifact roots must remain credential-free.

---

## 12. Live-call boundary

After all offline gates pass, perform exactly:

```text
2 independent authenticated generation calls
```

Both calls must use identical:

- model;
- semantic prompt;
- 12 sources;
- source order;
- output schema;
- `max_tokens`;
- adaptive-thinking setting;
- effort;
- non-streaming setting.

Run 2 must not receive or inspect Run 1's semantic output.

No automatic retry.

No fallback model.

No repair prompt.

No "try again with a smaller schema."

No batching.

No inline schema change after Run 1.

Anthropic may internally cache compiled structured-output grammar. That does not violate independence because Run 2 receives no Run 1 semantic result.

Do not deliberately use conversation continuation or previous-message state.

---

## 13. Response handling

For each call capture:

```text
HTTP/API success or error
message id (safe provider identifier)
stop_reason
latency
input_tokens
output_tokens
cache_creation_input_tokens when supplied
cache_read_input_tokens when supplied
other safe usage counters exposed by the SDK/API
```

Do not assume an HTTP-success response is a qualification success.

For a normal completion:

```text
Claude structured response
        ↓
parsed_output / provider-wire envelope
        ↓
local original Zod envelope validation
        ↓
normalizeProviderWireResult(...)
        ↓
Atlas Semantic IR Zod validation
        ↓
source accounting
        ↓
evidence grounding
        ↓
semantic oracle
```

No stage may semantically repair the model result.

---

## 14. Stop-reason rules

Treat response completion state explicitly.

### `end_turn`

Normal candidate for evaluation.

### `max_tokens`

Qualification failure for that run.

Even if partial/parseable JSON exists, do not claim semantic PASS.

Classify as provider output truncation / structural failure.

Do not increase `max_tokens` and retry under the same authorization.

### `refusal`

Preserve as a model/provider refusal failure.

Do not prompt around it.

### provider/network/rate/auth rejection before semantic output

Preserve sanitized diagnostic and classify according to the terminal rules below.

---

## 15. Semantic oracle

Reuse the existing SEMIR-003 oracle unchanged.

Each successful normalized result must be tested for:

- source disposition;
- proposition structure;
- modality;
- nested modality;
- polarity;
- condition vs trigger;
- temporal relationship;
- quantity/threshold;
- state/state transition;
- unresolved-aspect correctness;
- discourse role;
- source evidence;
- source accounting.

In particular, `SEMIR-001-007` must retain the known/missing split:

```text
source:
Approval may be required before processing.

required semantic dimensions:
possibility
+
obligation
+
before processing
+
unresolved applicability condition
```

The model must not:

- convert it into unconditional obligation;
- interpret `may` as permission;
- invent the missing applicability condition;
- ask whether approval is required instead of identifying the missing applicability condition.

Do not special-case this logic in the provider adapter.

The existing oracle is the authority.

---

## 16. Cross-run stability

Byte-identical JSON is not required.

Harmless source-grounded wording variation is allowed by the existing semantic-equivalence policy.

Critical semantic differences are not allowed, including:

```text
permission ↔ possibility
possibility ↔ obligation
possibility(obligation) ↔ permission
positive ↔ negative
condition ↔ trigger
resolved ↔ unresolved
example ↔ assertion
different threshold semantics
invented actor
invented condition
invented outcome
source disposition changes
```

Compare the same frozen critical dimensions used by the existing qualification.

---

## 17. Terminal classification

### PASS

Only if **both** independent runs:

- complete without truncation/refusal;
- produce structured output successfully;
- pass the provider-wire contract;
- normalize deterministically;
- pass Atlas Semantic IR Zod validation;
- pass source accounting;
- pass evidence grounding;
- pass every critical semantic oracle case;
- are cross-run semantically stable.

### FAIL

Use `FAIL` if semantic execution occurs and any qualification requirement fails.

Examples:

- `stop_reason=max_tokens`;
- refusal after execution;
- local structural validation failure;
- deterministic normalization failure;
- accounting/evidence failure;
- semantic oracle failure;
- critical cross-run instability.

Recommended failure categories:

```text
PROVIDER_OUTPUT_TRUNCATION
PROVIDER_REFUSAL_FAILURE
PROVIDER_STRUCTURAL_FAILURE
EVIDENCE_GROUNDING_FAILURE
PROVIDER_SEMANTIC_FAILURE
PROVIDER_STABILITY_FAILURE
```

### ENVIRONMENT_BLOCKED

Use only when the provider/environment prevents meaningful semantic execution, for example:

- missing/invalid API credential;
- network failure;
- provider outage;
- HTTP 429 before semantic generation;
- provider-side schema rejection before model execution;
- account/billing/quota rejection before semantic generation.

If at least one run reaches actual semantic generation but the other does not, preserve the mixed result clearly; do not silently upgrade it to semantic PASS.

The ticket cannot PASS without two complete comparable runs.

---

## 18. No inline remediation

After the first authenticated call, the experiment is frozen.

Do not change:

- prompt;
- schema;
- source order;
- max tokens;
- effort;
- model;
- provider settings;
- evaluator.

If Anthropic rejects the schema, record the exact sanitized reason.

If the model truncates, record it.

If semantics fail, record the exact cases/dimensions.

No remediation under the live-run authorization.

Return to human/planning authority.

---

## 19. Offline gates before provider use

Before the first authenticated generation call, all of the following must pass:

```text
SEMIR-001 corpus gate                          PASS
SEMIR-002 Atlas schema gate                    PASS
SEMIR-003 oracle/mutation gate                 PASS
SEMIR-004 NormalizedDocument harness           PASS
existing provider-wire round-trip              PASS
Anthropic transformed-schema compatibility     PASS
12-case subset identity                        PASS
semantic prompt SHA-256                        PASS
two-run isolation test                         PASS
sanitizer test                                 PASS
artifact path ignored                          PASS
git diff --check                               PASS
```

Provider calls made before all gates pass:

```text
0
```

Do not use a throwaway Anthropic inference call as a connectivity test.

---

## 20. Artifact isolation

Use a new ignored artifact root, for example:

```text
packages/atlas-contracts/.atlas-data/semantic-ir-spike-007/anthropic-sonnet-5-5/
```

Do not write into SEMSPIKE-006 artifact directories.

Suggested artifacts:

```text
freeze.json
run-01.json
run-02.json
summary.json
```

`freeze.json` should include at minimum:

- ticket/run identity;
- model;
- provider;
- semantic prompt hash;
- source manifest/hash;
- schema fingerprint;
- `max_tokens`;
- effort;
- thinking mode;
- SDK/package version;
- runner commit;
- no-retry/no-fallback/no-repair flags.

Provider diagnostics must be sanitized.

---

## 21. Cost / usage evidence

Record actual token usage from both runs.

If desired, record a purely informational cost estimate using the price snapshot at execution time.

Current planning snapshot for Claude Sonnet 5.5:

```text
input:  $2 / 1M tokens
output: $10 / 1M tokens
```

Cost is **not** a PASS/FAIL oracle.

Do not optimize the semantic response during this ticket merely to reduce cost.

The purpose is feasibility measurement.

---

## 22. Required final report

Create a bounded CK handoff such as:

```text
project's goal/feedback/SEMSPIKE-007-anthropic-sonnet-5-5-qualification.md
```

Report separately:

```text
STRUCTURAL RESULT
EVIDENCE RESULT
SEMANTIC RESULT
CROSS-RUN STABILITY
TERMINAL RESULT
```

Also include:

- provider/model;
- exact commit;
- prompt fingerprint;
- schema fingerprint;
- source-subset fingerprint;
- two-run matrix;
- `stop_reason` per run;
- latency per run;
- token usage per run;
- each failing case/dimension, if any;
- sanitized provider error, if any;
- explicit statement that SEMSPIKE-006 remains unchanged/frozen.

---

## 23. Interpretation of outcomes

### If SEMSPIKE-007 PASSes

This is evidence that:

- the current Semantic IR is representable by a capable hosted model;
- the Groq SEMSPIKE-006 blockers were primarily provider/execution-envelope issues;
- Atlas can continue evaluating the current semantic architecture without immediately redesigning it for Groq Free.

A PASS does **not** yet prove production economics, real-PRD context strategy, canonicalization, or reconciliation.

### If SEMSPIKE-007 FAILs semantically

This is much more important than a Groq environment failure.

Classify exactly what failed.

If Sonnet 5.5 repeatedly misinterprets the frozen semantic dimensions, the next step should be an architecture/model-quality decision, not prompt hacking inside the same ticket.

Potential later comparison:

```text
SEMSPIKE-008 — Claude Opus 5.5 upper-bound qualification
```

only if planning authority decides that an upper-bound model test is useful.

### If SEMSPIKE-007 is ENVIRONMENT_BLOCKED

Preserve the exact cause.

Do not infer anything about Atlas semantic feasibility.

---

## 24. Non-goals

SEMSPIKE-007 does **not** authorize:

- compact Semantic IR redesign;
- bundle-level semantic redesign;
- source-unit accounting redesign;
- prompt caching experiments;
- batching;
- production extraction wiring;
- BSS continuation;
- canonicalization;
- reconciliation;
- Master publication;
- provider fallback;
- Opus fallback;
- real customer PRDs;
- ZDR claims;
- schema weakening to make Claude pass.

---

## 25. Security / privacy boundary

Use only the existing controlled non-confidential SEMIR fixtures.

Do not send customer PRDs or private production documents.

Do not claim ZDR merely because Anthropic Structured Outputs are ZDR-eligible; account-level data-retention configuration is outside this ticket.

This experiment is about semantic feasibility, not production data-governance certification.

---

## 26. CK-ready completion condition

GO must not short-stop after merely wiring Anthropic.

The work is CK-ready only after either:

### A. Live qualification completed

```text
offline gates                         PASS
exactly two authenticated calls       COMPLETE
results/artifacts frozen              COMPLETE
terminal classification               COMPLETE
CK report                             COMPLETE
git diff --check                      PASS
```

or:

### B. A genuine pre-live environment blocker prevents authorized execution

with sufficient evidence showing that no semantic call could be performed safely.

Do not stop at:

```text
"Anthropic adapter implemented; live run still pending."
```

if credentials and execution authority are available.

---

## 27. Core invariant

SEMSPIKE-007 changes **the provider**, not Atlas semantics.

The experiment is:

```text
Same 12 source cases
        +
Same semantic policy
        +
Same Semantic IR meaning
        +
Same deterministic oracle
        ↓
Anthropic Claude Sonnet 5.5
        ↓
Can the model produce correct, grounded,
stable Atlas semantics twice?
```

That is the only question this ticket needs to answer.
