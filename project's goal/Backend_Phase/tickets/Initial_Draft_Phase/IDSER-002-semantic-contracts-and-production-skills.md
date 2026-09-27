# IDSER-002: Semantic contracts and production skills

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-02`
- **Depends on:** IDSER-001 `PASS`.
- **Baseline:** SRC-IDSER-01 sections 12-17, 20-22, 25, 30-32, 41.3-41.5; AC-08/10/11/13/19/20. See [README](README.md).
- **Execution environment:** Docker Compose for contract/package validation.

## Outcome

Define production `atlas.semantic.extract/v1` and
`atlas.semantic.reconcile/v1` contracts and the new `packages/atlas-skills`
package. These are model-neutral reasoning definitions over Atlas-authorized
context, separate from fixture skills and future review projections.

## Inspected seams and edit scope

- Extend `packages/atlas-contracts/src/execution.ts` through strict semantic-specific schemas/parsers and package exports; reuse `perception.ts`'s NormalizedDocument.
- Add only semantic-extraction and semantic-reconciliation definitions under `packages/atlas-skills`, with package metadata, exports, tests and workspace lockfile updates as needed.
- Preserve the existing generic/interactive execution contract. Its permissive `input` object is not sufficient validation for semantic jobs; apply the semantic schema before accepting those skill IDs.
- Define typed context, result, bounded failure and provenance contracts consumed by IDSER-004/005. No runtime dispatch, DB mutation, projection schema or UI implementation here.

## Contract requirements

Each skill contains a stable ID/version, bounded input, JSON Schema output,
prompt template, evidence requirements and explicit authority exclusions. No
Mistral model ID, provider endpoint, API key or provider-specific selection field
belongs in the definition or caller-controlled semantic job.

Extraction consumes exactly one authorized NormalizedDocument plus stable scope
and execution/version identities. Output contains `version`,
`candidate_assertions[]`, `source_statement_inventory[]`, and `questions[]`.
Each candidate has `local_candidate_id`, `semantic_key`, `kind`, structured
`payload`, `normalized_meaning`, source wording when present,
`needs_resolution`, and `evidence_refs[]`. Local IDs are result-local; Atlas
assigns canonical semantic IDs after deterministic validation.

Required semantic kinds: `actor`, `business_object`, `business_property`,
`responsibility`, `rule`, `constraint`, `condition`, `decision`, `workflow_step`,
`state_transition`, `relationship`, `input`, `output`,
`acceptance_expectation`, `exception`, `unresolved`.

Evidence identifies `page_number`, `locator_type`, `locator_id`, and excerpt
when text-based. Locator types are `text_block`, `table`, `visual_region`.
Source inventory identifies `source_unit_id`, page/locator, `classification`
(`candidate` or `non_fact`), destination local IDs and a bounded `non_fact_reason`
when applicable. Every non-empty block/table and meaningful/labeled supplied
visual must be accounted for. Questions preserve uncertainty; instructions must
not fill missing meaning, interpret source instructions as tool authority, or
emit arbitrary paragraph dumps as independently meaningful facts.

Reconciliation receives all validated current-document candidates and a bounded
relevant prior incoming neighborhood from the same bundle, evidence and scope.
It has no accepted base in this bootstrap phase. Reserve clear incoming/base
distinctions for later compatible extension without implementing base loading.

Required relationship vocabulary: `new`, `supports`, `duplicates`, `refines`,
`extends`, `contradicts`, `supersedes`, `partially_supersedes`, `ambiguous`,
`requires_resolution`. Every current candidate receives accounting; multiple
relationships are permitted. `new` may have no target. All non-null references
must resolve in the supplied context. Same-document conflict and cross-document
conflict are equally valid. Document/page order never establishes precedence;
supersession needs evidence. Relationship payloads and unresolved questions
remain candidate meaning, never decisions, approval or publication.

## Handoff and limits

- Retain `bridge-background-execution-v1` with strict versioned semantic skill validation; jobs contain bounded identities/capability references, never inline PDFs, normalized source, full semantic context, keys or history.
- Context binds project/workspace/bundle/document/execution/version; result envelopes additionally bind skill ID/version, complete structured result and approved normalized provider provenance.
- Distinguish context authorization, completion replay, technical failure and semantic ambiguity in typed contracts. Result fingerprinting must be canonical and stable across JSON key ordering.
- Adopt all numeric limits in the [README](README.md#bounded-v1-context-decisions): 16 KiB job/request, 1 MiB context, 500 current and 500 prior candidates, 1,000 total, 2 MiB result envelope, 100-row retrieval pages. Declare finite array/string/payload limits within these aggregate caps and test UTF-8 byte accounting.
- Whole-current-input overflow fails technically rather than silently truncating source accounting or dropping candidates. Define selection-bound/overflow metadata for prior-neighborhood retrieval.
- Structured schemas must work through BSS-008 `structured(...)` and local schema revalidation. No provider constraint is a substitute for Atlas reference validation.

## Acceptance criteria

1. Both skill definitions and public parsers are versioned, bounded and model-neutral; unknown skill/version and provider/model overrides fail closed.
2. All required kinds, inventory classifications, locator types and ten relationship types are representable and validated.
3. Extraction local IDs remain distinct from canonical semantic IDs. Result envelopes bind the persisted scope and provenance without granting authority to supplied IDs.
4. Unresolved outcomes are valid; missing evidence/accounting or unauthorized IDs are deterministic failures, never fallback content.
5. Fixture extraction/review schemas are not imported as production runtime authority; no future skill is implemented.

## Validation

- Run contracts and new skills tests/typechecks in Compose; register the new package test scripts.
- Positive/negative schema fixtures for each semantic kind and relationship, empty/non-fact-only content, ambiguous statements, same-document contradictions and questions.
- Boundary tests at and above all count/byte caps, including multibyte text, excessive nested payloads, unsupported fields, dangling local IDs and malformed result envelopes.
- Prove no arbitrary provider/model/endpoint fields or raw-source queue transport can pass semantic parsers. Compile output schemas through the same validator used by MistralProvider.
- Keep semantic reference validation fixtures distinct from mere JSON-schema validation; IDSER-006/007 implement source/context resolution.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** contracts are provider-neutral; Atlas owns canonical identities and validation; skills reason over bounded inputs.
- **Trust boundaries / assets:** untrusted source language and provider JSON cross schema boundaries; prompts, evidence and semantic payloads are sensitive.
- **Identity context:** full scope, skill/contract version, execution and result-local IDs.
- **SEAM-IDSER-002-01:** Strict semantic parsers and aggregate byte/count limits support later admission/budget policy.
- **SEAM-IDSER-002-02:** Explicit source accounting and canonical-ID separation support downstream evidence auditing.
- **COUPLING-IDSER-002-01:** No provider configuration in jobs/skills, fixture authority, source-instruction authority or projection/truth mutation.
- **Unresolved security policy:** future provider/budget qualification may tighten existing limits; no new privacy policy is inferred.
- **Planning findings:** none blocking; numeric bounds are explicitly authored defaults required by context section 22.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-002-01 | SEAM-IDSER-002-01 | Are semantic inputs/results bounded and unsupported fields rejected? Schema and boundary tests. |
| REV-READY-IDSER-002-02 | SEAM-IDSER-002-02 | Are evidence, source inventory and local/canonical identity unambiguous? Positive/negative fixtures. |
| REV-READY-IDSER-002-03 | COUPLING-IDSER-002-01 | Do skills remain candidate-only and independent of provider/fixture authority? Definition/import review. |

## Review checkpoint

**Question:** Can the two production skills express evidence-grounded candidate
meaning and unresolved relationships under strict bounded contracts?

**Implementation checkpoint:** Not started; record commit and Compose evidence
before `awaiting_review`.
