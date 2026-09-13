# SFE-003-01: Restore established non-Master route representations

- **State:** feedback_remediation
- **Review batch:** BATCH-33
- **Depends on:** SFE-003 approved; SFE-002-01 approved; user `go`
- **Blocks:** SFE-004 through SFE-007
- **Baseline:** [SFE-003](SFE-003-route-and-switcher-initial-draft-wiring.md); [SFE phase scope](SFE-README.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md), sections 4.2–4.3, 5–6, 9.1, and 9.4; [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md); the existing `WorkflowWorkspace` layout and interaction model.
- **SFE-000 map entries:** SFE-M0 source isolation; SFE-M4 route/switcher reads and projection boundary; SFE-M5 candidate/Master isolation checks; SFE-M6 workspace review projection consumption
- **Source authority:** The projection reads only the selected SFE fixture record, its extraction candidate, and source provenance. It must not fall back to a checked-in scenario or hand-authored project data.

## Corrective outcome

Render any selected Ready-to-review non-Master workspace through Atlas’s established, human-readable route representations: **Main Workflow**, **Project Facts**, and **CES Result**. Each view must retain its existing hierarchy and information pattern while reading only the selected workspace’s `atlas-workspace-review-projections` review model. The data remains visibly unapproved; Master remains empty.

This corrective ticket replaces the direct-candidate and quote-pattern adapters introduced during SFE-003 remediation. Those adapters satisfy fixture ownership but make the UI infer grouping and wording. The UI must instead consume the workspace review model produced by SFE-002-01.

## Scope

- Remove all direct-candidate, normalized-field, and quote-pattern projection logic from route/UI adapters.
- Consume the selected workspace’s validated `atlas-workspace-review-projections` output as the single display model.
- **Main Workflow:** group related candidate assertions into meaningful operational scopes and workflows; preserve source ordering, dependencies, conditions, branches, roles, outputs, and unresolved items where provided. Supply readable titles, summaries, ordered step labels, and business outcomes to the existing `WorkflowWorkspace` layout.
- **Project Facts:** derive readable, meaning-grouped facts from the same candidate data and render them through the existing `ProjectKnowledge` / facts layout, including links to related workflows and source evidence.
- **CES Result:** derive candidate-aware CES assessments only where the selected fixture supplies the required source-grounded basis; render them through the existing `CesResult` layout and keep their review/unapproved status explicit. If the fixture lacks a valid CES assessment basis, retain the established meaningful empty/review state rather than fabricating an assessment.
- Do not display semantic keys, candidate IDs, or serialized JSON in any content or evidence surface in these three routes.
- Render only source-language annotations supplied by the review model. The UI never title-cases normalized fields, translates, shortens source wording, creates labels, forms groups, or uses project-specific fallback patterns.
- Keep candidate status visible in the route and maintain direct, claim-level access to source quote, document, and page evidence.
- Retain the SFE-003 runtime contract: exact modal-created project/workspace identity, URL/switcher synchronization, PRD-lens preservation, no fallback to unrelated scenario data, and empty Master behavior.
- Add a bounded evidence/detail affordance for source document, page, exact quote, and plain-language interpretation. Candidate IDs and raw structured payloads remain internal fixture/provenance data and are never rendered in the end-user routes.

## Out of scope

- Changing extraction results, candidate authority, approval, publication, or Master truth.
- Changing the visual language, route shell, or workflow interaction model established before SFE-003.
- Creating project 02, publishing project 02, or beginning SFE-004 through SFE-007.

## Acceptance criteria

- A selected non-Master workspace renders the same established information patterns and visual hierarchy as the existing Safara routes: a workflow sequence in **Main Workflow**, a meaning-grouped knowledge list in **Project Facts**, and contextual fact-linked assessments in **CES Result**.
- The persisted `safara-project-01` extraction produces readable content for each applicable route from its candidate relationships and payloads. Primary content contains no raw semantic-key identifiers (for example `safara.main_flow.*`) and no JSON payload serialization.
- The persisted `safara-project-01` Initial Draft uses its Indonesian PRD language throughout Main Workflow. In particular, it projects the package/departure scope as `Menyiapkan paket dan keberangkatan` and the first source step as `Membuat paket umrah`; normalized labels such as `Main Registration Flow` and `Creates An Umrah Package` must not render.
- Every displayed operational scope, workflow, step, outcome, fact, and CES assessment is derived from the selected fixture’s candidate data; no value is copied from the prior checked-in scenario merely to make a route look complete.
- Every displayed item in all three routes retains a reachable source-evidence path to its exact quote, document, page, and plain-language interpretation. Candidate IDs and raw payloads remain internal and are never rendered in primary or supporting end-user UI.
- Initial Draft remains visibly `Ready for review` / unapproved. Switching to Master immediately shows the existing explicit empty-Master state with no workflows, facts, changes, CES items, or candidate content.
- The route, selected workspace, project identity, and PRD lens remain synchronized across pointer selection, keyboard selection, reload, desktop, narrow desktop, and mobile layouts.
- The projection has deterministic behavior for missing optional candidate fields: preserve available source meaning, show a clear review-state fallback, and never invent titles, outcomes, or workflow relationships.

## Validation

- Add fixture-contract tests that prove semantic grouping/order, source-language labels, and evidence linkage across Main Workflow, Project Facts, and CES Result; add negative tests that reject raw semantic keys, candidate IDs, JSON payloads, normalized English workflow/action labels, and translation-only UI copy in every rendered route or evidence-detail surface.
- Verify that all displayed Initial Draft content resolves from the chosen modal-created fixture record; include an arbitrary valid project ID record to prove no scenario fallback.
- Manually inspect Initial Draft and Master in the browser at desktop, narrow desktop, and mobile widths. Compare all three Initial Draft routes against their established readable layouts, not only against data counts.
- Test pointer and keyboard workspace switching, focus state, reload, PRD-lens retention, supported themes, evidence access, and the empty Master state.
- Apply the frontend review gate: workflow-sequence pattern correctness, dominant hierarchy, readable typography/density, responsive composition, accessibility, and project personality must pass before the checkpoint is submitted for review.

## Review question

Does the selected Initial Draft use its own candidate fixture and provenance while preserving Atlas’s established Main Workflow, Project Facts, and CES Result representations, with candidate/audit detail available without replacing each route’s primary information presentation?
