# SEMSPIKE-006 provider-wire compatibility remediation

- **Scope:** offline remediation for `SEMSPIKE-006 @ 3421df1` and `SEMSPIKE-006-DIAG-01`
- **Provider calls made:** `0` authenticated calls
- **Result:** `READY_FOR_REVIEW`

## Execution transparency

During local validation, the existing `run-semspike-006.mts` command was
mistakenly invoked once. `GROQ_API_KEY` was not configured, so its no-key
branch returned before `fetch`: no authenticated request or provider call was
made. It did write ignored no-key environment records to the configured local
artifact root. This is not treated as a live qualification run, and no live
result is claimed by this remediation.

## Workflow exception

Direct human/planning authorization temporarily bypassed the supplemental
CK/HMN prerequisite for this isolated offline provider-wire compatibility
remediation.

This exception does not alter the normal Atlas workflow for other tickets.

## Confirmed DIAG-01 cause

Groq rejected the direct Atlas-emitted JSON Schema because strict output
requires every declared object property to appear in `required`. The confirmed
paths were the quantity union's `unit` and the state object's `from`.

The recursive offline inspection found every equivalent omission in the Atlas
schema:

| Atlas path | Provider-wire representation |
| --- | --- |
| `sourceSemanticResult.discourseRole` | required `discourseRole: enum \| null` |
| `qualifiers.modality` | required `modality: SemanticModality \| null` |
| `qualifiers.state` | required `state: State \| null` |
| `possibility.appliesTo` | required `appliesTo: BaseModality \| null` |
| `quantity.unit` (both union branches) | required `unit: string \| null` |
| `state.from` | required `from: string \| null` |

## Contract boundary and preservation

`sourceSemanticResultSchema` remains the unchanged **Atlas Semantic IR**
contract. It retains optional semantic fields and remains the final structural
authority. `providerWireResultSchema` is a separate **Groq provider-wire**
contract. It requires every declared property, closes every object, represents
only the fixed optional semantic paths with `null`, then calls deterministic
structural normalization before the unchanged Atlas Zod parse.

Normalization converts only wire `null` to semantic absence; it preserves all
non-null values and arrays exactly. It does not change modality, create actors
or conditions, flatten nested modality, alter condition/trigger placement,
canonicalize text, or repair semantic content.

## Strict-schema compatibility result

`check-semir-006-provider-wire.mjs` recursively visits properties, array
items, unions, definitions, and local references. It reports all violations
rather than stopping at the first one. The final wire schema has **42 reachable
objects**, all with `additionalProperties: false` and every declared property
in `required`. Result: **PASS**, zero violations.

The checker also proves its detection boundary by applying the same recursive
validator to the direct Atlas-emitted schema and asserting it reports the
confirmed `unit` and `from` omissions.

The final wire schema emits `minLength` and `minItems`; it emits no `default`,
`maxItems`, or `maxLength`. The inspection also records its `anyOf`/`oneOf`
union constructs. The range-order Zod refinement is not representable in the
emitted JSON Schema, but the unchanged final Atlas Zod validation rejects an
invalid normalized range deterministically. The ticket evidence confirms the
all-properties-required restriction but does not establish whether Groq accepts
every emitted constraint keyword or union construct. Those constructs have
therefore been recorded, not speculatively removed. This is the remaining
provider compatibility uncertainty and requires a separately authorized live
run.

## Offline regression evidence

| Check | Outcome |
| --- | --- |
| `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` | PASS — 43 frozen corpus cases |
| `node scripts/semantic-ir-v0/check-semir-002-schema.mjs` | PASS — Atlas semantic schema and structural negatives |
| `node scripts/semantic-ir-v0/check-semir-003-oracle.mjs` | PASS — known-good semantics; required mutations rejected |
| `node scripts/semantic-ir-v0/check-semir-006-provider-wire.mjs` | PASS — wire normalization and strict-schema compatibility |
| `pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts` | PASS — real NormalizedDocument route; 19 semantic and 3 accounting mutations rejected |
| `git diff --check` | PASS |

No provider request was made as part of the remediation validation. Semantic
meaning remains governed by the frozen corpus, the unchanged Atlas Semantic IR
schema, and the unchanged oracle.
