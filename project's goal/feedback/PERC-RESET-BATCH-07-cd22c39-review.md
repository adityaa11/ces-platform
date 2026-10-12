# PERC-RESET batch CK review — cd22c39

- **Ticket:** `PERC-RESET-007` — Three Safara PDFs, one RUN-003 pipeline
- **Batch:** `PERC-RESET`
- **Review type:** first independent CK review
- **Reviewed target:** commit `cd22c39fc4429d848a1bcf3d18cd9b44c172930a` (`chore: record PERC-RESET-007 GO evidence`)
- **Ticket / GO checkpoint:** frozen PERC-RESET-007 ticket and `PERC-RESET-007-go-ready-for-ck.md`; ticket state `awaiting_review`
- **Result:** `PASS`

## Review basis and target preconditions

The frozen ticket requires one authenticated Project B containing exactly the
three named PDFs in order, separate empty Master and Initial Draft workspaces,
immutable source-bound members, one qualified RUN-003 perception execution per
document including valid zero-visual output, bounded staged admission with no
extra logical execution, all members at `perceived`, and no semantic execution,
job, provider activity, fallback route, or Master publication.

The reviewed commit records the GO checkpoint and the committed ticket-set
README records PERC-RESET-007 as `awaiting_review`. The reviewed target is
unambiguous. The worktree has unrelated semantic-relationship edits and
untracked future-ticket/workflow material; those changes were excluded from
this review and do not alter the committed GO artifact or the recorded Project
B evidence.

## Review Contract

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-007-01 | Authenticated multipart creation; exact ordered, bounded, source-bound originals | One Project B, three named PDFs, matching source identity and upload bounds | Read-only qualification rerun returned the recorded project and bundle, ordered filenames, `%PDF-` headers, sizes `114181/112316/115773`, and the three recorded SHA-256 values; one source grant per member; total upload is `342270` bytes | PROVEN |
| RC-PERC-RESET-007-02 | Empty Master separate from Initial Draft; exactly three ordered members and bundle count `3` | One empty Master, one Initial Draft, three ordered members | Read-only qualification rerun returned `emptyMasters=1`, `initialDrafts=1`, ordered sequences `1..3`, and `expectedDocumentCount=3` | PROVEN |
| RC-PERC-RESET-007-03 | Every member independently uses the qualified RUN-003 route/profile | Three completed perception executions with the exact qualified identity | All three live execution rows are `completed` and record `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`; worker/container and Compose checks show the same RUN-003 option profile and one enabled route | PROVEN |
| RC-PERC-RESET-007-04 | Truthful zero-visual or captured-evidence cardinality; table evidence retained | Actual normalized output, not assumed image counts | Live normalized output returned text/table/visual counts `73/2/0`, `68/3/0`, and `88/1/0`; accepted derived-asset count is `0` for each; focused worker suite passed the zero-visual and asset-integrity cases | PROVEN |
| RC-PERC-RESET-007-05 | Bounded `2/2/2` admission, eventual third member, no extra logical execution | First two executions overlap; third is admitted after a permit is released; exactly three executions | Live execution timestamps show executions 1 and 2 created at `20:16:49.105Z`, execution 2 completed at `20:16:53.304Z`, and execution 3 was created at `20:16:53.310Z`; exactly the three recorded execution IDs exist, with no duplicate logical execution | PROVEN |
| RC-PERC-RESET-007-06 | Three distinct accepted caches, all members `perceived`, original identities bound, no invented ready state | Distinct normalized cache identities, source bindings, terminal member state, and permitted aggregate state | Read-only qualification rerun returned three distinct cache keys, one cache per source, source SHA matches, all members `perceived`, bundle state `processing`, and policy `staged-fair-local-v1` | PROVEN |
| RC-PERC-RESET-007-07 | Zero semantic executions/jobs/provider activity and no Master assertion/publication | Project-scoped semantic/job counts and workspace state remain empty at the boundary | Read-only qualification rerun returned `semantic executions=0`, `semantic jobs=0`, `providerCalls=0`, and the empty Master proof; no semantic or Master work is represented in the Project B state | PROVEN |

## Validation and evidence performed

- Read-only resume of the named qualification harness against the existing
  stable project `safara-run003-three-pdf-07199fff2bcc`; it created no second
  project and returned the recorded project, bundle, source hashes, ordered
  members, normalized counts, cache identities, workspace states, and zero
  semantic counts.
- Direct database inspection of the three perception execution rows confirmed
  the recorded execution IDs, completed states, RUN-003 identities, source
  grant/cache counts, accepted asset counts, and admission timestamps.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts`
  — passed 12/12.
- Effective Compose and running worker configuration inspection confirmed the
  single enabled RUN-003 route, `DOCLING_OPTION_PROFILE=atlas-digital-pdf-run-003-capture-v1`,
  and the matching capability identity.

## Findings

No ticket-bound implementation or evidence deficiency was identified. No CK
finding or remediation cycle is required.

## Frozen Finding Closure Matrix

No blocking findings were created; therefore there are no closure clauses to
freeze. All seven Review Contract rows above are `PROVEN`.

## Scope-change observations

None. This review does not require semantic execution, semantic-provider
invocation, Master publication, deployment/provider changes, source edits, or
successor-ticket work.

## Decision

`PASS`. PERC-RESET-007 satisfies its frozen ticket contract at the reviewed
commit. This result applies only to PERC-RESET-007 and does not authorize
PERC-RESET-008.
