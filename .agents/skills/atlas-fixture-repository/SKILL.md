---
name: atlas-fixture-repository
description: Create an immutable, Git-like Atlas knowledge-repository candidate from supplied source-grounded knowledge. Use for golden-fixture repository scenarios; output a candidate only, never accepted truth.
---

# Atlas Fixture Repository

## Shared execution contract

This file is the provider-neutral instruction source for both Codex and the
future Agents Bridge. A bridge reads `atlas-skill.json`, supplies only the
declared input, and renders this instruction through the selected model adapter.
The selected model returns only the declared structured response.

## Outcome

Represent Atlas project truth as an append-only JSON repository. The fixture
model must make a selected workspace resolve to a branch HEAD, rather than to a
mutable UI-shaped project object.

Treat supplied source artifacts and accepted base state as authoritative context.

## Canonical boundary

Keep these as the canonical fixture layer:

- immutable source artifacts, including PRDs and accepted addenda;
- assertions with stable IDs, semantic keys, payloads, and provenance;
- revisions with parent IDs and the accepted changes they introduce;
- branches whose refs point at a revision HEAD;
- optional materialized snapshots keyed by branch and HEAD revision.

JSON is the knowledge representation. Do not require relational tables merely
for fixture work. A single mutable `workspace` JSON object is not canonical
truth, however: accepted documents and revisions must remain immutable.

## Rules

- Give every assertion, artifact, revision, proposal, and branch a stable ID.
- Preserve the old assertion when a newer assertion supersedes it.
- Record source artifact and page on source-grounded assertions.
- Record parent revision IDs, relevant interpreter versions, and an explicit
  branch HEAD on every resolved branch state.
- Keep content in JSON-compatible structures. Use deterministic ordering where
  it makes fixture diffs and hashing inspectable.
- Represent the base revision explicitly; never infer it from fixture order.
- Keep UI workflow, facts, and CES records out of the canonical repository
  unless they are explicitly a materialized projection.

## Scope boundary

The PRD lens is an evidence/document filter. It is not a branch selector.
Workspace selection chooses a branch-relative HEAD and therefore can change the
current truth. A lens may be applied after selecting a workspace.

Return only the response declared by `atlas-skill.json`. It is a candidate for
deterministic validation and review: it cannot approve, commit, move a branch
HEAD, mutate storage, or invent source evidence.
