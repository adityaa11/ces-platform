# BSS-V2-BATCH-04.01 CK review

- **Ticket:** BSS-V2-004-01 — Persistent local Docling perception service integration
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `359323288d9c1f1db88f6f6c77402ae4683c1217` (`docs: record Docling GO review target`)
- **Implementation commit recorded by GO:** `b6b62d03f3c87f19863b0ab388017be2f90a5f24` (`feat(bridge): qualify persistent Docling CPU route`)
- **Review batch:** `BSS-V2-BATCH-04.01`
- **Result:** `CHANGES_REQUIRED`

## Review basis and evidence

The reviewed commit's parent is the GO implementation commit. The reviewed commit changes only `project's goal/feedback/BSS-V2-004-01-go-checkpoint.md`, adding the implementation/review target record. The ticket-owned source files inspected therefore resolve to the recorded implementation revision. Per user clarification, remaining working-tree changes are outside this ticket; no ticket-owned working-tree changes were present.

Reviewed the frozen ticket's seven Review Contract rows, its CPU resource-profile and performance requirements, and the GO checkpoint. Inspected the target commit's Compose service and worker dependency, Docling adapter and mapper, route identity checks, provider tests, and qualification harness. The checkpoint records passing Bridge/Core/Contracts tests and a real Compose qualification run, along with four warm end-to-end values (6,019 ms, 4,015 ms, 2,021 ms, and 6,016 ms), a 6,074 ms warm-up, and approximately 6.4 s restart-to-ready. These are recorded GO evidence; CK did not rerun those commands or the live service.

Contract row disposition:

| Ticket row | Status | Review note |
| --- | --- | --- |
| RC-BSSV2-004-01-01 | PROVEN | Pinned CPU image digest, private Compose service, route identity checks, and package identities are recorded. |
| RC-BSSV2-004-01-02 | PROVEN | Adapter receives bounded PDF bytes, posts those bytes to the private v1 endpoint, and fixes the processing options. |
| RC-BSSV2-004-01-03 | UNRESOLVED | Compose admits the worker after `/ready`, but no startup gate proves the exact Atlas option profile has been warmed before ordinary work. |
| RC-BSSV2-004-01-04 | UNRESOLVED | Mapper assigns page 1 when source page provenance is absent. |
| RC-BSSV2-004-01-05 | IMPLEMENTED_UNPROVEN | End-to-end values meet the gate, but required stage measurements are missing from the harness/checkpoint. |
| RC-BSSV2-004-01-06 | IMPLEMENTED_UNPROVEN | Safe classifications and cancellation handling are present, but the required bounded-timeout negative scenario is not exercised by the provider test or reported in the checkpoint. |
| RC-BSSV2-004-01-07 | IMPLEMENTED_UNPROVEN | Local runtime identity is recorded, but the required CPU-resource profile evidence is incomplete. |

## Frozen Finding Closure Matrix

### CK-001 — Exact-profile warm readiness is not an admission gate

- **Authority:** BSS-V2-004-01, “Service readiness and warm execution”; RC-BSSV2-004-01-03 requires readiness to wait for the exact Atlas no-OCR profile to be warm and reusable.
- **Unsatisfied evidence:** `docker-compose.yml` healthchecks Docling `/ready` and lets `agents-bridge-worker` start when that healthcheck passes. `worker-main.ts` starts the worker without a profile warm-up. The qualification harness performs a separate warm-up invocation, which does not gate ordinary worker admission.
- **Observable correction:** Make successful initialization of the exact Atlas option fingerprint a prerequisite for the perception route accepting ordinary work, using a repository-owned or synthetic non-confidential PDF. Keep the service resident and retain the pinned identity checks.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Closure oracle (binary) | Direct-regression boundary |
| --- | --- | --- | --- |
| CK-001.a | “The Docling service must remain unavailable to Atlas perception routing until” items 1–5, including exact-profile initialization/warm-up; RC-BSSV2-004-01-03. | **PASS iff** committed Compose/worker startup code and a production-shaped readiness observation show ordinary perception work is unavailable before exact-profile warm-up succeeds, then becomes available after that warm-up; the warm-up uses non-confidential fixture data and the same pinned service/profile. Evidence: startup/readiness implementation and a Compose readiness observation or test. | Only route admission and exact-profile startup/readiness behavior, including direct regressions to service readiness. |

### CK-002 — Missing page provenance is converted to page 1

- **Authority:** BSS-V2-004-01 scope requires source-grounded page/order mapping; RC-BSSV2-004-01-04 requires page/order to be materially deterministic and optional data not fabricated.
- **Unsatisfied evidence:** `apps/agents-bridge/src/providers/docling.ts` implements `pageFor` with `... ?? 1`. A Docling text/table item without a usable provenance page is therefore presented as belonging to page 1 without source evidence.
- **Observable correction:** Reject such an item or preserve it without an invented page assignment, consistent with the existing normalized-document contract.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Closure oracle (binary) | Direct-regression boundary |
| --- | --- | --- | --- |
| CK-002.a | Scope: deterministic source-grounded page/text/heading/table mapping; RC-BSSV2-004-01-04 requires source-grounded deterministic page/order and no fabricated optional data. | **PASS iff** a mapper test with missing and malformed page provenance proves no item is assigned page 1 (or another invented page), and the real fixture matrix still maps and parses the supported PDFs as `NormalizedDocument v1`. Evidence: mapper test and qualification result. | Direct mapping behavior for Docling page provenance, IDs, order, and parser-valid output. |

### CK-003 — Bounded timeout behavior lacks the required negative proof

- **Authority:** RC-BSSV2-004-01-06 explicitly names service/network/processing timeout and requires controlled HTTP/service/adapter negative tests showing bounded cancellation/timeout behavior.
- **Unsatisfied evidence:** `DoclingProvider` uses `AbortSignal.timeout` and maps an elapsed deadline to a timeout error, but `apps/agents-bridge/tests/docling-provider.test.ts` only tests a pre-aborted signal for cancellation; it does not hold a request open through the configured deadline and assert the bounded timeout result. The GO checkpoint does not report that named scenario.
- **Observable correction:** Add or record a controlled stalled-request case that exercises the configured deadline and proves timeout classification and bounded completion without mapping or fallback.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Closure oracle (binary) | Direct-regression boundary |
| --- | --- | --- | --- |
| CK-003.a | RC-BSSV2-004-01-06 explicitly requires timeout cases and bounded cancellation/timeout. | **PASS iff** a provider test or equivalent controlled adapter validation holds the Docling request open past the configured timeout, then demonstrates a stable timeout classification within a bounded interval, with no mapper invocation, partial result, or fallback. Evidence: test/validation output and the adapter timeout path. | Docling request timeout and cancellation handling only. |

### CK-004 — Required performance-stage measurements are absent

- **Authority:** BSS-V2-004-01 “Performance qualification” explicitly requires separate measurements for cold boot, profile warm-up, HTTP/request transfer, Docling-reported processing/pipeline time, mapping/serialization, normalization/parsing, and end-to-end warm-route latency; RC-BSSV2-004-01-05 requires the timed matrix and these stage timings.
- **Unsatisfied evidence:** `scripts/bss-v2-004-01/qualify-docling.mts` records provider, normalization, parsing, and total elapsed time. Its provider duration combines readiness/version calls, transfer, conversion, response handling, and mapping, and it does not record Docling-reported processing time. The checkpoint includes restart-to-ready and warm-up summaries but not the remaining separate stage values.
- **Observable correction:** Extend the production-shaped qualification evidence to record each ticket-named timing separately, then retain the four required warm runs and their end-to-end gate results.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Closure oracle (binary) | Direct-regression boundary |
| --- | --- | --- | --- |
| CK-004.a | Performance qualification timing list and RC-BSSV2-004-01-05. | **PASS iff** a durable qualification output identifies separate values for service cold boot, exact-profile warm-up, HTTP/request transfer, Docling-reported processing/pipeline, mapping/serialization, normalization/parsing, and end-to-end latency, and shows Safara Full, Finance, Readiness, and repeated Safara each at or below 20,000 ms end-to-end. Evidence: qualification harness/output from the pinned Compose route. | The existing route/profile and named latency matrix only; the 20,000 ms threshold is unchanged. |

### CK-005 — CPU resource qualification record is incomplete

- **Authority:** BSS-V2-004-01 “CPU resource profile” explicitly requires recording the chosen thread count and rationale, local worker/concurrency count, host/container CPU availability, memory if readily available, and absence of CUDA device use. RC-BSSV2-004-01-07 also requires local runtime/resource observations.
- **Unsatisfied evidence:** Compose sets `DOCLING_DEVICE=cpu`, thread environment defaults to 4, and `DOCLING_SERVE_WORKERS=1`; the checkpoint records Torch `2.14.1+cpu`. It does not record the qualification host/container CPU availability, the reason for choosing four threads, an explicit bound/observation for local conversion concurrency, or readily available memory observation.
- **Observable correction:** Add the bounded resource-profile observations and the basis for selected CPU settings to the qualification record, including an explicit Docling local conversion concurrency bound. Preserve the CPU-only runtime identity evidence.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Closure oracle (binary) | Direct-regression boundary |
| --- | --- | --- | --- |
| CK-005.a | “CPU resource profile” required record list; RC-BSSV2-004-01-07 requires runtime metrics/resource observations. | **PASS iff** the qualification record states available host/container CPUs, selected Docling CPU threads and rationale, an explicit local conversion concurrency limit, memory observation when available, and evidence of no CUDA device use for the pinned CPU run. Evidence: Compose/runtime configuration and qualification output. | CPU resource settings and observations for this Docling route only. |

## Decision

`CHANGES_REQUIRED`. Five ticket-authorized clauses remain unresolved or insufficiently proven. The findings are limited to the frozen BSS-V2-004-01 obligations above. No separate scope-change observation was identified. This is the single consolidated first review for the checkpoint; the clause IDs and binary oracles are frozen by this artifact.

CK did not execute tests, rebuild/restart Compose services, or rerun the live qualification matrix. Validation outcomes above are reported only as recorded in the GO checkpoint; the review findings are based on the committed implementation and evidence inspected.
