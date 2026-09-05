---
name: atlas-fixture-verification
description: Verify an Atlas Git-like repository and projection bundle for integrity, provenance, and branch-relative consistency. Use for golden-fixture review; report violations without repairing or mutating data.
---

# Atlas Fixture Verification

## Shared execution contract

This file is the provider-neutral instruction source for both Codex and the
future Agents Bridge. A bridge reads `atlas-skill.json`, supplies only the
declared input, and renders this instruction through the selected model adapter.
The selected model returns only the declared structured response.

## Outcome

Check the architectural invariants of golden fixtures, not only that UI record
links happen to resolve.

Treat the supplied repository and projection bundle as the complete inspection
context. Report only evidence-based violations and unresolved checks.

## Required checks

- Every branch HEAD resolves to an existing revision in the same project.
- Every revision parent and proposal base revision resolves.
- Accepted assertion IDs and source artifacts resolve; assertions retain page
  provenance where appropriate.
- A supersession preserves both the old and next assertion and is unambiguous.
- An unapproved proposal does not change any branch HEAD or current snapshot.
- An approved proposal produces a revision and moves exactly the intended
  branch ref.
- Every materialized projection declares a branch and the branch's current
  HEAD revision.
- Workflow references, facts, CES results, and chatbot reads agree for the
  selected branch on the same semantic value.
- Two workspaces with distinct HEADs can return distinct current values without
  cross-contamination.
- A merge conflict remains unresolved until an explicit resolution revision is
  present.

## Test design

Prefer tests that validate IDs, revision topology, resolved semantic values,
and provenance. Do not make tests depend on presentation wording or component
markup. Keep fixture test names tied to an architecture invariant so failures
identify the broken rule.

## Safety boundary

Return only the report declared by `atlas-skill.json`. This skill does not
repair data, approve proposals, resolve conflicts, or make a repository valid
by assumption. Deterministic tests remain the final gate.
