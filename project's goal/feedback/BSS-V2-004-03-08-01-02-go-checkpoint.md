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

The frozen implementation context identifies the required exact originals and their expected hashes. They are absent from commit `d6421dd`, but the user provided an accessible external evidence root: `C:\Workspace\semantic-bss-v0.3.1`.

Independent SHA-256 checks against that root reproduced the frozen six-case evidence exactly:

| External original | Expected SHA-256 | Reproduced result |
| --- | --- | --- |
| `eligibility_table_atlas.txt` | `72949f01fcd173afeeffc4744503be8d6ccc1da053757282b73c91a7c538a546` | exact match |
| `eligibility_table.png` (60,408 bytes) | `107faf4ef7f8b0e78dcd41ab5c529b3bd611124416a8cd946f3b950989513ca6` | exact match |
| `semantic-v031-bss-004-03-08-evidence/20261010T202858Z-bd4be3cc/response.content.raw.txt` | `4d283b3d7376795f4dd70e187c81078fcf3f594ebad5636a9c8f1299fff28883` | exact match |

The matching HTTP-success evidence manifest records one provider attempt and zero retries; this checkpoint made no new call. Its manually declared table/image relationship is expressly fixture-only and not production authority.

The user then supplied the original stress-pack root: `C:\Workspace\atlas_final_multimodal_stress_v1`. All 14 `SHA256SUMS.txt` entries were independently recomputed. Thirteen match exactly; only `scripts/run_final_stress.ps1` mismatches (`expected d0dda5ae24998088360c8537a1b4b903b279da78590804166e0ccae38bde154f`, `actual 241fa32983a4aaee20d394ba5b8c0e11bd9f4be5cdb05fecadbf227a22d43505`). The mismatched live-call runner was not executed.

The required fixture evidence itself is verified against its manifest: `fixtures/workflow.png`, `fixtures/workflow.dot`, `fixtures/payment_table_atlas.txt`, both eligibility files, and `gold/ground_truth.json` all match. Visual inspection of the verified workflow confirms 11 labeled nodes, 12 directed edges, the dashed ambiguous `N05 → N11` `?` edge, and `N05`'s `Alasan WAJIB`; the verified payment table's `PAY-03` says `Alasan penolakan = Opsional`. The verified gold expects that contradiction to survive rather than be resolved, `C01` allowed, `C02`–`C05` blocked, and `C06` unknown. `FIXTURE_UNAVAILABLE_BLOCKED` is therefore cleared for the ticket-required source and gold evidence only. The pack-runner hash mismatch is retained as a diagnostic integrity observation, not treated as verified evidence and not used as a reason to change fixture truth.

## Existing-schema fit and relationship boundary

Inspection of `packages/atlas-contracts/src/semantic-v1.ts` establishes that Semantic V1 can retain table-owned assertions as `candidate` inventory entries with canonical candidate evidence locators. It can also inventory a visual source as `non_fact` with no candidate destination. That representation alone is not faithful for title/legend context: `non_fact_reason` is provider-proposed bounded prose and has no field that binds a visual source to the table assertions it governs.

Inspection of `packages/atlas-contracts/src/perception.ts` establishes that a `NormalizedDocument v1` visual region can bind only its page, visual locator, optional label/bounding box, and `assetRef`. It supplies no trusted semantic table-to-image relationship. Common page, bounding box, asset reference, pixel similarity, and model inference are therefore not valid relationship issuers. The existing `semantic-source-packet.ts` converts every eligible locator independently into a packet-local slot and has no cross-slot relationship channel.

The only conditional fit identified by the incorporated context is an **Atlas-authored, validated, versioned context-provenance sidecar** outside canonical candidates. If separately authorized, it would need at least: a bounded context role; source slot/page/visual locator and asset hash; the owned candidate references governed by that context; and an Atlas-issued relationship with a validator and scope. It must preserve the visual unit's `non_fact` candidate-inventory disposition without treating meaningful context as discarded. This checkpoint neither defines nor authorizes that interface; HMN is the only authority named by the frozen ticket to accept such a new trust contract.

Accordingly, the current schema has no faithful, auditable representation for propagating an image title/legend to a table-owned assertion without a new trust contract. This checkpoint records `SCHEMA_FIT_BLOCKED` and requests the bounded HMN decision specified by the ticket. It does not add a seventeenth kind, a third source classification, a provider-owned relationship, or a fabricated image-owned business candidate.

