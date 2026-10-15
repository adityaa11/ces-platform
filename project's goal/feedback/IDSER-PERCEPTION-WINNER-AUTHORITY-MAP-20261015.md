# IDSER perception winner: RUN-003 downstream authority map (2026-10-15)

**Record type:** FROZEN PROSPECTIVE PERCEPTION-PATH AUTHORITY MAP / downstream conflict inventory.
**User authorization:** On 2026-10-15 the user requested checking unfinished IDSER against PERC-RESET and recognizing PERC-RESET as the perception-path winner.
**Branch/snapshot inspected:** `adityaa11/ces-platform`, `codex/new-atlas-backend`, HEAD `b5d200b6990d5924f6b539025dfab831c2398426`.
**Existing binding decision, NOT invented here:** [PERC-RESET implementation context §8A](../Backend_Phase/tickets/Perception_Reset_Phase/00-PERCEPTION-RESET-IMPLEMENTATION-CONTEXT.md), [CANONICAL-PERCEPTION-BASELINE-v1.md](CANONICAL-PERCEPTION-BASELINE-v1.md), and [PERC-RESET-008 independent CK PASS](PERC-RESET-BATCH-08-9f31026-review.md) on reviewed commit `9f31026501032323c7445d72091c6e6bd1f10d7e`.
**Related successor map:** [IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md](IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md).

> This document records precedence already established by PERC-RESET-008 CK PASS. It is NOT a new implementation approval, retroactive ticket rewrite, HMN signature, CK verdict, model/OCR qualification, authorization for another Docker reset, or a blanket permission to amend frozen downstream RCs. The original child files and CK evidence remain unchanged until separately authorized prospective realignment.

## 1. Effective winner and supported scope

**Winner of ordinary/canonical `atlas.document.perceive` for the qualified local digital-PDF workload: PERC-RESET-002..008 and the exact RUN-003 successor baseline.**

```text
Authenticated original digital PDF / Atlas-owned source grant
    -> IDSER-012-01-01 Atlas-owned staged-policy, fair local permit admission
    -> one normal qualified Docling perception route
       route: docling-run-003-capture
       capability: atlas.document.perceive
       option profile: atlas-digital-pdf-run-003-capture-v1
       capability identity: docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1
    -> private local pinned Docling Serve, no OCR
    -> IDSER-012-01-03-01 RUN-003 mapping / verified transient descriptors
    -> IDSER-012-01-03-02 Atlas-owned durable derived visual evidence, authorization,
       exact scoped manifest/hash/integrity, replay and accepted NormalizedDocument V1
    -> durable perceived
    -> STOP: zero unsolicited semantic executions, jobs, provider calls or Master effects
```

The canonical local Compose profile is `atlas-canonical-perception`; actual `docker-compose.yml` enables the exact `docling-run-003-capture` route on Bridge and worker and aligns `DOCLING_OPTION_PROFILE` and `ATLAS_D1_PERCEPTION_CAPABILITY_IDENTITY`. The approved image uses embedded `/opt/app-root/src/.cache/docling/models` artifacts. **Do not resurrect the original cache-volume reattachment prerequisite**: HMN-PERC-RESET-001-003 and PERC-RESET-004's user-authorized image-embedded amendment govern the specific earlier evidence gap. No present downloaded-volume retention is claimed for that empty-cache case.

Perception's scope is bounded digital-PDF text, table structure and **capture** of actual visual evidence. It does not prove scanned-only OCR, diagram/chart understanding, visual business meaning, semantic extraction or release of a second external provider. A valid zero-visual PDF still uses RUN-003 and can have `visualRegions=[]` / `derivedAssets=[]`; an actual captured visual needs exact verified asset coverage.

**Supersession condition already satisfied:** `PERC-RESET-008` independent CK `PASS`. Therefore the baseline's frozen declarations are effective:

```text
SUPERSEDED_PERCEPTION_REGRESSION_BASELINE=atlas-digital-pdf-no-ocr-v1
CURRENT_PERCEPTION_REGRESSION_BASELINE=atlas-digital-pdf-run-003-capture-v1
OLD_PERCEPTION_BACKWARD_COMPATIBILITY_REQUIRED=false
```

Historical `atlas-digital-pdf-no-ocr-v1`/image-disabled route, pre-RUN-003 cache/profile identity, qualification-only activation and Mistral OCR-first IDSER execution expectations have **no authority as an alternative normal perception route**. Preserve archival fixtures and historical PASS records; do not erase them or force old-route parity in successor tests.

## 2. Division of ownership (no replacement of accepted foundations)

