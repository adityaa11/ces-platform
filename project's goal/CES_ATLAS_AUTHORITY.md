# CES Atlas Source of Truth

## Active product authority

Atlas implementation and review must use only:

1. [`graphs context.md`](graphs%20context.md)
2. [`supporting graphs context.md`](supporting%20graphs%20context.md)
3. [`atlas_semantic_extraction_feedback_context.md`](atlas_semantic_extraction_feedback_context.md)
4. [ATLAS-V2 ticket sequence](tickets/greenfield/atlas-knowledge-explorer/README.md)
5. [HARD-027 golden qualification](tickets/greenfield/atlas-hardening/CES-GF-ATLAS-HARD-027-golden-model-profile-safara-workflow-qualification.md)
6. [`golden-main-workflow.json`](../tests/fixtures/safara/golden-main-workflow.json)
7. [Atlas UI Manual Gate Context](UI%20Gate/ATLAS_UI_MANUAL_GATE_CONTEXT.md),
   accepted at content hash
   `sha256:af45501722121e340e90a3a104983b640949f3d81127e9ae78ccdfe8389e8d47`
8. [Atlas renewed UI prototype](UI%20Gate/atlas-incremental-prd-ux%282%29.html),
   accepted as the golden behavioral and layout example at content hash
   `sha256:ec5e25ea3f2a98fd8ec1130af59e59371f0b410c1a51f059560772043cc13505`
9. [Accepted Atlas redesign plan](tickets/greenfield/atlas-redesign/CES-GF-ATLAS-REDESIGN-000-manual-verification-workspace-redefinition.md)

The graph and semantic context documents define Atlas knowledge behavior. The
UI Manual Gate Context defines workspace information architecture, section
intent, and manual verification behavior; its pinned prototype is the golden
behavioral and layout example, not a production data schema or template.
Tickets define implementation order and acceptance. HARD-027 and its fixture
qualify behavior without becoming production extraction templates.

## Non-authority

Old Atlas, hardening, workflow-UI, DAPE, compatibility-route, feedback, and
evidence documents are not implementation sources. They were removed because
they prescribed competing candidate, Requirement Collection, system-intent,
workflow-only, fixed-tab, or renderer-specific paths.

Generic foundation and Agents Bridge documents may supply infrastructure only.
They cannot define Atlas semantics, graph types, topology, hierarchy, artifacts,
approval subjects, or UI navigation.

## Accepted redesign authority

[`ATLAS-REDESIGN-000`](tickets/greenfield/atlas-redesign/CES-GF-ATLAS-REDESIGN-000-manual-verification-workspace-redefinition.md)
received terminal outcome `ACCEPTED` after remediation commits `259ee18` and
`29a2b70`. The pinned UI Gate sources and finite REDESIGN-001 through
REDESIGN-010 sequence are active authority. This acceptance authorizes the
bounded implementation plan; it does not accept future implementation, make
the current Atlas UI authoritative, or resume POL-010 before REDESIGN-009.

## Clean-state rule

If a proposed change needs an old Atlas contract or compatibility branch, stop.
Update the ATLAS-V2 contract and tickets explicitly or remove the dependency.
Never reconstruct a deleted legacy ticket from code behavior or Git history.
