# IDSER-001 Review Feedback - Cross-Scope Referential Integrity Remediation

## Status

**Review result:** `CHANGES_REQUIRED`

**Ticket:** `IDSER-001 - Domain and persistence foundation`

**Reviewed branch:** `codex/new-atlas-backend`

**Reviewed head:** `63fb27f380f7223a93957d3a985a24e518ac88e0`

The current IDSER-001 remediation improves scope integrity across several persistence boundaries, but two relationship edges still allow valid IDs from the wrong Atlas scope to be linked together.

This violates IDSER-001's explicit invariant:

> Wrong-scope membership, result, evidence, and relationship references must fail in PostgreSQL.

The remaining defects are database-level referential-integrity defects and must be corrected in PostgreSQL, not only through application validation.

---

## Finding 1 - `knowledge_index` can reference a candidate from another Atlas scope

### Current state

`atlas.knowledge_index` contains:

- `semantic_candidate_id`
- `project_id`
- `workspace_id`
- `bundle_id`
- `document_id`

However, the current remediation constraint is effectively:

```sql
FOREIGN KEY (semantic_candidate_id)
REFERENCES atlas.semantic_candidate(id)
```

The constraint proves only that the candidate ID exists.

It does **not** prove that the referenced candidate belongs to the same:

- project,
- workspace,
- bundle,
- document.

Therefore a valid candidate from Project A can still be inserted into a `knowledge_index` row declaring Project B scope, provided the other independently referenced scope rows are valid.

The rows are individually valid, but their relationship is not.

### Required correction

Add a composite referenced key on `atlas.semantic_candidate`:

```sql
ALTER TABLE atlas.semantic_candidate
ADD CONSTRAINT semantic_candidate_scope_key
UNIQUE (
  id,
  project_id,
  workspace_id,
  bundle_id,
  document_id
);
```

Then replace the misleading single-column `knowledge_index_candidate_scope_fkey` with a real scope-bound foreign key:

```sql
ALTER TABLE atlas.knowledge_index
DROP CONSTRAINT IF EXISTS knowledge_index_candidate_scope_fkey;

ALTER TABLE atlas.knowledge_index
ADD CONSTRAINT knowledge_index_candidate_scope_fkey
FOREIGN KEY (
  semantic_candidate_id,
  project_id,
  workspace_id,
  bundle_id,
  document_id
)
REFERENCES atlas.semantic_candidate (
  id,
  project_id,
  workspace_id,
  bundle_id,
  document_id
);
```

After this change, PostgreSQL must reject any `knowledge_index` row where the candidate exists but any part of its declared scope differs from the candidate's actual scope.

---

## Finding 2 - `reconciliation_relationship.target_semantic_id` can cross bundle scope

### Current state

The current remediation correctly added a scoped foreign key for:

```text
reconciliation_relationship.source_semantic_id
```

using:

```text
semantic_id + project_id + workspace_id + bundle_id
```

However, `target_semantic_id` still relies only on:

```sql
FOREIGN KEY (target_semantic_id)
REFERENCES atlas.knowledge_index(semantic_id)
```

This proves only that the target semantic exists.

It does **not** prove that the target semantic belongs to the relationship's:

- project,
- workspace,
- bundle.

Therefore a relationship declared for Bundle A can point at a valid indexed semantic from Bundle B.

### Required correction

Migration `0013` already provides the necessary referenced key:

```sql
ALTER TABLE atlas.knowledge_index
ADD CONSTRAINT knowledge_index_bundle_scope_key
UNIQUE (
  semantic_id,
  project_id,
  workspace_id,
  bundle_id
);
```

Add the missing target-side composite foreign key:

```sql
ALTER TABLE atlas.reconciliation_relationship
ADD CONSTRAINT reconciliation_relationship_target_scope_fkey
FOREIGN KEY (
  target_semantic_id,
  project_id,
  workspace_id,
  bundle_id
)
REFERENCES atlas.knowledge_index (
  semantic_id,
  project_id,
  workspace_id,
  bundle_id
);
```

`target_semantic_id` remains optional.

PostgreSQL's normal composite foreign-key behavior must preserve `NULL` as a valid no-target relationship while enforcing the complete scope tuple whenever `target_semantic_id` is populated.

---

## Migration requirement

Do **not** rewrite historical IDSER migrations.

Do not modify:

- `0009_idser001_domain_persistence_foundation.sql`
- `0010_idser001_manifest_trigger_fix.sql`
- `0011_idser001_manifest_trigger_delete_fix.sql`
- `0012_idser001_bundle_document_cleanup.sql`
- `0013_idser001_scope_and_lifecycle_remediation.sql`

Create a new additive migration after `0013`.

Recommended logical purpose:

```text
0014_idser001_cross_scope_reference_integrity
```

The exact filename may follow the repository's existing migration naming convention, but it must be a new ordered migration.

Register it in the migration runner after `0013`.

---

## Required PostgreSQL negative tests

The existing semantic-foundation test does not currently prove these invariants because it does not build the complete semantic candidate/index/reconciliation graph.

The remediation must add database-backed negative tests using real PostgreSQL constraints.

The test setup must create **valid independent scopes** so the failure is caused specifically by the composite relationship constraint and not by an unrelated missing-row FK.

### A. `knowledge_index -> semantic_candidate`

Create at least two valid scopes with legitimate candidates.

For example:

```text
Scope A
  project A
  workspace A
  bundle A
  document A
  candidate A

Scope B
  project B
  workspace B
  bundle B
  document B
```

Then verify PostgreSQL rejects all of the following while `semantic_candidate_id = candidate A` remains a valid existing ID:

1. Candidate A + `project_id = project B`
2. Candidate A + `workspace_id = workspace B`
3. Candidate A + `bundle_id = bundle B`
4. Candidate A + `document_id = document B`

Each case must fail at the database constraint boundary.

A same-scope positive insert must also succeed.

---

### B. `reconciliation_relationship.target_semantic_id -> knowledge_index`

Create valid indexed semantics in separate scopes.

Then verify PostgreSQL rejects:

1. Relationship in Project A targeting a semantic from Project B
2. Relationship in Workspace A targeting a semantic from Workspace B
3. Relationship in Bundle A targeting a semantic from Bundle B

The source semantic should remain valid and same-scope in these tests so the failure is specifically attributable to the target boundary.

Also verify:

- same-scope target succeeds;
- `target_semantic_id = NULL` remains valid where the relationship model allows no target.

There is no `document_id` on `reconciliation_relationship`, so document-level enforcement is not required at this edge. Document integrity is enforced when the semantic enters `knowledge_index`.

---

## Test construction requirement

Do not write tests where the "wrong scope" ID simply does not exist.

That only proves ordinary foreign-key existence checks.

The tests must deliberately use:

- existing Project B,
- existing Workspace B,
- existing Bundle B,
- existing Document B,
- existing Candidate B / indexed semantic B,

and then mix those valid identities into Scope A records.

The invariant being tested is:

```text
valid referenced row
+
wrong owning scope
=
PostgreSQL rejection
```

not:

```text
missing referenced row
=
PostgreSQL rejection
```

---

## Drizzle/schema alignment

`packages/atlas-db/src/schema.ts` currently represents these references primarily as single-column `.references(...)` relationships.

After the SQL correction, keep the declared schema aligned with the actual database model as far as the repository's Drizzle version supports composite foreign keys and unique constraints.

At minimum, the schema must not continue to communicate that these are merely ID-level relationships if PostgreSQL now treats them as scope-bound relationships.

Required logical relationships:

```text
knowledge_index
  (
    semantic_candidate_id,
    project_id,
    workspace_id,
    bundle_id,
    document_id
  )
    ->
semantic_candidate
  (
    id,
    project_id,
    workspace_id,
    bundle_id,
    document_id
  )
```

and:

```text
reconciliation_relationship
  (
    target_semantic_id,
    project_id,
    workspace_id,
    bundle_id
  )
    ->
knowledge_index
  (
    semantic_id,
    project_id,
    workspace_id,
    bundle_id
  )
```

Do not weaken the PostgreSQL constraint merely because an ORM declaration is inconvenient.

PostgreSQL is the authoritative enforcement boundary for IDSER-001.

---

## Required validation

The remediation is complete only when all of the following are demonstrated:

1. Migration chain applies successfully from the current pre-`0014` state.
2. Existing IDSER/PCC/BSS data survives the additive migration.
3. Same-scope `knowledge_index -> semantic_candidate` insertion succeeds.
4. Cross-project candidate indexing is rejected.
5. Cross-workspace candidate indexing is rejected.
6. Cross-bundle candidate indexing is rejected.
7. Cross-document candidate indexing is rejected.
8. Same-scope reconciliation target succeeds.
9. Cross-project reconciliation target is rejected.
10. Cross-workspace reconciliation target is rejected.
11. Cross-bundle reconciliation target is rejected.
12. Nullable `target_semantic_id` behavior remains valid.
13. Existing source-side `reconciliation_relationship_source_scope_fkey` remains enforced.
14. Existing Bridge/Atlas permission isolation remains unchanged.
15. Core/DB typechecks continue to pass.
16. Migration check continues to pass.
17. Existing IDSER semantic-foundation tests continue to pass alongside the new negative cases.

---

## Non-goals

This remediation must remain bounded to IDSER-001 referential integrity.

Do not introduce:

- worker implementation,
- queue activation,
- provider/Mistral runtime behavior,
- extraction execution behavior,
- reconciliation execution behavior,
- publication,
- master truth resolution,
- revision/HEAD semantics,
- UI changes,
- additional workspace lifecycle design,
- new Bridge authority,
- application-only scope validation as a substitute for PostgreSQL constraints.

No new architectural authority should be created.

---

## Acceptance criteria for this remediation

The remediation passes review only if PostgreSQL itself guarantees:

### Candidate indexing invariant

For every populated `knowledge_index.semantic_candidate_id`:

```text
knowledge_index.project_id
knowledge_index.workspace_id
knowledge_index.bundle_id
knowledge_index.document_id
```

must equal the corresponding scope of the referenced `semantic_candidate`.

A candidate ID from another valid scope must not be indexable.

### Reconciliation target invariant

For every non-null `reconciliation_relationship.target_semantic_id`:

```text
reconciliation_relationship.project_id
reconciliation_relationship.workspace_id
reconciliation_relationship.bundle_id
```

must equal the scope of the referenced `knowledge_index` row.

A valid indexed semantic from another scope must not be targetable.

---

## Review checkpoint

The previous remediation at commit:

```text
63fb27f380f7223a93957d3a985a24e518ac88e0
```

must remain `awaiting_review / CHANGES_REQUIRED` for IDSER-001 until these two scope edges are enforced and demonstrated with negative PostgreSQL tests.

The follow-up CFC should report exactly:

- the new migration added;
- the composite unique/FK constraints created;
- the negative cross-project/workspace/bundle/document tests added;
- the positive same-scope tests;
- nullable target behavior;
- migration/typecheck/permission regression results.

CFC must not declare the ticket approved.

After remediation, return IDSER-001 to `awaiting_review` for CK.
