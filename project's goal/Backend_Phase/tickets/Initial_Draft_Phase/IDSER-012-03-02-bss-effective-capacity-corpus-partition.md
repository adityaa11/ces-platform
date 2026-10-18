# IDSER-012-03-02 — BSS-effective-capacity semantic corpus partition — split map

> **Current GO dependency:** the approved interactive resolver `-03-01-02` is preserved; both `-03-02-01` and `-03-02-02` now require successor `IDSER-012-03-01-03` CK PASS, which binds reusable `BSS-V2-007` receiving authorization to the same Atlas document resolver. No browser-session assumption in background planning; future GHR route remains inactive.

- **State:** `planned`; non-executable family/traceability map. GO is not authorized.
- **Batch:** `IDSER-BATCH-12-03-02`.
- **Parent:** [IDSER-012-03](IDSER-012-03-semantic-batch-planner-ghr-contract-hard-stop.md).
- **Outcome:** preserved family outcome: deterministic BSS-capacity-qualified **plan proposal**, per-batch owner/context/REL/media partition and resource envelopes; **STOP before durable publication**.

## Split decision and executable children

This leaf combines an external BSS authenticated-read integration, a semantic source/estimator algorithm, and a policy-qualified partition/replan algorithm. Their owners, evidence and likely CFC findings are independent. It is too large for one GO → CK → CFC → HMN cycle.

| Order | Executable child | Sole implementation/proof seam | Frozen rows discharged |
| --- | --- | --- | --- |
| 1 | [IDSER-012-03-02-01](IDSER-012-03-02-01-authorized-bss-prospective-snapshot-reader.md) | Actual authenticated BSS prospective snapshot consumer boundary and exact inactive-status acceptance | BSS-read portion of RC-0120302-01 |
| 2 | [IDSER-012-03-02-02](IDSER-012-03-02-02-conservative-corpus-demand-estimator.md) | Pure canonical source-unit/locator handling and conservative request-demand estimator | RC-0120302-03 source fidelity, RC-0120302-04 estimator/envelope portions |
| 3 | [IDSER-012-03-02-03](IDSER-012-03-02-03-structural-fit-corpus-partition-proposal.md) | Deterministic structural-fit partition/replan proposal composed only from the two approved surfaces | Remaining RC-0120302-01 through RC-0120302-06 |

`-02-01` and `-02-02` each require **`-03-01-03` CK PASS**, in addition to approved `-03-01-01/02`, and may run independently. `-02-03` requires both to pass and is the only family closure. It reuses, never reimplements, the reader and estimator. CFC returns a read or estimator defect to its owning child; HMN may resolve only a named BSS/Atlas authority gap.

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** BSS owns capacity policy and prospective structural fit; Atlas owns accepted source and no BSS runtime admission is in scope.
- **Trust boundaries:** `SR-0120302-T1` authenticated BSS principal → inactive planning snapshot; `SR-0120302-T2` resolved accepted source/grants → pure bounded demand; `SR-0120302-T3` pinned policy + demand → unpublished proposal.
- **Prohibited couplings:** `SR-0120302-C1` prohibits direct BSS SQL, IDSER capacity-policy publication, runtime-quota read/reservation, synthetic limits, prompt/provider transport, and semantic truth writes.
- **Review bindings:** `SR-0120302-R1` demonstrates callable authoritative read; `SR-0120302-R2` proves measured conservative bounds and locator fidelity; `SR-0120302-R3` proves stale/foreign/unknown failure and zero durable/execution effects.

## Preserved family contract

All sections below remain binding family authority. They allocate no GO to this map and are not weakened, reinterpreted, or replaced by its children.

Consume the authorized resolved accepted NormalizedDocument from -03-01. Consume a real authenticated BSS-005 `CapacityPlanningSnapshot/v1` with server-owned prospective inactive semantic workload/process/route/quota identity, immutable provider source, effective enforcement selection and exact policy/profile/version, qualified structural maximum/estimator/output/media overhead, safety/headroom, background fair/protected interactive policy. There is **no BSS-006 `RuntimeCapacityConstraint/v1` runtime read in this scope**; the later admitted worker alone checks current window pressure. A caller cannot obtain a BSS send permit or shrink a stable batch merely because a current quota window is depleted.

