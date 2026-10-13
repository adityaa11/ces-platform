# Change impact and successor closure matrix

**Status:** frozen planning matrix for the REL successor tickets. Rows become CK obligations only when their named ticket receives explicit GO.

## Ownership and change matrix

| Concern | Frozen successor choice | Owner | Explicit non-effect |
| --- | --- | --- | --- |
| Provider response | Strict opt-in `atlas.relationship-extraction-envelope/v1`, holding old strict semantic proposal plus relationship proposals. | REL-01 | No property is added to the old proposal schema; no JSON repair, fence stripping, enum coercion, or second call. |
| Proposal source attribution | Validate every source slot/locator/evidence reference against the exact trusted packet/source snapshot before minting a revision. | REL-01 | Matching hash, slot, metadata, confidence, or provider status cannot mean semantic correctness or acceptance. |
| Revision and binding | Append-only provisional revisions and binding/deferred records; revision hash includes predecessor relation where applicable. | REL-01 contract; REL-03 invokes it after finalization | No reviewer, registry, publication, mutation of prior revision, or provider-issued canonical ID. |
| Prior context | Query by exact project/workspace/document/source-SHA snapshot and project only valid provisional revisions in deterministic revision/lineage order. | REL-02 | Initial extraction has an empty projection; projection does not confer trust. |
| Finalization | Preserve `298021d` independent finalization; filter only precisely declared dependent candidate tuples into durable deferred records. | REL-03 | No `non_fact`, visual-owned candidate, partial authority upgrade, or whole-document failure. |
| Qualification | Reuse parser/legacy/D1 oracles; add lifecycle-specific provisional, forged-identity, deferred-binding and replay-loss oracles. | REL-04 | No live provider, job, reservation, acceptance, confirmation, or publication claim. |

## Frozen successor Review Contract rows

| Clause | Ticket | Binary PASS condition |
| --- | --- | --- |
| `SCK-REL-01.a` | REL-01 | A valid single-response relationship proposal yields only a source-verified immutable `proposed` revision; every claimed accepted/confirmed/published field and every bad slot, locator, source SHA, asset, duplicate, or predecessor is rejected. |
| `SCK-REL-01.b` | REL-01 | The strict envelope accepts no unrecognized property and preserves old-schema rejection; array ordinal is captured only as provenance and cannot establish candidate or acceptance authority. |
| `SCK-REL-01.c` | REL-01 | Repository port replay is idempotent by execution plus revision hash and returns the same immutable records without a provider call or rewrite. |
| `SCK-REL-02.a` | REL-02 | Empty revision input builds a valid first packet; valid matching provisional revisions project deterministically, while foreign/stale/duplicate/unsupported revisions do not project. |
| `SCK-REL-02.b` | REL-02 | Projection is labelled provisional and preserves relation/dependency identity without changing source ownership, hydrated media, legacy bytes, or authority. |
| `SCK-REL-03.a` | REL-03 | Independently grounded tuples are canonicalized with retained strict checks; each essential dependent tuple is represented exactly once by a durable deferred record and no canonical assertion. |
| `SCK-REL-03.b` | REL-03 | The old two-string accepted-context input and unverified descriptor cannot augment canonical evidence; replay/staging is duplicate-safe and preserves sidecar/canonical convergence. |
| `SCK-REL-04.a` | REL-04 | The full offline positive/negative matrix proves source verification, provisional retention, independent progress, deferment, non-promotion and replay convergence. |
| `SCK-REL-04.b` | REL-04 | Reviewed-SHA legacy profiles, Semantic V1, provider neutrality, worker replay/cancellation and D1 terminal stop pass with counters proving zero external/live effects. |

## Historical closure protection

`RC-BSSV2-0040305-03`, `-04`, and `-05` remain `PROVEN`; successor tests only detect direct regressions. `CK-001.a` and `CK-001.b` remain historically unresolved. No successor PASS is a PASS for those historical clauses.
