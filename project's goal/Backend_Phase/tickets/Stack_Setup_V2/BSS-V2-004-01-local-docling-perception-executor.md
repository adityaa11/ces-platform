# BSS-V2-004-01: Local Docling perception executor integration

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.01`
- **Dependencies:** BSS-V2-001, BSS-V2-002, BSS-V2-003 at CK `PASS`; DOCSPIKE-001 evidence available as feasibility input only
- **References:** V3 §§3–6, 15, 31–35; Baseline V2 §§7–15, 21–22, 28–29; BSS V2 context §§13–15, 21–22, 28–29

## Outcome and starting seam

Integrate one production-shaped, local Docling implementation beneath the existing `DocumentPerceptionProvider`-style capability. Its complete CK-ready boundary is:

```text
BSS-009-authorized bounded PDF bytes
    -> local Docling
    -> deterministic generic perception result
    -> existing normalizePerceptionResult(...)
    -> existing parseNormalizedDocument(...)
    -> NormalizedDocument v1
```

The route supports only the evidenced digital-PDF class. It is not the IDSER D1 lifecycle ticket and does not activate semantic work.

## Scope

- Extend the existing Bridge capability/qualified-route seam additively for one explicit local-processor identity, Docling/runtime version, adapter version, qualification version, bounded local execution configuration, and processor provenance/runtime metrics.
- Consume bytes only through the existing BSS-009-authorized input boundary. The local processor receives bounded bytes and never discovers `DocumentStore`, storage keys, source paths, Atlas tables, or queue payloads.
- Invoke local Docling through a bounded non-public execution topology selected within the existing Compose/Bridge architecture; support timeout, cancellation, startup/process failure classification, malformed mapped-output rejection, and safe diagnostics.
- Deterministically map source-grounded page/text/heading/table structure into the existing generic perception result: stable source-unit IDs, preserved page/reading order, and geometry only when trustworthy. Use the real existing normalizer and parser.
- Produce repeatability evidence using repository-approved non-confidential digital PDFs. Record processor/runtime provenance and local runtime measurements; do not imply external provider telemetry.

## Forbidden and non-authority work

- Do not change `NormalizedDocument v1`, its normalizer/parser, BSS-009 grant/result authority, IDSER semantic schemas, queues, replay/fencing, or Atlas truth ownership.
- Do not read `DocumentStore` directly, expose a public Docling endpoint, add a second queue/service of record, or let Docling persist Atlas state.
- Do not emit `workflow_step`, `rule`, `constraint`, `actor`, semantic candidates, reconciliation decisions, accepted truth, fabricated confidence, or fabricated visual regions. Heading/title/paragraph are structural observations only.
- Do not qualify scanned PDFs/OCR, external-provider privacy terms, RPM/TPM/RPD, provider quotas, provider token prices, provider training/ZDR classifications, Gemini, or any semantic route.

## Frozen Review Contract

| Row | Exact bounded behavior | Required proof / binary closure | Regression guard |
| --- | --- | --- | --- |
| RC-BSSV2-004-01-01 | A configured `atlas.document.perceive` local route identifies the exact Docling/runtime, adapter, and qualification versions; only the existing capability interface reaches it. | Config/route validation and import-boundary tests. **PASS iff** unknown/missing local identities fail closed and Atlas Core/skills do not import Docling internals. | BSS-V2-001/002 route and perception-interface suites. |
| RC-BSSV2-004-01-02 | The executor accepts only BSS-009-authorized bounded PDF bytes and does not discover sources. | Spy/fake-store and request-boundary tests. **PASS iff** no path/storage key/document discovery reaches the processor and byte/media/hash preconditions remain enforced at the inherited boundary. | BSS-009 source-redemption tests. |
| RC-BSSV2-004-01-03 | Real local Docling maps supported digital PDFs deterministically into source-grounded generic pages, text, headings, and tables. | Real local fixture matrix plus canonical repeated-run comparison. **PASS iff** page/order/IDs/content/tables are materially identical across equivalent runs, source-unit IDs are stable, and no sorting masks reading-order changes. | DOCSPIKE fixture expectations and mapper tests. |
| RC-BSSV2-004-01-04 | Mapped output passes the unchanged real normalizer and `parseNormalizedDocument(...)`; unavailable information remains absent. | Execute actual `normalizePerceptionResult(...)` then parser against the real local output. **PASS iff** parser-valid `NormalizedDocument v1` results require no schema weakening, fabricated confidence, or fabricated visual region; geometry appears only when trustworthy. | Atlas Core perception/contract tests. |
| RC-BSSV2-004-01-05 | Local startup, process, timeout, cancellation, and malformed mapping failures are bounded and classified without trusted partial result. | Controlled process/adapter negative tests. **PASS iff** each case has a stable safe technical failure, no result handoff is attempted for invalid output, and cancellation terminates the local work according to the chosen topology. | Existing worker cancellation/error normalization tests. |
| RC-BSSV2-004-01-06 | Local execution records processor provenance and runtime metrics without pretending to be an external provider. | Redaction/provenance tests and one real local run inspection. **PASS iff** executor/version/config/latency or resource observations are available, while credentials, provider tokens, quota domains, price profiles, privacy-class claims, source bytes, and raw bodies are absent. | Bridge logging/redaction tests. |

## Required validation and Docker procedure

Run mapper/route/config/process-failure tests, real local Docling fixture and repeatability runs, real Core normalization/parser tests, affected Bridge perception-worker tests/typecheck, and `git diff --check`. For any Compose/image/configuration change: rebuild/recreate only affected Atlas/Bridge/Docling process containers, inspect effective image/config and reported Docling/runtime version, verify readiness, then prove no stale process/container serves the route. Never use `docker compose down --volumes` as routine repair.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `BOUNDARY-BSSV2-004-01-SOURCE` — BSS-009 authorizes bytes and Atlas retains source identity/result acceptance; `BOUNDARY-BSSV2-004-01-TRUTH` — Atlas owns normalized acceptance and all semantic truth.
- **Trust boundaries / assets:** BSS-009 authorized bytes -> Bridge local executor -> generic untrusted mapping -> Atlas normalizer; PDF contents, source grant, execution identity, and local process boundary.
- **Identity context:** execution, artifact/source SHA-256, capability route, processor/runtime/adapter/qualification identities.
- **Extension seams:** `SEAM-BSSV2-004-01-LOCAL-EXECUTOR` for bounded local invocation; `SEAM-BSSV2-004-01-PROVENANCE` for processor-specific runtime evidence.
- **Prohibited couplings:** `COUPLING-BSSV2-004-01-SOURCE-DISCOVERY` prohibits direct store access; `COUPLING-BSSV2-004-01-SEMANTICS` prohibits structural output becoming business meaning; `COUPLING-BSSV2-004-01-PROVIDER-ECONOMICS` prohibits fictitious external-provider metadata.
- **Unresolved security policy:** deployment-specific local process isolation, resource ceilings, and retention remain policy attachments; this ticket preserves their seams but does not invent them.

| Mandatory review binding | Readiness reference | Narrow question / expected evidence |
| --- | --- | --- |
| REV-READY-BSSV2-004-01-01 | SEAM-BSSV2-004-01-LOCAL-EXECUTOR | Does the implementation receive only bounded authorized bytes and expose no source-discovery capability? Boundary/import and negative tests. |
| REV-READY-BSSV2-004-01-02 | COUPLING-BSSV2-004-01-SEMANTICS | Does mapper output remain generic structural perception with no semantic/truth fields? Mapper fixtures and output inspection. |
| REV-READY-BSSV2-004-01-03 | SEAM-BSSV2-004-01-PROVENANCE | Is processor evidence useful and redacted without fabricated provider controls? Provenance/log assertions. |

## GO hard stop and CK-ready completion

GO stops after the real local route can turn an already-authorized bounded digital PDF into a deterministic parser-valid `NormalizedDocument v1`. It must not schedule D1, deliver a result to Atlas, start semantic extraction/reconciliation, activate a remote model, or broaden OCR support.

`READY_FOR_CK` requires every Review Contract row to be proven with the named harnesses and the stale-environment procedure where applicable. CK asks only whether this local executor boundary is qualified for the stated digital-PDF class.
