# GLF-004-02: Project creation intake and pipeline handoff

- **State:** planned
- **Review batch:** BATCH-20.2
- **Depends on:** GLF-003-02 approved, GLF-004 approved, GLF-004-01 approved
- **Baseline:** Architecture Checkpoint sections 12–17, 22.5–22.8, 24; UI/UX Prototype PRD sections 4.2–4.4, 5–6, 9.1, 9.4; Fixture Data-Intent Contract; GLF-003; GLF-004; GLF-004-01; AUI-002; AUI-004; AUI-013

## Outcome

Define and implement the Create and process project intake boundary. The modal
collects a valid project identity and its PRD PDFs, then produces one
fixture-owned creation request that a later extraction lifecycle can consume.
The same stable `projectId` must travel from the modal to the project record,
processing job, repository candidate, card, and project route.

## Scope

- Add the Create a project modal fields: Project ID, Project Name, Project
  Description, and PRD PDFs.
- Make Project ID initially derive from Project Name, allow deliberate editing
  before submission, and validate it as a stable lowercase kebab-case key.
- Apply input limits: Project ID 3–48 characters, Project Name 1–80
  characters, Project Description 0–280 characters, and at least one PDF.
- Provide accessible labels, required-state feedback, inline format guidance,
  character counts, and disabled/loading/error submit states.
- Produce one explicit `ProjectCreateRequest`-style fixture payload containing
  `projectId`, `projectName`, `projectDescription`, and PRD-file metadata.
- Create a fixture-backed Extracting project record and matching processing job
  from the accepted request, keyed by the submitted stable ID.
- Ensure the Project Card and route adapter consume that generated record by
  stable ID rather than display labels or component-local copies.

## Out of scope

- Running the GLF-003 golden-fixture generator against arbitrary user uploads,
  changing the immutable Safara golden bundle, or adding production storage,
  queues, extraction, or provider integrations.
- Completing the Extracting → Ready for review → Published lifecycle; a later
  ticket owns simulated or real processing progression and publication.
- Broad Project Card containment changes for unbroken maximum-length strings.
  That stress-test remediation remains GLF-004 visual work; this ticket only
  supplies the validated input contract those cards will receive.
- Workspace/branch selection and branch/HEAD-aware knowledge-surface reads.

## Acceptance criteria

- The modal displays all four requested fields in the stated order and does
  not accept submission until every required value is valid.
- Project ID is unique within the fixture-backed project store, is normalized
  as lowercase kebab case, and remains the sole identity key after submit.
- Name and description preserve their original human-readable casing; file
  input accepts one or more PDFs and reports the selected count accessibly.
- The accepted request creates exactly one Extracting project card and one
  processing job with the same `projectId`; no UI state is inferred from the
  project name or description.
- The new project resolves through the GLF-004-01 project read adapter without
  changing the golden Safara bundle.
- Validation failures, duplicate IDs, invalid file selection, and submit
  progress are visible and keyboard-accessible.

## Validation

- Exercise empty, invalid-format, duplicate-ID, maximum-length, and valid
  submission cases; verify the payload fields and generated card/job share an
  identical stable ID.
- Verify the all-lowercase, all-uppercase, and mixed-case name/description
  stress inputs are accepted or rejected according to their field contract;
  record card-containment findings separately under GLF-004 if they remain.
- Verify the created Extracting card has disabled Open project and Share
  actions, selected-PDF metadata, and accessible status messaging.
- Verify the generated project can be selected and resolved through the route
  adapter, while existing Safara golden-bundle reads remain unchanged.
- Run fixture relationship, form interaction, route, accessibility, and
  focused visual checks, then apply the frontend review gate before review.
