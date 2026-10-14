# HMN Authorization: SEM-CUTOVER-007

Ticket: `SEM-CUTOVER-007` — canonical offline stepwise worker composition and durable composite staging
Batch: `SEM-CUTOVER`
HMN authorization ID: `HMN-SEM-CUTOVER-007-001`
Invocation: explicit user `hmn` delegation; human decision authorizes a bounded ticket-only realignment before GO.
Current workflow state: `planned`; ticket realignment complete; no GO, CFC, or CK has been executed or authorized by this record.

## Frozen references

- Frozen ticket: `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-007-offline-stepwise-worker-composition.md`
- Branch: `codex/new-atlas-backend`
- Inspected HEAD: `caaaf21adf9f965763941f483c741ce49e787944` (`docs(atlas): approve REL-03 durable prerequisite`)
- Relevant GO commit: none for SEM-CUTOVER-007
- Relevant CK artifact: none for SEM-CUTOVER-007; this is pre-GO ticket realignment
- Relevant CFC commit: none
- Prior HMN authorization: none for SEM-CUTOVER-007
- Approved SEM-006 evidence: `project's goal/feedback/SEM-CUTOVER-006-0d8a8a1-verification.md`, PASS at reviewed remediation `0d8a8a1`
- Approved predecessor-preparation evidence: `project's goal/feedback/REL-03-DURABLE-001-f95747a-verification.md`, PASS at `f95747a`
- Approved durable prerequisite evidence: `project's goal/feedback/REL-03-DURABLE-001-7657d92-verification.md`, PASS at `7657d92`; approved ticket status committed at `caaaf21`

## Worktree state

The active branch is `codex/new-atlas-backend` at the inspected HEAD. The worktree contains unrelated tracked generated-fixture modifications and unrelated untracked planning, fixture, laboratory, archive, and feedback material. Those changes are preserved and remain outside this authorization. This invocation modifies only the SEM-CUTOVER-007 ticket and this bounded HMN evidence record.

## Diagnosis

The existing SEM-007 ticket correctly preserved the six RC rows and the D1 stop, but its prerequisite wording still treated durable composite staging as unqualified and its execution contract still described the legacy ordinary result replay boundary. The approved repository state now exposes the qualified predecessor preparation/projection/accounting/verifier chain and the independently CK-approved `createSemanticCompositeReplay()` durable composite API. The ticket therefore needed a bounded contract realignment before implementation could be considered by a later GO.

The current worker's legacy `SemanticReplay.stage(idempotencyKey, executionId, envelope, lease)` path is not the approved durable composite interface. The realignment binds SEM-007 to the actual approved APIs, keeps predecessor logic read-only, separates durable staging from ordinary delivery, names the extraction worker/composition ownership, and preserves the existing reconciliation contract and normal D1 stop.

No implementation defect, missing approved predecessor API, provider/runtime/deployment choice, architecture/policy decision, or genuine predecessor defect was found during this planning inspection. The existing `preflightMultimodalRequest()` boundary is present and remains an estimator, not admission permission.

## Ticket-authority trace

- The user's explicit human decision authorizes only this ticket-contract realignment and explicitly forbids GO, CFC, and CK during this invocation.
- The six existing rows `RC-007-01` through `RC-007-06` are preserved and their evidence mapping is updated to the current approved architecture; no new acceptance row replaces or weakens them.
- SEM-006, the qualified SEM-005 / SEM-006 / REL-03 preparation at `f95747a`, and `REL-03-DURABLE-001` at `7657d92` are incorporated as read-only predecessor authority.
- The realigned ticket explicitly consumes `buildStepwiseSourcePacket()`, `buildStepwiseRelationshipEnvelopeRequest()`, `prepareQualifiedStepwiseSemanticPreparation()`, `projectQualifiedStepwiseSemanticResult()`, `prepareQualifiedStepwiseSemanticCompositeAccounting()`, `verifyQualifiedStepwiseSemanticPreparation()`, `semanticCompositeHash()`, and `createSemanticCompositeReplay().load()/stage()`.
- The ticket names the permitted worker, composition-root, focused unit/integration test paths and one explicitly owned optional composition helper, while excluding worker infrastructure, provider adapters, neutral capability contracts, Atlas authority, migrations/schema, and durable replay-owner modifications.
- The ticket retains the exact ordered effects, the pre-provider winner check, genuine nullable canonical projection, isolated PostgreSQL requirement, non-inert counter requirement, multimodal fake authority boundary, normalized-document substitution negative, and the stated stopping conditions.

## Decision

`RETURN_TO_GO` for the separately invoked, initial SEM-CUTOVER-007 implementation, after this bounded ticket-only realignment.

The terminal planning decision is **`SEM-007_GO_READY`**: the ticket now accurately consumes the approved predecessors, names explicit implementation ownership, and gives every frozen RC an executable architecture-aligned test plan. This decision is not GO authorization, implementation authorization, CK `PASS`, CFC authorization, or production activation.

## Authorized scope

- Modify only the frozen SEM-CUTOVER-007 ticket to incorporate the approved predecessor status, actual durable composite interface, ordered effects, delivery/staging separation, ownership allowlist, multimodal fake authority, and current RC evidence mapping.
- Create only this bounded HMN evidence record under `project's goal/feedback/`.
- Preserve SEM-CUTOVER-007 status as `planned`.
- Permit a later, separately invoked GO to inspect the real worktree and implement only the ticket's named SEM-007-owned paths, subject to its predecessor gates and stopping conditions.

## Required validation

The later GO/CK workflow must read the realigned ticket as the current authority and verify, at minimum:

- one explicitly selected stepwise extraction path with no legacy fallback;
- exact source/asset identity, authorized media resolution, provider-neutral multipart preflight, and `RESOURCE_ENVELOPE_BLOCKED` for unknown image TPM;
- strict REL qualification, SEM-006 projection, SEM-005 accounting, and genuine `canonicalResult: null` where fully deferred;
- actual approved composite staging and recovery through isolated PostgreSQL, not the legacy ordinary replay store or fake counters alone;
- winner replay, lease fencing, delivery/ack-loss/cancellation/restart instrumentation, immutable winner and sidecar identity, and no duplicate provider effect;
- non-inert counter positive controls and zero denied-route provider/admission/job effects;
- the normalized-document substitution negative after authorized context retrieval; and
- canonical D1 remaining `perceived`, with zero normal semantic jobs/provider requests and unchanged reconciliation.

## Forbidden work

- Do not execute GO, CFC, or CK during this invocation.
- Do not modify implementation code, provider adapters, `worker.ts`, provider-neutral capability contracts, route/admission code, Atlas semantic authority, migrations/schema, durable replay, reconciliation, Master, publication, Docker, or production configuration.
- Do not reopen or modify SEM-005, SEM-006, REL-03, `REL-03-DURABLE-001`, or their historical CK artifacts.
- Do not convert nullable deferred output to an empty Semantic V1 object, deliver it as accepted meaning, or change Atlas lifecycle acceptance inside SEM-007.
- Do not perform live provider calls, unauthorized media hydration, admission reservations, normal D1 semantic execution, or canonical RUN-003 data mutation.
- Do not alter or discard unrelated dirty/untracked worktree material and do not create speculative follow-up tickets.

## Handoff

Expected next command: separately invoked `GO SEM-CUTOVER-007`, followed by its bounded implementation checkpoint and independent CK. Keep SEM-CUTOVER-007 `planned` until that GO and independent acceptance occur. No automatic GO, CFC, or CK follows from this HMN record.
