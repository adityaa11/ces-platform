---
name: atlas-prd-extraction
description: Extract source-grounded candidate assertions from a new Atlas PRD or Addendum. Use for new knowledge input; return candidates and ambiguities only, never accepted truth or UI projections.
---

# Atlas PRD Extraction

## Shared execution contract

This file is the provider-neutral instruction source for both Codex and the
future Agents Bridge. A bridge reads `atlas-skill.json`, supplies only the
declared input, and renders this instruction through the selected model adapter.
The selected model returns only the declared structured response.

## Objective

Extract atomic candidate assertions from the supplied immutable PRD or
Addendum. The result is source-grounded incoming knowledge for later change
proposal and validation; it is not accepted Atlas truth.

## Required behavior

- Create one candidate per independently meaningful rule, responsibility,
  constraint, condition, commitment, output, or unresolved question.
- Assign a stable candidate ID, assertion kind, semantic key, and structured
  payload. Keep source wording separate from its normalized interpretation.
- Attach an exact supporting quote, the supplied artifact ID, and page number
  to every candidate assertion.
- Use targeted current-state context only to identify a possible affected
  semantic object or potential contradiction. Do not treat it as permission to
  rewrite or supersede accepted truth.
- Return `needs_resolution` with a targeted question when wording does not
  safely determine a value, scope, actor, condition, or relationship.
- Return a source-statement inventory for every supplied page. Each inventory
  row has a stable ID, artifact ID, page, exact quote, statement class,
  normalized interpretation, and exactly one destination: an atomic candidate
  ID or an explicitly permitted non-fact reason (and duplicate target when
  applicable). A material statement may not be classified as a non-fact.
- Preserve workflow reconstruction data in candidate payloads and
  relationships: actors, triggers, ordered steps, conditions, branches,
  inputs, outputs, dependencies, state transitions, exceptions, and open
  questions. The inventory is a coverage index, never a replacement for this
  structured extraction.
- Preserve distinctions in scope, condition, actor, timing, modality, and
  status. Do not merge separate rules only because their wording is similar.

## Boundaries

- Do not invent quotes, page numbers, requirements, source artifacts, or
  certainty not supported by the supplied document text.
- Do not scan or replay historical PRDs. The caller supplies only the new
  artifact and any targeted current context needed for comparison.
- Do not create Main Workflow, Project Facts, CES, revisions, addenda,
  approvals, commits, branch updates, or materialized state.
- Do not decide whether a candidate becomes an accepted assertion. That is the
  responsibility of the change-proposal, validation, approval, and commit flow.

## Safety boundary

Return only the response declared by `atlas-skill.json`. The response is a
candidate extraction for deterministic validation and review.
