# PERC-RESET batch CK verification — a653008

- **Ticket:** `PERC-RESET-001` — Docker inventory and reset
- **Batch:** `PERC-RESET`
- **Review type:** independent CK review of HMN-003 amendment-v1 qualification
- **HMN authorization:** `HMN-PERC-RESET-001-003`
- **Reviewed target:** tag `PERC-RESET-001-go-qualification-v1` → commit `a6530089ffd6a7a89c4c8452a6cdf755e3145c89`
- **Amended evidence contract:** `PERC-RESET-001-evidence-contract-amendment-v1.md`
- **Qualification closure:** `PERC-RESET-001-go-qualification-closure-v1.md`
- **Result:** `PASS` for the bounded amendment-v1 qualification

## Review scope and authority

HMN-003 authorizes one versioned evidence-contract amendment and read-only current-state qualification for the already completed reset. This review checks the amendment's six current acceptance conditions, the qualification record and its stated historical gaps, and direct regressions in the qualification checkpoint. It does not re-run the Docker reset, reconstruct missing historical evidence, or review successor tickets.

The original CK artifact `PERC-RESET-BATCH-01-807b8e6-review.md` remains unchanged with its original `CHANGES_REQUIRED` result. Its three missing historical observations remain `HMN-ACCEPTED_EVIDENCE_GAP` under the expressly planning-authorized amendment; none is relabeled `PROVEN`. This PASS applies to the amended, bounded qualification only. It does not claim historical image/cache preservation or Docling model readiness.

## Amendment contract review

| Row | Amendment authority | Required proof | CK evidence and result |
|---|---|---|---|
| AM-PERC-RESET-001-01 | Amendment v1, amended acceptance conditions 1–2 | Intended local engine and zero containers/images/volumes/custom networks/Compose projects/build cache | Reviewed the recorded command outcomes and independently repeated the read-only Docker inventory. `desktop-linux`; engine `docker-desktop|29.8.0|Docker Desktop|linux`; zero containers, images, volumes and Compose projects; only built-in networks; build cache `0B`. `PROVEN`. |
| AM-PERC-RESET-001-02 | Amendment v1, amended acceptance condition 3 | Four named PDFs exist with matching retained hashes and `%PDF-` headers | Independently read current file sizes, SHA-256 values and five-byte headers. All four match the GO closure and pre-reset blocker values. `PROVEN`. |
| AM-PERC-RESET-001-03 | Amendment v1, amended acceptance condition 4 | Current branch, HEAD, status and tracked differences compared with available baseline, with unavailable historical detail stated | Qualification closure records the pre-artifact snapshot (`codex/new-atlas-backend`, HEAD `807b8e614ec3876996d636a5fc5959c0a256f5f0`), tracked diff summary, exact `git status --short`, available baseline at `b7bee3d`, and explicitly says it cannot establish exact historical status/origin. Current checkpoint is `a653008`; the target commit adds only the HMN, amendment and qualification documents. `PROVEN` for the amended current-state comparison; exact contemporaneous reset comparison remains an accepted gap. |
| AM-PERC-RESET-001-04 | Amendment v1, amended acceptance condition 5 | This qualification performs no Docker mutation, service operation, build, pull, cleanup or model download | The recorded qualification commands are read-only; the checkpoint diff adds documentation only. CK's repeated Docker checks were also read-only. No reset or service/model operation occurred. `PROVEN`. |
| AM-PERC-RESET-001-05 | Amendment v1, amended acceptance condition 6 and historical-gap disposition | Accepted uncertainty is explicit; historical gaps are not called proven; no readiness claim | Amendment and closure separately list the missing inventory, image IDs, exact historical Git comparison, and uncertain historical model locations as `HMN-ACCEPTED_EVIDENCE_GAP`; the user-accepted risk is recorded; model readiness is deferred to PERC-RESET-004. `PROVEN` as the authorized disposition and record only. |

## Historical CK finding disposition

The following evidence remains absent and is not treated as proven: the full contemporaneous pre-reset inventory/target reconciliation; the complete set of 81 removed image identifiers; and an exact contemporaneous post-reset Git comparison. HMN-003 explicitly accepts these historical evidence limits for this completed reset and the amended contract replaces their recovery as pass conditions with the outcome-based qualification above. The historical CK finding and its frozen oracles are preserved in the original artifact without rewriting or retroactive status changes.

## Direct-regression check

The reviewed target's changes are limited to the HMN-003 artifact, amendment v1 and GO qualification closure. No source or runtime files changed in this checkpoint. The live Docker inventory and PDF observations match the qualification record. No direct regression in the bounded qualification was found.

## Decision

`PASS` under evidence-contract amendment v1. All amended current-state acceptance conditions are supported, the accepted historical gaps remain clearly identified rather than presented as proof, and no direct regression was found. This result does not alter the historical first-review result, authorize PERC-RESET-002, or establish Docling model readiness.
