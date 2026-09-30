# IDSER-010-03: Deterministic failure-authority partition record

- **State:** `partitioned-planned`; this is not a GO target and has no review batch.
- **Predecessor:** IDSER-010-02 `PASS`.

The original IDSER-010 failure scope has two independent closure oracles and is therefore recursively partitioned:

```text
010-02 PASS -> 010-03-01 creation/kickoff rollback PASS
             -> 010-03-02 semantic failure containment PASS -> 010-04
```

`010-03-01` owns the all-or-nothing project/DocumentStore/initial pg-boss transaction. `010-03-02` owns context/result/provider/schema/evidence/inventory/reference rejection after semantic execution begins, including Scenario G. Both must prove their complete local contracts before handoff. Neither may consume the other's proof, and neither authorizes changes to the approved failure lifecycle, schema, queue, worker, or provider architecture.

## Partition self-check

Each executable child has one dominant implementation/proof surface, one finite CK decision and a locally repairable CFC boundary: transaction rollback in 03-01; semantic-authority terminal containment in 03-02. HMN receives only a single residual assertion in that surface. The final 010-06 checkpoint consumes both `PASS` records and does not repair either authority.
