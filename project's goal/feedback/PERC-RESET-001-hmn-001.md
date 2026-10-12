# HMN Authorization: PERC-RESET-001

- **Ticket:** `PERC-RESET-001` — Docker inventory and reset (preserve downloaded Docling models)
- **Batch:** `PERC-RESET`
- **HMN authorization ID:** `HMN-PERC-RESET-001-001`
- **Invocation:** explicit user `HMN-001` delegation on 2026-10-12
- **Current workflow state:** initial GO stopped `BLOCKED`; no CK finding or CFC cycle exists.
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-001-docker-inventory-and-full-reset.md`
- **Current HEAD:** `fe37082` (`docs(go): record PERC reset blocker`)
- **Relevant GO commit:** `fe37082`
- **Relevant CK artifact:** none
- **Relevant CFC commit:** none
- **Prior HMN authorization:** none
- **Worktree state:** pre-existing unrelated REL-03/source/planning edits and untracked artifacts remain outside this authorization and must be preserved.

## Diagnosis

The initial GO checkpoint, `project's goal/feedback/PERC-RESET-001-go-blocked.md`, identified two ticket-bound environmental blockers: a running disposable REL-03 PostgreSQL qualification workload and inability to prove model weights in any of seven actual empty `docling-models` cache volumes. No deletion was performed.

The user has now explicitly resolved both conditions within the frozen ticket's Docker-only reset scope: all existing Atlas/REL-03 Docker runtime resources are disposable, all seven empty Docling cache volumes may be deleted, and only the already-local pinned Docling Serve image may remain. This does not alter the ticket's host/Git/PDF protections or authorize subsequent tickets, runtime reconstruction, or model download.

## Ticket-authority trace

The frozen ticket authorizes removal of obsolete Docker containers, images, volumes, custom networks, and build cache after safe identification. Its original cache exception required `BLOCKED` if safe preservation could not be established. The explicit user decision supplies the bounded environmental authority to classify the seven inspected empty volumes as non-model data and to delete the identified REL-03 workload, while preserving the exact local Serve image. No product, architecture, provider, deployment, or acceptance requirement has changed.

## Decision

`RETURN_TO_GO` — the initial implementation has no committed `awaiting_review` checkpoint and no CK/CFC finding. GO may resume only the remaining frozen PERC-RESET-001 Docker cleanup under this authorization.

## Authorized scope

- Use only the already verified `desktop-linux` engine.
- Stop and remove existing Atlas and REL-03 containers, including `atlas-rel03-qualified-postgres-1` and its Docker-only `atlas-rel03-qualified_postgres-data` volume.
- Delete all existing Atlas/REL-03 Docker volumes, including the seven inspected empty Docling cache volumes.
- Delete obsolete images, custom networks, and build cache, retaining only `quay.io/docling-project/docling-serve-cpu@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7` when locally present.
- Preserve an actually discovered unrelated irreplaceable non-Atlas workload and record its precise identity.

## Required validation

GO must record explicit command/exit-code and removed/protected-identifier evidence; verify the active context, absence of legacy Atlas/REL-03 containers, volumes, custom networks and active processes; verify the preserved pinned image only; and re-hash all four protected Safara PDFs. It must append a separate execution/closure record and leave the prior blocker record unchanged.

## Forbidden work

Do not alter Git branches, working-tree changes, REL-03 candidate/source/evidence, `.env`, host bind targets, repository configuration, or protected PDFs. Do not switch engines, start/rebuild Compose, download or run Docling, run semantic work, recreate a qualification environment, or begin PERC-RESET-002.

## Handoff

Expected next command: `GO PERC-RESET-001` under `HMN-PERC-RESET-001-001`. A successful completion must record this authorization ID and then stop `READY_FOR_CK`; this authorization is not a CK `PASS`.
