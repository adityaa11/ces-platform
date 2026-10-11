# SEMCTX-SPIKE-001 v0.3 — Oracle-readiness review

- **Review type:** planning-only, independent of any simulator implementation.
- **Reviewed proposal:** `project's goal/Backend_Phase/SEMCTX-SPIKE-001-v0.3-planning-proposal.md`.
- **Disposition:** `ORACLE_READY`.

## Review method

This review tests whether each promised v0.3 behavior can be expressed as immutable fixture input plus a binary assertion without consulting a future planner's result to decide what is expected. It does not validate production behavior, provider quality, semantic correctness, or canonical acceptance.

| Review row | Immutable inputs required before implementation | Exact oracle / named assertion | Result |
| --- | --- | --- | --- |
| R-01 identity and output ownership | Per-source document hash, scope, locator, source ID, and content hash for F1–F3. | Each source appears once in inventory and one ledger row; every completed assertion's `owner_source_id` is one original source; request context IDs are disjoint from its owner ID. | Ready |
| R-02 state separation | Expected `planned`, `executed`, `completed`, or `deferred` transition sequence per source. | `completed` requires expected fixed mock assertion emission; `planned`/`executed` alone do not count in coverage. | Ready |
| R-03 dependency selection | Edge ID, type, authority, scope, evidence hash, and direct-context requirement. | Closure contains only authorized, in-scope essential edges; optional/comparison/rejected/mock-only edges are absent. | Ready |
| R-04 F1 | F1-P/F1-T source bytes and 4096-byte profile. | Two completed owner requests, no deferral, `coverage=complete`, `accepted=false`, `semantic_ready=false`. | Ready |
| R-05 F2 | F2 P/T/V asset tuple plus rejected T→V edge evidence. | P completes; T has `SOURCE_RELATIONSHIP_UNPROVEN`; V has `MEANINGFUL_ASSET_UNINTERPRETED`; `coverage=partial`; V is not `non_fact`. | Ready |
| R-06 F3-D decision | F3-D exact source bytes, eligibility `independent_eligible`, and byte calculation. | `payload_bytes(D) <= 4096`; D completes independently; any C request includes D only as context. | Ready |
| R-07 F3 overflow and optional edges | F3-C/D exact serialized payload inputs; C→D essential edge; A→B comparison and B→C optional edges. | `payload_bytes(C+D) > 4096`; C defers `IRREDUCIBLE_ESSENTIAL_CLOSURE_OVERFLOW`; A/B plans are unaffected by optional/comparison edges. | Ready |
| R-08 F3 cycle | E↔F edge IDs and exact authority/scope records. | SCC `{E,F}` yields two `ESSENTIAL_DEPENDENCY_CYCLE` rows and no E/F owner request. | Ready |
| R-09 document coverage | Full source inventory and expected terminal ledger rows. | Derived formula yields F1 complete, F2/F3 partial; no partial result is accepted/canonical/semantic-ready. | Ready |
| R-10 negative cases | N-01–N-09 fixture mutation definitions. | Each mutation has one expected rejection or canonical-hash equality assertion. | Ready |
| R-11 determinism and isolation | Canonical serializer/profile and allowed-import list/counters. | Ten replays plus source-order reversal have one output hash; counters stay zero and imports remain Node built-ins/local files only. | Ready |
| R-12 immutable freeze | SHA-256 member list for every fixture, expected output, profile, negative matrix, and manifest canonical form. | Runner verifies all member hashes before planner import and compares full canonical expected outputs. | Ready |
| R-13 scope reduction | Proposed file inventory. | Static test rejects F4/correction/reconciliation identifiers or production imports from the v0.3 implementation paths. | Ready |

## Preconditions for an executable oracle

`ORACLE_READY` is conditional on the pre-implementation freeze creating the exact F3 byte-calibrated fixture and recording the numerical `D` and `C+D` payload byte values in the manifest. That is a fixed authoring requirement, not an unresolved behavior choice: if the values do not satisfy the declared inequalities, the oracle bundle is invalid and must be rewritten/re-reviewed before GO.

## Findings

No behavior remains undefined in the planning proposal. The source-specific F3-D policy, F2 visual asset accounting, closure rule, cycle policy, terminal state model, coverage formula, and all stated negative cases each have an independent assertion target. F4 is intentionally outside the reviewed oracle.

## Handoff

This review authorizes no implementation. A future GO request must name a newly frozen manifest whose contents satisfy this review; otherwise the correct disposition is `PLANNING_DECISION_REQUIRED`.
