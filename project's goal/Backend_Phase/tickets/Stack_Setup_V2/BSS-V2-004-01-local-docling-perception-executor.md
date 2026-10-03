# BSS-V2-004-01: Persistent local Docling perception service integration

- **State:** `planned` (revised before CK checkpoint); **Review batch:** `BSS-V2-BATCH-04.01`
- **Dependencies:** BSS-V2-001 and BSS-V2-002 at CK `PASS`; BSS-V2-003 remains approved adapter history but is not a perception dependency; DOCSPIKE-001 is feasibility input only
- **References:** V3 §§3–6, 15, 31–35; Baseline V2 §§7–15, 21–22, 28–31; BSS V2 context §§10–12, 20–31
- **Upstream implementation correction:** any in-progress per-request Python subprocess implementation is not the final acceptance topology. Compatible mapper/config/test work may be retained, but GO must re-read and satisfy this revised persistent-service contract before CK handoff.

## Outcome and starting seam

Integrate Docling in the production shape recommended by the Docling project for a non-Python caller: a long-lived, Compose-private `docling-serve` service that keeps its Python runtime, loaded models, converter cache, and initialized pipeline reusable across document requests.

The complete CK-ready boundary is:

```text
BSS-009-authorized bounded PDF bytes
    -> Agents Bridge
    -> private Docker-network HTTP call
    -> persistent docling-serve
         -> local engine
         -> warm cached PDF converter/pipeline
         -> local CPU execution
    -> DoclingDocument JSON
    -> deterministic Atlas mapper
    -> existing normalizePerceptionResult(...)
    -> existing parseNormalizedDocument(...)
    -> NormalizedDocument v1
```

The route supports only the evidenced digital-PDF class. It is not the IDSER D1 lifecycle ticket and does not activate semantic work.

## Required local Docker topology

The production-shaped development route must use a dedicated long-lived Docling service in the existing Compose network.

Required properties:

```text
executor kind: local_processor
service: docling-serve
Docling version: 2.132.0
docling-serve version: 1.21.0
initial device profile: CPU
remote services: disabled
external plugins: disabled
UI: disabled
compute engine: local
Uvicorn worker processes: one unless separately justified
Docling local conversion concurrency: bounded and explicit
model/converter cache: enabled
models/artifacts: present before accepting Atlas work
host-public port: not required and not exposed by the base Atlas profile
Atlas queue authority: pg-boss, not Docling/RQ
```

The implementation should use the official CPU-only Docling/Docling-Serve dependency path or equivalent CPU-only pinned installation. A CUDA-enabled Torch stack that cannot see an NVIDIA device is not an acceptable final CPU profile merely because it still runs on CPU.

Use the official CPU-only `docling-serve` 1.21.0 runtime/image path or an equivalent reproducible image, verify `docling==2.132.0` at runtime, and pin the deployed image by immutable digest/version in qualification evidence. Do not rely on mutable `latest` or `main` tags as the frozen route identity.

## Service readiness and warm execution

Container liveness is not route readiness.

The Docling service must remain unavailable to Atlas perception routing until:

1. the service health endpoint responds;
2. the Docling readiness endpoint reports model-loading readiness;
3. the pinned Docling/docling-serve/runtime identity is verified;
4. required model artifacts are already local;
5. the exact Atlas digital-PDF option profile has been initialized/warmed without customer source data.

The Atlas option profile must be explicit and minimal for the current supported class:

```text
pipeline: standard PDF pipeline
OCR: false
table structure: true
layout/reading order: true
picture description: false
picture classification: false unless independently required
chart extraction: false
code enrichment: false
formula enrichment: false
remote services: false
external plugins: false
page-image generation: false unless a frozen mapper requirement proves it necessary
```

If Docling's boot-time default warm-up does not initialize this exact option fingerprint, perform one bounded startup/qualification warm-up using a repository-owned or synthetic non-confidential digital PDF. That warm-up is operational preparation, not acceptance evidence for a customer document.

