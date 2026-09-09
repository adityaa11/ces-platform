# GLF-004-01: Project-route fixture recalibration

- **State:** planned
- **Review batch:** BATCH-20.1
- **Depends on:** GLF-003-02 approved, GLF-004
- **Baseline:** Architecture Checkpoint sections 12–17, 22.5–22.8, 24; UI/UX Prototype PRD sections 4.2–4.3, 5–6, 9.1, 9.4; Fixture Data-Intent Contract; GLF-003; GLF-004; AUI-002; AUI-004; AUI-013

## Outcome

Recalibrate the project-level route wiring so the Projects library, repository
cards, project switcher, and project route state read one fixture-owned project
record and retain stable project identity. This creates the compatibility
boundary required before workspace selection and branch/HEAD-aware knowledge
surfaces are introduced.

## Scope

- Adapt the Projects library's fixture read path to the approved golden-fixture
  project/repository projection required by GLF-004.
- Resolve project-card identity, repository lifecycle state, metrics, and
  available primary action through stable `project.id`, not display labels or
  component-local state.
- Preserve the existing no-project-selected shell behavior, project selection,
  project switcher behavior, and project route/link compatibility.
- Keep unavailable project actions explicit: an extracting project cannot open
  a workspace, while a ready-for-review project exposes its review action.
- Preserve existing role and sharing behavior as secondary project concerns;
  do not make those behaviors determine repository lifecycle state.
- Provide one project-level adapter/read boundary rather than screen-local
  conversions or duplicated project-state inference.

## Out of scope

- Workspace/branch selection, selected HEAD display, execution provenance, and
  PRD-lens separation; GLF-005 owns those concerns.
- Branch/HEAD-aware fixture reads for Main Workflow, Project Facts, CES Result,
  Changes Done, Sources context, or chatbot-read context; GLF-006 owns those
  knowledge surfaces.
- New production persistence, PRD processing, or provider integrations.

## Acceptance criteria

- The Projects route and project switcher resolve every project through one
  fixture-owned record keyed by stable `project.id`.
- Repository-card Master state, Initial Draft state, metrics, and primary
  action use fixture-owned lifecycle fields and do not infer truth from
  display text.
- The no-project-selected state remains valid until a permitted project action
  selects a project; unavailable projects cannot route into a workspace.
- Existing project links, route context, roles, and sharing behavior retain
  their approved behavior when no branch/HEAD selection is active.
- No Main Workflow, Project Facts, CES Result, Changes Done, Sources, or
  chatbot-read surface is migrated to branch/HEAD-aware data in this ticket.

## Validation

- Exercise published, extracting, and ready-for-review fixture records through
  the Projects route and project switcher, checking stable-ID selection and
  disabled/enabled actions.
- Verify no-project-selected, permitted role, and existing sharing scenarios
  retain their approved route behavior.
- Confirm all downstream knowledge surfaces retain their existing fixture read
  path; record that their branch/HEAD migration is deferred to GLF-006.
- Run fixture relationship, route, accessibility, and focused visual checks,
  then apply the frontend review gate before review.
