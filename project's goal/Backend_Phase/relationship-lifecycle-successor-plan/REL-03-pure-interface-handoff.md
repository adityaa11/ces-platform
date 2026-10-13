# REL-03 pure-interface prerequisite handoff

**Disposition:** `RETURN_TO_HMN` — no GO, CFC, CK result, worker dispatch, durable integration, or SEM-CUTOVER-006 resumption is authorized by this handoff.

**Decision source:** user HMN decision, `AMEND / Option B`, 2026-10-13. This addendum supersedes only the REL-03 ownership shape described below. It does not rewrite historical artifacts.

## Preserved candidate

The exact candidate was copied before planning changes to `REL-03-candidate-preservation-8fbddc74/`, rooted at HEAD `8fbddc74c90c8e353d5bc56e6fd9094dd6f86006`. It is a recovery snapshot, not an approved implementation or staging area. The live candidate remains unstaged and untouched.

| Original path | Identity at preservation |
| --- | --- |
| `apps/agents-bridge/src/semantic-extraction-finalizer.ts` | SHA-256 `2DA347D78DB43B6FAEBAF48009D9549840AB521B7F369CE82E5C5C50EDEEC9D8`; base blob `26e9dc8`; hunks `@@ -30,0 +31,4`, `@@ -69,0 +74,4`, `@@ -82,0 +91,9`, `@@ -105,0 +123` |
| `apps/agents-bridge/src/semantic-relationship-sidecar.ts` | untracked; SHA-256 `21641C923B5F5888912429C63002605FCBF495530FC922C0671430F10077A261` |
| `apps/agents-bridge/src/semantic-worker.ts` | SHA-256 `61D93809D05F7004DCA6E4A5ACAA50807CCC329202298A10EF2085756580CEE4`; base blob `d9e04f8`; hunks `@@ -1,2 +1,2`, `@@ -6,0 +7`, `@@ -11,0 +13`, `@@ -13 +15,22`, `@@ -16 +39,4`, `@@ -27,0 +54,3`, `@@ -29 +58`, `@@ -31 +60,4` |
| `apps/agents-bridge/tests/semantic-relationship-finalizer.test.ts` | untracked; SHA-256 `4CFEC3EEADD9CFB08C26BEE5478CE663766BEC4CCD101DDAFD6B4531BCF0A304` |
| `apps/agents-bridge/tests/semantic-worker.test.ts` | SHA-256 `AFB0AAE9D0ADB34E11939816D1CB5302CABCBD93C12FC62E1B01B5129E08173D`; base blob `8b29b79`; hunk `@@ -92,0 +93,10` |

No executor may overwrite, stage, discard, or treat the snapshot as a merge base. Any authorized salvage starts from a new scoped diff against these identities; the old opt-in dispatch and `stageSidecar` ordering are explicitly rejected.

## Smallest prerequisite and owners

| Owner | Permitted files/hunks | Required result | Explicit exclusion |
| --- | --- | --- | --- |
| REL-03 pure interface | `apps/agents-bridge/src/semantic-relationship-sidecar.ts` and `apps/agents-bridge/tests/semantic-relationship-finalizer.test.ts`, using only a newly isolated pure export | `prepareDeferredDependentInterpretations(input)` validates exact candidate tuples against the strict parsed semantic proposal and supplied immutable provisional revisions; returns deterministic deferred tuple descriptors and draft-only deferred meanings | no call to `materializeProvisionalRelationshipRevisions`, repository, provider, worker, stage/append, accepted-decision issuer, or canonical finalizer |
| SEM-CUTOVER-006 | `semantic-extraction-finalizer.ts` and its focused finalizer tests under its existing bounded owner | consumes the qualified tuple descriptors; canonicalizes independent candidates only and consumes a trusted verifier decision only for accepted context | cannot create the interface, alter its identity rules, issue acceptance, or use worker/SQL effects |
| REL-03 durable integration | separately named later authorization | qualifies atomic/idempotent composite winner or independently CK-qualified recovery for canonical result + immutable relationship revisions + SEM-005 sidecar | no in-memory fake may establish this durable claim |
| SEM-CUTOVER-007 | separately named later authorization | selects the one qualified stepwise worker path and consumes the approved interfaces | no legacy/optional dispatch compatibility branch |

The pure export's input is limited to a strict already-parsed proposal, trusted slot/source locators, exact `ContextSourceRelationshipRevisionV1` records, and the execution/scope identity needed to derive a deterministic deferred ID. Its output must retain, per essential tuple: the exact `{ source_slot, candidate_index }`, relationship revision hash, trusted source identity/evidence locator, provider-proposed conditional meaning, deterministic deferred ID, and `canonical_candidate_id: null`. It must reject duplicate/foreign/out-of-range tuples, two essential revisions claiming one tuple, revision/source/scope mismatch, missing relationship revision, and a candidate meaning or locator that cannot be re-derived from the supplied inputs.

## Reused contract and non-negotiable oracles

The interface reuses, without redefining, SEM-CUTOVER-005's `ProvisionalSemanticSidecar`, `prepareProvisionalSemanticSidecar`, source-accounting dispositions, immutable revision references, scope/hash/replay semantics, and its rule that conditional meaning is neither V1 `non_fact` nor trusted candidate evidence. The pure interface supplies attributable deferred meanings as input to that existing accounting; it must not introduce a second source-accounting representation.

Positive oracle: a mixed owned source with one independent tuple and one exactly matched essential tuple produces one qualified deferred meaning with the listed provenance while leaving the independent tuple eligible for SEM-CUTOVER-006 finalization. Optional revisions do not make a tuple deferred. Zero relationship revisions is valid.

Negative oracle: malformed proposal, foreign/missing/duplicate slot, unowned/context-only source, invalid tuple index, duplicate tuple, foreign revision, mismatched source SHA/asset/locator/scope, conflicting essential revisions, accepted-looking caller data, or any attempt to return a canonical ID/trusted evidence/`non_fact` fails before an output is returned. Tests must demonstrate no provider, database, repository, worker, sidecar-stage, or accepted-decision call because the interface has none.

## Independence and approvals

This prerequisite is intentionally independent of SQL durability: it prepares no revisions or sidecar and has no recovery claim. It is also independent of real human verification: it neither verifies acceptance nor issues a decision; SEM-CUTOVER-006 may use controlled verifier-consumer fixtures only. Missing acceptance blocks only the dependent authoritative decision, never independently supported extraction.

Still valid: SEM-CUTOVER-005 independent CK PASS and its source-accounting/sidecar contracts; SEM-CUTOVER-006's finalizer/verifier boundary; existing REL-01/02 provenance vocabulary; historical BSS-V2-004-03-05 findings remain open. Not valid for this work: the former REL-03 integrated scope, its legacy opt-in worker branch, in-memory sidecar staging as durability proof, or `HMN-SEM-CUTOVER-006-001` as authority to edit REL-03.

## Required next human authorization

Authorize one amended REL-03 **pure-interface-only** leaf (the two files named above) after its predecessor gate is satisfied, with an explicit GO and independent CK. It must state that SEM-CUTOVER-006 remains paused until this interface has its own CK result, and that the later durable-integration and SEM-CUTOVER-007 authorizations remain distinct. No new user-verifier, SQL, migration, provider, worker, or new ticket set is authorized.

