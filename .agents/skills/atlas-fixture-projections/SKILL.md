---
name: atlas-fixture-projections
description: Produce or review branch-aware Atlas projection candidates from accepted materialized state. Use for golden Workflow, Facts, CES, and chatbot-read scenarios; do not create independent UI truth.
---

# Atlas Fixture Projections

## Shared execution contract

This file is the provider-neutral instruction source for both Codex and the
future Agents Bridge. A bridge reads `atlas-skill.json`, supplies only the
declared input, and renders this instruction through the selected model adapter.
The selected model returns only the declared structured response.

## Outcome

Build golden fixture views from a selected branch's materialized HEAD state.
The same canonical assertions must drive Main Workflow, Project Facts, CES,
and chatbot-facing read fixtures.

Treat the supplied selected branch, HEAD revision, resolved facts, and
dependency data as authoritative context.

## Projection contract

Each materialized result must identify:

- `branchId`;
- `headRevisionId`;
- the fact/assertion IDs it resolves from;
- its projection or baseline version when applicable.

Treat the materialized state as the branch working tree at HEAD. Normal read
fixtures must resolve it directly, not replay PRDs or ask an LLM to infer the
answer from historical documents.

## Surface rules

- Main Workflow references canonical fact IDs where practical; do not duplicate
  literal conditions that are already facts.
- Project Facts exposes current resolved value plus provenance and assertion
  supersession history.
- CES consumes current facts and workflow semantics, recording both project
  revision and CES baseline version.
- Chatbot reads use selected branch current truth by default. Retrieve history
  only for explicit historical questions or conflict explanation.
- Track enough dependencies to show which projection entries or CES rules are
  affected when an assertion changes.

## Workspace-selector proof

At minimum, fixtures must demonstrate two branch HEADs with different valid
answers for the same semantic key. Switching workspace changes all affected
projections together. It must not be simulated by filtering the same shared UI
records.

## Safety boundary

Return only the response declared by `atlas-skill.json`. A projection is not
canonical truth and must not create assertions, revisions, approvals, or branch
updates. Deterministic Atlas code remains responsible for materialization and
storage updates.
