# CES-GF-ATLAS-V2-010C - Bounded Exhaustive Semantic Extraction

**Status:** Planned
**Depends on:** ATLAS-V2-010B

## Outcome

Consider every relevant PRD section without relying on one provider response to
summarize an entire document.

## Scope

- Create deterministic extraction scopes from reconstructed sections and
  bounded source-unit groups.
- Extract section identity, semantic facts, and context classification per scope.
- Classify introduction, background, objective, user, module, rule, validation,
  and delivery contexts without assuming all headings are modules.
- Require an explicit disposition for every scope: relevant facts extracted,
  context only, unsupported, or failed.
- Run a separate bounded cross-section pass for evidenced module relationships.
- Require exact source statements, terms, and source-unit IDs.
- Retry invalid provider facts with bounded corrective feedback; never silently
  paraphrase or invent evidence.
- Merge provider calls only after each scope passes schema and grounding checks.

## Acceptance

- Every reconstructed section has a recorded disposition.
- Safara introduction text is context, not a module.
- All evidenced Safara business sections yield their relevant facts without
  hardcoded names or topology.
- A provider cannot return one fact and implicitly claim complete coverage.
- The same extraction process handles an unrelated workflow and non-workflow
  document.
- Provider calls and artifacts remain bounded, deterministic, and auditable.

