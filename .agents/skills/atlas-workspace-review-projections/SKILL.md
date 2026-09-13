---
name: atlas-workspace-review-projections
description: Produce a source-grounded, candidate-only review model for any non-Master Atlas workspace. Use for Main Workflow, Project Facts, and CES Result review data; never emit accepted truth, publish a workspace, or create UI-specific fallback copy.
---

# Atlas Workspace Review Projections

## Outcome

Create a single review model from one selected non-Master workspace's candidate assertions, source accounting, and selected accepted base context. The model supplies source-language annotations and semantic groups for Main Workflow, Project Facts, and CES Result.

It is review data only. It never changes Master, accepted facts, revisions, branches, approvals, or publication state.

## Source and authority rules

- Read only the supplied workspace-scoped extraction result, its exact source evidence, and the explicit selected base context.
- Every group, label, summary, outcome, fact, and CES assessment must identify supporting candidate IDs. Each supporting candidate must retain exact quote, artifact, and page evidence.
- Source-language display annotations are required. Do not translate normalized payload fields, title-case semantic keys, reuse another project's fixture content, or create phrase-matching rules for a particular project.
- Candidate IDs and semantic keys are internal references. They must not be emitted as display labels, summaries, UI copy, or evidence interpretation.
- When source material cannot safely support a concise annotation or grouping, return `needs_resolution` with the affected candidate IDs and question. Do not invent a display fallback.

## Group model

Use one shared semantic group graph. A group may appear in multiple surfaces through explicit memberships:

- `workflow_step` supplies ordered Main Workflow pages and steps.
- `fact_row` supplies Project Facts groups and rows.
- `ces_assessment` supplies CES Result assessments linked to their facts and workflows.

Groups, memberships, and annotations are candidate-only projection metadata. They are not canonical assertions and do not select a UI component or route.

## Validation expectations

- All group/member/annotation references resolve within the selected workspace's candidate set.
- Group order is deterministic per surface.
- Each display annotation uses the document's source language.
- Every visible record has one or more evidence-backed candidates.
- A review model must state its workspace ID, selected base identity when applicable, execution provenance, and review-only status.

## Safety boundary

Return only the response declared by `atlas-skill.json`. The UI renders this review model but may not add labels, grouping, translations, or candidate identifiers of its own.
