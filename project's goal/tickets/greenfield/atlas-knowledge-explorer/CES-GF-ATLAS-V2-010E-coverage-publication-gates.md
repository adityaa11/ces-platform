# CES-GF-ATLAS-V2-010E - Coverage and Publication Gates

**Status:** Completed
**Depends on:** ATLAS-V2-010D

## Outcome

Make it impossible for sparse, misleading, or structurally unsupported output
to be published as a usable Atlas proposal.

## Scope

- Calculate structural coverage over pages, reconstructed sections, extraction
  scopes, facts, modules, relationships, and evidence.
- Require every major section to have a disposition.
- Detect vague module labels, introduction-only models, missing endpoints,
  unsupported root graph kinds, isolated modules, and zero-relationship maps.
- Validate recursive navigation integrity: every detail item is reachable from
  the project root, every parent exists, ancestry is acyclic, ordered paths are
  stable, and no item is orphaned or assigned to a fabricated container.
- Reject breadcrumb data whose root, parent chain, or displayed labels disagree
  with the canonical knowledge hierarchy.
- Require every rendered detail graph or knowledge child to retain evidence
  links that can drive the synchronized PDF workspace.
- Separate `complete`, `awaiting_human_review`, `incomplete`, and `failed` run
  states.
- On incomplete extraction, write diagnostics and resumable intermediate data
  but do not publish `atlas-knowledge.json` as a usable proposal.
- Return a documented distinct CLI exit code for incomplete extraction.
- Prevent the UI from presenting incomplete diagnostics as an authoritative
  Main Workflow.

## Acceptance

- The previously generated one-introduction-module result is rejected.
- No run with zero graph assessments can claim a usable Main Workflow.
- No proposal with an orphaned detail graph, cyclic ancestry, broken parent
  path, fabricated breadcrumb segment, or unevidenced detail child is usable.
- Thresholds are structural and domain-neutral, not fixed Safara counts.
- Diagnostics state exactly which sections, facts, endpoints, or graph
  prerequisites remain unresolved.
- Complete repeated runs remain byte-deterministic.

## Completion Evidence

- Coverage now reports pages, scopes, facts, modules, relationships, graph
  assessments, and stable issue codes.
- Failed scopes, empty facts, missing modules, unscoped introductory modules,
  absent supported graphs, empty business workflows, isolated workflow modules,
  and unevidenced detail children block proposal publication.
- Incomplete runs return exit code `8` and publish only diagnostics, validated
  intermediate extraction, source manifest, and an incomplete run manifest.
- `atlas-knowledge.json` and the usable evidence proposal are withheld until the
  structural gate reaches `awaiting_human_review`.
