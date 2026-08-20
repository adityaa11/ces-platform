# AUI-003: Account shell and reusable UI primitives

- **State:** planned
- **Review batch:** BATCH-03
- **Depends on:** AUI-001, AUI-002
- **Baseline:** UI/UX Prototype PRD 2.1, 3, 4.1, 7, 9.3

## Outcome

Create the reusable, responsive Atlas shell and account states that make sign-in, profile context, and logout simple and predictable.

## Scope

- Implement fixture-driven sign-up, sign-in, and password-reset states.
- Implement application navigation, profile control, profile menu, and logout state.
- Establish reusable primitives for status badges, avatars, empty states, buttons, dialogs, panels, and responsive drawers.

## Acceptance criteria

- Owner, editor, and viewer states are visibly understandable.
- Avatar, name, email, settings, and Logout are reachable from the shell.
- The shell works on desktop, tablet, and mobile without hidden essential controls.
- Reusable components receive data and events through explicit inputs rather than importing fixtures.

## Validation

- Check keyboard navigation and focus for menus and dialogs.
- Check desktop and mobile shell layouts using the representative fixture sessions.

