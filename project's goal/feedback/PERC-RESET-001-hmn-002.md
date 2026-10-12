# HMN Authorization: PERC-RESET-001 image-retention amendment

- **Ticket:** `PERC-RESET-001`
- **Batch:** `PERC-RESET`
- **HMN authorization ID:** `HMN-PERC-RESET-001-002`
- **Invocation:** explicit user planning instruction on 2026-10-12: the ticket may pass even though the local pinned Docling Serve image was deleted.
- **Current workflow state:** initial GO cleanup complete; prior execution record is blocked only by the former local-image retention condition.
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-001-docker-inventory-and-full-reset.md`
- **Current HEAD:** `cf97048`
- **Relevant GO commit:** `fe37082` (initial blocker); current uncommitted execution evidence is `PERC-RESET-001-go-execution-blocked.md`
- **Relevant CK artifact:** none
- **Relevant CFC commit:** none
- **Prior HMN authorization:** `HMN-PERC-RESET-001-001`

## Diagnosis

The authorized reset left the selected Docker engine empty and preserved all host/Git protections, but it removed the local pinned Docling Serve image. The initial ticket text treated local image retention as a required exception, making the implementation checkpoint non-ready even though the prior cache inspection established that all seven cache volumes were empty and contained no model weights.

## Ticket-authority trace

The user explicitly directs that the ticket be updated so independent CK may pass without the local Serve image. This is a planning amendment to the ticket's image-retention condition only. It does not alter the ticket's container/volume/network/cache cleanup obligations, host/Git/PDF protections, zero-service requirement, or the later PERC-RESET-004 duty to establish actual model readiness.

## Decision

`RETURN_TO_GO` — amend only the stated image-retention condition and complete the existing PERC-RESET-001 execution evidence. No CK finding or CFC cycle exists.

## Authorized scope

- Revise PERC-RESET-001 so the exact local pinned Docling Serve image is an optional reuse optimization, not a retained-resource pass condition.
- Record that it was deleted and that no model cache/model readiness is claimed.
- Convert the existing cleanup evidence into an `awaiting_review` GO closure only if all remaining ticket rows are proven.

## Required validation

Reconfirm `desktop-linux`, zero containers, zero volumes, only Docker built-in networks, zero images, zero build cache, no Compose projects, and unchanged four-PDF SHA-256 values. The GO closure must cite this amendment and preserve both prior records unchanged.

## Forbidden work

Do not pull, build, run, or configure Docling; do not recreate Docker resources; do not alter Git/host/PDF/REL-03 artifacts; do not begin PERC-RESET-002.

## Handoff

Expected next command: resume `GO PERC-RESET-001` under `HMN-PERC-RESET-001-002`, write an `awaiting_review` closure if validation remains clean, then stop for CK. This is not a CK `PASS`.
