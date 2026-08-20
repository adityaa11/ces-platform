# Atlas UI/UX Prototype Review Protocol

**Status:** Draft  
**Applies to:** Atlas UI/UX prototype and its supporting UX PRD  
**Purpose:** Reach clear, reviewable decisions without creating an endless feedback loop.

## 1. Principle

Reviews exist to decide whether the prototype meets agreed requirements. They are not an open-ended opportunity to redesign already-approved work. Feedback must be specific, traceable to the agreed scope, and resolved by an explicit decision.

## 2. Review roles

- **Decision owner:** the person authorized to approve the prototype or request an in-scope change.
- **Reviewer:** provides consolidated feedback within the review window.
- **Prototype owner:** records feedback, explains its disposition, implements accepted changes, and presents the revised prototype.

If multiple stakeholders review, the decision owner supplies one consolidated response. Conflicting feedback is resolved by the decision owner before it is submitted.

## 3. Review baseline

Every review starts from a named baseline:

- [Atlas UI/UX Prototype PRD](Atlas_UI_UX_Prototype_PRD.md)
- the current prototype version; and
- a short change log since the prior review.

Feedback is in scope only when it identifies a gap, ambiguity, usability issue, or defect against that baseline. A request that adds a new product capability, changes the product direction, or changes an approved requirement is a **scope change**, not ordinary review feedback.

## 4. Review stages and limits

| Stage | Review focus | Maximum review rounds | Exit decision |
|---|---|---:|---|
| 1. UX direction | Information architecture, primary flows, visual direction | 1 | Approve direction or make one consolidated revision request |
| 2. Core flows | Sign-in, project library, upload/progress, sharing, workspace navigation | 1 | Approve flows or make one consolidated revision request |
| 3. Atlas detail | PRD lens, evidence, Main Workflow, Facts, CES Result, Changes Done, approval states | 1 | Approve content interactions or make one consolidated revision request |
| 4. Responsive and handoff | Desktop, tablet, mobile, accessibility cues, final polish | 1 | Final approval or a finite list of release-blocking corrections |

Each stage allows one feedback round and one revision. A new review round is permitted only for a defect introduced by that revision or for an approved scope change.

## 5. How to submit feedback

Feedback must be submitted as one consolidated list for the current stage. Each item must include:

1. **Location:** screen, flow, component, or prototype state.
2. **Observation:** what is unclear, incorrect, or unusable.
3. **Requirement link:** the relevant UX PRD section or approved decision.
4. **Priority:** Blocker, Important, or Optional.
5. **Requested outcome:** the observable result needed, not a mandatory implementation method unless that method is itself required.

Example:

> **Location:** Create project upload state.  
> **Observation:** It is unclear whether processing continues after leaving the screen.  
> **Requirement link:** UX PRD 4.3.  
> **Priority:** Important.  
> **Requested outcome:** The project library and notification bar must show that processing continues in the background.

### Global component consistency gate

For each review checkpoint, the prototype owner must identify any global component or layout primitive affected by the change. The reviewer evaluates its rendered behavior across every relevant route, state, and breakpoint—not only on the screen where the change was made. A reused component must keep its declared size, position, spacing, hierarchy, and responsive behavior unless an intentional named variant is documented and accepted.

### Design-quality gate

Before a checkpoint can be presented as review-ready, the prototype owner must compare the rendered surface with the approved design-quality baseline. The review asks whether the hierarchy, density, navigation, whitespace, and control placement express a deliberate, product-appropriate workspace pattern. A generic dashboard scaffold, copied default component arrangement, or implementation that has only been source-checked fails this gate. When a new pattern is not already approved, its researched references and intended behavior must be documented before implementation.

### Reference-led composition gate

For every new screen or material redesign, the prototype owner must record a short visual direction before implementation: the product-interface references or approved pattern, intended hierarchy, density, surface system, navigation behavior, primary action, and responsive composition. Review the screen as one complete composition—not a set of individually working controls. A checkpoint fails this gate when it relies on default-looking controls, local visual patches, or disconnected component styling rather than one coherent system.

