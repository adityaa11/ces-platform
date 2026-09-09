# Atlas Golden Fixture Re-Review

**Branch:** `codex/new-atlas`
**Reviewed HEAD:** `caae158b6ff904eeaf1981b5c8ad45a3e4aead52`
**HEAD message:** `fix(fixtures): derive projected record count`
**Primary remediation commit:** `a13858cf9f0b33e610a0f34deea478d23c9c377a`
**Review result:** `CHANGES_REQUESTED`

## Summary

The previous review feedback has been substantially resolved.

The fixture architecture is now much closer to the intended Git-like Atlas model:

- shared skill envelopes are present for all five stages,
- skill inputs and outputs are schema-validated,
- revision execution provenance is recorded,
- projection dependencies are restored,
- the staged proposal uses the full change contract,
- `inc01.exclusions` is no longer conflated with `manifest.eligibility`,
- supersession is explicit instead of inferred from semantic-key repetition,
- materialized fact provenance is exposed through the public typed resolver,
- the reconciliation report now states the correct human-review boundary,
- GLF-003-02 status drift in the phase README has been corrected.

The remaining blocker is narrower than before:

> `atlas.fixture-verification` is schema-valid but still incomplete relative to its own required instruction checks.

There is also a ticket-state consistency issue across the GLF phase records.

---

# 1. Previous Findings Status

| Previous finding | Status |
|---|---|
| Restore five skill envelopes | RESOLVED |
| Validate skill input/output schemas | RESOLVED |
| Record execution provenance | RESOLVED |
| `dependencyIds` missing | RESOLVED |
| Incomplete staged proposal | RESOLVED |
| `inc01.exclusions` rewritten as `manifest.eligibility` | RESOLVED |
| Automatic supersession on semantic-key collision | RESOLVED |
| Exhaustiveness claim overstated | RESOLVED |
| `candidateId` / `inventoryId` missing from public type | RESOLVED |
| README says GLF-003-02 `planned` | RESOLVED |
| Verification skill performs all required architectural checks | STILL INCOMPLETE |

---

# 2. Semantic Identity Is Now Correct

The previous generator incorrectly transformed:

```text
inc01.exclusions
```

into:

```text
manifest.eligibility
```

with an `out_of_scope` value.

That created a false history where the Increment 03 manifest eligibility rule appeared to supersede an Increment 01 scope statement.

The current implementation no longer performs that rewrite.

The source statements remain independent:

```text
inc01.exclusions
```

and:

```text
manifest.eligibility
```

This is the correct model because they describe different concepts:

```text
inc01.exclusions
    = capability / increment scope

manifest.eligibility
    = business eligibility rule
```

The fixture test now explicitly protects this distinction.

Conceptually, Atlas now treats:

```text
same semantic identity
```

separately from:

```text
historical replacement
```

which is the correct direction for audit history.

---

# 3. Supersession Is Now Explicit

The previous implementation automatically applied:

```text
later assertion with same semanticKey
    =>
supersedes previous assertion
```

That was unsafe because repeated semantic identity can mean:

- reinforcement,
- clarification,
- duplication,
- restatement,
- extension,
- correction,
- actual supersession.

The current assertion builder now only sets:

```text
supersedesAssertionId
```

when the inventory explicitly declares a relationship equivalent to:

```text
relationship.type = supersedes
```

This is a major improvement.

The correct mental model is now:

```text
semanticKey
    = same canonical concept

supersedes
    = explicit historical relationship
```

rather than assuming those two meanings are interchangeable.

---

# 4. The Shared Skill Contract Boundary Has Been Restored Structurally

The generator now loads all five Atlas skill manifests:

```text
atlas.prd-extraction
atlas.fixture-repository
atlas.fixture-changes
atlas.fixture-projections
atlas.fixture-verification
```

Each recorded stage contains inspectable:

```text
input
response
skillId
skillVersion
executionProvenance
status
```

AJV validation is now applied to both the input and output schema for each stage.

The generator also checks:

```text
skill identity
skill version
execution mode
stage status
```

before allowing publication.

The generated bundle now records:

```text
skillResponses
    |
    +-- extractionResponses
    +-- repositoryResponse
    +-- changeResponse
    +-- projectionResponses
    +-- verificationResponses
```

instead of only preserving lightweight extraction output.

The tests independently validate these recorded envelopes against the shared skill contracts.

This resolves the largest mechanical part of the previous review finding:

> The fixture generator must not silently redefine the shared contract shapes.

---

# 5. Revision Execution Provenance Is Fixed

Repository revisions now contain explicit execution provenance.

For example, the Master and Increment 03 revisions carry provenance associated with:

```text
atlas.fixture-repository
skill version
execution mode
```

