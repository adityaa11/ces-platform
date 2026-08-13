# CES-GF-AGB-014 - Coverage-Gap Routing and Safara End-to-End Replay

**Status:** Implemented candidate; pending REVIEW_GATE
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-007, AGB-008, AGB-010, AGB-011, AGB-012, and AGB-013
**Blocks:** Resume of final POL-008 taxonomy approval

## Outcome

Connect valid coverage gaps to the appropriate registered knowledge agent and
prove the complete Safara suspend/resume cycle reaches the accepted
Coverage-V4-equivalent semantic state without manual Codex authorship.

## Scope

- Validate exact accounting before routing.
- Route only `SOURCE_OR_POLICY_GAP` by earliest incomplete layer to extraction,
  canonicalization, or taxonomy agents.
- Persist proposals/evidence, suspend for REVIEW_GATE, consume accepted
  publications, and rerun coverage.
- Replay the historical Safara V1-to-V4 semantic progression using golden
  fixtures and external authority events.

## Acceptance contract

- Invalid/incomplete coverage fails; `DECISION_REQUIRED` does not activate a
  knowledge agent.
- Every bridge execution remains bounded and every authority transition occurs
  outside the agent boundary.
- Fact-level support retains only the canonical/raw branch materially relevant
  to that fact.
- Safara ends with exactly 111 accounted facts: 82 awareness, 24 no-security-
  awareness-required, 5 outside-software-scope, 0 decision-required, and 0
  source-or-policy gaps.
- Golden success is semantic/governance equivalence, not byte-for-byte prose or
  a universal requirement to reach a literal V4.
- Duplicate/no-progress fixtures suspend instead of looping.

## Explicit non-goals

- Self-accepting proposals or coverage, replacing Atlas fact approval, final
  POL-008 approval, starting POL-009, or making Safara-specific Policies.

## Review focus

End-to-end authority separation, routing correctness, suspension/resume,
non-convergence, fact-level lineage, golden equivalence, and terminal counts.

## Implementation evidence

- Policies-owned orchestration validates complete governed accounting and
  creates one bounded workflow per `SOURCE_OR_POLICY_GAP`; `DECISION_REQUIRED`
  activates no agent.
- Earliest incomplete layers route only to the registered extraction,
  canonicalization, or taxonomy agent identities.
- Agent execution records attempts, proposals, and deterministic validation,
  then suspends for REVIEW_GATE. Only externally accepted review/publication
  evidence resumes coverage evaluation.
- Historical Safara v1-v4 fixtures exercise all three routes and finish with
  exactly 111 facts: 82 awareness, 24 no-awareness-required, 5 outside scope,
  and no unresolved decisions or knowledge gaps.
- Fact support filtering retains only the materially relevant fact branch;
  accepted AGB-011 non-convergence controls remain the retry/loop boundary.
