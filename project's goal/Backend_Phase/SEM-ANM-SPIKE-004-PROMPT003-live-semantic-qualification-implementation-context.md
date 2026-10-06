# SEM-ANM-SPIKE-004 Implementation Context
## PROMPT-003 live semantic qualification after cross-field remediation

Status: planning context for Codex implementation and CK handoff

Repository: `adityaa11/ces-platform`

Branch: `codex/new-atlas-backend`

Current branch head inspected: `8b098ad697165b66daeb96b8113267e08239ee61`

Current branch head message: `docs: approve PROMPT-003 offline qualification`

PROMPT-003 CK result: `PASS`

PROMPT-003 reviewed implementation / qualification checkpoint: `83373bc880f7647b091a9cb83ef3e983790055b6`

PROMPT-003 frozen context commit included in CK target: `603ecca29fc5e4dd7d86303a9d903209ae9558ee`

PROMPT-003 approval commit: `8b098ad697165b66daeb96b8113267e08239ee61`

---

## 1. Purpose

`SEM-ANM-SPIKE-004` is the controlled live follow-up to `SEM-ANM-PROMPT-003`.

Its only material question is:

> Does the exact CK-approved PROMPT-003 system prompt, with the approved cross-field composition remediation and no other semantic change, make the same Anoman `gemini-2.5-flash` route pass the same frozen S1-S4 semantic oracle in two independent calls while preserving the already-good S1-S3 behavior?

This is intentionally an A/B continuation of `SEM-ANM-SPIKE-003`.

```text
SEM-ANM-SPIKE-003
PROMPT-002
same provider route
same S1-S4 corpus
same oracle
2 calls
-> S1 PASS
-> S2 PASS
-> S3 PASS
-> S4 FAIL
-> terminal FAIL

SEM-ANM-PROMPT-003
only approved semantic prompt delta:
CROSS-FIELD SEMANTIC COMPOSITION
-> offline CK PASS

SEM-ANM-SPIKE-004
PROMPT-003
same provider route
same S1-S4 corpus
same oracle
2 calls
-> test whether S4 becomes PASS
-> prove S1-S3 do not regress
```

Do not broaden the experiment.

---

## 2. Branch Findings That Are Frozen Into This Context

The current branch has completed and approved `SEM-ANM-PROMPT-003`.

The latest approval record states that:

```text
PROMPT-003-01 PASS
PROMPT-003-02 PASS
PROMPT-003-03 PASS
```

The integrated PROMPT-003 qualification is offline-only and records:

```text
providerCalls = 0
credentialsRead = false
identicalBuilds = 2
```

It also proves that PROMPT-003 preserves the PROMPT-002 Zod authority and provider schema and adds only the frozen cross-field composition policy to the system prompt/provenance.

Therefore SPIKE-004 must consume PROMPT-003 as the immutable predecessor and must not reconstruct, paraphrase, or manually patch the prompt.

---

## 3. Exact PROMPT-003 Artifact Identity

Before any live provider call, assert the following approved SHA-256 identities.

| Artifact | Required SHA-256 |
| --- | --- |
| Frozen Atlas Semantic V1 Zod reference | `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083` |
| PROMPT-002 predecessor system prompt | `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5` |
| Provider schema | `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b` |
| PROMPT-003 system prompt | `da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1` |
| PROMPT-003 prompt provenance | `90e9e3b6a6607dedd4c135c485dbfc9223741a6200be6bd28519d4bb7f4b5200` |
| Cross-field policy body | `2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10` |

Consume the live system prompt only from:

```text
scripts/sem-anm-prompt003/generated/system-prompt.txt
```

Consume the provider schema identity from:

```text
scripts/sem-anm-prompt003/generated/provider-schema.json
```

Consume PROMPT-003 provenance from:

```text
scripts/sem-anm-prompt003/generated/prompt-provenance.json
```

The exact Zod validation authority remains:

```text
scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts
```

because PROMPT-003 intentionally left that CK-approved Zod authority byte-identical.

Any hash mismatch is a local hard stop before provider use.

