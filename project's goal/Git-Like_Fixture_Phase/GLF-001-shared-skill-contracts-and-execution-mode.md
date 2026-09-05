# GLF-001: Repository skill-mode configuration

- **State:** approved
- **Review batch:** BATCH-17
- **Depends on:** None
- **Baseline:** Architecture Checkpoint sections 1, 9, 21–24; UI/UX Prototype PRD 9.1, 9.3–9.4

## Outcome

Establish repository-local `SKILLS_MODE` configuration with `codex` as the
default fixture-authoring mode and a safe future `agents_bridge` option.

## Scope

- Define `SKILLS_MODE` as `codex | agents_bridge` in repository-local example
  configuration, defaulting to `codex`.
- Define invalid/missing values and explicit no-fallback behavior.
- Keep mode selection separate from validation, approval, and commit authority.
- Document that actual per-branch execution provenance is fixture/revision data
  defined by GLF-002 and GLF-003, not a mutable process environment value.

## Acceptance criteria

- `codex` is the documented default; no live bridge or provider is required.
- The execution-mode setting cannot alter validation, approval, or commit
  authority.
- Selecting `agents_bridge` without a configured bridge fails explicitly.

## Validation

- Verify the default execution-mode resolution without any environment setting.
- Verify invalid mode values and missing-bridge behavior.
