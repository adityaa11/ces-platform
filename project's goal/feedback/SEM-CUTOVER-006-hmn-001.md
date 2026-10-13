# HMN Authorization: SEM-CUTOVER-006

- **Ticket:** `SEM-CUTOVER-006` — BSS-V2-004-03-05 contextual-trust remediation
- **Batch:** `SEM-CUTOVER`
- **HMN authorization ID:** `HMN-SEM-CUTOVER-006-001`
- **Invocation:** explicit user `HMN SEM-CUTOVER-006` delegation; human decision `APPROVE`.
- **Current workflow state:** `SEM-CUTOVER-005` has independent CK `PASS`; `SEM-CUTOVER-006` is planned with no implementation checkpoint. Historical BSS-V2-004-03-05 `CK-001.a` and `CK-001.b` remain open pending the separately required consolidated CK after SEM-CUTOVER-007.

## Frozen ticket reference

- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-006-03-05-context-trust-remediation.md`
- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/00-SEM-CUTOVER-IMPLEMENTATION-CONTEXT.md`
- Frozen historical CK: `project's goal/feedback/BSS-V2-BATCH-04.03-05-298021d-review.md` (`CK-001.a`, `CK-001.b`)
- Approved successor authority: `project's goal/feedback/SEM-CUTOVER-002-hmn-001.md` and `project's goal/feedback/SEM-CUTOVER-002-hmn-002.md`

Current HEAD: `de718578091bfaa97bfbf3532cb8297d293689d9` on `codex/new-atlas-backend`.

Relevant GO commit: none for `SEM-CUTOVER-006`.

Relevant CK artifact: `project's goal/feedback/SEM-CUTOVER-005-0c3d4a6-verification.md` (`PASS`); historical finding matrix above.

Relevant CFC commit: none for `SEM-CUTOVER-006`.

Prior HMN authorization: none for `SEM-CUTOVER-006`.

Worktree state: pre-existing modifications include `apps/agents-bridge/src/semantic-extraction-finalizer.ts`, `apps/agents-bridge/src/semantic-worker.ts`, `apps/agents-bridge/tests/semantic-worker.test.ts`, generated fixtures, and untracked future-ticket/feedback/laboratory material including `apps/agents-bridge/tests/semantic-relationship-finalizer.test.ts`. This HMN record changes no implementation path; those files are preserved and are not implementation evidence for this decision.

## Diagnosis

The historical finalizer's caller-supplied `{ ownedSourceSlot, contextSourceSlot }` pair cannot establish accepted contextual authority. The approved successor contract permits the bounded finalizer remediation to consume only an independently validated Atlas relationship-verification decision. The human decision also resolves the prior workflow prohibition solely for this successor ticket: missing human verification may withhold dependent trusted contextual evidence, but must not prevent independent canonical extraction or erase attributable provisional uncertainty.

## Ticket-authority trace

| Authority | Effect |
| --- | --- |
| `SEM-CUTOVER-006`, `RC-006-01` / historical `CK-001.a` | Contextual evidence requires an exact validated accepted relationship; caller claims and matching metadata are not authority. |
| `SEM-CUTOVER-006`, `RC-006-02` / historical `CK-001.b` | Accepted context can enrich the same table-owned candidate; missing essential context withholds only the dependent authoritative decision. |
| `SEM-CUTOVER-006`, `RC-006-03` through `RC-006-05` | Preserve provisional treatment, deterministic/canonical invariants, and existing provider-neutral/replay/D1 boundaries. |
| User decision recorded by this artifact | Supplies the ticket-required specific HMN authorization for the bounded successor remediation; it does not waive or resolve the historical findings. |

## Decision

`RETURN_TO_GO`.

The user-approved successor remediation is implementation-ready for `SEM-CUTOVER-006` only. This is not a CFC authorization for the historical ticket and is not a CK `PASS`.

## Authorized scope

- Implement only `SEM-CUTOVER-006`'s deterministic finalizer remediation and focused finalizer qualification.
- Permitted implementation paths: `apps/agents-bridge/src/semantic-extraction-finalizer.ts` and focused finalizer tests.
- A narrow provider-neutral trusted-verifier port/type may be added only when necessary to enforce the approved independent verification boundary. Its owner and path must be recorded in the GO checkpoint before modification.
- A controlled offline verifier fake may exercise accepted, forged, foreign, expired, revoked, duplicate, unsupported, and mismatched decisions. It cannot issue production authorization or represent human approval.

## Required validation

GO must execute the frozen ticket's mandatory deterministic positive and negative qualification matrix, preserve exact owned-slot accounting and canonical parsing, and demonstrate that invalid trusted-context attempts fail before invalid canonical output is staged. It must retain unrelated finalizer guarantees and record all Review Contract rows in its checkpoint.

## Forbidden work

- Do not change `semantic-worker.ts`, provider adapters, source grants, schema authority, database/migrations, REL-03, admission, reconciliation, Master, publication, canonical RUN-003 data, or historical CK artifacts.
- Do not treat caller-supplied acceptance-like data, provider confidence, page proximity, or matching asset identity as authorization.
- Do not reopen historical RC-03/04/05 behavior, begin SEM-CUTOVER-007, enable a real provider, or claim historical `CK-001.a/b` resolved.
- If enforcing the boundary requires a separately mutable trust/authority owner beyond the narrow port/type, stop `OWNERSHIP_CONFLICT_BLOCKED` and return for HMN authority.

## Handoff

Expected next command: `GO SEM-CUTOVER-006`.

GO must cite `HMN-SEM-CUTOVER-006-001`, commit only authorized paths, mark the ticket `awaiting_review`, and hand off to independent CK. SEM-CUTOVER-006 CK qualifies the finalizer component only; the historical full BSS-V2-004-03-05 CK remains required after SEM-CUTOVER-007.
