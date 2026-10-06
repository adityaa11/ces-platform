Planning decision for IDSER-007 `REVIEW_CONTRACT_GAP`:

The review-contract gap must be closed through a supplemental frozen CK closure boundary. Do not rewrite, reopen, renumber, or strengthen the original IDSER-007 frozen CK matrix.

The two omitted observations are legitimate existing IDSER-007 requirements because the frozen ticket's `Validation` section explicitly requires:

1. concurrent distinct bundles/users; and
2. actual worker restart evidence.

These requirements existed before GO and the first CK review. They are therefore not new acceptance criteria, scope expansion, reviewer preference, or HMN-authored requirements. The review defect is that the first CK review failed to freeze them into its closure matrix.

Authorize a one-time review-contract repair with the following boundary:

- Preserve every existing resolved CK-001/CK-002/CK-003 clause as resolved and protected.
- Do not reopen their implementation or evidence.
- Do not modify the historical CK artifacts.
- Create a supplemental IDSER-007 CK review-contract-gap artifact derived directly from the existing IDSER-007 `Validation` authority.
- Freeze exactly two supplemental unresolved closure clauses:
  - distinct-bundle/distinct-user concurrency evidence using the ticket-required real DB/queue Compose boundary;
  - actual worker-restart evidence using the ticket-required worker/Compose boundary.
- The supplemental artifact must define objective closure oracles and evidence expectations only for those two existing ticket requirements.
- It must explicitly state that it repairs an omission in the original review contract and does not constitute a new review, new acceptance criteria, or reopening of resolved findings.
- No other IDSER-007 requirement may be added, strengthened, or rediscovered during this contract repair.

After the supplemental closure clauses are frozen, return to human/HMN authority. A subsequent explicit `hmn IDSER-007` may authorize `AUTHORIZE_EVIDENCE_REMEDIATION` for those supplemental unresolved clause IDs only.

That bounded CFC may add or adjust only the test/fixture/evidence needed to prove those two clauses unless an actual implementation defect is exposed by the required tests. Existing resolved implementation and evidence remain protected.

After the CFC checkpoint, CK verifies only:

1. the two supplemental frozen gap clauses;
2. the remediation diff relevant to them; and
3. direct regressions introduced by that remediation.

If both supplemental clauses are proven and no direct regression exists, IDSER-007 may receive `PASS`.

Immediate next workflow command: `ck IDSER-007` to perform the authorized supplemental review-contract-gap freeze only.

Do not run CFC yet.