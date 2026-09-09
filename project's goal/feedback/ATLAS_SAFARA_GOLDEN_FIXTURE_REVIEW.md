# Atlas Safara Golden Fixture Review

**Branch:** `codex/new-atlas`
**Reviewed HEAD:** `bf33b5e` - `fix(fixtures): derive reconciliation counts`
**Review result:** `CHANGES_REQUESTED`

## Summary

The Safara golden fixture has improved substantially. It now accounts for the three authoritative incremental PRDs, all 11 source pages, 138 inventoried source statements, 134 candidate assertions, 4 non-fact classifications, branch-relative materialized truth, generated projections, and a reconciliation report.

The strongest part of the implementation is the move toward explicit source accounting and page-grounded provenance.

However, I would not approve `BATCH-19.2` yet.

The main blocker is architectural: the generator now constructs repository state, changes, projections, and verification data directly instead of executing the five shared Atlas skill contracts that GLF-003 explicitly defines as the golden-fixture pipeline.

That makes the fixture internally consistent, but it weakens its role as an architecture contract.

---

# 1. Blocking: The Generator Bypasses the Five-Skill Architecture

GLF-003 defines the golden fixture pipeline as:

```text
atlas.prd-extraction
        |
        v
atlas.fixture-repository
        |
        v
atlas.fixture-changes
        |
        v
atlas.fixture-projections
        |
        v
atlas.fixture-verification
```

The ticket also requires each stage to expose inspectable:

- input
- output
- execution mode
- skill ID
- skill version
- execution provenance

The current generator instead directly constructs:

- assertions
- revisions
- branches
- materialized states
- staged proposal
- workflow projections
- facts projections
- CES projections
- chatbot projections

The final generated bundle only contains a lightweight extraction response structure.

It no longer demonstrates that the repository, changes, projections, and verification outputs satisfy the corresponding shared skill contracts.

## Why this matters

The golden fixture should test the architecture.

It should not become an alternative implementation of the architecture.

The dangerous state is:

```text
Golden Fixture Generator
        |
        +--> creates repository
        +--> creates changes
        +--> creates projections
        +--> validates itself
```

The intended state is:

```text
Golden Fixture Orchestrator
        |
        +--> atlas.prd-extraction
        |
        +--> atlas.fixture-repository
        |
        +--> atlas.fixture-changes
        |
        +--> atlas.fixture-projections
        |
        +--> atlas.fixture-verification
        |
        v
Deterministic publication gates
```

The orchestrator may coordinate the steps, but the skill contracts must remain the authoritative boundaries.

## Concrete contract drift already exists

### Projection contract drift

`atlas.fixture-projections` requires projection records to contain:

```text
recordId
assertionIds
dependencyIds
```

The current generator emits:

```text
recordId
assertionIds
candidateIds
inventoryIds
resolvedValue
```

but no `dependencyIds`.

That means the generated projection shape is already diverging from the shared skill schema.

### Repository contract drift

`atlas.fixture-repository` requires revision-level execution provenance.

The current generated revisions contain:

```text
revisionId
parentRevisionIds
acceptedAssertionIds
```

but no execution provenance.

### Change contract drift

`atlas.fixture-changes` requires a proposal containing fields such as:

```text
proposalId
branchId
baseRevisionId
targetSemanticKey
beforeValue
proposedValue
provenance
resolution
status
```

The current staged proposal is much smaller:

```text
proposalId
branchId
baseRevisionId
targetSemanticKey
status
```

## Required fix

Restore the five-skill orchestration boundary.

The fixture generator should:

1. load and validate immutable PRD artifacts,
2. invoke the PRD extraction contract,
3. invoke the repository contract,
4. invoke the change contract,
5. invoke the projection contract,
6. invoke the verification contract,
7. run deterministic topology and provenance gates,
8. publish only when all gates pass.

The fixture generator should not silently redefine the shared contract shapes.

---

# 2. Semantic Bug: `inc01.exclusions` Is Incorrectly Rewritten as `manifest.eligibility`

Increment 01 contains a statement equivalent to:

```text
Payments, documents, readiness, manifest, and reports
are not yet in scope for this increment.
```

The source inventory correctly models this as:

```text
semanticKey = inc01.exclusions
```

However, the generator special-cases it and rewrites it into:

```text
semanticKey = manifest.eligibility
value = {
  status: "out_of_scope"
}
```

Later, Increment 03 contains a real manifest eligibility rule:

```text
semanticKey = manifest.eligibility
value = {
  allowedReadiness: "Siap"
}
```