## Bridge invocation contract

Agents Bridge owns invocation of the already-authorized source bytes.

The Bridge must send the exact bounded PDF bytes over the Compose-private network using the stable Docling Serve v1 file-conversion API (for example the synchronous file-upload conversion path) rather than:

- spawning one fresh Python process per document;
- passing DocumentStore paths or storage keys;
- giving Docling database credentials;
- allowing Docling to discover source files;
- adding a second durable job queue.

The Bridge request must freeze an Atlas-controlled option fingerprint for the supported digital-PDF route. Client/user payloads cannot arbitrarily enable OCR, remote services, VLMs, plugins, alternate pipelines, or other Docling capabilities.

The returned Docling JSON is untrusted perception input. Atlas/Bridge mapping and existing Atlas normalization remain authoritative.

## Performance qualification

The production CPU route is not qualified merely because conversion is correct.

For the representative digital-PDF fixture matrix, after the service and exact route profile are warm:

```text
Bridge has authorized PDF bytes
    -> request to ready Docling service
    -> Docling conversion
    -> response received
    -> deterministic mapping
    -> normalizePerceptionResult(...)
    -> parseNormalizedDocument(...)
```

must complete in **<= 20,000 ms wall-clock per document** for every required qualification run.

Measure and record separately:

```text
service cold boot
model/pipeline warm-up
HTTP/request transfer
Docling reported processing/pipeline time
mapping/serialization
Atlas normalization/parsing
end-to-end warm-route latency
```

Cold boot/warm-up latency is deployment-readiness evidence and is not counted as normal per-document latency only if the route cannot become ready before that initialization completes.

At minimum, run the approved Safara Full, Finance, and Readiness digital PDFs through the warm service and repeat the primary Safara run. A single fast cached run cannot compensate for another required warm-route run above 20 seconds.

If the correctly warmed, correctly configured CPU service cannot meet the 20-second gate, this CPU route is **not qualified**. Do not weaken the latency gate or silently enable GPU. Escalate the execution-profile decision separately.

## CPU resource profile

Docling CPU threading and local conversion concurrency must be explicit deployment-profile values, not accidental defaults.

GO may perform a bounded CPU-thread/concurrency measurement sufficient to choose the qualification profile, but must not turn this ticket into general performance research.

Record:

- `DOCLING_DEVICE=cpu` or equivalent explicit CPU selection;
- selected Docling CPU thread count and why;
- selected Docling local worker/concurrency count;
- host/container CPU availability used for the qualification;
- peak/resident memory if readily available;
- absence of CUDA device use in the CPU route.

Do not represent local CPU capacity as RPM/TPM/RPD or an external provider quota domain.

## Scope

- Add the dedicated Compose-private persistent Docling service and Bridge HTTP adapter beneath the existing `DocumentPerceptionProvider`-style capability.
- Extend the qualified-route seam additively for explicit local-processor, service/runtime, adapter, qualification, option-profile, and CPU-resource identities.
- Consume bytes only through the existing BSS-009-authorized input boundary.
- Keep Docling models/artifacts local and available before route readiness; normal document processing must not depend on downloading models from the network.
- Deterministically map source-grounded page/text/heading/table structure into the existing generic perception result with stable source-unit IDs, preserved page/reading order, and geometry only when trustworthy.
- Use the real existing normalizer and parser.
- Produce real persistent-service repeatability, latency, readiness, failure, and provenance evidence with repository-approved non-confidential PDFs.

## Forbidden and non-authority work