| Existing owner | Still-live responsibility | Not its authority |
| --- | --- | --- |
| BSS-009/009-01/02 and Atlas boundaries | Source-document admission and scoped grants, source integrity, worker/Bridge trust separation, authenticated Atlas result acceptance | Select an outdated normal image-disabled route just because a historical test used it |
| IDSER-012-01-01 (approved) | Staged bundles' Atlas-owned bundle-fair local admission, two durable local permits, exactly scoped original documents and transactional executable work | External-provider RPM/TPM/RPD scheduler or silent adoption of legacy bundles |
| IDSER-012-01-02 (approved) | Qualified 2/2/2 local concurrency composition (two Atlas permits/two Bridge perception consumers/two Docling conversions; one Uvicorn process), accepted V1 and `perceived` | Alternative perception engine or premature semantic continuation |
| IDSER-012-01-03-01 / -03-02 (approved) | Exact RUN-003 mapping, source-grounded text/tables/visual descriptors, verified Atlas-owned derived storage/resolver, replay and authorization | A second parser/Docling route, image interpretation, derived asset re-admission |
| PERC-RESET-002..008 (approved, -008 CK PASS) | Sole enabled ordinary RUN-003 profile, zero-visual/exact-asset acceptance, canonical Compose, checked Project A/B corpus, current upstream regression baseline | Rewrite the approved IDSER scheduling/grant/integrity contracts, change semantics, or authorize destructive reset/another live provider |
| SEM-CUTOVER-007A / SEM qualified deferred acceptance | Sole downstream semantic extraction algorithm, REL envelope and qualified evidence/acceptance (separate winner) | Change Docling's already accepted local perception engine |
| BSS-V2-005/006 | External semantic/provider capacity planning and durable admitted transport | Add artificial external quota/transport to private local Docling |

**No competing perception options:** downstream IDSER can use `NormalizedDocument V1` and authorized derived refs produced by the winner, but must not branch to Mistral OCR, old image-disabled Docling, qualification-only RUN-003, or a second local perception pipeline for an otherwise supported input. An out-of-profile scanned PDF requires an explicit future independently qualified capability decision; it is not an implicit fallback.

## 3. IDSER child-by-child conflict classification

The unapproved executable semantic-related IDSER tickets at the snapshot remain: `IDSER-011-01..04` and `IDSER-012-02-01..04`. The four executable `IDSER-012-01` local-perception children are already approved and **are not** future GO/CK supersession targets. The following is a prospective classification only.

| IDSER child | Specific conflicting / ambiguous future clause | Retain, retire or rehome |
| --- | --- | --- |
| **IDSER-011-01** (`planned`), RC-011-01-01..03 | Treats real `MistralProvider` worker/credential, OCR model and Mistral-specific configured limits as prerequisite to future perception processing | **RETIRE** as a global canonical-perception gate. **KEEP** reviewed image/config/provenance, secret redaction, real-provider truthfulness and non-fabricated ZDR claims for separately authorized external-provider qualification. **REHOME** generic live semantic provider validation to the named qualified semantic gate and future official-provider/privacy owner; it cannot requalify or replace RUN-003 |
| **IDSER-011-02** (`planned`), RC-011-02-02 and -04, with -01/-03 supportive | Explicitly requires `MistralProvider.perceive(...)` for D1 and an immediate Mistral extraction/reconciliation chain; future staged work must not use it as a selectable perception alternative | **RETIRE** this mandatory perception dispatch and reconciliation-first sequencing for staged-policy bundles. **KEEP** fresh authenticated project/source identity, exact NormalizedDocument/result/provenance, source grants and scope, no silent fallback, validated Atlas acceptance. **REHOME** perception proof to PERC-RESET-008 + approved IDSER-012-01; semantic proof to SEM-CUTOVER/BSS-006/IDSER-012-02; full reconciliation proof to a separately authorized later owner |
| **IDSER-011-03** (`planned`), RC-011-03-01..04 | D2 must wait for D1 reconciliation and repeat Mistral OCR, extraction and reconciliation on an old sequential route | **RETIRE** Mistral OCR as required canonical perception and D1-before-D2 reconciliation gating for staged bundles. **KEEP** source and scoped prior-context identity, exact accounting, replay/failure and no truth promotion; **REHOME** independent staged multi-document progress to IDSER-012-01/-02, later reconciliation context to separately authorized future scope |
| **IDSER-011-04** (`planned`), RC-011-04-01..04 | Integrates planned `011` Mistral OCR route and N/N reconciliation-ready endpoint as if it were prerequisite of RUN-003 perception + staged semantic work | **RETIRE** as mandatory future PERC-RESET/IDSER-012 upstream gate. **KEEP** exact integrated evidence, redaction, authorized scope, no premature downstream/Master effects; **REHOME** staged perception evidence to PERC-RESET-008 and future semantic/live/complete reconciliation checkpoints according to their explicit scope |
| **IDSER-012-02-01** (`planned`), RC-0120201-01..07 | No explicit competing perception route; old 'single packet' oracle may wrongly demand historical pre-RUN-003 source/parity fixtures | **KEEP** RUN-003 NormalizedDocument V1 and Atlas-approved derived-asset locators, zero-visual/table/visual positive cases, exact source ownership and truthful unexamined visuals. **REHOME** legacy packet parity questions to the SEM-CUTOVER winner map, not a perception rollback |
| **IDSER-012-02-02** (`planned`) | No direct perception conflict; work envelope/route activation may be confused with Docling local capacity | **KEEP** input remains accepted RUN-003 V1; semantic provider is an external BSS-V2-005/006 workload only. No Docling external-quota plan/route |
| **IDSER-012-02-03** (`planned`) | No direct perception conflict; real semantic provider transport must not be substituted for Docling or add a second perception path | **KEEP** source/asset grants, per-batch exact ownership, BSS-V2-006 admission and exclusive SEM-007A extraction; no perception re-conversion/re-admission |
| **IDSER-012-02-04** (`planned`) | No direct perception conflict; potential aggregation/lifecycle consequences are semantic-deferred issues under the separate winner map | **KEEP** final source coverage against RUN-003 V1, scoped/replayed verified derived assets; don't re-open the qualified perception route or declare unexamined visuals understood |

