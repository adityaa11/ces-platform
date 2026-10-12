# PERC-RESET-001 Evidence Contract Amendment v1

- **Version:** 1
- **Effective date:** 2026-10-12
- **Planning authority:** `HMN-PERC-RESET-001-003` (`project's goal/feedback/PERC-RESET-001-hmn-003.md`)
- **Applies to:** qualification of the already completed PERC-RESET-001 Docker reset only
- **Frozen ticket:** `PERC-RESET-001-docker-inventory-and-full-reset.md`
- **Original CK review:** `project's goal/feedback/PERC-RESET-BATCH-01-807b8e6-review.md`

## Authority and effect

This is a versioned planning amendment to the evidence contract for one completed reset. It supplements the frozen ticket for the bounded purpose stated above. It does not rewrite the frozen ticket or any historical GO, CK, CFC, or HMN artifact. It accepts, for this completed reset only, that preservation of model weights in an unverified historical location cannot be established and that possible loss does not by itself fail this amended qualification. This does not assert that weights existed or survived. It does not authorize another reset, reopen or reclassify an earlier CK finding, or authorize PERC-RESET-002.

For this completed reset, this amendment replaces the requirements to recover a complete contemporaneous pre-reset identifier/label/mount inventory, all 81 removed image IDs, and an exact contemporaneous post-reset Git-state comparison with the outcome-based qualification below. Evidence that is absent from retained records remains absent and must never be represented as historical proof.

## Retained historical evidence

The original records support these limited statements:

- The execution record reports successful removal of 39 containers, 25 volumes, seven custom networks, 81 images, and Docker build cache on `desktop-linux`.
- The execution record identifies container, volume, and network targets and reports successful removal commands. It reports the aggregate image count and identifies the removed pinned Docling image, but does not retain the complete image identifier set.
- The original blocker records seven inspected `/root/.cache` volumes as empty (`files=0`, `4.0K`) and records the pre-reset pinned image identity. The execution record confirms the image was removed. No model-readiness claim is supported.
- The GO closure records the four post-reset source PDF hashes and `%PDF-` headers and asserts host/Git protections were preserved.
- The original CK artifact's evidence-gap descriptions remain as written and are not retroactively changed.

These statements do not prove the missing complete pre-reset inventory, removed-image identifier set, or contemporaneous Git comparison.

## Amended acceptance contract

The new GO qualification must independently verify and record all of the following at the time of qualification:

1. The selected Docker context and engine are the intended local `desktop-linux` Docker Desktop Linux engine.
2. Current Docker state has zero containers, zero images, zero volumes, no custom networks, zero build cache, and zero Compose projects.
3. Each of the four protected Safara PDFs exists at its ticket path, has a `%PDF-` header, and has a SHA-256 matching the retained pre-reset and GO-closure values.
4. Current Git branch, HEAD, worktree status, and tracked differences are recorded and compared with the available pre-reset baseline. The comparison must state exactly which baseline details are available and which are missing; it must not imply an exact historical comparison where the records do not permit one.
5. The qualification itself performs no Docker service creation/start/restart, build, pull, cleanup, or model download.
6. The closure acknowledges the accepted uncertainty about any model weights in an unverified historical location. It makes no claim that such weights were preserved and no claim of Docling model readiness. PERC-RESET-004 remains responsible for model-readiness qualification.

## Historical evidence gaps and accepted risk

The following are classified `HMN-ACCEPTED_EVIDENCE_GAP`; none may be labeled `PROVEN`:

- The complete contemporaneous pre-reset engine/resource inventory and exact target reconciliation, including all required labels and mounts, are not available in retained checkpoint records.
- All 81 removed image identifiers are not available in retained checkpoint records.
- An exact contemporaneous post-reset branch/HEAD/dirty-state comparison is not available in retained checkpoint records.
- Model weights in any historical location not directly verified by the retained empty-volume inspections cannot now be proven preserved.

The human planning authority accepts these limits and the risk that unverified historical model weights may have been removed with Docker resources. The retained records do not establish that such weights existed or were lost. This acceptance resolves the evidence-contract question for this completed reset only; it does not convert any missing observation into proof or alter CK's original record.

## Closure and review

The new GO qualification closure must map each amended acceptance condition to its current evidence, exact command and outcome, and separately list each `HMN-ACCEPTED_EVIDENCE_GAP`. Internal readiness may be `READY_FOR_CK` only when every current-state acceptance condition above is supported and every historical gap and accepted risk is explicit. This readiness is not a CK PASS. Independent CK evaluates this amendment and its qualification evidence and may return `CHANGES_REQUIRED`.
