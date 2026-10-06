# HMN Authorization: IDSER-002

Ticket: `IDSER-002: Semantic contracts and production skills`
Batch: `IDSER-BATCH-02`
HMN authorization ID: `HMN-IDSER-002-001`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; remediation is required before the ticket can be reviewed again.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-002-semantic-contracts-and-production-skills.md`
Current HEAD: `af5bc33f85c385883a47abbdbad0ae17e98db5f3` (`docs(idser): record CFC remediation`)
Relevant GO commit: `f4b65f08c949d223a690ca0c3c1b6e98e7b797ff` (`feat(contracts): add semantic skill contracts`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-02-c75d8aa-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `c75d8aa1b12df9dbdafc2703fd37cce477584427` (`fix(contracts): address IDSER-002 CK findings`)
Prior HMN authorization: none found
Worktree state: no tracked modifications; pre-existing untracked planning and review artifacts are present, including the CK artifacts above.

## Diagnosis

The first CK review found four ticket-bound contract and evidence defects. The bounded CFC remediation at `c75d8aa` resolved CK-001 through CK-003 and made the production contracts materially correct for the reviewed behavior. The post-CFC CK verification found no direct regression, but CK-004 remains open because the frozen ticket's explicit validation matrix is incomplete.

The remaining work is evidence remediation, not a product or architecture decision: add the specified fixtures for empty extraction, ambiguity/unresolved candidate meaning, same-document contradiction, prior-neighborhood count boundaries, and 1 MiB context / 2 MiB result-envelope UTF-8 boundaries. The ticket already requires these tests and their limits; no acceptance criterion, dependency, provider policy, runtime design, or ticket scope needs reinterpretation.

## Ticket-authority trace

- IDSER-002 Validation requires positive and negative fixtures for every semantic kind and relationship; empty/non-fact-only content, ambiguous statements, same-document contradictions and questions; boundaries at and above all count/byte caps; malformed envelopes; and multibyte accounting.
- IDSER-002 Handoff and limits fixes the 1 MiB serialized semantic context, 500 prior candidates, and 2 MiB result-envelope limits.
- `IDSER-BATCH-02-f4b65f0-review.md` issued CK-004 for the missing fixture matrix.
- `IDSER-BATCH-02-c75d8aa-verification.md` confirms CK-001 through CK-003 resolved and identifies the exact remaining CK-004 cases, returning control to human/planning authority.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one new, bounded CFC cycle for CK-004 only. This authorization is newer than the CK verification it addresses and is consumed by exactly one remediation commit. It does not authorize another remediation cycle after a later CK result.

## Authorized scope

1. Extend the IDSER-002 semantic contract test fixtures and only the supporting test helpers or deterministic contract validation code strictly necessary to exercise the required cases.
2. Add positive and negative coverage for:
   - a fully empty extraction result permitted by the frozen contract;
   - an unresolved or ambiguous extraction candidate and its question;
   - a same-document contradiction relationship scenario;
   - prior-candidate limits at 500 and 501;
   - extraction/reconciliation context UTF-8 JSON boundaries at 1 MiB and just over 1 MiB; and
   - semantic result-envelope UTF-8 JSON boundaries at 2 MiB and just over 2 MiB.
3. Preserve the previously resolved CK-001 through CK-003 coverage and the existing all-kind/all-relationship matrix. If a fixture exposes a deterministic parser defect that directly prevents the ticket-required case, repair only that defect and add the matching regression fixture.
4. Record this authorization ID in the CFC remediation evidence and make one bounded remediation commit.

## Required validation

- Run `git diff --check` for the remediation diff.
- In Docker Compose, run the registered `@atlas/contracts` test and typecheck scripts and the registered `@atlas/skills` test and typecheck scripts.
- Show that at-limit cases pass and just-over-limit cases fail deterministically, including multibyte UTF-8 accounting where applicable.
- Confirm no provider/model/endpoint field, fixture-runtime authority, persistence mutation, dispatcher, or UI behavior was introduced.

## Forbidden work

- Do not change the frozen IDSER-002 scope, acceptance criteria, numeric limits, semantic vocabulary, provider-neutral boundary, source-accounting rules, or local-versus-canonical identity model.
- Do not implement runtime dispatch, DB mutation, semantic context routing, worker execution, review projections, UI, IDSER-003 work, or a new production architecture.
- Do not redesign correct production contracts merely to avoid writing validation evidence.
- Do not begin another CFC cycle after this remediation without a new explicit user `hmn` invocation and a new HMN artifact.

## Handoff

This opens one bounded evidence-remediation CFC cycle for `HMN-IDSER-002-001`. After the remediation is committed and evidence is recorded, set the checkpoint to `awaiting_review` and hand the exact commit to CK. CK must review the bounded remediation; this authorization is not a PASS record.

Expected next command: `cfc IDSER-002`
