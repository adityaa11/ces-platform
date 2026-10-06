# Atlas Semantic IR v0 Qualification Ticket Set

- **State:** `planned`
- **Ticket prefixes:** `SEMIR`, `SEMSPIKE`
- **Authoritative context:** [Semantic IR v0 Qualification implementation context](../../SEMIR-context.md)
- **Execution branch:** `codex/new-atlas-backend`

## Purpose

This set determines whether Atlas can represent source-grounded specification meaning as propositions with independent qualifiers, explicit unresolved aspects, and deterministic evidence validation. It is an isolated qualification experiment. A provider may propose meaning only after the offline representation and validation gates have passed; it never receives authority over canonical truth, reconciliation, or Atlas projections.

```text
NormalizedDocument v1
  -> authorized source units
  -> Semantic IR proposal
  -> Zod structural validation
  -> deterministic evidence validation
  -> deterministic semantic oracle
  -> qualification result
```

The set supersedes the old mutually-exclusive semantic-category experiment for this purpose. `SEMSPIKE-005` is frozen `FAIL` comparison evidence; it is not a prerequisite and its parser is not a success boundary for this new contract.

## Delivery order

| Order | Ticket / batch | Depends on | Bounded review question |
| ---: | --- | --- | --- |
| 1 | [SEMIR-001](SEMIR-001-semantic-qualification-corpus.md) / `SEMIR-BATCH-01` | Frozen SEMIR context and existing deterministic test conventions | Does the reviewable, human-authored corpus define the semantic distinctions the IR must preserve? |
| 2 | [SEMIR-002](SEMIR-002-semantic-ir-zod-schema.md) / `SEMIR-BATCH-02` | SEMIR-001 `PASS` | Can a small Zod Semantic IR represent every frozen corpus case without case-specific hacks or canonicalization? |
| 3 | [SEMIR-003](SEMIR-003-deterministic-oracle-and-mutations.md) / `SEMIR-BATCH-03` | SEMIR-001/002 `PASS` | Do deterministic validators accept known-good meaning and reject dimension-specific semantic corruption? |
| 4 | [SEMIR-004](SEMIR-004-normalized-document-qualification-harness.md) / `SEMIR-BATCH-04` | SEMIR-001 through SEMIR-003 `PASS`; existing `NormalizedDocument v1` | Does the offline harness use real Atlas source units with exact accounting and evidence grounding? |
| 5 | [SEMSPIKE-006](SEMSPIKE-006-semantic-ir-live-qualification.md) / `SEMSPIKE-BATCH-06` | SEMIR-001 through SEMIR-004 `PASS`; accepted `NormalizedDocument v1` route; invokable frozen Groq route | Can two independent provider generations populate the frozen IR without semantic repair or critical instability? |

Dependencies are `PASS` gates. `awaiting_review`, implementation convenience, or a partial evidence file is not authorization to start a dependent ticket.

## Frozen scope and exclusions

The tickets may create only an isolated semantic-IR qualification corpus, schema, deterministic validation/harness, spike runner, ignored live artifacts, and summarized reports. They must not implement canonical Master truth, canonical entities or relations, reconciliation, conflict/supersession, projections, production workers or persistence, retrieval/RAG, context retrieval, publishing, human reconciliation UI, semantic repair, adaptive retries, fallback models, multi-agent decomposition, or a production route.

`NormalizedDocument v1`, immutable source fixtures, deterministic source accounting, and the BSS-V2-004-02 perception boundary are reusable inputs. The old semantic parser and existing semantic-v1 contract are not reused as a required parser boundary unless a future separately authorized adapter exists.

## Shared controls

- Each ticket starts `planned`; work starts only after an explicit `go` for that ticket/batch. Complete the ticket-local frozen review rows, commit evidence-safe work, then set it `awaiting_review` and stop for CK.
- GO never continues automatically into the next ticket. CK reviews only the ticket’s frozen contract. CFC may repair only ticket-local implementation or evidence defects; it must not change semantic definitions, corpus expectations, oracle meaning, provider prompt, or provider configuration. Such a need is `SCOPE_CHANGE` and requires HMN/human authority.
- Offline tickets make **zero** provider calls. SEMSPIKE-006 makes exactly two equivalent authenticated calls, with no retry, fallback, repair, or result-sharing between runs.
- External provider output is untrusted until the generating Zod schema, slot accounting, evidence validator, and semantic oracle all pass. Parsing never grants canonical authority.
- Keep runtime code and artifacts isolated. Suggested ignored artifact roots are `.atlas-data/semantic-ir-v0/` and `.atlas-data/semantic-ir-spike-006/`; never commit raw provider outputs, source content not approved for fixtures, API keys, authorization headers, or secret-bearing diagnostics.

## Live-qualification release gate

SEMSPIKE-006 is executable only when the corpus and live subset are frozen and reviewed; every corpus case is representable; known-good fixtures and all required mutations pass/fail as expected; real `NormalizedDocument v1`, deterministic evidence validation, and source accounting pass; generated JSON Schema retains required descriptions; affected tests and `git diff --check` pass; and the prompt/provider configuration are frozen. Any failed condition is a stop condition, not an invitation to call the provider early.

## Completion boundary

This set ends with a single `PASS`, `FAIL`, or `ENVIRONMENT_BLOCKED` result for SEMSPIKE-006. A `PASS` is feasibility evidence only and may support separately authored planning for bounded context-aware extraction. A `FAIL` identifies whether the IR, oracle, provider semantics, or provider stability was the failing boundary; it never silently broadens the prompt or changes model/configuration.
