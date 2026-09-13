# SFE-002-01: Generate generic workspace review projections

- **State:** planned
- **Review batch:** BATCH-34
- **Depends on:** SFE-002 BATCH-27 PASS; user `go`
- **Blocks:** SFE-003-01, SFE-004 through SFE-007
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-002](SFE-002-initial-draft-extraction.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md), sections 4.2–4.3, 5–6, 9.1, and 9.4; existing readable Main Workflow, Project Facts, and CES Result route representations.
- **SFE-000 map entries:** SFE-M0 workspace source authority; SFE-M1 rich extraction; SFE-M4 accepted/read boundary; SFE-M5 verification; SFE-M6 workspace review projections.
- **Source authority:** Read only the selected non-Master workspace’s extraction candidate, source accounting, and explicit selected base context. Never read a legacy scenario fixture, another workspace’s candidate, or Master as a substitute for candidate content.

## Outcome

Create `atlas-workspace-review-projections`, a provider-neutral, candidate-only skill that produces one generic semantic review model for any non-Master workspace. Its source-language annotations and shared groups are the only display content consumed by Main Workflow, Project Facts, and CES Result while that workspace is unapproved.

## Scope

- Define the skill instructions and JSON contract for workspace-scoped review projection input and output.
- Produce one source-language annotation graph with shared group IDs, deterministic order, candidate membership, and evidence support for all requested review surfaces.
- Model Main Workflow pages/steps, Project Facts groups/rows, and CES Result groups/assessments as surface memberships of the same review model rather than independent UI truth.
- Require every display label, summary, outcome, fact, and assessment to link to supporting candidate assertion IDs with source quote, artifact, and page provenance.
- Keep candidate IDs, semantic keys, payloads, and execution IDs internal. They are allowed for deterministic references and validation but never as display annotations or user-facing evidence copy.
- Return `needs_resolution` if source evidence cannot support a source-language label, grouping, relationship, or assessment. Do not translate normalized fields, title-case identifiers, apply project-specific phrase matching, or borrow an established fixture’s display wording.
- Add deterministic validation and fixture tests for provenance, workspace/base isolation, group membership, source language, no-display-identifier invariant, and a second differently worded source fixture.

## Out of scope

- Changing accepted Master projections, publication, revisions, approval, or current branch truth.
- Rendering UI routes; SFE-003-01 owns consumption by the existing route components.
- Reusing golden fixture groups or hand-authored scenario content as the output for any workspace review model.

## Acceptance criteria

- The skill accepts any non-Master workspace ID and its own complete extraction result; it does not depend on the label `Initial Draft` or a Safara project ID.
- A complete response identifies its workspace, source language, candidate-only status, shared semantic groups, display annotations, requested surface memberships, supporting candidate IDs, and execution provenance.
- Each visible annotation is source-language content supported by candidate evidence. Candidate IDs, semantic keys, raw payloads, normalized English actions, and project-specific fallback copy are not display values.
- Main Workflow, Project Facts, and CES memberships can reference one shared group and candidate graph without duplicating or contradicting group meaning.
- Missing, cross-workspace, dangling, unordered, or unsupported annotations fail validation or produce `needs_resolution`; no workspace becomes Ready for review with an invalid review model.
- The contract remains provider-neutral in both `codex` and `agents_bridge` execution modes.

## Validation

- Validate the skill JSON schema, its instructions, and type/runtime adapters.
- Test two distinct source fixtures with different wording; prove the same consumer needs no phrase-specific code for either fixture.
- Test every group, annotation, membership, and evidence reference for workspace isolation and source grounding.
- Confirm generated review-model display values never contain candidate IDs, semantic keys, serialized payloads, or normalized action strings.

## Review question

Does `atlas-workspace-review-projections` produce one evidence-backed, source-language, candidate-only review model for any non-Master workspace that all three established read routes can consume without adding UI inference?
