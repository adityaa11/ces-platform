# BSS-V2-004-03-08-01-02 GO checkpoint — semantic schema-fit and visual-context disposition

- **Ticket:** `BSS-V2-004-03-08-01-02` — Semantic schema-fit and visual-context disposition
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-01-02-semantic-schema-fit-and-visual-context-disposition.md`
- **State:** `awaiting_review` with a documented blocked disposition; this is not downstream-ready.
- **Scope owner:** schema-fit assessment and context-provenance disposition only. No runtime, canonical-schema, prompt, packet, provider, fixture, or historical-artifact mutation.
- **Candidate/review SHA:** `f1fa2d5eb20c433d82808b832f62320ebf7b44b4` before this checkpoint; the checkpoint-introducing commit is the CK review target.
- **Branch:** `codex/new-atlas-backend`
- **Required predecessor CK PASS:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.01-01-7de0276-review.md`, decision `PASS` for `08-01-01`.
- **Consumed approved boundaries:** the 01-01 immutable baseline; `NormalizedDocument v1` visual locators/derived-asset references; canonical Semantic V1 source accounting. None is reopened or extended here.

## Changed-file and ownership inventory

| Path | Purpose | Approved contract affected |
| --- | --- | --- |
| `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-01-02-semantic-schema-fit-and-visual-context-disposition.md` | Lifecycle transition to `awaiting_review` | This leaf only |
| `project's goal/feedback/BSS-V2-004-03-08-01-02-go-checkpoint.md` | Bounded assessment and evidence ledger | This leaf only |

No path under `packages/` or `apps/` changed. The 01-01 parent-head manifest remains the legacy comparison authority; no snapshot, gold, or original evidence file was created or changed.

## Fixture availability disposition

The frozen implementation context identifies the required exact originals and their expected hashes, but explicitly states that they are absent from commit `d6421dd`: `fixtures/eligibility_table_atlas.txt`, `fixtures/eligibility_table.png`, raw v0.3.1 response/diagnostics, and the `atlas_final_multimodal_stress_v1` pack including `SHA256SUMS.txt`.

At the candidate SHA, the exact-name inventory command below returned no paths:

```powershell
rg --files -uu | rg '(^|/|\\)(eligibility_table_atlas\.txt|eligibility_table\.png|payment_table_atlas\.txt|workflow\.png|ground_truth\.json|SHA256SUMS\.txt|atlas_final_multimodal_stress_v1_powershell_fix\.zip)$'
```

Therefore neither the expected table hash `72949f01fcd173afeeffc4744503be8d6ccc1da053757282b73c91a7c538a546`, the expected PNG hash `107faf4ef7f8b0e78dcd41ab5c529b3bd611124416a8cd946f3b950989513ca6`, nor a complete manifest/inventory can be independently reproduced. There is also no reviewer-accessible source location recorded in the repository. This is `FIXTURE_UNAVAILABLE_BLOCKED`; no source, gold, raw response, or diagnostic result was reconstructed from the planning document's hash strings.

## Existing-schema fit and relationship boundary

Inspection of `packages/atlas-contracts/src/semantic-v1.ts` establishes that Semantic V1 can retain table-owned assertions as `candidate` inventory entries with canonical candidate evidence locators. It can also inventory a visual source as `non_fact` with no candidate destination. That representation alone is not faithful for title/legend context: `non_fact_reason` is provider-proposed bounded prose and has no field that binds a visual source to the table assertions it governs.

Inspection of `packages/atlas-contracts/src/perception.ts` establishes that a `NormalizedDocument v1` visual region can bind only its page, visual locator, optional label/bounding box, and `assetRef`. It supplies no trusted semantic table-to-image relationship. Common page, bounding box, asset reference, pixel similarity, and model inference are therefore not valid relationship issuers. The existing `semantic-source-packet.ts` converts every eligible locator independently into a packet-local slot and has no cross-slot relationship channel.

