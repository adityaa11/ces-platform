# AUI-009: Responsive and clarity pass

- **State:** in_progress
- **Review batch:** BATCH-08
- **Depends on:** AUI-004, AUI-005, AUI-006, AUI-007, AUI-008
- **Baseline:** UI/UX Prototype PRD 2.1, 7, 8, 9.3; [AUI-007–AUI-010 reference-system analysis](AUI-007-010-reference-system-analysis.md)

## Outcome

Ensure the complete Atlas prototype is intentionally responsive, accessible, and simple to use without concealing the provenance or approval context that makes Atlas valuable.

## Scope

- Refine desktop, tablet, and mobile layouts for all completed surfaces.
- Ensure navigation, PRD lens, evidence, sharing, profile, processing, and approval controls remain accessible on smaller screens.
- Keep the signed-in profile/session control anchored at the bottom of the desktop workspace sidebar while the workspace content scrolls.
- Use a modal bottom sheet for the profile-action overlay at compact mobile widths; retain the anchored profile popover on wider layouts.
- Apply plain-language, visible-label, progressive-disclosure, status-feedback, touch-target, and confirmation requirements.
- Verify CSP-compatible component and asset patterns.
- Validate shared lens and source-accounting states across all workspace destinations rather than treating each screen as isolated.

## Acceptance criteria

- Each core flow remains complete at desktop, tablet, and mobile widths.
- Essential information may stack or move into focused drawers but is not removed.
- Users can identify the next action, status, and way back without specialist knowledge.
- Interactive controls remain keyboard-accessible with visible focus.
- The signed-in profile/session control remains visible at the bottom of the desktop workspace sidebar throughout navigation and page scroll.
- The mobile profile sheet dims and blocks the underlying surface, offers an explicit close action plus Escape/outside dismissal, contains focus while open, and restores focus to its trigger when closed.
- Expanded fact groups, change timelines, CES cards, source-accounting modal, and cross-destination returns preserve context at each target width.

## Validation

- Perform visual and interaction checks at representative desktop, tablet, and mobile sizes.
- Verify the desktop profile popover and compact-mobile profile bottom sheet separately, including open/closed, light/dark, focus, dismissal, and clipping states.
- Run accessibility checks appropriate to the chosen UI stack.