Do not regenerate semantic wording during the spike.

Do not substitute the manual prompt file used during diagnosis.

Do not patch the generated prompt at runtime.

---

## 4. Controlled Experimental Variable

The experiment must preserve the causal comparison with SPIKE-003.

The only intended semantic request difference is:

```text
SPIKE-003 system prompt SHA-256:
80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5

SPIKE-004 system prompt SHA-256:
da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1
```

The PROMPT-003 delta is the CK-approved generic:

```text
CROSS-FIELD SEMANTIC COMPOSITION
```

Do not introduce any second semantic variable such as:

```text
new fixture wording
new oracle wording
new model
new temperature
new response format
new provider route
examples added to the system prompt
extra user instructions
semantic repair
new payload schema
```

If another material variable changes, the experiment is no longer a clean qualification of PROMPT-003.

---

## 5. Historical Baseline: SPIKE-003 Must Remain Historical Truth

`SEM-ANM-SPIKE-003` is a completed terminal `FAIL` experiment and must not be rewritten.

Its committed feedback records exactly two authenticated Anoman calls with:

```text
HTTP 200
model = gemini-2.5-flash
temperature = 0
stream = false
response_format = json_object
```

Both SPIKE-003 runs produced:

```text
S1 PASS
S2 PASS
S3 PASS
S4 FAIL
```

Both failed S4 in the same material way:

```text
kind = condition
needs_resolution = false
questions = []
```

while still understanding local modality and timing.

That historical result is the baseline to compare against.

Do not edit:

```text
scripts/sem-anm-spike003/**
project's goal/Backend_Phase/tickets/Anoman_Spike_Phase/SEM-ANM-SPIKE-003-prompt002-live-semantic-qualification.md
project's goal/feedback/SEM-ANM-SPIKE-003-prompt002-live-semantic-qualification.md
```

---

## 6. Frozen Provider Profile

Use exactly:

| Setting | Frozen value |
| --- | --- |
| Gateway | Anoman AI |
| Endpoint | `https://api.anoman.io/v1/chat/completions` |
| Model | `gemini-2.5-flash` |
| Streaming | `false` |
| Temperature | `0` |
| Response format | `{ "type": "json_object" }` |
| Auth | `Bearer ANOMAN_API_KEY` |
| Credential source | repository-root `.env` |
| Number of calls | exactly 2 |
| Retry | none |
| Fallback | none |
| Correction call | none |

Reuse the already-qualified transport implementation from:

```text
scripts/sem-anm-spike002/anoman-client.mts
```

or a thin re-export of it.

Do not create a new provider transport behavior unless required by a genuine implementation defect.

Do not log, print, persist, or commit the API key or Authorization header.

---

## 7. Exact S1-S4 Corpus

Use the same four source statements as SPIKE-003, byte-for-byte.

| Slot | Exact source |
| --- | --- |
| S1 | `The customer submits an order.` |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` |
| S3 | `3.2 Purchase Rules` |
| S4 | `Approval may be required before processing.` |

The exact provider user payload must remain:

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

Required SHA-256 of those exact UTF-8 user-payload bytes:

```text
e0e674749c0917f1e9e5bb8ffbc1d0059d8f9421d7b7f830a1c7994b303a8f65
```

Prefer importing/reusing the historical SPIKE-003 fixture/user-payload construction rather than retyping it.

Regardless of implementation shape, assert the exact payload hash before both calls.

The provider request must NOT include:

```text
expected kinds
oracle requirements
manual remediation results
Run 1 output
historical provider output
S4 answer hints
PROMPT-003 implementation context
```

Only the approved system prompt and exact S1-S4 user payload cross the semantic provider boundary.

---

## 8. Frozen Validation Authority

Use the exact existing provider Zod schema authority:

```text
atlasProviderExtractionProposalV1Schema
```

from:

```text
scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts
```

Do not create a looser SPIKE-004 response schema.

Do not change:

```text
version
source_results
slot
classification
candidates
non_fact_reason
questions
semantic_key
kind
payload
normalized_meaning
needs_resolution
```

The provider output remains an untrusted proposal.

SPIKE-004 stops before Atlas finalization.

---

## 9. Frozen Semantic Oracle

The semantic oracle must be the exact SPIKE-003 oracle.

Preferred implementation:

```text
import/reuse:
scripts/sem-anm-spike003/semantic-oracle.mts
```

Do not rewrite or "improve" the oracle for SPIKE-004.

Do not make S4 easier merely because manual tests already passed.

Do not tighten S1-S3.

Do not change S2 back to a constraint-only expectation.

The frozen oracle remains:

### S1

```text
classification = candidate
exactly one candidate
kind = workflow_step
needs_resolution = false
questions = []
preserve customer + submit/submission + order
```

### S2

```text
classification = candidate
exactly one candidate
needs_resolution = false
kind = rule OR constraint
one candidate must preserve:
  customer
  buy/purchase
  normative meaning of "hanya boleh"
  maximum direction
  exact value 2
  product
  one-order scope