The deterministic validator also rejects revisions without execution provenance.

This gives Atlas a stable answer to:

```text
How was this branch HEAD revision authored?
```

without depending on the mutable environment that happens to be active when the fixture is later read.

That matches the intended Git-like architecture:

```text
execution environment at authoring time
        |
        v
recorded into revision provenance
        |
        v
immutable historical fact
```

---

# 6. The Staged Change Proposal Is Now Meaningful

The previous proposal was too small:

```text
proposalId
branchId
baseRevisionId
targetSemanticKey
status
```

The current staged change includes:

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

This better reflects the intended correction flow:

```text
User correction
      |
      v
Chatbot mediation
      |
      v
Candidate change proposal
      |
      v
Human review / resolution
      |
      v
Accepted revision
```

The proposal remains:

```text
status = staged
```

and does not silently alter accepted branch truth.

That is important because Atlas corrections should not mutate canonical truth merely because a reasoning stage produced a plausible candidate.

---

# 7. Projection Dependencies Are Restored

Projection records now include:

```text
recordId
assertionIds
dependencyIds
candidateIds
inventoryIds
resolvedValue
```

The missing `dependencyIds` contract drift has therefore been fixed.

For the current fixture phase, mapping projection dependencies directly to the assertions that feed the record is reasonable.

This gives later UI and CES logic a deterministic path for answering:

```text
Which visible outputs may be affected if this assertion changes?
```

That is important for future targeted recalculation instead of full rescans.

---

# 8. Public Typed Provenance Is Fixed

The public golden fixture read type now exposes materialized facts as:

```text
semanticKey
assertionId
candidateId
inventoryId
value
```

Previously, runtime data had `candidateId` and `inventoryId`, but the public type omitted them.

That mismatch is now resolved.

Future UI and chatbot layers can therefore resolve:

```text
branch
  |
  v
HEAD
  |
  v
materialized current fact
  |
  +-- assertion
  +-- extraction candidate
  +-- source inventory statement
```

without abandoning the typed branch read contract.

---

# 9. The Exhaustiveness Boundary Is Now Honest

The reconciliation report now explicitly states that it proves:

```text
traceability
+
internal consistency
of the authored source inventory
```

while human review remains responsible for confirming that:

```text
the inventory itself contains every material source statement
```

This is the correct boundary.

The machine can prove:

```text
every inventoried statement has one valid destination
every candidate maps to one assertion
every assertion maps back to source provenance
every projection maps back to accepted assertions
```

The machine cannot independently prove:

```text
a human never forgot to inventory one material sentence
```

unless an independent segmentation layer is introduced.

For Atlas, preserving that distinction is better than making an exaggerated completeness claim.

---

# 10. Remaining Blocking Finding: Verification Is Schema-Valid but Instruction-Incomplete

This is the primary remaining issue.

The `atlas.fixture-verification` skill instruction requires architectural checks covering areas such as:

```text
1. branch HEAD resolution
2. revision parent resolution
3. proposal base revision resolution
4. accepted assertion and source provenance
5. supersession integrity
6. staged proposal isolation
7. approved proposal branch movement
8. projection branch/HEAD consistency
9. cross-surface semantic consistency
10. branch isolation / no cross-contamination
11. unresolved merge-conflict integrity
```

The exact applicability depends on the fixture scenario, but the verification stage is expected to cover the required architecture invariants.

The current `verificationResponse()` only implements three checks:

```text
branch-heads-resolve
projection-heads-match
projection-provenance
```

This creates a dangerous distinction:

```text
SKILL.md
    says many checks are required

generator
    produces three checks

JSON schema
    only requires a non-empty checks array

AJV
    accepts the response

contract gate
    considers the stage valid
```

So Atlas can currently produce:

```text
atlas.fixture-verification = pass
```

without proving that the verification instruction was fully executed.

That is the remaining architectural hole.

---

# 11. Why Schema Validity Is Not Enough

JSON Schema can prove:

```text
the response has the expected shape
```

but not necessarily:

```text
the reasoning contract was completely executed
```

For example:

```json
{
  "status": "pass",
  "checks": [
    {
      "checkId": "branch-heads-resolve",
      "status": "pass"
    }
  ]
}
```

may be structurally valid while still omitting required semantic checks.

The deterministic gate therefore needs to validate check completeness, not only check structure.

---

# 12. Recommended Verification Fix

Define a deterministic required-check registry.

For example:

```text
requiredVerificationChecks = [
  branch-heads-resolve,
  revision-parents-resolve,
  proposal-base-resolves,
  assertion-source-provenance,
  supersession-integrity,
  staged-proposal-isolation,
  projection-heads-match,
  cross-surface-semantic-consistency,
  branch-isolation,
  unresolved-conflict-integrity
]
```

