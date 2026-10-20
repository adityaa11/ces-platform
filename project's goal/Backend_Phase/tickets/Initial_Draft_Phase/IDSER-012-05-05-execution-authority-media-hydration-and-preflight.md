# IDSER-012-05-05 — SUPERSEDED: SEM execution / media hydration

- **State:** `superseded` / `non_executable` within the IDSER-012-05 family. **Not eligible for GO, CK, CFC or HMN.**
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).
- **Disposition:** prior planner-family scope was incorrect; this file is an append-only ownership pointer, not an authorized implementation contract.
- **Successor owner:** SEM-CUTOVER runtime integration (exact successor ticket/authority to be frozen by SEM governance; do not assume or silently re-open historical approved SEM tickets).

## Out-of-scope work transferred to SEM ownership

SEM, **not IDSER**, must eventually consume verified locator-only `ImmutableSemanticCorpusPlan/v3` / `PlannedSemanticCorpusHandoff/v3` references and perform:

- Execution-scoped server authorization, lifecycle/cancellation checks, BSS admitted-job linkage and replay safety.
- Resolve and verify **exact** selected-owned/context locators against accepted `NormalizedDocument V1`.
- Read-only reconstruct and validate the same logical request and ordered selected-media manifest that IDSER sized, without silently rebuilding the whole document.
- Issue fresh scoped derived-image grants only at execution; hydrate actual selected PNG bytes; verify SHA-256, dimensions, byte length, MIME, source ownership and manifest order.
- Route capability/preflight, honest handling of `imageTpm: unknown`, serialized provider request-size parity, adapter/estimator/policy drift rejection, provider dispatch.
- Preserve no-legacy-fallback and no alternate media-store rules.

IDSER-012-05 supplies the **planner-only prerequisite**, with `-05-01` transient sizing, `-05-02` image-aware partition, `-05-03` locator-only immutable v3 metadata and `-05-04` a verified read-only reconstruction contract. **No image attachment, fake fetch, ordinary SEM worker integration, provider invocation or runtime grant test is required for IDSER CK PASS.**

## Governance

The former rows `RC-01205-05-01` through `RC-01205-05-06` are **retired as IDSER acceptance gates**. This does not waive their functional concerns: record them as downstream SEM-CUTOVER handoff obligations with their own future frozen acceptance. The IDSER family terminal `-05-07` must not depend on CK PASS for this superseded file. No code implementation or SEM modification authorized by this note.