**Approved historical IDSER-001..010:** some approved old paths/test fixtures use BSS-009 Mistral OCR, first-D1 kickoff, sequential extraction/reconciliation or Mistral-specific provider calls. They remain valid historical evidence but are **not** prospective GO authority for restoring an old perception route. This record neither reopens their approvals nor deletes legacy fixtures. Shared security/acceptance regressions remain binding.

## 4. Unapproved non-executable IDSER parents and indexes

| Parent/index | Inspection result | Required prospective index clarification |
| --- | --- | --- |
| `IDSER-011-live-mistral-acceptance-checkpoint.md` (`partitioned-planned`) | Explicitly requires D1/D2 `MistralProvider.perceive()`, two semantic operations and ready state. | Mark the original Scenario I progression historical/superseded **for future canonical staged perception**; preserve live credential/provider assurance obligations with named future owners; do not represent unfinished children as CK PASS |
| `IDSER-012-01-fair-bounded-local-docling-perception.md` (`planned` umbrella) | Describes the correct durable local Docling-to-`perceived` path but names only an earlier planning context; no specific conflicting executable route. | Cite the effective PERC-RESET-008 baseline as sole **current normal route/regression predecessor**; preserve approved IDSER-012-01 children and the 2/2/2/grant/asset gates |
| `IDSER-012-01-03-docling-evidence-preservation-and-semantic-handoff.md` (`planned` umbrella) | Contains pre-implementation diagnostic description (`include_images=false`) and the historical instruction 'retain the previous approved route or fail closed' until -03-02 qualified. Both children now CK PASS and PERC-RESET-008 has activated RUN-003. | Label those statements **historical precondition/diagnostic only**, never a selectable future fallback. Do not rewrite the approved child implementations or old planning evidence |
| `IDSER-012-staged-worker-pipeline-realignment.md` (`planned` umbrella) | Correctly separates staged local perception and later external semantic admission but does not explicitly state PERC-RESET winner and separately has stale semantic dependencies. | Point perceived upstream to PERC-RESET-008 and the approved IDSER-012-01 security/scheduling seams. Delegate semantic-only legacy dependencies to the SEM winner map |
| `IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md` (`planned` umbrella) | Consumes perception V1 with authorized visual refs; no alternate perception route proposed | State exact RUN-003 input baseline and qualified visual integrity; preserve the separate semantic winner and BSS-005/006 integration |
| `Initial_Draft_Phase/README.md` | Its top-level 'perception -> extraction -> reconciliation -> next document' is presented as original phase history; future staged exception is present. IDSER-011 future table entries still describe Mistral OCR as executable prerequisites; no explicit current PERC-RESET winner reference. | Put current RUN-003 + PERC-RESET-008 predecessor at the top of future staged plan and disallow silent historical-route fallback. Update 011 prospective dependency descriptions separately; never rewrite historical CK records |

## 5. PERC-RESET's live guarantees: mandatory future negative tests