### Verified six-case fit ledger

The verified table's C01–C06 rows are table-owned and fit existing `business_property` candidates with a trusted table evidence locator. C02 (`Belum Disetujui`) and C03 (`Belum Terbit`) retain not-yet temporal state in source wording/payload rather than becoming plain negation; C04 retains the `250000` / Rp quantity; C05 retains the expired-document condition; and C06 retains `?` and unavailable/unknown meaning without inventing an outcome. These are candidate-level facets, not a need for a new canonical kind. The PNG contributes no duplicate row candidate. Its title/legend can only be retained as conditional context through the unapproved sidecar described above.

## Negative-case disposition

The ticket-required offline relationship check was executed with an in-memory valid `NormalizedDocument v1` containing a table locator and an eligibility-image visual locator. `buildSemanticSourcePacket()` produced two independent slots (`table-eligibility` and `visual-eligibility`), while the serialized provider payload contained only `version` and `source_slots`; there is no relationship, governed-candidate, or context field. This check passed without image reads, providers, jobs, or reservations.

Consequently, unrelated table/image joining, synthetic-scope loss, legend substitution, and ungrounded reference propagation are all rejected at this ticket's current boundary by non-representation: no contextual propagation is possible without an approved relationship. The manually declared fixture pairing cannot override that boundary. An essential relationship remains `SOURCE_RELATIONSHIP_BLOCKED`; no relation may be inferred from page, geometry, image content, asset reference, or model output.

The supplied pack's offline `self_test.py` passed its ideal-payload and three negative assertions. Its evaluator was run with `write=False`, so it did not modify the original evidence directory. The archived `baseline`, `guided`, and `strict` provider responses each fail the machine Gate A semantic oracle (respectively unrecoverable JSON; 10/11 nodes and 10/12 edges with missing ambiguity; and 10/11 nodes, 10/12 edges, and 0/54 cells). These runs are historical diagnostic evidence only and do not supply provider acceptance, replay, retry, or new-call evidence for this leaf.

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
| `RC-01` | Original six-case and stress evidence must have reviewer-accessible bytes, independently verified SHA-256, and complete inventory; missing input is `FIXTURE_UNAVAILABLE_BLOCKED`. | Six-case external root reproduces table/PNG/raw-response hashes. Original stress root supplies workflow, eligibility, payment, gold, and manifest; all required source/gold entries match. `SHA256SUMS` has 13/14 verified entries; its live-call runner alone mismatches and was not used. No evidence was fabricated. | `PROVEN` |
| `RC-02` | Propose an evidenced Atlas-side title/legend/context relationship policy or document a schema gap, naming the authority boundary and `non_fact` disposition; GO cannot authorize a sidecar. | Semantic V1, NormalizedDocument V1, and source-packet seam inspection shows no durable relation between visual context and governed table candidate. This checkpoint records the conditional sidecar shape and pending HMN authority without implementing it. | `PROVEN` — schema gap documented; authorization pending |
| `RC-03` | Reject unrelated joins, scope loss, legend substitution, and ungrounded references; no trusted relation arises from NormalizedDocument/derived manifests. | Offline packet check produced independent table/visual slots with no relationship channel. The verified fixture's manual relation is expressly non-production authority. The four named propagations therefore fail closed by non-representation; the pack self-test passed and evaluator was read-only. | `PROVEN` — essential links remain `SOURCE_RELATIONSHIP_BLOCKED` |
| `RC-04` | If no faithful auditable fit exists without canonical change, record `SCHEMA_FIT_BLOCKED` and stop for HMN. | The existing binary source-accounting model has no trusted contextual-provenance relation, and a new sidecar is outside GO authority. `SCHEMA_FIT_BLOCKED` is recorded above. | `PROVEN` |

**Blocked disposition:** `SCHEMA_FIT_BLOCKED` remains. `FIXTURE_UNAVAILABLE_BLOCKED` is cleared only for the verified required source/gold evidence. The mismatched live-call runner remains unused and does not alter the verified fixtures. CK may verify this documented schema-fit blocker; it cannot authorize the sidecar or permit downstream implementation.

**Next required authority:** independent CK of this checkpoint. If CK confirms the blocker, a bounded `hmn` decision is required for the context-provenance contract. No successor GO is authorized.

Internal readiness: READY_FOR_CK
