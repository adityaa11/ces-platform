# PERC-RESET-001 GO qualification closure — evidence amendment v1

- **Ticket:** `PERC-RESET-001` — Docker inventory and reset
- **Batch:** `PERC-RESET`
- **State:** `awaiting_review`
- **Planning authority consumed:** `HMN-PERC-RESET-001-003` (`project's goal/feedback/PERC-RESET-001-hmn-003.md`)
- **Acceptance amendment:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-001-evidence-contract-amendment-v1.md`
- **Original CK result:** `CHANGES_REQUIRED`, preserved unchanged in `PERC-RESET-BATCH-01-807b8e6-review.md`
- **Original CFC progress:** `CFC_NOT_READY_FOR_CK`, preserved unchanged in `PERC-RESET-001-cfc-progress.md`
- **Qualification snapshot:** current read-only observations taken on 2026-10-12 before adding this HMN/amendment/closure checkpoint
- **Review target:** tag `PERC-RESET-001-go-qualification-v1` points to the bounded checkpoint commit containing this closure and amendment.

## Scope and outcome

The already completed Docker reset was qualified under the versioned, planning-authorized evidence contract. No Docker resource was created, started, restarted, rebuilt, pulled, or cleaned during qualification. No model was downloaded, no source code or unrelated worktree content was changed, and PERC-RESET-002 was not started.

Current-state requirements in amendment v1 are supported by the observations below. Historical observations absent from retained records remain `HMN-ACCEPTED_EVIDENCE_GAP`; none is labeled `PROVEN`. The human authority explicitly accepts the evidence limits and risk recorded in HMN-003 and amendment v1. No model-readiness claim is made; that belongs to PERC-RESET-004.

## Current Docker observations

All commands below exited `0` and were read-only:

| Required observation | Command | Result |
|---|---|---|
| Correct selected context | `docker context show` | `desktop-linux` |
| Local engine identity | `docker info --format '{{.Name}}|{{.ServerVersion}}|{{.OperatingSystem}}|{{.OSType}}'` | `docker-desktop|29.8.0|Docker Desktop|linux` |
| No containers | `docker ps -a --no-trunc` | Header only; zero containers |
| No images | `docker image ls -a --digests --no-trunc` | Header only; zero images |
| No volumes | `docker volume ls` | Header only; zero volumes |
| No custom networks | `docker network ls --no-trunc` | Only built-ins `bridge`, `host`, and `none` |
| No Compose projects | `docker compose ls -a` | Header only; zero projects |
| No image/container/volume usage; no build cache | `docker system df -v` | No image/container/volume entries; `Build cache usage: 0B` |

Qualification performed only the read-only Docker commands listed above. This supports the bounded assertion that this qualification did not create or start a service, rebuild or pull an image, clean Docker resources, or download a model. The current empty inventory is a current snapshot, not a claim about unrecorded historical state.

## Protected PDF observations

PowerShell enumerated the four ticket-named files in `docs\example`, calculated `Get-FileHash -Algorithm SHA256` for each, and read the first five bytes. The command exited `0`. Current byte sizes, SHA-256 values, and headers match the retained pre-reset blocker and GO closure:

The executed PowerShell command was:

```powershell
Get-ChildItem -LiteralPath 'docs\example' -File | Where-Object { $_.Name -in @('Safara_Buyer_Business_PRD_Professional.pdf','Safara_PRD_01_Foundation.pdf','Safara_PRD_02_Finance_Documents.pdf','Safara_PRD_03_Readiness_Manifest_Reporting.pdf') } | ForEach-Object { $h = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256; $stream = [System.IO.File]::OpenRead($_.FullName); try { $b = New-Object byte[] 5; [void]$stream.Read($b,0,5); $header = [System.Text.Encoding]::ASCII.GetString($b) } finally { $stream.Dispose() }; [PSCustomObject]@{Path=$_.FullName;Bytes=$_.Length;SHA256=$h.Hash;Header=$header} } | Format-List
```

| File | Bytes | SHA-256 | Header | Result |
|---|---:|---|---|---|
| `Safara_Buyer_Business_PRD_Professional.pdf` | 314167 | `2F537E8BB7EA4F69FB906AF03D0265E2A986A0F15C2DBEDBBACE5328CD40E7DF` | `%PDF-` | Match |
| `Safara_PRD_01_Foundation.pdf` | 114181 | `4A7AA8C90DD2F045ED1D37F73D69C5372FBDBEEDC76EDFA151CBD1AE88D370CC` | `%PDF-` | Match |
| `Safara_PRD_02_Finance_Documents.pdf` | 112316 | `527BCF9926FDB760E706B2505812531AACD6520B8D7F647A70B230983F48188C` | `%PDF-` | Match |
| `Safara_PRD_03_Readiness_Manifest_Reporting.pdf` | 115773 | `0B4944C0A1171223020A7E0C76E73CF4FF02E5513AE62FCEB9E43D5FD8CB720F` | `%PDF-` | Match |

## Current Git state and comparison to available baseline

The following read-only commands exited `0` before this qualification added its three authorized artifacts:

````text
git branch --show-current
# codex/new-atlas-backend

git rev-parse HEAD
# 807b8e614ec3876996d636a5fc5959c0a256f5f0

git diff --stat b7bee3d5341350eae39264a21fd1df315528f052..HEAD
# 8 files changed, 644 insertions(+)
# Added reset context, PERC-RESET ticket and README, prior GO records, and HMN-001/HMN-002 records.

git diff --stat
# 3 tracked files changed, 66 insertions(+), 6 deletions(-)

git diff --cached --stat
# no staged changes
````

Exact `git status --short` at that snapshot:

````text
 M apps/agents-bridge/src/semantic-extraction-finalizer.ts
 M apps/agents-bridge/src/semantic-worker.ts
 M apps/agents-bridge/tests/semantic-worker.test.ts
 M packages/atlas-fixtures/generated/safara-golden-bundle.json
 M packages/atlas-fixtures/generated/safara-reconciliation.md
?? apps/agents-bridge/src/semantic-relationship-sidecar.ts
?? apps/agents-bridge/tests/semantic-relationship-finalizer.test.ts
?? project's goal/Backend_Phase/BSS-V2-004-03-08-v0.3.1-sized-ticket-bundle/tickets/
?? project's goal/Backend_Phase/relationship-lifecycle-successor-plan/BSS-V2-004-03-05-REL-03-deterministic-finalizer-scope-closure.md
?? project's goal/Backend_Phase/relationship-lifecycle-successor-plan/BSS-V2-004-03-05-REL-04-offline-relationship-qualification.md
?? project's goal/Backend_Phase/relationship-lifecycle-successor-plan/README.md
?? project's goal/Backend_Phase/relationship-lifecycle-successor-plan/change-impact-and-successor-closure-matrix.md
?? project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-002-normal-run003-route-activation.md
?? project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-003-zero-visual-and-verified-asset-accounting.md
?? project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-004-clean-canonical-compose-boot.md
?? project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-005-professional-project-creation-master-initial-draft.md
?? project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-006-professional-multimodal-perception-e2e.md
?? project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-007-three-pdf-run003-admission-and-perception.md
?? project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-008-restart-manual-baseline-and-legacy-retirement.md
?? project's goal/Clean up/
?? project's goal/feedback/ATLAS-PERCEPTION-LAB-RUN-004-hmn-001.md
?? project's goal/feedback/ATLAS-PERCEPTION-LAB-RUN-004-hmn-002.md
?? project's goal/feedback/BSS-V2-004-03-05-REL-03-hmn-006.md
?? project's goal/feedback/BSS-V2-004-03-05-hmn-001.md
?? project's goal/feedback/BSS-V2-004-03-05-hmn-002.md
?? project's goal/feedback/BSS-V2-004-03-05-hmn-003.md
?? project's goal/feedback/BSS-V2-004-03-05-hmn-004.md
?? project's goal/feedback/BSS-V2-004-03-05-rel-hmn-005.md
?? project's goal/feedback/BSS-V2-004-03-08-01-02-hmn-001.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-01-2e5dd35-review.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-01-472fd2c-supplemental-verification.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-01-ac9af0f-verification.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-02-18bd83e-verification.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-02-d78e05a-review.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-02-f23b5ea-verification.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-03-4d5fd89-review.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-03-66a9c0f-verification.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-08.01-04-bce0856-review.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-08.02-01-640b99b-review.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-08.02-01-7ab1953-verification.md
?? project's goal/feedback/BSS-V2-BATCH-04.03-08.02-04-0cb2601-review.md
?? project's goal/feedback/IDSER-012-01-01-hmn-005.md
?? project's goal/feedback/IDSER-012-01-03-02-hmn-001.md
?? project's goal/feedback/IDSER-BATCH-12-01-01-2fbb213-verification.md
?? project's goal/feedback/IDSER-BATCH-12-01-01-a9dc0c3-verification.md
?? project's goal/feedback/IDSER-BATCH-12-01-03-01-4c5db72-verification.md
?? project's goal/feedback/IDSER-BATCH-12-01-03-01-9a02d4a-review.md
?? project's goal/feedback/IDSER-BATCH-12-01-03-02-7d842ad-verification.md
?? project's goal/feedback/IDSER-BATCH-12-01-03-02-f6ec9cd-verification.md
?? project's goal/feedback/PERC-RESET-001-cfc-progress.md
?? project's goal/feedback/PERC-RESET-BATCH-01-807b8e6-review.md
?? project's goal/feedback/SEMCTX-SPIKE-001-hmn-001.md
?? project's goal/feedback/SEMCTX-SPIKE-001-hmn-005.md
?? scripts/perception-lab/
?? scripts/semctx-spike-001-v0.3-oracle-r1/
?? scripts/semctx-spike-001/
````

Available pre-reset evidence in `PERC-RESET-001-go-blocked.md` states branch `codex/new-atlas-backend`, baseline HEAD `b7bee3d5341350eae39264a21fd1df315528f052`, and pre-existing unrelated dirty/untracked REL-03 and planning paths. It does not contain a complete path-by-path status snapshot. The retained GO closure says the reset preserved Git/host content, but does not contain a contemporaneous comparison. The commit-range comparison above shows eight reset ticket/evidence files added after that baseline; the worktree comparison shows the current unrelated changes and additions. Their exact pre-reset presence or later origin cannot be established from the available baseline record, so no causal attribution is made. This is a current-state capture and comparison against available evidence, not a reconstructed historical Git comparison.

## Historical evidence gaps and risk disposition

The following remain `HMN-ACCEPTED_EVIDENCE_GAP`, not `PROVEN`:

1. Complete contemporaneous pre-reset engine/resource output, including full label/mount inventory and authorized-target reconciliation, is absent from retained records.
2. The exact identifiers for all 81 removed images are absent; only the aggregate count and the removed pinned image identity are recorded.
3. Exact contemporaneous post-reset branch/HEAD/dirty-state comparison is absent. Current Git status and available-baseline comparison are recorded above, but cannot recreate it.
4. Historical locations outside the seven inspected empty cache volumes are not fully evidenced for model contents. Whether any model weights existed in another unverified location or were removed cannot now be proven.

The user explicitly accepts the risk that model weights in an unverified historical location may have been removed. The retained evidence does not establish that such weights existed or were lost. The pinned Docling image removal was intentional and is permitted by HMN-002 and the ticket amendment. No Docling model readiness is asserted; PERC-RESET-004 must qualify it.

## Review Contract Closure — amendment v1

| Row | Amendment authority | Required proof | Evidence / exact command outcome | Status |
|---|---|---|---|---|
| AM-PERC-RESET-001-01 | Amendment v1 § Amended acceptance contract 1–2 | Intended local engine and clean current Docker inventory | `docker context show`, `docker info --format ...`, `docker ps -a --no-trunc`, `docker image ls -a --digests --no-trunc`, `docker volume ls`, `docker network ls --no-trunc`, `docker compose ls -a`, and `docker system df -v`; all exited 0 and results are recorded above | `PROVEN` |
| AM-PERC-RESET-001-02 | Amendment v1 § Amended acceptance contract 3 | Four PDFs unchanged against retained hashes | Enumerated the four named files; `Get-FileHash -Algorithm SHA256` and five-byte header reads exited 0; all hashes, sizes, and `%PDF-` headers match the retained blocker/closure values above | `PROVEN` |
| AM-PERC-RESET-001-03 | Amendment v1 § Amended acceptance contract 4 | Current branch, HEAD, worktree status, and tracked differences compared with available pre-reset baseline, with limits stated | `git branch --show-current`, `git rev-parse HEAD`, `git status --short`, `git diff --stat`, `git diff --cached --stat`, and `git diff --stat b7bee3d..HEAD` exited 0; exact outputs and the incomplete baseline limitation are recorded above | `PROVEN` for the amended current-state comparison only; historical exact comparison remains `HMN-ACCEPTED_EVIDENCE_GAP` |
| AM-PERC-RESET-001-04 | Amendment v1 § Amended acceptance contract 5 | Qualification performs no Docker mutation or model download | Only the read-only commands listed above were issued in this qualification; zero current Docker resources observed. No service/build/restart/pull/cleanup/download command was issued | `PROVEN` for this bounded qualification |
| AM-PERC-RESET-001-05 | Amendment v1 § Historical evidence gaps and accepted risk | Missing historical evidence and model uncertainty explicitly separated from proof; risk accepted by human authority; no readiness claim | HMN-003 and this closure enumerate each missing observation as `HMN-ACCEPTED_EVIDENCE_GAP`, record accepted risk, and defer model readiness to PERC-RESET-004 | `PROVEN` as a disposition and record; the historical facts themselves remain gaps |

The original CK clauses and their results are unchanged. This closure does not mark any missing historical observation `PROVEN`, does not issue a CK `PASS`, and does not change the original CK result. No source code changed; no implementation regression suite applies to this documentation-and-observation qualification.

Internal readiness: `READY_FOR_CK`. The amended current-state requirements are supported, and the explicitly accepted historical gaps are not treated as proven. This is a new bounded GO qualification checkpoint for independent CK review only.