1. **Sole route:** `docker-compose.yml`/effective worker config has exactly one enabled normal `atlas.document.perceive`, exact `docling-run-003-capture` identity/profile/qualified reference; no `atlas-digital-pdf-no-ocr-v1`, `qualificationOnly` normal path, Mistral OCR alternative, or image-presence-based downgrade.
2. **Zero visuals:** a valid digital-PDF text/table document with no captured visual regions succeeds under the **same RUN-003** profile, `derivedAssets=[]` and no fabricated visual/asset.
3. **Positive visuals:** every captured visual has one valid bound descriptor/manifest and verified Atlas-owned asset; missing/foreign/colliding page, locator, hash, source, byte length, media, or grant fails closed before accepted `perceived`.
4. **Durable identity and replay:** one NormalizedDocument V1 with exact source/profile/cache identity; duplicate/lost acknowledgement, worker restart and accepted replay must not redo an already durable conversion or mint extra assets/jobs.
5. **Local fair admission:** two Atlas permits/two Bridge conversions/two Docling conversions; independent bundle-fair staging, pg-boss authority, no third concurrently admitted call or illicit legacy permit bypass.
6. **Hard terminal stop:** successful perception ends at `perceived`, with zero unsolicited semantic executions, jobs, provider attempts, reconciliation jobs, or Master effects.
7. **Security:** Atlas-owned source/derived storage and read authorization, secret/source redaction, no Bridge direct trusted-state writes, no derived asset as original-source recursion, private network Docling.
8. **Limits:** no claim that image capture establishes diagram understanding or that digital no-OCR RUN-003 can process scanned-only PDF. Such inputs need an explicit separately accepted capability decision.

## 6. Documentation/evidence caveats and bounded follow-up

- The authoritative `PERC-RESET-BATCH-08-9f31026-review.md` reports independent CK **PASS**, and its decision says the canonical RUN-003 baseline is effective. In contrast, the checked-in baseline header still says `READY_FOR_CK` conditional on PASS and the PERC-RESET README introduction says 008 planned, while its own table says 008 approved. This is **stale documentation**, not evidence that PASS is missing. Correct prospectively if editing index/status summaries; retain source evidence.
- The inspected `Perception_Reset_Phase` ticket directory contains 001..004 plus the context and README; README links for 005..008 do not currently resolve to files in that directory, although the 005..008 GO/CK artifacts exist under `feedback`. Do not invent missing ticket contents or silently claim they were inspected. The 008 review and baseline suffice to confirm the effective successor under the reviewed contract; recover/locate frozen 005..008 ticket sources before reconstructing their fine-grained clauses or changing historical indexes.
- The canonical baseline's original downstream conflict ledger identified `BSS-V2-004-03-08-03-03 RC-03` ('perception remain compatible') as **ambiguous, not automatically waived**; its future gate needs bounded clarification against RUN-003. This is also covered by the October 15 SEM winner's prospective retirement of old legacy extraction baselines. No dual-route compatibility can be inferred from either record.
- PERC-RESET-001 historical model-cache and reset-inventory evidence gaps remain the expressly accepted gaps of its versioned HMN/CK evidence. The current image-embedded model baseline is qualified separately by 004..008. Do not claim historical lost/preserved model weights were proven.
- The checked-in Compose source has been inspected; this document does **not** independently restart the user's local Docker engine, execute live providers or rerun PERC-RESET tests. Its runtime assertion is based on the exact independent CK observations cited above.

## 7. Next planned edits (not done by this map)

1. Realign **IDSER-011-01..04**, its umbrella and the IDSER README against both winner ledgers: keep secret-safe live semantic qualification, but remove mandatory Mistral OCR and legacy progression as *future* canonical perception gates.
2. Add exact effective PERC-RESET-008/RUN-003 precedence to **IDSER-012 / IDSER-012-01 / IDSER-012-01-03 / IDSER-012-02 umbrellas and indexes**. Retain already approved 012-01 child contracts and historical CK evidence unchanged.
3. Realign **IDSER-012-02 planned children** for the SEM-007A semantic winner and BSS-V2-005/006, without adding a second perception route or weakening visual-evidence source integrity.
4. Apply narrow prospective clarification to any remaining legacy 'perception compatible' clause (including the previously identified BSS-V2-004-03-08-03-03 RC-03) only under the appropriate HMN/ticket authority, without claiming that historical CK changed.
5. Independently check the final planned executable dependency graph for old image-disabled Docling, Mistral OCR-as-perception-default, qualification-only or fallback route, and redundant old baseline regression gates. Require a failing negative for any attempted bypass.

**Frozen now:** one effective RUN-003 normal-perception winner, exact retired behaviors and preserved invariants, impacted unapproved IDSER clauses, and remaining documentation/qualification concerns. **Not frozen as completed:** future IDSER ticket amendments, semantic provider qualification, scanned-PDF OCR, image interpretation, or any new production rollout.
