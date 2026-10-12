# PERC-RESET batch CK review — 9f31026

- **Ticket:** `PERC-RESET-008` — Restart proof and canonical perception handoff
- **Batch:** `PERC-RESET`
- **Review type:** first independent CK review
- **Reviewed target:** commit `9f31026501032323c7445d72091c6e6bd1f10d7e` (`chore(perc): record reset 008 handoff`)
- **Ticket / GO checkpoint:** frozen PERC-RESET-008 ticket and `PERC-RESET-008-go-ready-for-ck.md`; ticket state `awaiting_review`
- **Consumed planning authority:** `HMN-PERC-RESET-008-001` (`RETURN_TO_GO`), solely for the image-embedded Docling baseline interpretation
- **Result:** `PASS`

## Review basis and target preconditions

The frozen ticket requires a single canonical local Compose environment; exactly
two accepted projects and four original PDFs; preserved `perceived` results;
the sole qualified RUN-003 route; no semantic work or legacy runtime;
restart/replay safety; and a versioned, post-PASS successor baseline. The
reviewed target records the GO checkpoint and updates the committed ticket-set
README to `awaiting_review`. The target is unambiguous. The worktree contains
pre-existing semantic/REL/planning edits and untracked workflow material; this
review excluded them because they are not part of commit `9f31026` or its
ticket-owned evidence.

## Review Contract

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-008-01 | Check 1; HMN-PERC-RESET-008-001 | Canonical inventory and approved image-embedded Docling baseline, with no false cache-volume claim | Running canonical container uses the exact digest-pinned image and `/opt/app-root/src/.cache/docling/models`; the sorted per-file fingerprint reproduced as `01ba86056ff361a5b5efb51a570ea8041e9c48acb2ed1e4107e3265a662ccf45`; canonical inventory is one Compose project/network, two labelled data volumes, seven labelled containers, and no unexpected non-internal Docker resources | PROVEN |
| RC-PERC-RESET-008-02 | Check 2 | Normal Compose restart, readiness, and durable accepted outputs/assets | CK executed `docker compose -p atlas-canonical-perception -f docker-compose.yml restart docling-serve atlas agents-bridge agents-bridge-worker`; all four were healthy afterward, PostgreSQL stayed healthy, and Docling `/ready` returned `200` | PROVEN |
| RC-PERC-RESET-008-03 | Check 3 | Bounded lost-ack/replay/idempotency negatives using the directly relevant worker suite | `pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` passed 12/12, including lost-ack replay, acceptance-outage replay without reconversion/upload, zero-visual acceptance, and asset-binding negatives | PROVEN |
| RC-PERC-RESET-008-04 | Check 4 and final oracle | Two projects/four originals, all `perceived`, RUN-003 only, empty Masters, and zero semantic activity | Live PostgreSQL inspection found two projects, one empty Master and one Initial Draft each, four source rows with the recorded hashes, `perceived` member counts `1` and `3`, four completed RUN-003 executions with one cache each, and zero semantic executions / `bridge-background-execution-v1` jobs | PROVEN |
| RC-PERC-RESET-008-05 | Check 5 | Versioned supported contract, actual service details, hashes, limitations, and Windows quickstart | `CANONICAL-PERCEPTION-BASELINE-v1.md` records the route/profile, pinned image, corpus hashes, two project states, known OCR/diagram limits, local URLs, and executable PowerShell start/restart commands | PROVEN |
| RC-PERC-RESET-008-06 | Check 6 | Conditional supersession of old perception compatibility; retained guarantees and conflict ledger | The baseline names the old and RUN-003 identities, makes the transition effective only after this independent PASS, preserves the listed lifecycle/asset guarantees, gives positive visual and zero-visual examples, and identifies the broad downstream `BSS-V2-004-03-08-03-03 RC-03` ambiguity as a future HMN clarification rather than waiving it | PROVEN |
| RC-PERC-RESET-008-07 | Check 7 | Bounded perception-only checkpoint and independent handoff | Commit `9f31026` changes only the phase README plus the canonical baseline and GO evidence; it contains no self-issued PASS and preserves unrelated workspace changes | PROVEN |

## Validation and evidence performed

- Examined commit `9f31026`, the frozen ticket, `HMN-PERC-RESET-008-001`, the
  GO checkpoint, and `CANONICAL-PERCEPTION-BASELINE-v1.md`.
- Inspected the effective Compose configuration and the running container:
  exact Docling image digest, embedded artifact-path environment value, 103-file
  model tree fingerprint, readiness response, and Docker labels/resources.
- Performed the normal scoped Compose restart named by the ticket. The restarted
  services returned healthy; Docling logs state that the valid artifact path
  means no model weights are downloaded at runtime.
- Inspected live PostgreSQL project, workspace, document, member, perception,
  cache, semantic-execution, and `pgboss` state. It confirmed both acceptance
  projects, four recorded hashes, all four terminal `perceived` members, sole
  RUN-003 identity, and zero semantic work.
- Ran the focused document-perception worker suite: 12 passed, 0 failed.

## Findings

No ticket-bound implementation or evidence deficiency was identified. No CK
finding or remediation cycle is required.

## Frozen Finding Closure Matrix

No blocking findings were created; therefore there are no closure clauses to
freeze. All seven Review Contract rows are `PROVEN`.

## Scope-change observations

The broad wording of planned downstream `BSS-V2-004-03-08-03-03 RC-03` is
properly retained as a future HMN clarification request. It is not a
PERC-RESET-008 defect and this review does not waive, amend, or reopen it.
No semantic execution, provider integration, Master publication, REL work,
source reimport, deployment change, or successor-ticket work is authorized.

## Decision

`PASS`. PERC-RESET-008 satisfies its frozen ticket contract at commit
`9f31026`. The RUN-003 successor perception baseline described in
`CANONICAL-PERCEPTION-BASELINE-v1.md` is now effective under its stated scope.
