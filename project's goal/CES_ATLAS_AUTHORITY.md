# CES Atlas Source of Truth

## Active product authority

Atlas implementation and review must use only:

1. [`graphs context.md`](graphs%20context.md)
2. [`supporting graphs context.md`](supporting%20graphs%20context.md)
3. [ATLAS-V2 ticket sequence](tickets/greenfield/atlas-knowledge-explorer/README.md)
4. [HARD-027 golden qualification](tickets/greenfield/atlas-hardening/CES-GF-ATLAS-HARD-027-golden-model-profile-safara-workflow-qualification.md)
5. [`golden-main-workflow.json`](../tests/fixtures/safara/golden-main-workflow.json)

The context documents define product behavior. Tickets define implementation
order and acceptance. HARD-027 and its fixture qualify behavior without
becoming production extraction templates.

## Non-authority

Old Atlas, hardening, workflow-UI, DAPE, compatibility-route, feedback, and
evidence documents are not implementation sources. They were removed because
they prescribed competing candidate, Requirement Collection, system-intent,
workflow-only, fixed-tab, or renderer-specific paths.

Generic foundation and Agents Bridge documents may supply infrastructure only.
They cannot define Atlas semantics, graph types, topology, hierarchy, artifacts,
approval subjects, or UI navigation.

## Clean-state rule

If a proposed change needs an old Atlas contract or compatibility branch, stop.
Update the ATLAS-V2 contract and tickets explicitly or remove the dependency.
Never reconstruct a deleted legacy ticket from code behavior or Git history.
