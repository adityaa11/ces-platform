# PERC-RESET-005 CK review — 7ff0ebb

- **Ticket:** `PERC-RESET-005` — Authenticated Project A creation and workspace contract
- **Batch:** `PERC-RESET`
- **Review type:** first independent CK review
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-005-professional-project-creation-master-initial-draft.md`
- **Mirrored ticket copy:** `project's goal/Clean up/Atlas_Canonical_Perception_Reset/tickets/PERC-RESET-005-professional-project-creation-master-initial-draft.md` (same SHA-256 `067e0dddbf5b6c3d0a161928752b265e935d2d8d7d70811113a5abdd22a106e8`)
- **GO checkpoint:** `project's goal/feedback/PERC-RESET-005-go-ready-for-ck.md`
- **Reviewed checkpoint commit:** `7ff0ebbb47c633107d6619281ccd3310d94d733a`
- **Evidence commit:** `d0a85cb87a68602a8496c4314639294afc31b976` records the GO creation evidence; `7ff0ebb` records the `awaiting_review` handoff.
- **Predecessor:** PERC-RESET-004 independent CK `PASS` (`PERC-RESET-BATCH-04-e03e3dc-review.md`)
- **Result:** `PASS`

## Scope and authority

CK reviewed the frozen PERC-RESET-005 ticket, its identical mirrored copy, the
GO checkpoint, the approved PERC-RESET-004 predecessor, the committed
checkpoint binding, the real project-creation boundary, the canonical Compose
configuration, and the live persisted state for the named project.

The reviewed checkpoint commit changes only the perception-reset ticket-set
state to `awaiting_review`; the preceding evidence commit adds the GO record.
No implementation file is changed by this checkpoint. The current worktree
contains unrelated dirty and untracked semantic/relationship/planning work;
those paths do not overlap the reviewed checkpoint and were not consumed.

The ticket authorizes one authenticated creation of the named single-PDF
project and its initial persisted boundaries. It does not authorize semantic
execution, provider calls, review, Master publication, a second project, or
advancement into PERC-RESET-006.

## Review Contract

| Row | Ticket authority | Required behavior and proof | Evidence / validation | Status |
|---|---|---|---|---|
| RC-PERC-RESET-005-01 | Actions 1–2; Evidence; binary oracle | Exact source PDF and one fresh project created through the real authenticated multipart route, without recording credentials or creating a second project | GO records `%PDF-`, `314167` bytes, media type `application/pdf`, SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, fresh authenticated sign-in, `POST /api/projects` multipart `201`, and the created stable ID. CK independently confirmed the source header/hash/size and the live database contains exactly one row for the stable ID. The committed boundary resolves the session user before accepting the multipart creation. | PROVEN |
| RC-PERC-RESET-005-02 | Action 3; binary oracle | Project and document ownership are bound to the authenticated creator; exactly one empty Master, one draft Initial Draft, and one immutable source document exist | Read-only canonical Postgres query returned project `156d4756-55cf-491f-9fa1-bea3c37ecb84`, exactly the two workspace rows (`master/empty`, `initial_draft/draft`), one Initial Draft document, matching original filename/media type/size/hash, and matching project/document `created_by_user_id` values | PROVEN |
| RC-PERC-RESET-005-03 | Action 3; binary oracle | One staged perception bundle and one ordered member are bound to the Initial Draft and source document | Read-only query returned bundle `e9811a0d-a833-4965-a098-4b69f884b719` with `perception_admission_policy=staged-fair-local-v1`, expected count `1`, and one sequence-`1` member referencing the Initial Draft document. The member was observed `perceived`; the bundle was observed `processing` with completed count `0`, which the ticket permits as automatic perception may advance quickly | PROVEN |
| RC-PERC-RESET-005-04 | Action 4; binary oracle | Supported authenticated project-card/UI projection finds the project without claiming publication or semantic readiness | Authenticated internal home-project read returned HTTP `200` and the target card: `state=extracting`, `documentCount=1`, `master.label=No published work`, `initialDraft=0 of 1 PRDs processed (0%)`, and `action=Workspace unavailable` | PROVEN |
| RC-PERC-RESET-005-05 | Action 5; binary oracle | Perception kickoff resolves to RUN-003; no semantic execution/job, review, published Master, or alternative perception route exists | Persisted execution `39cc9cad-9d74-4cfa-8eb6-9c435d03022e` is `completed` with capability identity `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1` and contract `v1`. Canonical Compose exposes one enabled `docling-run-003-capture` route with the matching profile/identity; live pg-boss inventory is only `atlas-document-perception-v1:1`; project-scoped semantic execution, context, candidate, evidence, extraction-result, reconciliation-result, and relationship counts are all `0`; Master remains `empty` and published-Master count is `0`. PERC-RESET-004's approved single-route evidence is consumed unchanged. | PROVEN |

## Validation and evidence

CK performed the following read-only checks:

- Read both frozen ticket copies and confirmed their SHA-256 identity; read the GO checkpoint and PERC-RESET-004 `PASS` artifact.
- Inspected `git show` for the reviewed checkpoint and evidence commits and confirmed the checkpoint contains no implementation diff.
- Confirmed the source PDF header, byte size, and SHA-256 on the host.
- Inspected canonical Compose status/configuration, container status, and the effective Bridge route/profile identity.
- Queried canonical Postgres for the project, ownership, workspaces, document, bundle, ordered member, perception execution, all project-scoped semantic/reconciliation tables, and Master state.
- Queried the live pg-boss inventory; it contains only `atlas-document-perception-v1:1`.
- Performed the authenticated internal home-project read with the existing owner identity assertion; no session token or secret was emitted.

No project was created, no queue or database state was changed, and no
provider/semantic/review/publication action was initiated during CK. No direct
in-scope regression was found.

## Frozen Finding Closure Matrix

No ticket-bound deficiencies remain; there are no CK findings or closure
clauses for this first review.

## Decision

All five applicable ticket-derived rows are proven. The real authenticated
creation evidence, persisted ownership/workspace/source contract, staged
perception linkage, supported card projection, required RUN-003 route, and
zero semantic/publication side effects are present. No direct in-scope
regression remains. **Result: `PASS` for PERC-RESET-005.**
