# Review: BATCH-08 - Responsive and clarity pass

- Reviewed commit: `f826554`
- Baseline: AUI-009 acceptance criteria and validation; UI/UX Prototype PRD 2.1, 7, 8, 9.3; [AUI-007–AUI-010 reference-system analysis](../atlas-ui/AUI-007-010-reference-system-analysis.md)
- Result: `CHANGES_REQUESTED`
- Review round: 2 (remediation review)

## Previous findings

- F-001 (responsive visual-validation record): **Resolved**. `BATCH-08-visual-validation.md` records connected workspace, desktop/tablet/mobile, theme, profile, navigation, focus, dismissal, and clipping checks.
- F-002 (profile/session flow evidence): **Partially resolved**. Desktop anchoring and mobile sheet focus/close/Escape behavior are documented, but the required outside-dismiss behavior is not implemented or evidenced.

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-003 | Important | `apps/atlas/components/Dialog.tsx:17-22`, `apps/atlas/components/ProfileMenu.tsx:26` | AUI-009 acceptance: compact-mobile profile sheet offers explicit close action plus Escape/outside dismissal | Accepted | Make the mobile profile sheet close when the user activates the backdrop/outside area, while preserving the existing close button, Escape handling, focus containment, and trigger-focus restoration. Add the outside-dismiss interaction to the visual-validation record and/or an automated test. The current `Dialog` backdrop has no pointer handler, so clicking outside the panel leaves the sheet open. |

## Decision

The responsive validation record is now present and automated tests/lint pass (`pnpm test` and `pnpm lint`). BATCH-08 remains `CHANGES_REQUESTED` because the required mobile outside-dismiss behavior is not implemented.
