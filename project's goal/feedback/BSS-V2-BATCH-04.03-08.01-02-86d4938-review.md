# CK review — BSS-V2-004-03-08-01-02

- **Ticket:** `BSS-V2-004-03-08-01-02` — Semantic schema-fit and visual-context disposition
- **Batch:** `BSS-V2-BATCH-04.03-08.01-02`
- **Review type:** first independent CK review
- **Reviewed commit:** `86d4938385783690b5c38a5ee50983207e9f436a` (`docs(bss): verify 03-08 stress fixture pack`)
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-01-02-semantic-schema-fit-and-visual-context-disposition.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-08-01-02-go-checkpoint.md`
- **Ticket state before review:** `awaiting_review`
- **Candidate code SHA recorded by GO:** `f1fa2d5eb20c433d82808b832f62320ebf7b44b4`

## Review boundary and preconditions

The active ticket and checkpoint are unambiguous. The checkpoint identifies its introducing commit as the CK target; the current committed HEAD is `86d4938`. The tree has unrelated untracked files, but no tracked changes, and they do not alter that committed review target. From the recorded candidate SHA through the reviewed commit, the only changed paths are the ticket lifecycle transition and this leaf's GO checkpoint. `packages/` and `apps/` are unchanged from the approved 01-01 baseline.

The required predecessor record, `BSS-V2-BATCH-04.03-08.01-01-7de0276-review.md`, records `PASS` for 01-01. This review consumes its immutable baseline and does not reopen it. No provider, runtime, schema, prompt, fixture, gold, or historical review artifact was changed in the reviewed checkpoint.

## Independent evidence and validation

### RC-01 — original fixture and inventory

Independent SHA-256 recomputation against the accessible original roots matched the six-case table (`72949f01fcd173afeeffc4744503be8d6ccc1da053757282b73c91a7c538a546`), PNG (`107faf4ef7f8b0e78dcd41ab5c529b3bd611124416a8cd946f3b950989513ca6`), and raw response (`4d283b3d7376795f4dd70e187c81078fcf3f594ebad5636a9c8f1299fff28883`). I recomputed all 14 stress-pack manifest entries: all required fixture, gold, prompt, and evidence files match; the sole mismatch is `scripts/run_final_stress.ps1`. That live-call runner was not executed and is not used as source or acceptance evidence.

The verified stress artifacts support the checkpoint's mapped observations: the workflow has 11 nodes and 12 edges, including the dashed ambiguous `N05 → N11` edge; the diagram labels N05's rejection reason `WAJIB`; and payment row PAY-03 records `Opsional`. The gold preserves that conflict, expects C01 allowed, C02–C05 blocked, and C06 unknown. The eligibility image is a duplicate visual rendering of its table, not an independent policy source.

### RC-02 and RC-04 — schema fit and blocked disposition

Inspection of `semantic-v1.ts`, `perception.ts`, and `semantic-source-packet.ts` confirms the checkpoint's finding: Semantic V1 can retain table-owned candidates and inventory a visual as `non_fact`, but the existing representation has no Atlas-trusted relationship that binds visual title/legend context to governed table candidates. NormalizedDocument V1 provides visual locators and asset references, not that authority. The checkpoint documents the schema gap, a conditional sidecar's minimum issuer/validator/scope/provenance fields, the visual unit's `non_fact` inventory disposition, and the pending HMN decision. It does not authorize or implement the sidecar. `SCHEMA_FIT_BLOCKED` is explicitly recorded as required by the ticket.

### RC-03 — relationship negatives

The focused source-packet test was reproduced. It verifies deterministic independent source slots and that provider payloads contain only `version` and `source_slots`; the packet builder has no relationship, governed-candidate, image-read, provider, or persistence seam. This is sufficient for the current ticket disposition: none of the four named table/image propagations can be expressed through this boundary, so essential context remains `SOURCE_RELATIONSHIP_BLOCKED` rather than inferred from page, geometry, asset reference, or model output.

The supplied stress-pack `self_test.py` passed its ideal-payload and three negative assertions. The stress evaluator was run with `write=False`; baseline, guided, and strict archived responses reproduce the documented Gate A failures. Neither command calls a provider or modifies the evidence directory.

| Exact command independently run | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts test` | PASS: 14 tests (2 execution, 2 perception, 10 Semantic V1) |
| `corepack pnpm --filter @atlas/skills test` | PASS: 9 focused prompt/source-packet tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS: 5 tests, including staged replay without a second provider call |
| `python C:\Workspace\atlas_final_multimodal_stress_v1\scripts\self_test.py` | PASS: ideal payload, wrong cell, missing edge, missing conflict, and malformed cells checked |
| `python -c "import importlib.util, pathlib; p=pathlib.Path(r'C:\Workspace\atlas_final_multimodal_stress_v1\scripts\evaluate_results.py'); s=importlib.util.spec_from_file_location('ev',p); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.evaluate_dir(pathlib.Path(r'C:\Workspace\atlas_final_multimodal_stress_v1\evidence'),write=False)"` | Read-only evaluator run; archived responses fail Gate A as documented |

Relevant runtime paths match the 01-01 approved baseline, and no shared-code path changed. The review commands made no external provider attempts, semantic/perception jobs, reservations, reconciliation, or publication. The original fixture images were visually inspected as source evidence; the test harnesses made no image reads. Inspection of the reviewed documentation found no credentials, base64, or image bytes.

## Review Contract outcomes

| Row | Ticket authority and required observable | CK evidence | Status |
| --- | --- | --- | --- |
| `RC-01` | Ticket RC-01: reviewer-accessible original six-case and stress evidence, independently verified hashes and inventory; missing inputs are `FIXTURE_UNAVAILABLE_BLOCKED`. | Recomputed all six-case hashes and all 14 stress manifest entries. Required source/gold evidence matches; the unused live-call runner mismatch is recorded and does not alter fixture truth. | `PROVEN` |
| `RC-02` | Ticket RC-02: evidenced Atlas-side context relationship proposal or schema gap; identify trust/validation/scope/provenance and preserve the visual's `non_fact` inventory disposition. | The existing contracts have no trusted context-to-candidate relation. The checkpoint records the gap, conditional minimum sidecar authority/provenance, `non_fact` disposition, and pending HMN authorization. | `PROVEN` |
| `RC-03` | Ticket RC-03: reject unrelated joins, scope loss, substituted legends, and inferred relations; existing V1/derived manifests do not supply a trusted link. | Source packet exposes independent slots only and serializes no relationship channel. Focused test, code inspection, and offline stress self-test reproduce the fail-closed boundary; no context is propagated without an authorized relation. | `PROVEN` |
| `RC-04` | Ticket RC-04: record `SCHEMA_FIT_BLOCKED` and stop for HMN if no faithful, auditable fit exists without canonical change. | The missing trusted relation is documented; the checkpoint explicitly records `SCHEMA_FIT_BLOCKED` and names HMN as the next authority. | `PROVEN` |

## Findings and scope observations

No ticket-derived deficiency was identified. No `CK-###` finding or Frozen Finding Closure Matrix is required. The mismatched stress runner is a disclosed diagnostic integrity observation; it was not required source/gold evidence and was not executed. No ticket or architecture change is needed to decide this checkpoint.

## Decision

`PASS`

The committed checkpoint satisfies all four applicable Review Contract rows. This PASS approves only the 01-02 schema-fit assessment and its documented `SCHEMA_FIT_BLOCKED` disposition. It does not authorize the context sidecar or downstream implementation; the ticket requires a bounded HMN decision before that work can proceed.
