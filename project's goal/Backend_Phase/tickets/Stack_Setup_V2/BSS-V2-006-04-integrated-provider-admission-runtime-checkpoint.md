# BSS-V2-006-04: Integrated durable provider-admission runtime checkpoint

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-04`
- **Dependencies:** BSS-V2-006-01 through -03 CK `PASS`
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)

## Outcome

Prove the generic runtime as one reusable external-provider authority before semantic extraction becomes a client.

## Required deterministic scenario

At minimum, use one shared synthetic quota domain with:

```text
hard-protected interactive process
background extraction-like process with large backlog
background reconciliation-like process with heavier token envelope
multiple fairness keys/projects
bounded RPM + TPM + RPD + concurrency
```

Exercise saturation, borrowing, interactive arrival, plan decrease/increase, actual-usage under/over reservation, 429/Retry-After, restart, acknowledgement loss and deduplicated wakeup.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00604-01 | All external executable transport in the harness is preceded by one durable reservation/admission decision. | PASS iff denied/deferred work never reaches fake transport and no admission bypass path exists. |
| RC-BSSV2-00604-02 | Background load cannot block a healthy protected interactive request, while idle background capacity remains work-conserving among background lanes. | PASS iff the interactive request receives protected capacity without waiting behind the background queue and background fairness/borrowing still progresses. |
| RC-BSSV2-00604-03 | Restart/replay/ack-loss preserve reservation, fairness and once-only dispatch/reconciliation effects. | PASS iff no quota double-spend/refund, duplicate executable job or stale capacity release occurs. |
| RC-BSSV2-00604-04 | Runtime dynamically converges across plan and provider-pressure changes without code/config reload of each consumer. | PASS iff profile vN -> vN+1 and temporary runtime clamp change new admissions as designed while existing work remains attributable. |
| RC-BSSV2-00604-05 | Local Docling and Atlas trusted state remain outside this external-provider authority. | PASS iff no local perception route needs quota metadata and Bridge admission tables/roles do not own Atlas truth. |

## Hard stop

After PASS, BSS-V2-006 is available as shared infrastructure. Do not implement semantic, reconciliation, CES or chat product behavior in this checkpoint.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00604-PGBOSS`, `BOUNDARY-BSSV2-00604-BRIDGE-OPS`, `BOUNDARY-BSSV2-00604-PLAN-CEILING`, and `BOUNDARY-BSSV2-00604-LOCAL-ATLAS-EXCLUSION` compose the accepted broker, persistence, policy-ceiling, Docling, and Atlas-truth separations.
- **Trust boundary:** `TRUST-BSSV2-00604-END-TO-END-ADMISSION` is the integrated transition from secret-free waiting work through one durable reservation to fake executable transport and exactly-once normalized usage reconciliation.
- **Sensitive assets:** `ASSET-BSSV2-00604-EVIDENCE` limits harness/evidence to synthetic work and redacted operational identities; no credential, authorization header, prompt, source document, or full provider body is required.
- **Identity context:** `IDENTITY-BSSV2-00604-TRACE` correlates logical work/attempt, process/fairness key, quota domain, active plan, resource envelope, reservation, job, transport outcome, reconciliation fence, pressure state, and wakeup across restart.
- **Extension seams:** `SEAM-BSSV2-00604-CONSUMER-CONTRACT`, `SEAM-BSSV2-00604-DECISION-TRACE`, `SEAM-BSSV2-00604-RESTART-RECOVERY`, and `SEAM-BSSV2-00604-DYNAMIC-CONVERGENCE` provide the reviewable integration points future consumers must reuse.
- **Prohibited couplings:** `COUPLING-BSSV2-00604-CONSUMER-LIMITER` forbids per-consumer quota schedulers; `COUPLING-BSSV2-00604-BYPASS`, `COUPLING-BSSV2-00604-SENSITIVE-EVIDENCE`, `COUPLING-BSSV2-00604-DOCLING-QUOTA`, and `COUPLING-BSSV2-00604-ATLAS-TRUTH` are forbidden.
- **Verification seams:** `VERIFY-BSSV2-00604-TRANSPORT-GATE`, `VERIFY-BSSV2-00604-PROTECTION-FAIRNESS`, `VERIFY-BSSV2-00604-RESTART-REPLAY`, `VERIFY-BSSV2-00604-PLAN-PRESSURE`, and `VERIFY-BSSV2-00604-ROLE-EXCLUSION` cover the complete deterministic scenario.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00604-LIVE-PROVIDER` leaves provider-specific privacy/residency/retention, real credentials, live limits, and production numeric policy to later qualified consumer work.
- **Review bindings:** `REV-READY-BSSV2-00604-01` verifies the end-to-end pre-transport gate and identity trace; `REV-READY-BSSV2-00604-02` verifies hard protection, multi-resource fairness, restart/replay, and exactly-once reconciliation; `REV-READY-BSSV2-00604-03` verifies dynamic plan/pressure convergence plus Docling/Atlas/sensitive-evidence exclusion.

## Workflow evidence

Implementation must close every Review Contract row in one deterministic integrated harness, record exact Compose commands/counts and redacted state/transport observations in a compact closure ledger, reach `READY_FOR_CK`, and only then move to `awaiting_review`. This ticket grants no GO by itself.
