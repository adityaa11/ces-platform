---
name: atlas-fixture-changes
description: Produce a staged Atlas ChangeProposal candidate from extracted knowledge, a user correction, or merge context. Use for golden-fixture change scenarios; never silently alter accepted truth.
---

# Atlas Fixture Changes

## Shared execution contract

This file is the provider-neutral instruction source for both Codex and the
future Agents Bridge. A bridge reads `atlas-skill.json`, supplies only the
declared input, and renders this instruction through the selected model adapter.
The selected model returns only the declared structured response.

## Outcome

Create realistic fixture scenarios in which incoming information is proposed,
validated, approved, and committed without letting an LLM-style extraction or
chat correction silently mutate accepted truth.

Treat supplied source artifacts, branch state, and the base revision as
authoritative context.

## Required separation

Model these states separately:

```text
source input -> ChangeProposal -> validation/resolution -> approval -> revision
```

An extracted candidate and a user correction are proposals, not assertions in
the accepted branch state. An approved correction also has an immutable
addendum artifact before it becomes authoritative.

## Scenario guidance

Use compact but meaningful scenarios that exercise an architectural rule:

- a new PRD branch based on Master;
- a staged, unapproved proposal that leaves HEAD unchanged;
- an approved proposal that produces a new revision and updates only its
  branch HEAD;
- a correction that creates an addendum rather than rewriting its PRD;
- a stale proposal whose base revision no longer matches HEAD;
- a semantic three-way merge with an explicit unresolved conflict.

For every proposal include its base revision, target semantic key, before and
proposed assertion or value, provenance, status, and any resolution required.

## Rules

- Do not turn a visual "Changes Done" item into the source of truth. It is a
  projection of proposal/revision history.
- Approval must be represented as the event that permits a new immutable
  revision; an approval flag alone is insufficient.
- Never silently select a winner for conflicting semantic values.
- Keep scenarios small enough to diagnose a broken invariant from fixture data.

## Safety boundary

Return only the response declared by `atlas-skill.json`. The result is staged
candidate data; it cannot approve a proposal, seal an addendum, create a
revision, move HEAD, or mutate Atlas storage.