- Do not use a fresh Python/Docling subprocess as the normal per-document production route.
- Do not change `NormalizedDocument v1`, its normalizer/parser, BSS-009 grant/result authority, IDSER semantic schemas, queues, replay/fencing, or Atlas truth ownership.
- Do not read `DocumentStore` directly, expose Docling publicly in the base Compose profile, add Redis/RQ/a second queue, or let Docling persist Atlas state.
- Do not let callers choose arbitrary Docling options.
- Do not emit `workflow_step`, `rule`, `constraint`, `actor`, semantic candidates, reconciliation decisions, accepted truth, fabricated confidence, or fabricated visual regions.
- Do not qualify scanned PDFs/OCR, GPU/CUDA acceleration, external-provider privacy terms, provider quota/economics, Gemini, or any semantic route.
- Do not substitute the model-free Native PDF pipeline merely to pass latency; its loss of layout/reading-order/table semantics requires separate architecture authority.

## Frozen Review Contract

| Row | Exact bounded behavior | Required proof / binary closure | Regression guard |
| --- | --- | --- | --- |
| RC-BSSV2-004-01-01 | A configured `atlas.document.perceive` route resolves only to the pinned Compose-private persistent Docling Serve CPU profile with explicit service/runtime/adapter/qualification/option identities. | Config/route/Compose inspection plus version endpoints/import-boundary tests. **PASS iff** missing/mutable/mismatched identities fail closed, no host-public exposure is required, and Atlas Core/skills do not import Docling internals. | BSS-V2-001/002 route and perception-interface suites. |
| RC-BSSV2-004-01-02 | Atlas sends only BSS-009-authorized bounded PDF bytes to the private Docling service; Docling cannot discover sources or choose processing policy. | Request-boundary tests and Compose network/config inspection. **PASS iff** no path/storage key/DB credential/source discovery reaches Docling, the request uses exact authorized bytes, and arbitrary OCR/remote/plugin/pipeline options are rejected or unavailable. | BSS-009 source-redemption tests. |
| RC-BSSV2-004-01-03 | Service readiness means required models and the exact Atlas no-OCR PDF option profile are warm/reusable before normal work; repeated requests reuse a long-lived service rather than spawning Docling per PDF. | Startup/readiness evidence, process/container identity observation, converter/model-cache evidence where available, and two sequential real conversions without service/process replacement. **PASS iff** route readiness waits for warm initialization and the Docling service/process remains resident across conversions. | Compose readiness and route health tests. |
| RC-BSSV2-004-01-04 | Real warm local Docling maps supported digital PDFs deterministically into source-grounded generic pages, text, headings, and tables, and the unchanged normalizer/parser accepts them. | Real persistent-service fixture matrix plus canonical repeated Safara comparison and actual `normalizePerceptionResult(...)` / `parseNormalizedDocument(...)`. **PASS iff** page/order/IDs/content/tables are materially deterministic, optional data is not fabricated, and `NormalizedDocument v1` requires no weakening. | DOCSPIKE fixture expectations and Atlas Core perception tests. |
| RC-BSSV2-004-01-05 | The qualified CPU route meets the Atlas perception latency requirement after readiness. | Warm-service timed matrix for Safara Full, Finance, Readiness, and repeated Safara with stage timings. **PASS iff** every required end-to-end warm-route run is <= 20,000 ms and cold-start/warm-up time is reported separately rather than hidden or amortized. | Performance harness must use the same Compose route/options as production-shaped proof. |
| RC-BSSV2-004-01-06 | Service/network/processing timeout, cancellation, unavailable/malformed response, mapper failure, and readiness loss are bounded without trusted partial result. | Controlled HTTP/service/adapter negative tests. **PASS iff** each case has stable safe classification, invalid/partial output is never normalized/handed off as success, cancellation/timeout is bounded, and Atlas does not silently fall back to a per-request subprocess or remote provider. | Existing worker cancellation/error normalization tests. |
| RC-BSSV2-004-01-07 | Local execution records executor provenance/runtime metrics without pretending to be an external provider. | Redaction/provenance tests and real run inspection. **PASS iff** service/Docling/Torch/device/option-profile/qualification identity and timing/resource observations are available, while credentials, provider tokens, quota domains, price profiles, privacy-class claims, source bytes, and raw response bodies are absent. | Bridge logging/redaction tests. |

## Required validation and Docker procedure

Run:

```text
route/config/network-boundary tests
persistent service readiness/warm-up proof
real local Docling fixture matrix through Compose-private HTTP
repeatability comparison
<=20s warm-route latency matrix
actual Atlas normalizer/parser validation
service unavailable / not-ready / timeout / cancellation / malformed-response negatives
mapper failures
affected Bridge perception-worker tests and typecheck
Atlas Core perception/contract tests
git diff --check
```

For Compose/image/configuration changes:

1. rebuild/recreate only affected Bridge/Docling services;
2. use the pinned CPU-only Docling Serve runtime/profile;
3. verify effective image/package/version identity;
4. verify model artifacts are already local;
5. verify `/health` and model-loading `/ready`;
6. warm the exact Atlas no-OCR PDF option fingerprint if boot readiness does not do so;
7. verify one resident Docling service/process serves sequential conversions;
8. prove no stale Bridge/Docling container serves the route;
9. never use `docker compose down --volumes` as routine repair.

BuildKit cache size is not the final image size. Record final image size separately from build cache when diagnosing dependency footprint.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `BOUNDARY-BSSV2-004-01-SOURCE` — BSS-009 authorizes bytes and Atlas retains source identity/result acceptance; `BOUNDARY-BSSV2-004-01-TRUTH` — Atlas owns normalization and all semantic truth.
- **Trust boundaries / assets:** BSS-009 authorized bytes -> Bridge HTTP client -> private Docling service -> untrusted Docling JSON -> deterministic mapper -> Atlas normalizer.
- **Identity context:** execution, artifact/source SHA-256, route, service/image, Docling/docling-serve/Torch/device, option-profile, adapter, qualification identities.
- **Extension seams:** `SEAM-BSSV2-004-01-LOCAL-SERVICE` for private resident execution; `SEAM-BSSV2-004-01-READINESS` for warm-route admission; `SEAM-BSSV2-004-01-PROVENANCE` for processor evidence.
- **Prohibited couplings:** `COUPLING-BSSV2-004-01-SOURCE-DISCOVERY`; `COUPLING-BSSV2-004-01-SEMANTICS`; `COUPLING-BSSV2-004-01-PUBLIC-SERVICE`; `COUPLING-BSSV2-004-01-SECOND-QUEUE`; `COUPLING-BSSV2-004-01-PROVIDER-ECONOMICS`.
- **Unresolved security policy:** final production host isolation/resource sizing remains a later deployment decision; current source/network/role boundaries remain mandatory.

| Mandatory review binding | Readiness reference | Narrow question / expected evidence |
| --- | --- | --- |
| REV-READY-BSSV2-004-01-01 | SEAM-BSSV2-004-01-LOCAL-SERVICE / SOURCE | Does only Bridge send bounded authorized bytes to a non-public resident Docling service with no source-discovery authority? Network/request/config negatives. |
| REV-READY-BSSV2-004-01-02 | SEAM-BSSV2-004-01-READINESS | Can Atlas avoid sending normal work until the required models/profile are ready and warm, without per-document process initialization? Startup/readiness/sequential-run evidence. |
| REV-READY-BSSV2-004-01-03 | COUPLING-BSSV2-004-01-SEMANTICS / PROVENANCE | Does the mapper remain structural only while provenance/timing is useful and redacted? Fixture/output/log assertions. |

## GO hard stop and CK-ready completion

GO stops after the **persistent, ready, warm Compose-private Docling CPU service** can turn an already-authorized bounded digital PDF into a deterministic parser-valid `NormalizedDocument v1` and every required warm-route qualification run is <=20 seconds end-to-end.

It must not schedule IDSER D1, deliver a result to Atlas, start semantic extraction/reconciliation, activate GPU or a remote model, or broaden OCR support.

`READY_FOR_CK` requires all seven Review Contract rows proven with the named production-shaped service harnesses. A working subprocess fallback, successful cold one-off script, or structurally correct result above the latency gate is not CK-ready.