```

Reject false splitting into detached broad rule + detached constraint.

### S3

```text
classification = non_fact
candidates = []
non-empty non_fact_reason
questions = []
```

### S4

```text
classification = candidate
exactly one candidate
kind = rule
needs_resolution = true
exactly one clarification question
preserve approval
preserve possible / may-be-required modality
preserve before-processing timing
ask only for missing applicability condition
```

Reject:

```text
kind = condition
kind = unresolved
needs_resolution = false
certain "approval is required"
invented applicability trigger
invented threshold
invented approver
question about implementation detail
```

The oracle judges material semantics, not exact key names inside flexible payload JSON.

---

## 10. No Semantic Repair

The following are forbidden:

```text
condition -> rule rewrite
needs_resolution false -> true rewrite
question insertion
question rewriting
payload key rewriting
semantic_key rewriting
enum mapping
JSON extraction from prose
repairing malformed JSON
asking the model to self-correct
third call after a failed result
```

If PROMPT-003 still fails the frozen oracle, the experiment result is `FAIL`.

A failed provider result is a scientifically valid completed outcome.

---

## 11. Output Normalization Boundary

Reuse the exact SPIKE-003 normalization behavior.

The only allowed pre-parse normalization is:

```text
remove one complete outer Markdown JSON fence
```

only when that fence wraps the whole provider content.

Then:

```text
JSON.parse
-> exact Zod validation
-> exact source accounting
-> exact semantic oracle
```

Reject prose-prefixed JSON, partial fences, key repair, enum repair, or semantic repair.

Prefer importing/reusing:

```text
scripts/sem-anm-spike003/normalize-provider-output.mts
```

unchanged.

---

## 12. Exactly Two Independent Calls

SPIKE-004 authorizes exactly two equivalent live calls.

Both calls must use identical:

```text
PROMPT-003 system prompt bytes
system prompt hash
provider schema identity
model
endpoint
temperature
stream setting
response format
S1-S4 user payload bytes
user payload hash
normalizer
Zod schema
source-accounting check
semantic oracle
```

Run 1 must not influence Run 2.

Do not include Run 1 content in Run 2.

Do not retry a failed run.

Do not make a third call without explicit HMN authorization.

---

## 13. Recommended Implementation Shape

Create a new isolated directory:

```text
scripts/sem-anm-spike004/
```

Suggested files:

```text
scripts/sem-anm-spike004/
  README.md
  fixture.mts
  anoman-client.mts
  normalize-provider-output.mts
  semantic-oracle.mts
  test.mts
  run.mts
  reassess-evidence.mts
