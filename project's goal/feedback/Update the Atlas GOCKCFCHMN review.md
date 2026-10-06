Update the Atlas GO/CK/CFC/HMN review protocol to support the already-established supplemental `REVIEW_CONTRACT_GAP` recovery path without weakening ordinary CFC authorization.

The current protocol successfully supports:

`REVIEW_CONTRACT_GAP`
→ human/planning decision
→ HMN-authorized supplemental CK contract-gap freeze

but CFC currently requires the latest CK result to be `CHANGES_REQUIRED`, leaving no legal transition from a successfully frozen supplemental gap matrix into evidence remediation.

Add the following bounded recovery rule.

A CFC cycle may consume a supplemental `REVIEW_CONTRACT_GAP` artifact only when all of the following are true:

1. the gap was previously returned to human/planning authority;
2. a durable planning decision explicitly authorized a supplemental contract-gap freeze;
3. CK created a supplemental frozen closure matrix containing stable clause IDs;
4. every supplemental clause traces directly to the existing frozen ticket;
5. the supplemental artifact does not reopen, renumber, modify, or strengthen historical resolved clauses;
6. the supplemental clauses remain unresolved;
7. a newer explicit user `hmn` invocation produced `AUTHORIZE_EVIDENCE_REMEDIATION`;
8. that HMN authorization names only the unresolved supplemental clause IDs; and
9. no later artifact supersedes that authorization.

Under those conditions only, CFC may treat the supplemental frozen clauses as the bounded remediation target even though the CK artifact result is `REVIEW_CONTRACT_GAP` rather than `CHANGES_REQUIRED`.

This does not make ordinary `REVIEW_CONTRACT_GAP` CFC-authorizing. A gap without the planning decision, supplemental frozen matrix, and newer HMN evidence-remediation authorization must still return to human/planning authority.

For supplemental-gap CFC:

- use the supplemental CK artifact as the source of its frozen closure oracles;
- preserve every historical resolved clause as protected;
- remediate/prove only the supplemental clause IDs selected by HMN;
- do not restart broad review;
- commit one bounded remediation checkpoint;
- hand off to CK.

CK must then support a corresponding supplemental-gap verification path:

- verify only the supplemental frozen clauses selected by the consumed HMN authorization;
- inspect the relevant remediation diff and direct regressions introduced by it;
- preserve all historical resolved findings;
- return `PASS` when all original ticket-derived clauses and all supplemental ticket-derived clauses are proven and no direct regression remains;
- otherwise return control to human/planning authority using the existing bounded rules.

HMN should recognize a completed supplemental CK freeze as eligible for `AUTHORIZE_EVIDENCE_REMEDIATION` when the supplemental clauses are frozen, unresolved, ticket-traceable, and no product/scope/architecture decision remains.

Update the shared Atlas Review Contract plus GO/CK/CFC/HMN consumers only where required to make this transition deterministic. Do not alter the meaning of ordinary `CHANGES_REQUIRED`, ordinary `REVIEW_CONTRACT_GAP`, existing resolved-clause protection, or the one-user-invocation-per-remediation-cycle rule.

Apply the Atlas review workflow regression benchmark after changing the protocol.

After this protocol correction is committed, return to IDSER-007. The next workflow sequence is:

`hmn IDSER-007`
→ authorize `AUTHORIZE_EVIDENCE_REMEDIATION` for `CK-SUP-001.a` and `CK-SUP-002.a` only
→ `cfc IDSER-007`
→ `ck IDSER-007`.