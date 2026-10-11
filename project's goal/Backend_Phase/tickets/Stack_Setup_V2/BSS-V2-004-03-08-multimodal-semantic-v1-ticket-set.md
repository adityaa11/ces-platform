# BSS-V2-004-03-08: Multimodal Semantic V1 source-to-prompt integration

- **State:** `planned` (13 committed leaf tickets since `d6421dd`); **direct GO eligibility:** explicit user `go` naming one dependency-ready leaf authorizes its initial implementation. No preliminary HMN is required for ordinary frozen-scope GO. Source and missing-fixture audit in master §0.8.
- **Parent context:** [v0.3.1 implementation context](../../BSS-V2-004-03-08-v0.3.1-sized-ticket-bundle/BSS-V2-004-03-08-v0.3.1-implementation-context.md).
- **Scope:** production-shaped, offline-only multimodal Semantic V1 request architecture. This family does not activate live semantic execution.
- **Structure:** `08`, `08-01`, `08-02`, and `08-03` are non-executable planning headings. The 13 linked leaves are the only proposed GO/CK units.

## Family guardrails

- Each leaf may start on the user's explicit `go` for that leaf (or a specifically authorized batch) after its current SHA, frozen requirements and predecessor CK PASS are verified. **HMN is not a routine prerequisite**; invoke it only for a blocked ticket requiring a new architectural/policy/scope decision or permitted post-CK/CFC continuation. A leaf GO never automatically authorizes its successor.
- The first eligible leaf is `08-01-01`, which captures an immutable legacy baseline only. `BASELINE_UNVERIFIED`, `SCHEMA_FIT_BLOCKED`, `LEGACY_REGRESSION_BLOCKED`, `RESOURCE_ENVELOPE_BLOCKED`, `OWNERSHIP_CONFLICT_BLOCKED`, and `CROSS_LEAF_SCOPE_BLOCKED` stop the affected work.
- All leaves are zero-call: no provider request, fallback/retry, reservation, semantic/perception job, reconciliation or publication.
- NormalizedDocument V1 and its derived manifest do NOT authorize a table↔image relationship: `01-02` proposes a trusted source and HMN authorizes; `02-01` blocks essential unproven links as `SOURCE_RELATIONSHIP_BLOCKED`.
- Original manual/stress files absent at `d6421dd`; verify unmodified originals and reviewer access or `FIXTURE_UNAVAILABLE_BLOCKED`.
- Stepwise instruction authority is per-section, not one owner per whole stage; input document/table/image instructions are untrusted source data.
- Existing Semantic V1 Zod, `prompt-003/v1`, text-only source packet, provider-neutral route boundary, finalizer ownership, and IDSER/BSS admission ownership remain authoritative.
- `08-02-06` only hands off resource-estimator/request-spec inputs; exact `RequestResourceEnvelope` belongs to `IDSER-012-02-01`.
- Closure means only `08-03-03` CK PASS for offline architecture, not real-model, PDF or admission qualification.

## Proposed leaves and dependencies

| Workstream | Leaf | Purpose | Requires |
| --- | --- | --- | --- |
| 01 | [08-01-01](BSS-V2-004-03-08-01-01-legacy-baseline-and-contract-impact-ledger.md) | Legacy baseline and impact ledger | Approved 03-01/02/03 and immutable current base SHA |
| 01 | [08-01-02](BSS-V2-004-03-08-01-02-semantic-schema-fit-and-visual-context-disposition.md) | Schema fit and context-only visual disposition | 01-01 CK PASS |
| 01 | [08-01-03](BSS-V2-004-03-08-01-03-source-input-zod-and-v0-3-1-stage-authority-map.md) | Source-input Zod and eight-stage authority map | 01-01/02 CK PASS; no schema-fit blocker |
| 01 | [08-01-04](BSS-V2-004-03-08-01-04-opt-in-eight-stage-compiler-and-legacy-coexistence.md) | Opt-in compiler and legacy coexistence | 01-01/03 CK PASS |
| 02 | [08-02-01](BSS-V2-004-03-08-02-01-deterministic-multimodal-source-ownership-relationship-packet.md) | Deterministic source/context relationship packet | 01-02/04 CK PASS |
| 02 | [08-02-02](BSS-V2-004-03-08-02-02-service-identity-grant-and-derived-image-authorization.md) | Service identity and scoped image-read grant | 02-01 CK PASS; IDSER-012-01-03-02 approved |
| 02 | [08-02-03](BSS-V2-004-03-08-02-03-verified-ephemeral-image-hydration.md) | Verified ephemeral image hydration | 02-02 CK PASS |
| 02 | [08-02-04](BSS-V2-004-03-08-02-04-additive-provider-neutral-typed-multipart-messages.md) | Provider-neutral typed multipart message contract | 02-01 CK PASS; 01-01 baseline |
| 02 | [08-02-05](BSS-V2-004-03-08-02-05-concrete-anoman-multimodal-transport-conformance.md) | Anoman transport conformance | 02-03/04 CK PASS; 03-04 CK PASS or HMN ownership amendment |
| 02 | [08-02-06](BSS-V2-004-03-08-02-06-multimodal-request-bounds-replay-redaction-and-resource-interface.md) | Request bounds, replay/redaction and resource interface | 02-03/04/05 CK PASS |
| 03 | [08-03-01](BSS-V2-004-03-08-03-01-frozen-independent-oracle-and-fixture-mapping.md) | Independent oracle and fixture mapping | 01-02 CK PASS; can proceed independently of later non-conflicting work |
| 03 | [08-03-02](BSS-V2-004-03-08-03-02-strict-proposal-parser-and-canonical-finalizer-qualification.md) | Strict parser and finalizer qualification | 03-01 CK PASS; BSS-V2-004-03-05 CK PASS |
| 03 | [08-03-03](BSS-V2-004-03-08-03-03-integrated-fake-provider-end-to-end-and-final-legacy-ck-gate.md) | Integrated fake-provider terminal CK gate | 02-06 and 03-02 CK PASS, all antecedents and resolved blockers |

## Dependency view

```text
01-01 -> 01-02 -> 01-03 -> 01-04 -> 02-01 -> 02-02 -> 02-03 --+
                      \-> 03-01 ------------------------------+-> 03-02 --+
02-01 -> 02-04 -> 02-05 -> 02-06 ------------------------------------------+-> 03-03
```

`02-05` must not start until sole typed-image adapter ownership is resolved with BSS-V2-004-03-04. `03-02` must not change the finalizer or bypass BSS-V2-004-03-05. The terminal handoff stays upstream of IDSER-012-02-01; it does not amend that ticket.

## Security readiness

The leaf-local readiness sections preserve attachment points for source input, context provenance, service grants, ephemeral visual bytes, neutral/provider transport, resource preflight, strict finalization, and the final offline integration. They deliberately leave provider privacy/residency, image-cost policy, live admission, and real-model qualification unresolved. Each leaf's listed review binding is the minimum independent CK coverage, not a security-baseline approval.
