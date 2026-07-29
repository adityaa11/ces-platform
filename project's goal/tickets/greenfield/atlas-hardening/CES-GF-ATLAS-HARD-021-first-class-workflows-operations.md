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
  - ordered activities or basic dependencies -> `activity_flow`;
  - meaningful process structure -> `business_workflow`;
  - process boundaries, events, lanes, gateways, or message-flow semantics ->
    `bpmn_candidate`;
  - functional areas or capabilities -> `functional_decomposition`;
  - modules with evidence-backed relationships -> `module_dependency`;
  - lifecycle states and transitions -> `state_diagram`;
  - business rules, conditions, and outcomes -> `decision_model`;
  - actors with goals, capabilities, permissions, or system use cases ->
    `actor_goal_model`;
  - participants with ordered messages, calls, or responses ->
    `sequence_interaction`;
  - business entities, attributes, associations, cardinality clues, identity,
    or uniqueness rules -> `conceptual_data_model`.
- Do not represent a conceptual model as a physical database schema unless the
  source explicitly provides physical-schema evidence.
- Do not infer module dependencies from co-occurrence or a module list.
- Do not infer sequence interactions from actors and responsibilities alone.
- Do not label an activity flow as BPMN without BPMN-level semantic evidence.
- Emit a reviewable model-support assessment containing support status,
  rationale, confidence, source evidence, blockers, and proposal revision for
  every considered model kind.
- Use exactly these support statuses:
  - `supported`: eligible for a normal proposed projection;
  - `partially_supported`: eligible for a visibly incomplete review-only
    projection;
  - `human_review_required`: eligible only for a non-authoritative review
    preview;
  - `insufficient_evidence`: no diagram projection;
  - `conflicting_evidence`: exception view only until resolved;
  - `not_applicable`: no projection, with rationale.
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
- [ ] Support status, projection eligibility, missing evidence, and review
      status remain separate explicit fields.

### Minimum semantic evidence contracts

- `activity_flow`: at least two activities and one evidence-backed ordering,
  dependency, enablement, or transition.
- `business_workflow`: at least two activities plus meaningful process
  structure such as ordering, decisions, states, joins, or loops.
- `bpmn_candidate`: evidence for process boundaries and BPMN-level semantics
  such as events, lanes, gateways, or message flows.
- `functional_decomposition`: at least two functional areas, or one area with
  meaningful sub-capabilities.
- `module_dependency`: at least two modules and one evidence-backed dependency,
  data-flow, enablement, containment, consumption, or shared-state relation.
- `state_diagram`: at least two states and one valid transition or conditioned
  state change.
- `decision_model`: at least one condition with two outcomes, or one
  condition-outcome rule suitable for a decision table.
- `actor_goal_model`: at least one actor and one source-grounded goal,
  capability, permission, or system use case.
- `sequence_interaction`: at least two participants and one ordered message,
  call, or response exchange.
- `conceptual_data_model`: at least two entities, or one entity with meaningful
  attributes and an evidence-backed relationship.

These contracts evaluate semantic evidence, not keyword counts.

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
- [ ] Pending multilingual equivalence retains separate proposed
      non-authoritative nodes
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