RPD `unknown` remains unknown; an explicitly approved exact BSS `not_enforced` RPD may be omitted from enforcement calculations, but cannot be converted to `0`, infinity or a fabricated RPD ceiling/reset. Preserve independent RPM, TPM, concurrency and all actual enforced dimensions. Old four-known RPD must still enforce day window; foreign/stale/missing/revoked approval, unsupported required dimension, unknown mandatory/known zero limit or unavailable structural estimate **block**, rather than invent numeric capacity. BSS owns capacity and fair admission; IDSER only chooses semantic corpus within structural request bounds.

Plan from real per-request prompt/schema/REL/visual/context/input/output reservation estimators, not pages or transient available TPM. Source coverage exactly once across owned slots, context-only slots may repeat without output ownership, bounded essential dependencies and deferred records; preserve original language, temporal modality, legend/scope, independent/dependent REL direction and honest visual unexamined state. Persist nothing yet, but return immutable deterministic ordered batch/plan proposal with complete identity hashes, BSS effective policy and estimator revisions, exact resource-envelope demand and explicit replan predecessor. Temporary 429/depleted window retains original partition; trusted enduring *structural* reduction triggers separately versioned replan/BLOCKED indivisible unit.

## Final review clarifications — actual snapshot, estimator and locator behavior

**Prospective snapshot acceptance oracle:** Current `createCapacityPlanningSnapshotReader` queries `bridge.read_capacity_planning_snapshot`. In SQL migration 0082, an authorized prospective request returns `apiVersion='CapacityPlanningSnapshot/v1'`, `status='inactive'`, `reason='prospective_planning_only'`, `view='prospective-planning-only'`, `readIsNotAdmissionPermit=true`, `plan=null`, and scoped `source`, `enforcement`, `process`, `workload`. **Only this exact authenticated `inactive` case is eligible for sizing;** it is not an activation failure and not a positive send eligibility result. Reject other `inactive` reasons, `unknown`, `stale`, `unfit`, foreign scope, missing authorized enforcement/estimator, and missing field versions. Read `requestBytes` / `inputTokens` fit using the same versioned bounds as the returned `workload.structuralBound`. Confirm the real reader and server-approved principal are composed and callable by the intended consumer. Do not create an Atlas-owned BSS SQL shortcut or an IDSER-specific BSS planner.

**Exact demand shape:** Consume existing `apps/agents-bridge/src/process-workload-catalogue.ts` `RequestResourceEnvelope` demand `{requestUnits,tokenUnits,dayUnits,concurrencyUnits}`, all finite nonnegative bounded integers and positively supported for the chosen request. `dayUnits` is a request/day accounting **demand**, not a numerical **provider daily capacity**; preserve it when RPD provider capacity is unknown-but-authorized-not-enforced. Record `eligibleDimensions` and exact BSS enforcement policy separately. Do not delete `dayUnits`, give it an infinity/placeholder limit, or create a second envelope schema. The future BSS `ProviderWorkAdmission/v1` `{rpm,tpm,rpd,concurrency}` per-attempt conversion is *outside this scope*.

**Source locators and dependencies:** `NormalizedDocument v1` has page numbers, text-block IDs, table IDs and visual-region IDs, but not an approved relationship graph. Canonical source locator combines document identity, page, kind and local ID, with uniqueness checks; duplicate/conflicting locator identity, missing media, foreign page or incomplete source attribution must fail or preserve explicit unexamined/deferred units. Only separately qualified authorized pre-existing REL context can populate REL revision/direction/necessity. When essential contextual fidelity cannot be preserved in a split, keep source/context together or BLOCK/defer; never infer REL or convert unexamined visuals to nonfacts.

**Structural-estimator gate and owner:** BSS snapshot `workload.estimator` contains version/identity but does not itself perform actual token/media accounting or build a SEM packet. **This leaf may implement and CK-qualify its own narrow pure deterministic conservative semantic corpus/request-demand estimator** for text, tables, bounded context/REL placeholders, reserved output, schema/system-prompt allowance and granted media, or reuse an already qualified estimator. Freeze measurable upper-bound fixtures, model/route assumptions, estimator identity/version, exact request-resource envelope projection and failure margins; the identity must agree with the BSS-owned registered workload policy. If BSS profile registration/metadata is missing, STOP with BSS owner rather than writing BSS policy; if safe estimator bounds cannot be demonstrated, **STOP `SEM_BATCH_ESTIMATOR_GAP`** rather than inventing capacity. This is not a second BSS capacity planner, SEM batch-corpus compiler, prompt builder, provider transport or approval to change the qualified stepwise methodology. Planner-only CK demonstrates conservative prospective structural fit; later SEM intake must independently prove the actual emitted request fits or reject/replan before any provider send.