The generator then sees the same semantic key and treats the Increment 03 assertion as superseding the Increment 01 assertion.

That creates this history:

```text
manifest.eligibility
    |
    +-- v1: out_of_scope
    |
    +-- v2: allowedReadiness = Siap
```

But that is not what the PRDs say.

The two facts are different.

Increment 01 states a scope fact:

```text
Manifest functionality is outside Increment 01 scope.
```

Increment 03 states a business rule:

```text
Only ready pilgrims may enter the final manifest.
```

One is about capability scope.

The other is about manifest eligibility.

They should not share one canonical semantic key.

## Recommended model

Keep the original fact as something like:

```text
inc01.exclusions
```

or:

```text
scope.manifest = out_of_scope
```

and independently keep:

```text
manifest.eligibility.allowedReadiness = "Siap"
```

There should be no supersession relationship between them.

---

# 3. Automatic Supersession by Semantic-Key Collision Is Too Dangerous

The current generator effectively does:

```text
if semanticKey has appeared before:
    newAssertion.supersedesAssertionId = previousAssertion
```

That means Atlas infers historical replacement from key repetition.

That is too weak for an audit-oriented model.

A repeated semantic key can mean several different things:

- reinforcement
- clarification
- duplication
- unchanged restatement
- correction
- extension
- true supersession

Those should not all collapse into `supersedes`.

## Example

PRD-01:

```text
Only accepted payments affect the balance.
```

PRD-04:

```text
For clarity, only accepted payments affect the balance.
```

The second statement reinforces the first.

It does not supersede it.

Another example:

PRD-A:

```text
timeout = 30 minutes
```

PRD-B:

```text
timeout = 30 minutes
```

The second statement does not create a new current truth.

It confirms an existing truth.

## Recommended rule

A shared semantic key should mean:

```text
These assertions concern the same canonical concept.
```

It should not automatically mean:

```text
The later assertion replaces the earlier assertion.
```

Supersession should be explicit.

For example:

```text
relationship:
  type: supersedes
  targetAssertionId: ast-...
```

Possible relationship types may eventually include:

```text
supersedes
reinforces
clarifies
duplicates
extends
conflicts_with
```

For the current GLF phase, even supporting only explicit `supersedes` would already be safer than inferring it from ordering.

---

# 4. Exhaustive Accounting Is Stronger, but It Does Not Yet Prove Exhaustiveness

The GLF-003-02 goal is correct:

```text
Every material statement from all 11 source pages
must resolve to exactly one destination:
candidate assertion or justified non-fact.
```

The current validator now checks important things:

- exactly three authoritative Safara PRDs,
- exactly 11 pages,
- every page has inventory entries,
- every inventory ID is unique,
- every candidate maps one-to-one with an accepted assertion,
- exact quote and page provenance are preserved,
- materialized facts preserve candidate and inventory provenance,
- projections preserve assertion, candidate, and inventory relationships,
- invalid publication mutations fail,
- Buyer PRD authority is rejected.

These are all meaningful improvements.

However, there is still an important limitation.

The inventory itself is manually authored.

If one material sentence is deleted from `safara-source-catalog.mjs`, nothing independently derived from the PDF tells the validator:

```text
This source statement has disappeared from the inventory.
```

As long as the page still contains some other inventory entries, page-level coverage still passes.

So the current relationship is:

```text
PDF
 |
 v
Human-authored source inventory
 |
 v
Validator checks internal consistency
```

It is not yet:

```text
PDF
 |
 v
Independent source segmentation
 |
 v
Every source segment classified
 |
 v
Material facts
```

## Recommendation

Do not pretend this is mathematically exhaustive.

For Atlas, a human-reviewed reconciliation checkpoint is acceptable and probably desirable.

The important thing is to state the boundary accurately:

```text
The system proves that the authored source inventory is internally complete
and traceable against the source pages.

Human review remains responsible for confirming that the inventory itself
contains every material statement.
```

That preserves audit honesty.

---

# 5. Type-Level Provenance Drift

The generated materialized facts now preserve:

```text
semanticKey
assertionId
candidateId
inventoryId
value
```

That is good.

However, the exported `GoldenFixtureBundle` type currently exposes resolved facts only as:

```text
semanticKey
assertionId
value
```

So runtime fixture data contains more provenance than the public typed read contract guarantees.

This matters because later UI and chatbot code may depend on the typed resolver.

## Recommended fix

Extend the resolved fact type to include:

```text
candidateId
inventoryId
```

For example:

```text
resolvedFacts: Array<{
  semanticKey: string;
  assertionId: string;
  candidateId: string;
  inventoryId: string;
  value: unknown;
}>
```

The public read model should preserve the provenance already present in the fixture.

---

# 6. What Is Working Well

The review findings above should not obscure the improvement in this fixture.

The new Safara fixture is much stronger than the earlier narrow example.

The current model is approximately:

```text
3 immutable incremental PRDs
        |
        v
11 checked source pages
        |
        v
138 inventoried source statements
        |
        v
134 candidate assertions
        |
        v
accepted assertions
        |
        v
branch-relative materialized truth
        |
        +--> Main Workflow
        |
        +--> Project Facts
        |
        +--> CES
        |
        +--> Chatbot Context
```

The source PDFs are SHA-256 bound and page-grounded.

The reconciliation report is derived from fixture data rather than preselected target counts.

The negative publication tests are also valuable.

The current suite deliberately tests failures such as:

- missing fact
- corrupted page provenance
- Buyer PRD introduction
- duplicate assertion
- corrupted materialized-fact provenance
- corrupted projection provenance
- invalid material-to-non-fact classification

and verifies that a failed generation attempt does not overwrite the last valid golden fixture.

That is exactly the type of behavior an audit-oriented fixture should have.

---

# 7. HEAD-Keyed Read Model Is Aligned with the Git-Like Architecture

The branch resolver follows the intended read path:

```text
branch
  |
  v
HEAD revision
  |
  v
materialized state
  |
  v
projection
```

This is important.

The UI and chatbot should resolve current branch truth from the selected HEAD.

They should not rescan every PRD every time current truth is requested.

This direction matches the Git-like architecture:

```text
historical artifacts remain immutable
        |
        v
accepted assertions form revision history
        |
        v
branch HEAD selects current accepted truth
        |
        v
materialized state provides fast current reads
```

That is the correct foundation for GLF-004 and GLF-005.

---

# 8. Minor Bookkeeping Drift

The Git-Like Fixture Phase README still lists:

```text
GLF-003-02 = planned
```

while the ticket itself is already:

```text
State = awaiting_review
```

The phase index should be updated so review status does not drift between files.

---

# Review Decision

## Result

`CHANGES_REQUESTED`

## Blocking finding

Restore the five-skill contract boundary.

The golden fixture generator must not become an alternative authority implementation for repository state, changes, projections, and verification.

The shared Atlas skill contracts should remain the architectural boundaries, and the generator should orchestrate and validate them.

## Required changes before approval

1. Restore the five-skill orchestration pipeline.
2. Validate each skill input and output against its schema.
3. Restore inspectable skill execution provenance.
4. Restore required projection dependencies.
5. Restore the full staged change proposal contract.
6. Stop rewriting `inc01.exclusions` into `manifest.eligibility`.
7. Make supersession explicit instead of inferring it from repeated semantic keys.
8. Extend the public golden-fixture type with `candidateId` and `inventoryId`.
9. Update the phase README status for GLF-003-02.
10. Keep the reconciliation report as a human-reviewable source accounting checkpoint and document the boundary of what it proves.

---

# Suggested Architecture After Remediation

```text
Immutable PRD PDFs
        |
        v
Source Statement Inventory
        |
        v
atlas.prd-extraction
        |
        v
Candidate Assertions
        |
        v
atlas.fixture-repository
        |
        v
Repository Candidate
        |
        v
atlas.fixture-changes
        |
        v
Staged Change Proposal
        |
        v
Accepted Revision / Branch HEAD
        |
        v
Materialized Branch State
        |
        v
atlas.fixture-projections
        |
        +--> Main Workflow
        +--> Project Facts
        +--> CES
        +--> Chatbot Context
        |
        v
atlas.fixture-verification
        |
        v
Deterministic Publication Gates
        |
        v
Golden Fixture Bundle
```

The important distinction is:

```text
Skills reason and produce candidates.
Deterministic gates validate them.
Repository authority determines accepted truth.
Branch HEAD determines current truth.
The fixture generator only orchestrates the process.
```

That keeps the golden fixture aligned with Atlas's Git-like architecture instead of allowing the fixture implementation itself to become a second source of truth.

---

# Validation Note

This review is based on inspection of the committed `codex/new-atlas` branch state and the relevant GLF tickets, generator, source catalog, generated fixture, reconciliation report, skill schemas, and tests.

The fixture test command was not executed locally as part of this review.

Recommended validation command after remediation:

```bash
corepack pnpm --filter @atlas/fixtures test
```
