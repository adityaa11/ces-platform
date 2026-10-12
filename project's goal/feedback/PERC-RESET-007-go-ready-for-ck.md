# PERC-RESET-007 GO — Three Safara PDFs, one RUN-003 pipeline

- **Ticket:** `PERC-RESET-007`; **checkpoint:** `GO PERC-RESET-007`; **dependency:** PERC-RESET-006 CK-approved.
- **Ticket state:** `awaiting_review`; **date:** 2026-10-13.
- **Scope:** One new authenticated Project B through perception only. No fallback route, semantic execution/provider call, Master publication, or successor-ticket work.

## Real Project B execution

Authenticated multipart creation made Project B `safara-run003-three-pdf-07199fff2bcc` (`05e1ccba-0bb3-462e-8cd5-90ac1ed4405d`), bundle `df95f0d8-2b06-4b99-ac66-a61aa9ba5175`.

| Sequence | Source | Bytes / SHA-256 | Execution | Text / tables / visuals-assets |
| ---: | --- | --- | --- | --- |
| 1 | `Safara_PRD_01_Foundation.pdf` | 114,181 / `4a7aa8c90dd2f045ed1d37f73d69c5372fbdbeedc76edfa151cbd1ae88d370cc` | `ef43ac19-f8a9-4219-9ae1-3afd6cccfb81` | 73 / 2 / 0-0 |
| 2 | `Safara_PRD_02_Finance_Documents.pdf` | 112,316 / `527bcf9926fdb760e706b2505812531aacd6520b8d7f647a70b230983f48188c` | `d60e32b9-e8fc-40e2-b353-16a806951c08` | 68 / 3 / 0-0 |
| 3 | `Safara_PRD_03_Readiness_Manifest_Reporting.pdf` | 115,773 / `0b4944c0a1171223020a7e0c76e73cf4ff02e5513ae62fceb9e43d5fd8cb720f` | `7850dba4-7fa9-44dc-9199-1fd75f7a7c9a` | 88 / 1 / 0-0 |

Each source had a `%PDF-` header, was preserved in the required order, and independently completed with `capability_identity=docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`. All three are actual valid zero-visual inputs; their table evidence was retained, while no derived asset was invented or dropped. There are three distinct normalized cache keys, three source grants, and exactly three logical executions.

The two permitted executions started at `2026-10-12 20:16:49 UTC`. The third began at `20:16:53.310 UTC`, immediately after the second completed at `20:16:53.304 UTC`: bounded two-permit admission and eventual third-member admission, with no manual requeue or duplicate execution.

Project B has one empty Master and one Initial Draft. Bundle state is `processing`, with `expected_document_count=3` and `perception_admission_policy=staged-fair-local-v1`; that is expected because semantic work intentionally does not start. All three members are `perceived`. Project-scoped queries found zero semantic executions and zero semantic/background jobs, therefore zero semantic-provider calls.

## Validation

- `docker exec atlas-canonical-perception-atlas-1 sh -lc 'node apps/atlas/scripts/perception-three-pdf-qualification.mjs /workspace/docs/example/Safara_PRD_01_Foundation.pdf /workspace/docs/example/Safara_PRD_02_Finance_Documents.pdf /workspace/docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf'` — passed against the authenticated Project B. The harness supports resuming the same project only to recover evidence after an initial schema-query correction; it did not create a second project.
- Read-only PostgreSQL query — `3` sources, `3` logical executions, `3` grants, `3` normalized caches, expected bundle count/policy, zero semantic executions, and zero non-perception Project B jobs.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — passed 12/12, including RUN-003 zero-visual acceptance and asset/source-integrity negatives.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence | Status |
| --- | --- | --- | --- |
| RC-PERC-RESET-007-01 | Authenticated multipart creation; exact ordered, bounded, source-bound originals | Authenticated Project B and three source hashes/sizes/grants above | PROVEN |
| RC-PERC-RESET-007-02 | Empty Master separate from Initial Draft; exactly three ordered members | Live workspace/bundle query: one empty Master, one Initial Draft, three members, count `3` | PROVEN |
| RC-PERC-RESET-007-03 | Each member independently uses qualified RUN-003 only | Three completed IDs each carry the exact RUN-003 identity | PROVEN |
| RC-PERC-RESET-007-04 | Truthful zero-visual or captured-evidence cardinality | Actual normalized output is 0 visuals/assets and 2/3/1 tables; focused worker suite passed | PROVEN |
| RC-PERC-RESET-007-05 | Bounded 2/2/2 admission, eventual third member, no extra logical execution | Timestamped two-then-third admission; exactly 3 executions | PROVEN |
| RC-PERC-RESET-007-06 | Distinct accepted caches, `perceived` members, originals bound; no invented ready state | Three cache keys/source SHA matches, all perceived, bundle remains processing | PROVEN |
| RC-PERC-RESET-007-07 | No semantic jobs/provider activity or Master assertion/publication | Project-scoped semantic and background-job counts are zero; Master is empty | PROVEN |

Internal readiness: `READY_FOR_CK`.

This is an implementation readiness handoff only. It is not a CK `PASS` and does not authorize PERC-RESET-008.
