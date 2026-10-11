# BSS-V2-004-03-08-03-01 GO checkpoint — frozen independent oracle and fixture mapping

- **Ticket:** `BSS-V2-004-03-08-03-01`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-03-01-frozen-independent-oracle-and-fixture-mapping.md`
- **State:** `awaiting_review`
- **Reviewed base / candidate HEAD:** `0e6048b5da13a701e68606a63a4af47b55ba9d80`
- **Prerequisite consumed:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.01-02-86d4938-review.md` — CK `PASS`; its later context-provenance resolution is independently approved by `...-ced86fa-context-provenance-review.md`.
- **Scope owner:** frozen semantic assessment, fixture hashes, and adversarial oracle definitions only. No compiler, finalizer, packet, provider, or runtime behavior changes.

## Bounded changes

| Path | Purpose | Classification |
| --- | --- | --- |
| `project's goal/feedback/BSS-V2-004-03-08-03-01-oracle-ledger.json` | Candidate-only immutable reference to reviewer-accessible original inventories, semantic expectations, M01–M13 interpretation, and negative oracle definitions. It contains hashes and bounded metadata only. | `INTENDED_ORACLE_LEDGER_ONLY` |
| This checkpoint and the frozen ticket state | Record GO evidence and `awaiting_review`; no historical artifact or external original is changed. | `WORKFLOW_EVIDENCE_ONLY` |

The ledger points to the supplied external evidence roots rather than copying any source image, response, diagnostic, gold, API key, or base64. It preserves the original six-case table as the assertion owner, records the duplicate PNG as context-only, and treats the stress pack runner's known hash mismatch as excluded diagnostic material. The original stress gold, fixture hashes, raw manual response, and frozen historical diagnostics remain unchanged.

## Independent oracle boundary

The candidate ledger keeps two determinations separate:

- M01–M12 describe fixture-scoped human semantic expectations: temporal `Belum` states, native literals/units, synthetic scope, table ownership, context-only image title/legend, C06 unknown, and the retained N05/PAY-03 conflict.
- M13 is a negative contract observation: the immutable raw manual response is fenced and emits uppercase `BUSINESS_PROPERTY`; it is therefore `RAW_CONTRACT_FAIL` for an authoritative strict parser/Zod. Diagnostic unwrapping or case folding remains non-authoritative.

The six independent negative oracle definitions reject reversed graph topology, invented cells/units, untrusted source relationships, context loss or duplicate visual authority, false C06 clarification, and source-embedded instruction attempts. They do not create Semantic V2, a new kind, a provider acceptance rule, or a trusted production table/image relation.

## Validation evidence

| Exact command | Outcome |
| --- | --- |
| `Get-FileHash -Algorithm SHA256` over the six-case TXT/PNG/raw response and all ticket-relevant stress fixtures/gold | PASS — all named source and gold hashes match the predecessor-approved inventory. |
| Recompute all 14 `SHA256SUMS.txt` entries in `C:\Workspace\atlas_final_multimodal_stress_v1` | PASS for 13 entries; `scripts/run_final_stress.ps1` differs from its manifest hash and was neither executed nor used as oracle evidence. |
| Read-only inspection of verified `gold/ground_truth.json`, `workflow.dot`, and the two normalized tables | PASS — 11 nodes, 12 directed edges, `N05 -> N11 [?]`, C01 allowed, C02–C05 blocked, C06 unknown, and the retained N05/PAY-03 contradiction match the candidate ledger. |
| `python C:\Workspace\atlas_final_multimodal_stress_v1\scripts\self_test.py` | PASS — offline ideal payload and negative fixture checks; no provider invocation. |
| Read-only `evaluate_results.py` invocation with `write=False` | PASS as a diagnostic reproduction only; archived outputs remain Gate A failures and were not used to rewrite gold. |
| JSON parse plus deterministic SHA-256 verification of `BSS-V2-004-03-08-03-01-oracle-ledger.json` | PASS — candidate ledger parses and self-hash matches after excluding `ledger_sha256`. |
| `git diff --check` | PASS |

All validation is local and read-only outside the two declared repository artifacts. `external_provider_attempt_count: 0`; `semantic_job_count: 0`; `unintended_perception_job_count: 0`; `admission_reservation_count: 0`. No provider request, fallback, retry, persistence, reconciliation, publication, or accepted-truth action was performed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01` | Recover reviewer-accessible original synthetic TXT/PNG/manual response and stress pack; verify inventory and SHA-256 before freeze. | `BSS-V2-004-03-08-03-01-oracle-ledger.json` records the external roots and complete ticket-relevant inventories. Six-case and raw response hashes match. Stress-pack 13/14 manifest entries match; the one mismatched live runner is explicitly excluded and unexecuted. | `PROVEN` |
| `RC-02` | Freeze a human semantic M01–M13 reference separate from strict parser/Zod acceptance, covering pending states, native literals, scope, context-only source, primary meaning, and no-invention. | Ledger `m01_m13_assessment` records fixture-scoped expected meaning for C01–C06, temporal literals, context-only visual role, unknown C06, source-attributed conflict, and `M13` raw-contract failure. It claims no provider/canonical acceptance. | `PROVEN` |
| `RC-03` | Add independent negatives for reversal, fabricated cells/units, invalid relationships, missing context, false clarification, and source-embedded instruction attempts; preserve original gold. | Ledger `independent_negative_oracles` defines one binary expected outcome for each named mutation. Original gold is referenced only by SHA and remains external/unmodified. | `PROVEN` |

**Known limitations:** The historical raw response is a one-attempt manual observation, not a qualified model result; the stress runner hash mismatch remains excluded; no real-PDF, live provider, parser/finalizer, or production context-provenance behavior is qualified.

Internal readiness: READY_FOR_CK