**Empty corpus:** accepted `NormalizedDocument v1` may have pages but no eligible source units. Return typed `NO_ELIGIBLE_SOURCE` with verified coverage/zero batch records; neither `-03-02` nor `-03-03` may invent one empty batch to make the future GHR positive `batchCount` schema pass.

## Frozen planning read/fit sequence — prevents duplicate BSS planning

1. Receive only the authenticated `-03-01` resolved accepted source and a BSS **server-authorized** prospective process/workload principal. Invoke the existing BSS snapshot reader with `prospective:true` to obtain structural maximum, policy/enforcement, safety, estimator identity and authorized route/profile revision. An inactive response is usable **only** for exact `prospective_planning_only`; it is not provider/route activation.
2. Produce a **pure, deterministic, conservative semantic corpus demand estimate** (real input text/tables/context/media, versioned prompt/schema/output allowance). Fit against immutable structural request maxima; the planner may split/adjust *owned/context source partitions*, **not** compute provider RPM/TPM window availability or publish a BSS plan.
3. Submit bounded `requestBytes` and `inputTokens` candidate estimates to the **same** BSS snapshot reader for authoritative structural fit where exposed; require consistent qualified policy/profile/estimator/structural versions across reads, or mark stale and restart planning against a newly pinned version. If BSS returns `unfit` for the structural candidate, try a deterministic smaller corpus (retaining source coverage/context) or return typed BLOCKED on indivisible source. Never treat `status=inactive/prospective_planning_only` as an admitted send permit.
4. Finish as an immutable, unpublished *semantic corpus plan proposal*. Provider rate-window pressure and current RPM/TPM remaining quotas are not planner inputs. Current BSS-006 runtime constraint reads are **not required nor to be added for this frozen planner-only scope**; later BSS admission owns live eligibility. A real profile change after proposal is fenced/revalidated by `-03-03` before persistence. BSS profile/route registration or unavailable estimator provenance is a **STOP to its owner**, not authority for IDSER to create a new BSS catalog.
5. `RequestResourceEnvelope` is the existing BSS workload demand `{requestUnits,tokenUnits,dayUnits,concurrencyUnits}` with exact dimension semantics and versioning. Do not equate numeric `dayUnits` demand to unknown RPD provider limit or replace it with numeric limit/vector metadata. The later admitted-work API `{rpm,tpm,rpd,concurrency}` remains downstream and outside this ticket.

## Frozen Review Contract

| ID | PASS iff |
| --- | --- |
| RC-0120302-01 | Actual BSS-005 consumer entrypoint resolves exact authorized prospective workload, policy and structural versions; absent/foreign/stale/unknown mandatory/known-zero/unsupported state blocks; no synthetic BSS substitute. |
| RC-0120302-02 | Anoman-like enforced RPM/TPM/concurrency + qualified unknown/not-enforced RPD fits without invented daily number; old known RPD and shared-domain protection remain enforced. |
| RC-0120302-03 | Deterministic N-batch full once-only owned coverage with bounded context-only zero ownership; tables, zero-visual, image grants, REL and cross-batch deferred conditions preserve fidelity or explicitly block. |
| RC-0120302-04 | Qualified per-request structural limits and resource demand include prompt/schema/input/output/media/REL/overheads and headroom, not magic page/token counts or remaining runtime quota. |
| RC-0120302-05 | Transient pressure never silently rebatches; trustworthy structural downgrades or changed source/media/policy/estimator yield new versioned replan or BLOCKED; old proposals are not mutated. |
| RC-0120302-06 | Process-neutral BSS protection and zero BSS writes/attempts/reservations/provider sends, GHR delivery, semantic truth/reconciliation effects proved with positive read and negative counters. |

**STOP:** return qualified immutable partition proposal, no durable `PlannedSemanticCorpusHandoff`, provider queue or GHR event. Missing real planning API/prospective authority → `BSS_CAPACITY_CONSUMER_READ_GAP` / `CAPACITY_PROFILE_BOOTSTRAP_GAP`, assigned to BSS, never direct Bridge-table read or fake active semantic route.
