---
name: cfc
description: Atlas bounded feedback-correction workflow. Use only when the user invokes `cfc` as the Atlas CK remediation command or explicitly authorizes remediation of an existing CK review.
---

# Atlas CFC Workflow

CFC performs one bounded remediation pass for accepted, in-scope findings in the latest consolidated CK review. The frozen ticket remains the authority; a CK statement is not a requirement by itself. The default remains one CFC pass followed by one CK verification; CFC cannot autonomously start another pass.

## Shared interpretation rule

GO, CK, CFC, and HMN MUST derive active-ticket scope, acceptance obligations,
validation obligations, evidence sufficiency, and finding closure from the
[shared Atlas Review Contract](../_shared/atlas-ticket-review-contract.md).
CFC MUST NOT substitute its own broader or narrower interpretation.

## Preflight

Read the frozen current ticket and its explicitly incorporated source references, the latest consolidated CK artifact, the reviewed commit, and the current remediation base. Proceed only when CK returned `CHANGES_REQUIRED` and the artifact identifies implementation-repairable findings that trace to current-ticket requirements. Preserve unrelated user changes and stage only authorized paths.

Also resolve the active-ticket tuple and read the shared Review Contract and
original frozen CK closure matrix. Do not operate from CK prose alone. Before
changing code, create a working progress view keyed to the original CK clause
IDs. For each authorized clause record its current status and evidence location;
link back to the CK artifact for ticket authority, required behavior/proof,
harness/scenario/observation, and closure oracle. Do not copy or rewrite those
criteria. Normalize and freeze a legacy matrix when needed without rewriting
old artifacts. Preserve already `PROVEN` rows and do not redesign them.

After CK has performed its allowed post-CFC verification and returned control to human/planning authority, do not begin another remediation from CK alone. Read the active newer HMN artifact under `project's goal/feedback/` during preflight. It must be explicitly delegated by a user `hmn` invocation, match the current ticket and unresolved finding/scope, be newer than the CK blocked event it addresses, remain within frozen-ticket authority, and have no later artifact that supersedes it. Only these HMN decisions authorize a new CFC cycle:

- `AUTHORIZE_NEXT_CFC`
- `AUTHORIZE_EVIDENCE_REMEDIATION`
- `AUTHORIZE_DIRECT_REGRESSION_REPAIR`

For uncommitted interrupted work, `CONTINUE_CURRENT_CFC` permits resuming the same authorized scope only. Confirm there is no remediation commit or CK handoff, that the partial worktree changes are in scope, and that the HMN record identifies what remains. It is not a new remediation cycle. Do not resume or consume a stale, mismatched, superseded, or scope-expanding HMN authorization.

Treat HMN as authorization to work on unresolved frozen clauses, not as a
source of acceptance criteria. Before acting on each HMN instruction, trace it
to both an unresolved CK clause and its ticket authority. If the HMN artifact
adds a test surface, scenario, or assertion not required by either, do not
silently adopt it as a readiness gate; record it as diagnostic-only or return
the authorization as out of scope for human/planning resolution.

For post-CFC HMN work, use HMN only to confirm that the user authorized work on
the named unresolved clause IDs. Read the closure oracle, CK-observed mismatch,
and required evidence directly from the referenced CK artifact. If an
authorized clause has no objective oracle or ticket trace, stop before editing
and return that CK review-contract defect to human/planning authority.

For each finding, identify the ticket requirement it enforces. If no such requirement exists, do not implement it. If it requires changing the ticket, reopening an approved predecessor, adding a provider/runtime/deployment target, making an architecture/product/policy decision, or doing future dependency work, stop and return it to human/planning authority as a scope-change issue.

## Remediate and hand off

Fix only the accepted in-scope findings from that consolidated review. Do not conduct a new review, create findings, change acceptance criteria, or add unrelated refactoring. Preserve approved predecessor boundaries. Run finding-specific validation and directly affected regressions; record exact results and limitations.

Complete the whole authorized closure matrix, not a convenient subset. Before
commit/handoff, perform a shadow-CK evidence check. If any authorized clause is
not `PROVEN` (including any required validation blocked by the environment,
unless the frozen ticket explicitly permits that validation to be skipped and
defines accepted alternative proof),
record `CFC_NOT_READY_FOR_CK` and continue the same authorized cycle; do not
hand off merely to discover what CK asks next. Use the ticket-required harness
and observations, not weaker substitutes.

The shadow-CK check MUST use the original CK artifact's frozen closure
condition. Extra HMN probes can be recorded as supporting evidence, but their
absence cannot make CFC unready unless the frozen ticket or CK clause requires
them. Never replace CK's matrix with a duplicated HMN-authored matrix.

If the execution window ends before closure, preserve partial in-scope work and
report interrupted/incomplete CFC. Do not create a completed checkpoint, mark
`awaiting_review`, consume the cycle, or hand off to CK. A valid
`CONTINUE_CURRENT_CFC` authorization resumes this uncommitted, in-scope work
only; it is not a new remediation cycle.

Create one bounded remediation commit, identify the CK findings it addresses, and, when HMN-authorized, record `HMN authorization consumed: <stable ID>` in the remediation checkpoint. Update the checkpoint to `awaiting_review` and stop for CK verification. CFC does not issue `PASS` and never invokes another CK/CFC cycle. After CK verification, unresolved findings or direct remediation regressions return to human/planning authority; there is no automatic second remediation pass.

The checkpoint MUST map each authorized clause to closure evidence, identify
direct regressions checked, and record `Internal readiness: READY_FOR_CK` before
`awaiting_review`.

For each clause, the checkpoint MUST name the test/assertion or other evidence
locator, the exact required command and its outcome (or the explicit permitted
environment limitation), and whether the frozen oracle passed. CK must be able
to map the evidence directly to the original CK clause and its HMN authorization
ID without inference.

## Authority

```text
frozen current ticket
> its explicit source references
> the published dependency interfaces/boundaries it consumes
> active bounded HMN authorization, when present
> repository evidence for implementation
> CK feedback only when it traces to that ticket authority
```

CFC repairs the ticket's accepted in-scope findings once. An HMN authorization is valid only within frozen-ticket authority; it cannot turn reviewer inference into scope.
