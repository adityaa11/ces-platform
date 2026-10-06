# CK verification: IDSER-003 / IDSER-BATCH-03

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-003-transactional-project-bundle-kickoff.md` / `IDSER-BATCH-03`
- Reviewed remediation commit: `470a161` (`test(idser): prove transactional kickoff remediation`)
- Checkpoint-record commit: `1b19d1d` (`docs(idser): record IDSER-003 CFC remediation`)
- CK source: `IDSER-BATCH-03-1c68912-review.md` (`CHANGES_REQUIRED`)
- Review type: bounded verification of CK-001 and CK-002, their named remediation, required evidence, and direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- `HEAD` is `1b19d1d066eec568a0e61fbab1a93b7d90ef51ab`; the checkpoint record names remediation commit `470a161`. The tracked worktree is clean; existing untracked review/context artifacts do not alter the reviewed commit.
- Inspected only the original CK-001/CK-002, the IDSER-003 CFC checkpoint, and the remediation diff in the affected integration tests.
- `docker compose up -d --build` succeeded and all four Compose services became healthy. With the worker paused, the authenticated app project-creation integration passed (1/1), and `@atlas/db test:project-repository` passed (2/2), including the IDSER-003 scenario. The worker was restarted and all four services returned healthy.
- `git diff --check 1c68912..470a161` passed.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-001 | RESOLVED | The authenticated project-creation integration now asserts the committed bundle, D1 bundle member, one document-identity-scoped pg-boss job, one perception execution and source grant, and absence of normalized cache/derived assets. Its run passed, including the existing authentication, upload validation, exact-byte/hash, duplicate, fixture-isolation, bounded response, and cache checks. The queued test job is cleaned up. |
| CK-002 | OPEN | The repository test uses the real transactional producer, performs the enqueue before a controlled later failure, and then verifies the project row and matching pg-boss job are absent. However, the success case only queries from another connection after `repository.create` has returned. It does not observe the job from that connection before commit, so the required before/after-commit visibility proof is still missing. The rollback case also asserts only the project row and job are absent; it does not explicitly assert the bundle/manifest, workspaces, documents, execution, and grant rows are absent. |

## Direct remediation regressions

No direct regression was identified in the bounded remediation. Both targeted Compose test commands passed.

## Decision

The remediation resolves CK-001 but does not complete the CK-002 transaction-visibility and full-graph rollback proof. Record `CHANGES_REQUIRED` for IDSER-003 / `IDSER-BATCH-03`; keep the ticket at `awaiting_review` and return control to human/planning authority. No further CFC pass is authorized by this verification.