```

Prefer thin re-exports/imports for historical frozen behavior:

```text
fixture/user payload <- SPIKE-003 exact source corpus
transport <- SPIKE-002/003 qualified Anoman client
normalizer <- SPIKE-003
semantic oracle <- SPIKE-003
```

SPIKE-004-specific code should primarily change:

```text
predecessor identity
prompt path/hash
evidence directory
ticket/report names
historical comparison metadata
```

That keeps the experiment controlled.

Do not modify historical SPIKE-002 or SPIKE-003 files to make SPIKE-004 work.

---

## 14. Required Offline Gates Before Spending Calls

Before either provider call, prove locally:

```text
PROMPT-003 ticket set has CK PASS
PROMPT-003 approval commit is reachable
PROMPT-003 Zod reference hash matches
PROMPT-003 provider schema hash matches
PROMPT-003 system prompt hash matches
PROMPT-003 provenance hash matches
cross-field policy hash matches
exact user payload hash matches
```

Then prove:

```text
exact Zod schema accepts a valid local proposal
exact Zod schema rejects malformed proposal
source accounting accepts S1-S4 exactly once
source accounting rejects missing slot
a source accounting rejects duplicate slot
source accounting rejects unknown slot
outer-fence normalizer accepts only the allowed complete fence
semantic oracle positive fixture passes
material oracle negatives fail
root .env is ignored
spike004 evidence directory is ignored
missing ANOMAN_API_KEY fails closed
secret-redaction checks pass
```

Also run the PROMPT-003 offline qualification gates before live use:

```text
node scripts/sem-anm-prompt003/prompt-compiler.test.mts
node scripts/sem-anm-prompt003/differential-artifacts.test.mts
node scripts/sem-anm-prompt003/qualification.test.mts
```

Then run the SPIKE-004 local test gate.

No provider call is allowed if an applicable local gate fails.

---

## 15. Evidence Directory

Write live evidence only under ignored:

```text
.atlas-data/sem-anm-spike004/
```

Suggested files:

```text
run-config.json
live-run-1.json
live-run-2.json
semantic-run-matrix.json
comparison-with-spike003.json
summary.json
```

Do not commit raw live evidence unless separately authorized.

Do not overwrite SPIKE-003 evidence.

---

## 16. Per-Run Evidence Requirements

For each call preserve, before semantic normalization:

```text
run number
HTTP status
latency
served model
finish reason
exact raw choices[0].message.content
whether outer fence was removed
post-fence JSON text
parsed proposal
Zod validation result
source-accounting result
S1 oracle result
S2 oracle result
S3 oracle result
S4 oracle result
validation error if any
```

Record available provider telemetry without inventing missing values:

```text
prompt tokens
completion tokens
reasoning tokens
text tokens
total tokens
_anoman.weighted_tokens
_anoman.cost_usd
routing mode
routing region
provider type
provider region
guardrail summary
cache metadata
```

Record request identity:

```text
PROMPT-003 system prompt hash
provider schema hash
Zod reference hash
provenance hash
cross-field policy hash
fixture/source identity
user payload hash
endpoint
model
temperature
response format
```

Never persist:

```text
ANOMAN_API_KEY
Authorization header
complete .env
unrelated environment variables/secrets
```

---

## 17. Historical Comparison Artifact

Produce a small deterministic `comparison-with-spike003.json` or equivalent report containing only committed historical facts and new run outcomes.

Historical baseline:

```text
SPIKE-003 / PROMPT-002
Run 1: S1 PASS, S2 PASS, S3 PASS, S4 FAIL
Run 2: S1 PASS, S2 PASS, S3 PASS, S4 FAIL
terminal: FAIL
```

New comparison should make it easy to answer:

```text
Did S4 change from FAIL -> PASS in both runs?
Did S1 stay PASS in both runs?
Did S2 stay PASS in both runs?
Did S3 stay PASS in both runs?
Was the provider route otherwise unchanged?
Was the prompt hash the intended PROMPT-003 hash?
```

Do not claim causality beyond this bounded controlled experiment.

The strongest supported conclusion after a successful SPIKE-004 is:

> Under the frozen S1-S4 qualification corpus and Anoman Gemini 2.5 Flash route, the CK-approved PROMPT-003 cross-field prompt remediation reproducibly resolves the prior S4 failure without regressing S1-S3.

It is NOT yet evidence that every Atlas semantic kind, every PRD, Safara, or production traffic is qualified.

---

## 18. Terminal Classification

Record exactly one:

```text
PASS
PASS_WITH_LIMITS
FAIL
ENVIRONMENT_BLOCKED
```

### PASS

Use only when both equivalent calls satisfy all correctness requirements:

```text
HTTP/provider inference succeeds
JSON parses after at most allowed outer-fence removal
exact Zod validation passes
exact source accounting passes
S1 PASS
S2 PASS
S3 PASS
S4 PASS
no semantic repair
```

### PASS_WITH_LIMITS

Use only when all correctness requirements for PASS hold but an observed operational limitation remains, for example:

```text
outer JSON fence dependence
material latency
material token/cost overhead
non-correctness-breaking routing behavior
```

Do not use PASS_WITH_LIMITS to excuse a semantic failure.

### FAIL

Use when meaningful inference executes but either run fails:

```text
parse
Zod
source accounting
S1
S2
S3
S4
```

or semantic repair would be required.

One failed semantic run is enough for terminal `FAIL` under this two-run reproducibility qualification.

### ENVIRONMENT_BLOCKED

Use when meaningful inference cannot be obtained because of:

```text
missing credential
401/403 entitlement problem
429/rate limit preventing meaningful inference
provider outage
network failure
environment failure
```

Do not convert an environment block into semantic FAIL.

---

## 19. Review Contract

| ID | Requirement | Pass condition |
| --- | --- | --- |
| `RC-ANM4-001` | Consume exact CK-approved PROMPT-003 artifacts. | Required hashes match before both calls. |
| `RC-ANM4-002` | Preserve the PROMPT-003-only experimental variable. | Request differs from SPIKE-003 semantically only by approved system prompt bytes. |
| `RC-ANM4-003` | Use exact frozen provider Zod authority. | Both outputs validate through existing `atlasProviderExtractionProposalV1Schema`; no duplicate loose schema. |
| `RC-ANM4-004` | Use exact frozen Anoman route. | Endpoint/model/temperature/stream/response mode match SPIKE-003. |
| `RC-ANM4-005` | Use exact S1-S4 user payload. | Payload bytes hash to `e0e674749c0917f1e9e5bb8ffbc1d0059d8f9421d7b7f830a1c7994b303a8f65`. |
| `RC-ANM4-006` | Use exact SPIKE-003 semantic oracle behavior. | Existing oracle is reused unchanged; no expectation drift. |
| `RC-ANM4-007` | Complete exactly two independent calls. | Two records, no retry/fallback/correction/third call. |
| `RC-ANM4-008` | Limit output normalization to one complete outer JSON fence. | Raw/post-fence evidence and local negatives prove no other repair. |
| `RC-ANM4-009` | Validate exact source accounting. | S1-S4 each appear exactly once; no unknown/duplicate/renamed slot. |
| `RC-ANM4-010` | Preserve S1. | Both runs satisfy frozen S1 oracle. |
| `RC-ANM4-011` | Preserve S2. | Both runs satisfy frozen combined normative/constraint oracle. |
| `RC-ANM4-012` | Preserve S3. | Both runs classify heading as non-fact. |
| `RC-ANM4-013` | Verify S4 remediation. | Both runs produce one `rule`, `needs_resolution=true`, one applicability question, possible modality, and before-processing timing without invented trigger. |
| `RC-ANM4-014` | Prohibit semantic repair. | No rewriting/mapping/question injection/self-correction occurs. |
| `RC-ANM4-015` | Preserve historical PROMPT-002/PROMPT-003/SPIKE-003 artifacts. | No historical file or result is rewritten. |
| `RC-ANM4-016` | Preserve safe attributable evidence. | Raw content, hashes, telemetry, oracle results, redaction review, and comparison are inspectable. |
| `RC-ANM4-017` | Remain before Atlas finalization. | No `parseSemanticExtractionResult(...)`, finalizer, reconciliation, persistence, BSS, or production routing work. |
| `RC-ANM4-018` | Stop for CK after bounded result. | Ticket/report move to `awaiting_review`; no automatic next-stage work. |

---

## 20. SecurityReadiness

Status: `applicable`

### Integrity boundary

```text
PROMPT-003 approved artifacts are immutable request authority.
Provider output is untrusted proposal data.
No provider output becomes Atlas accepted/canonical truth in this spike.
```

### Secret safety

```text
ANOMAN_API_KEY loaded only from repository-root .env
.env remains ignored
Authorization never persisted
raw evidence is redaction-scanned
```

### Trust boundary

```text
raw provider response
-> permitted fence normalization only
-> JSON.parse
-> exact Zod validation
-> exact source accounting
-> frozen semantic oracle
```

### Identity

Every run must be attributable to:

```text
PROMPT-003 approval
prompt hash
schema hash
reference hash
provenance hash
policy hash
payload hash
provider profile
run number
```

### Production containment

No production semantic authority, persistence, reconciliation, or publication behavior is authorized.

---

## 21. GO Guidance

GO may:

```text
create scripts/sem-anm-spike004/
reuse frozen historical transport/normalizer/oracle behavior
wire exact PROMPT-003 artifacts
write local deterministic gates
write secret-safe evidence logic
run the offline gates
perform exactly two authorized calls
record terminal result
commit bounded code/report/checkpoint
handoff to CK
```

GO must not:

```text
change PROMPT-003
change the provider schema
change Zod descriptions
change semantic oracle expectations
change S1-S4 wording
change model/provider
add examples to request
retry failed calls
add fallback
make a third call
repair semantics
continue to Safara/finalizer/reconciliation/BSS/production
```

Once live execution begins, do not short-stop between Run 1 and Run 2 unless a genuine environment/safety blocker prevents the second authorized call.

After the two-call boundary is reached, do not make another call.

---

## 22. CK Guidance

CK should verify:

```text
PROMPT-003 approval and hashes
exact system prompt bytes used
same route as SPIKE-003
same user payload hash
same semantic oracle
exact two calls
Run 1 independence from Run 2
raw response capture before normalization
fence-only normalization
Zod validation
source accounting
S1-S4 oracle outcomes
historical comparison
secret safety
no semantic repair
no scope expansion
```

CK returns its review over the completed bounded experiment.

A terminal `FAIL` experiment can still be correctly implemented and CK-approved as an accurate experiment record.

CK approval of the experiment record does not convert a semantic `FAIL` into a semantic `PASS`.

---

## 23. CFC / HMN Boundaries

CFC may repair only implementation defects that invalidate the frozen experiment, for example:

```text
wrong evidence path
incorrect hash assertion
broken redaction
broken JSON-fence parser
incorrect request-count accounting
report-generation bug
```

CFC may not alter semantic expectations or rerun provider calls after the authorized two-call boundary merely to obtain a better result.

Explicit HMN authorization is required for:

```text
third provider call
retry after semantic failure
model change
provider change
fixture change
oracle change
prompt change
schema change
semantic repair
Safara expansion
all-16-kind live qualification
finalizer integration
reconciliation
BSS/production work
```

---

## 24. Expected Repository Outputs

Suggested ticket:

```text
project's goal/Backend_Phase/tickets/Anoman_Spike_Phase/
  SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md
```

Suggested feedback:

```text
project's goal/feedback/
  SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md
```

Suggested implementation:

```text
scripts/sem-anm-spike004/**
```

Ignored evidence:

```text
.atlas-data/sem-anm-spike004/**
```

Do not reuse the SPIKE-003 ticket ID, feedback file, or evidence directory.

---

## 25. Hard Stop

Stop after:

```text
all local gates pass
+
exactly two PROMPT-003 live calls complete or environment blocks meaningful inference
+
raw/validated/oracle evidence is recorded
+
historical comparison is recorded
+
terminal classification is recorded
+
ticket is awaiting_review
+
CK handoff is prepared
```

Do not automatically continue into:

```text
Safara
broader PRD corpus
all 16 kinds live coverage
Atlas deterministic finalization
parseSemanticExtractionResult(...)
reconciliation
persistence
BSS-V2 continuation
production routing
```

If SPIKE-004 returns `PASS` or `PASS_WITH_LIMITS`, the next planning decision should be made separately from this experiment.
