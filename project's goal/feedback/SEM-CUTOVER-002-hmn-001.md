# HMN Authorization: SEM-CUTOVER-002

- **Ticket:** `SEM-CUTOVER-002` — Successor semantic baseline and deferred verification HMN
- **Batch:** `SEM-CUTOVER`
- **HMN authorization ID:** `HMN-SEM-CUTOVER-002-001`
- **Invocation:** Explicit user `HMN SEM-CUTOVER-002` delegation, `APPROVE`, recorded 2026-10-13.
- **Current workflow state:** Human decision recorded; `HMN_APPROVED_FOR_SUCCESSOR_PLAN`, awaiting independent verification. This is not a CK `PASS`, GO authorization, CFC authorization, or implementation checkpoint.

## Frozen ticket reference

- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-002-successor-baseline-and-deferred-verification-hmn.md`
- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/HMN-SEM-CUTOVER-002-PROPOSAL.md`
- `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/00-SEM-CUTOVER-IMPLEMENTATION-CONTEXT.md`, including its 2026-10-13 binding planning clarification.

## Current repository evidence

| Evidence | Recorded state |
|---|---|
| Current reviewed HEAD | `508118f8bb73bfb3800ecfd0580392b1471d4537` (`docs(sem-cutover): approve 001 ticket`) on `codex/new-atlas-backend` |
| Relevant GO commit | `47061e8` — `SEM-CUTOVER-001` inventory checkpoint; no GO exists for this human-decision ticket |
| Relevant CK artifact | `project's goal/feedback/SEM-CUTOVER-001-0782603-verification.md` — `PASS` at predecessor CFC commit `0782603171dbdb2556255160cb4d6295acff6cee` |
| Relevant CFC commit | `0782603171dbdb2556255160cb4d6295acff6cee` (`docs(sem-cutover): remediate 001 CK findings`) |
| Prior HMN authorization | None for `SEM-CUTOVER-002` |
| Worktree state | Dirty and untracked implementation, fixture, planning, feedback, and REL-03-candidate paths were present before this decision. They are outside this record and remain protected. |

## Diagnosis

`SEM-CUTOVER-001` has an independent CK `PASS`; its verification explicitly unlocks preparation of this bounded HMN decision only. The frozen 002 ticket requires real human authority for prospective successor-policy realignment and prohibits source, runtime, schema, provider, Docker, database, Master, REL-03-candidate, and historical-CK mutations.

The user has explicitly supplied that authority. This record consumes no future leaf GO and does not claim that successor implementation, durable persistence, relationship acceptance, or the 03-05 findings have been independently qualified.

## Ticket-authority trace and approved clause treatment

| Affected authority | Exact prospective treatment authorized | Successor positive observable | Successor negative / fail-closed observable | Preserved guarantees and downstream owner |
|---|---|---|---|---|
| `BSS-V2-004-03-05` RC-03/default and its historical `CK-001.a/b` | Retire legacy `prompt-003/v1` default/fallback and legacy byte-parity only as successor acceptance conditions. Maintain a single stepwise eight-stage path; version and qualify a successor if frozen v0.3.1 bytes, request, or response envelope change. | A later 03-05 owner can show one explicitly selected stepwise profile/hash for a successor request and response envelope, with the successor's stated qualification evidence rather than legacy-byte parity. | If the selected profile/hash, request, or response envelope is not explicitly identified and qualified, the successor path is not accepted; it must not silently reuse the legacy default or claim legacy-byte parity as replacement proof. | `CK-001.a/b` remain open; trusted context requires Atlas-validated, exact source/revision/scope/asset-bound authorization. Provider neutrality, strict source accounting, canonical validation, replay/fencing, and RUN-003's `perceived` stop remain mandatory. A separately bounded CFC/HMN route and independent 03-05 CK are required. |
| `BSS-V2-004-03-08-01-04` RC-02/RC-03 | Supersede the legacy compiler default, old text-only packet, and exact legacy-byte parity only for the new successor path. | A later compiler owner can demonstrate an explicitly selected successor profile/hash emitting the declared successor envelope through the stepwise path. | An unselected, mismatched, or legacy-default profile/hash must not activate the successor; no dynamic image-triggered fallback to the old text-only packet is accepted. | No implicit activation or fallback; profile/hash identity remains explicit. A later owner must qualify the successor functional and negative oracles. Historical approved evidence is unchanged. |
| `BSS-V2-004-03-08-02-01` RC-01/RC-02 | Do not treat missing human relationship verification as blocking independently supported owned-source extraction. | A later source-packet owner can demonstrate an independently supported owned source proceeding with exact source/asset identity and an attributable provisional relationship dependency. | A missing human relationship acceptance must not be represented as trusted context or silently promoted to fact; an unverified or non-owned context source remains unavailable for trusted contextual use. | Exact source/asset identity, context nonownership, and meaningful-unexamined-visual honesty remain mandatory; no visual-to-table inference or silent `non_fact`. A separately bounded source-packet owner must implement and qualify any interface change. |
| `BSS-V2-004-03-08-03-02` RC-03 | Replace the future legacy differential only with successor-specific strict envelope and ownership qualification. | A later finalizer owner can show a successor proposal whose envelope and ownership references satisfy the declared strict qualification. | Invalid, foreign, dangling, duplicate, malformed, or cross-slot material must be rejected fail-closed, with no repair, reconciliation, or provider dispatch. | Invalid, foreign, dangling, duplicate, malformed, or cross-slot material remains fail-closed; no repair, reconciliation, or provider dispatch is implied. |
| `BSS-V2-004-03-08-03-03` RC-03 | Replace the future whole-legacy baseline differential with the approved successor's integrated qualification and final independent 03-05 review. | A later integrated qualification can show the approved successor against the declared RUN-003-compatible, replay-safe, redacted offline observation set at an exact reviewed SHA. | Any qualification with a live provider/job/reservation effect, missing replay/redaction evidence, or an unreviewed SHA is not accepted as the successor replacement. | RUN-003 perception compatibility, replay, redaction, zero live provider/job/reservation effects, and exact final reviewed SHA remain required. |
| `IDSER-012-02-01` old single-packet parity | Prospectively realign toward the approved composite Semantic V1 plus pending/provisional sidecar, if the bounded owner proves fit. | A later bounded owner can demonstrate a composite Semantic V1 plus pending/provisional sidecar that faithfully records owned/context source accounting and meaningful unexamined visuals without truth promotion. | If faithful representation cannot be demonstrated, the result is `SCHEMA_FIT_BLOCKED`; no invented Semantic V1 classification, `non_fact` substitution, or partial result presented as full is accepted. | No invented Semantic V1 classification; meaningful unexamined visuals are not `non_fact`; owned/context source accounting and no truth promotion remain mandatory. `SCHEMA_FIT_BLOCKED` remains the stop if faithful representation cannot be demonstrated. |

