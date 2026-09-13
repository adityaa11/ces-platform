# SFE-003-01: Restore established Initial Draft route representations

- **State:** awaiting_review
- **Review batch:** BATCH-33
- **Depends on:** SFE-003 route/switcher wiring checkpoint; user `go`
- **Blocks:** SFE-004 through SFE-007
- **Baseline:** [SFE-003](SFE-003-route-and-switcher-initial-draft-wiring.md); [SFE phase scope](SFE-README.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md), sections 4.2–4.3, 5–6, 9.1, and 9.4; [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md); the existing `WorkflowWorkspace` layout and interaction model.
- **SFE-000 map entries:** SFE-M1 rich workflow extraction; SFE-M4 route/switcher reads and projection boundary; SFE-M5 candidate/Master isolation checks
- **Source authority:** The projection reads only the selected SFE fixture record, its extraction candidate, and source provenance. It must not fall back to a checked-in scenario or hand-authored project data.

## Corrective outcome

Render a selected Ready-to-review Initial Draft through Atlas’s established, human-readable route representations: **Main Workflow**, **Project Facts**, and **CES Result**. Each view must retain its existing hierarchy and information pattern while reading only the selected fixture’s unapproved candidate data. The data remains visibly Initial Draft / unapproved; Master remains empty.

This corrective ticket addresses the direct-candidate adapter introduced during SFE-003 remediation, which rendered atomic semantic keys and serialized candidate payloads as the primary workflow UI. That adapter satisfies fixture ownership but does not preserve the established workflow presentation.

## Scope

- Replace the one-atomic-candidate-per-workflow adapter with route-specific semantic Initial Draft projections derived from rich candidate relationships and payload fields.
- **Main Workflow:** group related candidate assertions into meaningful operational scopes and workflows; preserve source ordering, dependencies, conditions, branches, roles, outputs, and unresolved items where provided. Supply readable titles, summaries, ordered step labels, and business outcomes to the existing `WorkflowWorkspace` layout.
- **Project Facts:** derive readable, meaning-grouped facts from the same candidate data and render them through the existing `ProjectKnowledge` / facts layout, including links to related workflows and source evidence.
- **CES Result:** derive candidate-aware CES assessments only where the selected fixture supplies the required source-grounded basis; render them through the existing `CesResult` layout and keep their review/unapproved status explicit. If the fixture lacks a valid CES assessment basis, retain the established meaningful empty/review state rather than fabricating an assessment.
- Do not display semantic keys, candidate IDs, or serialized JSON as primary content in any of these three routes.
- Keep candidate status visible in the route and maintain direct, claim-level access to source quote, document, and page evidence.
- Retain the SFE-003 runtime contract: exact modal-created project/workspace identity, URL/switcher synchronization, PRD-lens preservation, no fallback to unrelated scenario data, and empty Master behavior.
- Add a bounded evidence/detail affordance for source document, page, exact quote, and plain-language interpretation. Candidate IDs and raw structured payloads remain internal fixture/provenance data and are never rendered in the end-user routes.

## Out of scope

- Changing extraction results, candidate authority, approval, publication, or Master truth.
- Changing the visual language, route shell, or workflow interaction model established before SFE-003.
- Creating project 02, publishing project 02, or beginning SFE-004 through SFE-007.

## Acceptance criteria

- Initial Draft renders the same established information patterns and visual hierarchy as the existing Safara routes: a workflow sequence in **Main Workflow**, a meaning-grouped knowledge list in **Project Facts**, and contextual fact-linked assessments in **CES Result**.
- The persisted `safara-project-01` extraction produces readable content for each applicable route from its candidate relationships and payloads. Primary content contains no raw semantic-key identifiers (for example `safara.main_flow.*`) and no JSON payload serialization.
- Every displayed operational scope, workflow, step, outcome, fact, and CES assessment is derived from the selected fixture’s candidate data; no value is copied from the prior checked-in scenario merely to make a route look complete.
- Every displayed item in all three routes retains a reachable source-evidence path to its exact quote, document, page, and plain-language interpretation. Candidate IDs and raw payloads remain internal and are never rendered in primary or supporting end-user UI.
- Initial Draft remains visibly `Ready for review` / unapproved. Switching to Master immediately shows the existing explicit empty-Master state with no workflows, facts, changes, CES items, or candidate content.
- The route, selected workspace, project identity, and PRD lens remain synchronized across pointer selection, keyboard selection, reload, desktop, narrow desktop, and mobile layouts.
- The projection has deterministic behavior for missing optional candidate fields: preserve available source meaning, show a clear review-state fallback, and never invent titles, outcomes, or workflow relationships.

## Validation

- Add fixture-contract tests that prove semantic grouping/order and evidence linkage across Main Workflow, Project Facts, and CES Result; add negative tests that reject raw semantic keys, candidate IDs, and JSON payloads in every rendered route or evidence-detail surface.
- Verify that all displayed Initial Draft content resolves from the chosen modal-created fixture record; include an arbitrary valid project ID record to prove no scenario fallback.
- Manually inspect Initial Draft and Master in the browser at desktop, narrow desktop, and mobile widths. Compare all three Initial Draft routes against their established readable layouts, not only against data counts.
- Test pointer and keyboard workspace switching, focus state, reload, PRD-lens retention, supported themes, evidence access, and the empty Master state.
- Apply the frontend review gate: workflow-sequence pattern correctness, dominant hierarchy, readable typography/density, responsive composition, accessibility, and project personality must pass before the checkpoint is submitted for review.

## Review question

Does the selected Initial Draft use its own candidate fixture and provenance while preserving Atlas’s established Main Workflow, Project Facts, and CES Result representations, with candidate/audit detail available without replacing each route’s primary information presentation?