### Mandatory visual-validation gate

Before a UI checkpoint is committed or presented for `ck`, the prototype owner must inspect the rendered browser surface—not only source code, lint output, or build output. The validation record must name the affected component and the states actually checked.

For every changed component, validate the applicable entries below:

| Dimension | Required checks when applicable |
|---|---|
| Shared impact | Every route and feature state that uses the changed component or layout primitive |
| Interaction | Default, hover/focus, open/closed, selected/unselected, and dismissed states |
| Theme | Dark and Light, including text contrast, elevation, borders, status colors, and focus treatment |
| Layout | Desktop, tablet, and mobile widths; expanded and collapsed navigation where present |
| Text rhythm | Heading-to-eyebrow and heading-to-body spacing, line-height, wrapping, paragraph measure, and alignment at each relevant width |
| Accessibility behavior | Keyboard focus, Escape, outside-click dismissal, and any changed ARIA state |

The reviewer must evaluate the exact state affected by the change. A screenshot or browser check where an overlay hides the affected element does not satisfy the gate. Any missed visual defect must be recorded with the untested state that allowed it to escape, and that state becomes mandatory validation for future changes to the component.

Text spacing is a first-class visual requirement, not incidental browser-default behavior. Components that contain labels, headings, supporting copy, or metadata must declare their intended margins and line-height in the shared style system. The reviewer must reject inherited/default spacing that produces cramped hierarchy, accidental gaps, or poor wrapping at a target breakpoint.

## 6. Feedback classification

| Classification | Definition | Handling |
|---|---|---|
| Blocker | Prevents a required flow, misrepresents a requirement, or creates a serious access/privacy misunderstanding | Must be resolved before stage approval |
| Important | Materially reduces clarity, usability, responsiveness, or traceability | Resolved in the current stage when in scope |
| Optional | Improvement that does not affect agreed acceptance criteria | Logged for later consideration; does not block approval |
| Scope change | Adds or materially changes an approved requirement | Requires decision-owner approval, PRD update, effort/impact assessment, and a new baseline |
| Out of scope | Does not relate to the current stage or agreed prototype scope | Recorded with rationale; not implemented in the current stage |

## 7. Disposition and change log

Every submitted item receives one explicit disposition:

- Accepted
- Accepted with adjustment
- Deferred
- Reclassified as scope change
- Out of scope
- Rejected with rationale

The prototype owner publishes a short decision log with the disposition, resulting action, and the prototype version in which accepted items were addressed. This prevents the same issue from being reopened without new evidence.

## 8. Approval rules

- Approval is given per review stage, not only at the end.
- Once approved, a stage is frozen.
- Later feedback may not reopen an approved stage unless it identifies a regression, a clear contradiction with an approved requirement, or an approved scope change.
- Silence after the agreed review window counts as no further feedback for that stage, not as an unbounded pending review.
- Final approval means the prototype satisfies the Prototype PRD acceptance criteria and all Blockers are closed.

## 9. Scope-change rule

To prevent design churn, a new idea is evaluated separately from defects. A scope-change request must state:

- the new or changed requirement;
- why the existing approved scope is insufficient;
- affected screens or flows;
- impact on prototype timeline; and
- whether it replaces an existing requirement or adds new scope.

No scope change enters the active review stage until the decision owner explicitly approves it and the UX PRD baseline is updated.

## 10. Final sign-off checklist

Final sign-off requires confirmation that:

- all four review stages have an approval decision;
- all Blockers are resolved;
- Important items are resolved or explicitly deferred;
- Optional items are logged separately;
- all accepted feedback appears in the change log;
- each changed global component has been compared across all of its relevant rendered uses; and
- every reviewed surface has passed the design-quality gate through visual inspection at its relevant breakpoints.
- the mandatory visual-validation record identifies each changed component and every applicable route, interaction, theme, layout, text-rhythm, and accessibility state checked; and
- the UX PRD acceptance criteria have been reviewed; and
- the final prototype is approved for handoff or implementation planning.