The only conditional fit identified by the incorporated context is an **Atlas-authored, validated, versioned context-provenance sidecar** outside canonical candidates. If separately authorized, it would need at least: a bounded context role; source slot/page/visual locator and asset hash; the owned candidate references governed by that context; and an Atlas-issued relationship with a validator and scope. It must preserve the visual unit's `non_fact` candidate-inventory disposition without treating meaningful context as discarded. This checkpoint neither defines nor authorizes that interface; HMN is the only authority named by the frozen ticket to accept such a new trust contract.

Accordingly, the current schema has no faithful, auditable representation for propagating an image title/legend to a table-owned assertion without a new trust contract. This checkpoint records `SCHEMA_FIT_BLOCKED` and requests the bounded HMN decision specified by the ticket. It does not add a seventeenth kind, a third source classification, a provider-owned relationship, or a fabricated image-owned business candidate.

## Negative-case disposition

The future negative matrix is frozen from ticket authority, but cannot be executed without the exact originals and approved source context: unrelated table/image join; lost synthetic scope; substituted legend; and ungrounded/inferred relation. For every such case, the current permitted disposition is rejection/no contextual propagation, retaining independent slots. An essential relationship remains `SOURCE_RELATIONSHIP_BLOCKED`; no relation may be inferred from page, geometry, image content, asset reference, or model output.

## Validation evidence

The following commands ran locally at the candidate SHA. They use deterministic local tests only and produced no provider attempt, image read, semantic/perception job, admission reservation, reconciliation, or publication.

| Command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts test` | PASS: 14 tests (including 10 Semantic V1 tests and 2 NormalizedDocument/perception-boundary tests) |
| `corepack pnpm --filter @atlas/skills test` | PASS: 9 tests, including deterministic packet construction and no provider/classification/finalization/persistence seam |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS: 5 tests; staged replay did not initiate a second provider call |

`external_provider_attempt_count: 0`; `semantic_job_count: 0`; `perception_job_count: 0`; `admission_reservation_count: 0`.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01` | Original six-case and stress evidence must have reviewer-accessible bytes, independently verified SHA-256, and complete inventory; missing input is `FIXTURE_UNAVAILABLE_BLOCKED`. | Exact-name inventory found none of the required originals, stress pack, or manifest. The incorporated context confirms their absence at the base commit and supplies no reviewer-accessible location. No evidence was fabricated. | `BLOCKED_ENVIRONMENT` — `FIXTURE_UNAVAILABLE_BLOCKED` |
| `RC-02` | Propose an evidenced Atlas-side title/legend/context relationship policy or document a schema gap, naming the authority boundary and `non_fact` disposition; GO cannot authorize a sidecar. | Semantic V1, NormalizedDocument V1, and source-packet seam inspection shows no durable relation between visual context and governed table candidate. This checkpoint records the conditional sidecar shape and pending HMN authority without implementing it. | `PROVEN` — schema gap documented; authorization pending |
| `RC-03` | Reject unrelated joins, scope loss, legend substitution, and ungrounded references; no trusted relation arises from NormalizedDocument/derived manifests. | Existing seam inspection establishes no table↔image link and this checkpoint freezes the four required rejection cases. Fixture-dependent executions cannot run because the originals and manifest are absent. | `BLOCKED_ENVIRONMENT` — `FIXTURE_UNAVAILABLE_BLOCKED`; essential links remain `SOURCE_RELATIONSHIP_BLOCKED` |
| `RC-04` | If no faithful auditable fit exists without canonical change, record `SCHEMA_FIT_BLOCKED` and stop for HMN. | The existing binary source-accounting model has no trusted contextual-provenance relation, and a new sidecar is outside GO authority. `SCHEMA_FIT_BLOCKED` is recorded above. | `PROVEN` |

**Blocked disposition:** `FIXTURE_UNAVAILABLE_BLOCKED` and `SCHEMA_FIT_BLOCKED`. No `READY_FOR_CK` claim is made because RC-01 and RC-03 lack their required fixture harness and observation. A CK review may verify that this documented blocker is correct; it cannot authorize the sidecar or permit downstream implementation.

**Next required authority:** provide an approved reviewer-accessible original-fixture location with unmodified bytes and a complete hash manifest, then invoke the bounded `hmn` workflow for the context-provenance contract decision if the schema gap remains. No successor GO is authorized.