Then publication should require:

```text
for every required applicable check:
    check exists
    check status is pass
```

not merely:

```text
checks.length >= 1
```

If a check is not applicable to the current fixture, that should also be explicit and deterministic rather than silently omitted.

For example:

```text
checkId: approved-proposal-branch-movement
status: not_applicable
reason: fixture contains staged proposal only
```

If the current schema does not support `not_applicable`, either:

1. add it deliberately to the verification contract, or
2. maintain a deterministic applicability matrix outside the reasoning result.

The important requirement is:

```text
absence must never be interpreted as successful verification
```

---

# 13. Recommended Verification Architecture

A stronger model would be:

```text
atlas.fixture-verification
        |
        v
advisory verification candidate
        |
        v
schema validation
        |
        v
required-check completeness gate
        |
        v
deterministic topology / provenance checks
        |
        v
publication allowed
```

This preserves the correct authority boundary:

```text
skill
    reasons and reports

deterministic Atlas code
    decides whether the candidate is sufficient for publication
```

That keeps the verification skill non-authoritative while still preventing incomplete reasoning from being treated as complete.

---

# 14. Ticket-State Consistency Issue

The previous README drift for GLF-003-02 has been fixed.

Both the phase README and GLF-003-02 now say:

```text
awaiting_review
```

However, another state inconsistency remains.

The phase README says:

```text
GLF-002 = approved
```

while the GLF-002 ticket itself says:

```text
State = awaiting_review
```

There is also a dependency inconsistency.

GLF-003-02 says:

```text
Depends on: GLF-003-01 approved
```

while GLF-003-01 currently says:

```text
State = awaiting_review
```

The phase process itself states that batches should progress only after dependency review passes.

Therefore the ticket metadata currently describes inconsistent workflow state.

For an audit-oriented architecture, this should be cleaned up before the phase is considered closed.

---

# 15. Current Reconciliation Result

The generated reconciliation report currently records:

```text
Source pages: 11
Inventory statements: 138
Candidate assertions: 134
Non-fact classifications: 4
Duplicate links: 0
Unresolved questions: 0
Current materialized facts: 219
Projected records: 677
```

The projected-record count is now derived correctly rather than producing the previous malformed value.

---

# Revised Review Decision

## Result

`CHANGES_REQUESTED`

## Previous review status

The previous feedback has been substantially resolved.

The fixture is no longer blocked by the earlier semantic identity, supersession, provenance, projection, staged-proposal, typed-read, or reconciliation-boundary issues.

## Remaining blocker

The verification stage must prove that all required architectural checks were executed.

A schema-valid subset of verification checks must not be accepted as complete verification.

## Required changes before approval

1. Implement every applicable required `atlas.fixture-verification` architectural check.
2. Add a deterministic required-check completeness gate.
3. Ensure omitted checks cannot silently count as success.
4. Reconcile GLF ticket states and dependency metadata.

---

# Expected Architecture After Final Remediation

```text
Immutable PRD artifacts
        |
        v
Source statement inventory
        |
        v
atlas.prd-extraction
        |
        v
Schema gate
        |
        v
Candidate assertions
        |
        v
atlas.fixture-repository
        |
        v
Schema gate
        |
        v
Repository candidate
        |
        v
atlas.fixture-changes
        |
        v
Schema gate
        |
        v
Staged proposal
        |
        v
Accepted branch materialization
        |
        v
atlas.fixture-projections
        |
        v
Schema gate
        |
        v
Branch-relative projections
        |
        v
atlas.fixture-verification
        |
        v
Schema gate
        |
        v
Required-check completeness gate
        |
        v
Deterministic topology / provenance gates
        |
        v
Golden fixture publication
```

The authority boundaries should remain:

```text
skills
    produce candidate reasoning outputs

schemas
    prove structural compatibility

deterministic gates
    prove required architecture invariants

repository approval / revision flow
    determines accepted truth

branch HEAD
    determines current truth
```

---

# Final Assessment

The fixture has moved from:

```text
large architectural remediation required
```

to:

```text
one focused verification-contract issue
+
ticket-state bookkeeping
```

Once the verification completeness gap and ticket-state inconsistencies are resolved, this review can reasonably move from:

```text
CHANGES_REQUESTED
```

to:

```text
PASS
```

---

# Validation Note

This review was performed against the committed `codex/new-atlas` repository state at:

```text
caae158b6ff904eeaf1981b5c8ad45a3e4aead52
```

The review inspected the current generator, source catalog, skill contracts, fixture tests, reconciliation report, typed golden-fixture resolver, and GLF ticket records.

The local fixture test command was not executed as part of this review.

Recommended validation command after remediation:

```bash
corepack pnpm --filter @atlas/fixtures test
```
