# CES-GF-ATLAS-HARD-021 — First-Class Workflows and Operations

**Stage:** Canonical model and workflow projection refinement
**Status:** Reopened — workflow inventory exists, connected topology is incomplete

## Objective

Determine which model kinds the document evidence supports, then extend
`ProposedProjectModel` with the corresponding source-grounded typed nodes and
relationships. Workflow is one possible model kind, not the assumed universal
shape.

## Dependencies

- ATLAS-HARD-009 and ATLAS-HARD-017 through ATLAS-HARD-020.

## Work

- Ask first: `What kinds of models does this document support?`
- Evaluate these evidence contracts independently, without stopping after the
  first match:
  - explicit activity sequence -> `business_workflow`;
  - modules and their relationships -> `module_dependency`;
  - lifecycle states and transitions -> `state_diagram`;
  - business rules, conditions, and outcomes -> `decision_model`;
  - actors and system interactions -> `actor_interaction`.
- Emit a reviewable model-support assessment containing support status,
  rationale, confidence, source evidence, blockers, and proposal revision for
  every considered model kind.
- Allow one document to support zero, one, or several model kinds. Unsupported
  or insufficiently evidenced kinds must not be fabricated.
- Add workflows, operations, actors, summaries, decisions, states,
  transitions, branches, loops, and dependencies.
- Represent all supported model kinds through shared canonical node identities
  and governed typed relationships so separate diagrams do not create
  duplicate semantic concepts.
- Establish a shared governed-edge contract for every derived transition,
  dependency, ordering edge, branch, join, and loop; ATLAS-HARD-023 must reuse
  this contract for other semantic relationships.
- Define the common governance envelope fields for identity, origin, evidence,
  rationale, confidence, review status, bulk-approval eligibility, blockers,
  and proposal revision.
- Own workflow and operation identity, topology, edge provenance, structural
  validation, and creation of stable review subjects. ATLAS-HARD-026 owns
  approval decisions, replay, stale-decision handling, supersession, and
  authoritative materialization.
- Preserve incomplete and competing interpretations.
- Derive structure from canonical claims and records without
  workflow-specific extractors.
- Keep Safara workflow names and topology in qualification fixtures.
- Pin derivation contracts and provenance.

## Outputs

`proposed-model-support-assessment.json`; canonical actor, module, workflow,
operation, decision, rule, state, and interaction bundle components referenced
by the proposed-model manifest; governed relationships; findings; and revision
metadata. Any diagram is a deterministic non-authoritative projection.

## Acceptance criteria

- [x] Workflows and operations have stable IDs and source lineage.
- [x] Arbitrary directed workflow shapes are supported.
- [x] Derived workflow topology uses the shared governed relationship contract
      and cannot bypass relationship review or publication rules.
- [x] Workflow edges expose the shared governance envelope and stable review
      identity without implementing a separate approval or replay path.
- [x] Unknown or competing structures remain review-required.
- [x] Detailed semantic records remain preserved.
- [x] Production logic contains no Safara-specific routing.
- [x] The frontend need not invent workflows or operations.
- [ ] Model-kind support is decided from explicit source evidence before any
      diagram projection is generated.
- [ ] Each model kind is assessed independently and one document may support
      several model kinds.
- [ ] Unsupported or insufficiently evidenced diagram kinds are omitted or
      marked review-required rather than fabricated.
- [ ] A concept shared across workflow, dependency, state, decision, and actor
      views retains one canonical identity.

## Tests and evidence

Linear, branching, joining, looping, parallel, optional, incomplete,
multi-actor, heading-free, multilingual, and novel-domain workflows.

## Out of scope

Record-to-workflow assignment is handled by ATLAS-HARD-022.

## Reopened acceptance gaps

The post-HARD-026 Safara run emitted workflows and operations but left
`workflow-edges.json` empty. Contract-level graph support is not sufficient
acceptance evidence.

- [ ] Group related operations into coherent business workflows.
- [ ] Emit source-grounded operation, decision, state, branch, join, loop, and
      dependency nodes where supported by the PRD.
- [ ] Emit governed `contains`, `precedes`, `triggers`, `depends_on`,
      `branches_to`, `joins_at`, `repeats_to`, `produces_state`,
      `requires_state`, and `recalculates` candidates as applicable.
- [ ] Mark every topology edge as explicit, derived, or human-confirmed.
- [ ] Reject an empty Safara workflow topology during qualification.
- [ ] Equivalent multilingual workflow or operation representations do not
      create duplicate topology nodes.
- [ ] Pending multilingual equivalence retains separate authoritative nodes
      and may only group them through review-only cluster metadata.
- [ ] Readiness-like outcomes are modeled through governed decisions and
      labeled conditional branches rather than unconditional dual states.
- [ ] Independent or parallel paths are not misclassified as mutually
      exclusive branches.
- [ ] Independent enabled paths share a `fanout_group_id` and
      `path_semantics: independent_non_exclusive`.

### Governed edge families and endpoint rules

- `contains`: workflow to operation, decision, or state.
- `precedes`, `follows`, `triggers`, `depends_on`: operation/state/decision to
  a valid executable or dependent node.
- `enables`: independent, non-exclusive paths; sibling paths use shared fanout
  metadata when they may proceed in parallel.
- `branches_to`: conditional, exclusive, or business-selected decision outcome
  to operation or state, with its governed condition or outcome label.
- `joins_at`: decision, state, or operation to a join point.
- `repeats_to`: operation or state to an earlier correction/retry operation.
- `produces_state`, `requires_state`, `recalculates`: operation to state.

Every edge uses the shared governance envelope, but validation must reject
endpoint combinations that are invalid for its edge family.

### Safara qualification thresholds

- [ ] `workflow-edges.json` contains at least one edge.
- [ ] Every non-trivial workflow has at least two connected operations.
- [ ] Orphan operations equal zero unless each orphan has an explicit
      justification finding.
- [ ] Every branch has at least two labeled outcomes.
- [ ] Every represented state transition has a producing or requiring
      operation.

## Implementation evidence

`ProposedProjectModel` now contains explicit workflow, operation, and governed
workflow-edge collections. A shared governance envelope pins origin, evidence,
rationale, confidence, review status, eligibility, blockers, and proposal
revision. Canonical Atlas derives domain-neutral workflow/operation records and
emits `workflows.json`, `operations.json`, and `workflow-edges.json`; the older
workflow-node graph remains a compatibility projection.

Verification:

- `corepack pnpm --filter @company/ces-proposed-project-model build`
- `corepack pnpm --filter @company/ces-cli typecheck`
- `corepack pnpm vitest run packages/proposed-project-model/src/index.test.ts packages/approved-project-model/src/hardened.test.ts packages/atlas-intent-graph/src/index.test.ts apps/cli/src/atlas.test.ts`
- 20 focused tests passed.
