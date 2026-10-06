I am establishing a new human/planning-authorized remediation cycle for IDSER-001.

This authorization is limited to the unresolved portion of CK-002 identified after the previous CFC verification.

This is not a new product requirement and does not change the frozen IDSER-001 scope. The remediation is required to satisfy IDSER-001's existing invariant that wrong-scope membership, result, evidence, and relationship references must fail in PostgreSQL.

Use `IDSER-001-cross-scope-reference-integrity-feedback.md` as the bounded remediation specification.

Authorized work is limited to:

- add the new additive `0014` migration;
- bind `knowledge_index` to `semantic_candidate` using the full project/workspace/bundle/document scope tuple;
- bind non-null `reconciliation_relationship.target_semantic_id` to `knowledge_index` using the project/workspace/bundle scope tuple;
- add the specified real PostgreSQL same-scope positive and cross-scope negative tests;
- keep the Drizzle/schema declarations aligned where supported;
- run only the required IDSER-001 validation and directly affected regressions.

Do not reopen unrelated IDSER-001 work, broaden CK, introduce new architecture, or modify historical migrations.

Treat this as a newly authorized bounded remediation cycle from human/planning authority, not as an automatic continuation of the previous CFC pass.

After implementation, create one bounded remediation commit, return IDSER-001 to `awaiting_review`, and stop for CK verification.