## Decision

**Decision: `RETURN_TO_CK` for independent verification of this HMN decision record.**

The explicit human decision is **APPROVE — bounded successor architecture and contract realignment only**. It adopts the eight-stage v0.3.1 methodology as the sole intended successor semantic method, defers human relationship confirmation to a later authenticated revision-bound workflow, permits nonblocking independent extraction with attributable provisional dependencies, and authorizes validation-before-persistence with a fenced atomic/idempotent composite winner or independently qualified equivalent.

This decision is prospective. It does not rewrite historical tickets or CK records, declare any future implementation complete, authorize REL-03 or database work, or issue a cryptographic signature.

## Authorized scope

- Record and independently verify this bounded decision and the clause-level prospective realignment above.
- Permit later ticket owners to consume this decision only within their separately authorized ticket scope and predecessor gates.
- Preserve the specified separation: SEM-CUTOVER-006 CK qualifies the finalizer component; SEM-CUTOVER-007 CK qualifies the offline worker plus approved durable replay boundary; a separate consolidated independent `BSS-V2-004-03-05` CK `PASS` must precede SEM-CUTOVER-008's effective baseline freeze.

## Required validation

- Independently verify that this record traces to the frozen 002 ticket, the user-provided approval, the actual recorded HEAD, and the predecessor `SEM-CUTOVER-001` CK `PASS` at `0782603`.
- Verify each prospective supersession is limited to the successor path and leaves the preserved guarantees, open `03-05` findings, and downstream ownership boundaries intact.
- Verify no source, schema, runtime, provider routing, Docker, database, canonical perception, REL-03 candidate, or historical CK artifact was changed by this decision checkpoint.

## Forbidden work

- No automatic execution of `SEM-CUTOVER-003` or any other successor GO.
- No implementation-code, provider-routing, Docker, database, canonical-perception, REL-03-candidate, migration, Master, publication, admission, or external-provider change.
- No claim of 03-05 CK closure, full 03-05 approval, user-verification implementation, semantic job authorization, or future GO/CK issuance.

## Unresolved authority conflicts

None within the bounded decision. Open implementation and ownership gates remain intentionally unresolved: exact successor profile/hash if frozen v0.3.1 bytes change; faithful sidecar/schema fit; separately approved REL-03/durable persistence integration before SEM-CUTOVER-007; and independent closure of 03-05 `CK-001.a/b`.

## Handoff

**Expected next command:** Independent `CK SEM-CUTOVER-002` to verify this decision record. After a CK result, any successor leaf still requires its own explicit user GO and its stated predecessor gates. No GO is issued by this HMN record.

## Bounded CFC remediation checkpoint

- **CFC authorization consumed:** `HMN-SEM-CUTOVER-002-002`.
- **Frozen CK artifact and clause:** `project's goal/feedback/SEM-CUTOVER-002-0151ed8-review.md`, `CK-001.a`.
- **Working status:** `awaiting_review`.
- **Changed path:** This decision record only: `project's goal/feedback/SEM-CUTOVER-002-hmn-001.md`.

### Progress view

| Frozen CK clause | Status | Evidence location | Frozen oracle outcome |
|---|---|---|---|
| `CK-001.a` | `PROVEN` | `## Ticket-authority trace and approved clause treatment`, six-row successor-treatment table | **PASS**: each exact historical authority has one prospective positive observable, one negative/fail-closed observable, and its preserved guarantee/downstream owner. No protected path or authority was changed. |

### Validation and direct-regression check

| Required command / inspection | Outcome |
|---|---|
| Direct comparison of the six table rows with `SEM-CUTOVER-002` `RC-002-01` and frozen `CK-001.a` | PASS: all six rows retain their exact prior authority and now state bounded, prospective successor positive and negative/fail-closed observables alongside preserved protections and owners. |
| PowerShell table-shape assertion against the six authorities | PASS: exactly six remediation rows, each with treatment, positive-observable, negative/fail-closed-observable, and preserved-owner columns. |
| `git diff --check -- project's goal/feedback/SEM-CUTOVER-002-hmn-001.md` | Exit 0; no whitespace diagnostics. |
| Bounded-path inspection | PASS: only this authorized decision-record path is staged for the remediation commit; no source, schema, provider, Docker, database, canonical-perception, REL-03, historical CK, Master, publication, admission, or external-provider path is included. |

`CK-001.a` satisfies the frozen documentary closure oracle. `RC-002-02` through `RC-002-05`, historical 03-05 `CK-001.a/b`, and all excluded implementation surfaces remain protected.

`Internal readiness: READY_FOR_CK`.

One bounded decision-record remediation commit is handed to independent CK. CFC does not issue CK `PASS`.
