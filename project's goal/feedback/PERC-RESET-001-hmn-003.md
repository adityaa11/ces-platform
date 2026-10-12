# HMN Authorization: PERC-RESET-001 post-reset evidence-gap disposition

- **Ticket:** `PERC-RESET-001`
- **Batch:** `PERC-RESET`
- **HMN authorization ID:** `HMN-PERC-RESET-001-003`
- **Invocation:** Explicit user planning-authority disposition supplied on 2026-10-12
- **Current workflow state:** Initial CK returned `CHANGES_REQUIRED`; CFC progress is `CFC_NOT_READY_FOR_CK` because historical observations are absent from retained records.
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-001-docker-inventory-and-full-reset.md`
- **Current HEAD before qualification:** `807b8e614ec3876996d636a5fc5959c0a256f5f0`
- **Relevant GO records:** `project's goal/feedback/PERC-RESET-001-go-execution-blocked.md`; `project's goal/feedback/PERC-RESET-001-go-closure.md`
- **Relevant CK artifact:** `project's goal/feedback/PERC-RESET-BATCH-01-807b8e6-review.md`
- **Relevant CFC artifact:** `project's goal/feedback/PERC-RESET-001-cfc-progress.md`
- **Prior HMN authorizations:** `HMN-PERC-RESET-001-001`; `HMN-PERC-RESET-001-002`
- **Worktree state:** Existing unrelated modified source files and untracked user work are present; preserve them.

## Diagnosis

The completed destructive reset is documented, but retained checkpoint records do not contain a complete contemporaneous pre-reset inventory, all 81 removed image identifiers, or an exact contemporaneous post-reset Git comparison. Those observations cannot be reconstructed without fabrication. The user confirms deletion of all Docker resources, including Docling Serve, was intentional and acceptable, and explicitly accepts the bounded evidence risk.

## Ticket-authority trace

The user, as planning authority, explicitly authorizes a versioned amendment limited to qualification of the already completed PERC-RESET-001 reset. The original GO, CK, CFC, and HMN artifacts remain unchanged. The amendment replaces only the historical identifier-level and contemporaneous-comparison evidence conditions for this completed reset with an outcome-based qualification and records missing historical proof as `HMN-ACCEPTED_EVIDENCE_GAP`. It does not alter later ticket scope or claim model readiness.

## Decision

`RETURN_TO_GO` for one bounded evidence-contract amendment and current-state qualification. The original CK result and its frozen findings remain unchanged for independent CK to evaluate against the new planning amendment; no prior finding is retroactively marked proven or reclassified.

## Authorized scope

- Record this user disposition as HMN-003.
- Create a versioned PERC-RESET-001 evidence-contract amendment limited to the completed reset.
- Perform only read-only current-state Docker, PDF, and Git observations required by that amendment.
- Create one new GO qualification closure mapped to the amendment. Mark it ready for independent CK only if each amendment condition is supported and every unavailable historical observation is explicitly recorded as `HMN-ACCEPTED_EVIDENCE_GAP`.

## Required validation

Use the read-only checks and exact outcomes recorded in the new GO qualification closure: Docker context/engine and resource inventory; four source PDF hashes; current branch, HEAD, worktree status, and comparison with available pre-reset evidence; and confirmation that this qualification did not create a Docker service or download a model.

## Forbidden work

Do not recreate deleted Docker resources or run another reset. Do not rebuild, restart, pull, or clean Docker resources; download models; change source code or unrelated worktree content; modify historical artifacts; treat missing historical evidence as `PROVEN`; change PERC-RESET-002 state; or claim Docling model readiness. PERC-RESET-004 owns model-readiness qualification.

## Handoff

Expected next command: independent `CK` review of the versioned amendment and new GO qualification closure. CK may return `CHANGES_REQUIRED`; HMN-003 is not a PASS and does not authorize a further remediation cycle.
