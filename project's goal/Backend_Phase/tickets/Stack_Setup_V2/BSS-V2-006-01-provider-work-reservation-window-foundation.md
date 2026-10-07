# BSS-V2-006-01: Durable provider-work, reservation, and quota-window foundation

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-01`
- **Dependencies:** BSS-V2-005-04 CK `PASS`; BSS-006; BSS-003 Bridge persistence/role boundary
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)

## Outcome

Create the Bridge-owned durable operational substrate for waiting provider work, per-attempt RequestResourceEnvelope reservations, quota-domain runtime/window state, and deduplicated wakeups. No fairness policy or real provider call is released yet.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00601-01 | Provider work registration is idempotent by logical work/attempt identity and persists process/quota/fairness/resource references without raw prompt/source bodies. | PASS iff duplicate registration yields one waiting work item and prohibited content/secrets are absent. |
| RC-BSSV2-00601-02 | Quota-domain runtime state durably tracks active plan version, refill/window state, in-flight concurrency and cooldown metadata. | PASS iff restart preserves capacity state and stale/missing plan references fail closed. |
| RC-BSSV2-00601-03 | Reservation records bind work identity, attempt, RequestResourceEnvelope and authorizing DesiredAdmissionProfile version. | PASS iff one attempt cannot hold duplicate live reservations and old reservations remain attributable after a plan change. |
| RC-BSSV2-00601-04 | Waiting/admitted execution uses pg-boss only and can schedule one deduplicated future wakeup without a polling daemon. | PASS iff no Redis/second broker/process-local timer becomes durable authority and duplicate wakeup requests collapse safely. |
| RC-BSSV2-00601-05 | Operational persistence remains Bridge-owned and cannot mutate Atlas trusted state. | PASS iff role tests keep `agents_bridge` in allowed operational schemas and deny trusted Atlas writes. |

## Hard stop

Persistence and deterministic state transitions exist, but no provider transport is authorized by this child.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00601-BRIDGE-OPS` restricts runtime state to Bridge operational schemas; `BOUNDARY-BSSV2-00601-PGBOSS` keeps pg-boss as the only broker/wakeup mechanism; `BOUNDARY-BSSV2-00601-PLAN` consumes exact active DesiredAdmissionProfile versions; `BOUNDARY-BSSV2-00601-ATLAS` denies trusted Atlas mutation.
- **Trust boundary:** `TRUST-BSSV2-00601-WORK-REGISTRATION` accepts a consumer's logical work identity and validated resource/profile references into durable waiting state without accepting source/prompt bodies.
- **Sensitive assets:** `ASSET-BSSV2-00601-CREDENTIAL-SOURCE` covers provider credentials, prompts, source bodies, and authorization headers, all prohibited from provider-work/reservation/window records and evidence.
- **Identity context:** `IDENTITY-BSSV2-00601-ATTEMPT` binds logical work, attempt, process, quota domain, fairness key, RequestResourceEnvelope, desired-profile version, reservation, wakeup, and state version.
- **Extension seams:** `SEAM-BSSV2-00601-WORK-STATE`, `SEAM-BSSV2-00601-RESERVATION`, `SEAM-BSSV2-00601-WINDOW`, `SEAM-BSSV2-00601-WAKEUP`, and `SEAM-BSSV2-00601-STATE-TRANSITION` retain later authorization/retention/observability attachment points.
- **Prohibited couplings:** `COUPLING-BSSV2-00601-RAW-CONTENT`, `COUPLING-BSSV2-00601-DUPLICATE-RESERVATION`, `COUPLING-BSSV2-00601-SECOND-BROKER`, `COUPLING-BSSV2-00601-POLLING-AUTHORITY`, and `COUPLING-BSSV2-00601-ATLAS-WRITE` are forbidden.
- **Verification seams:** `VERIFY-BSSV2-00601-IDEMPOTENCY`, `VERIFY-BSSV2-00601-RESTART`, `VERIFY-BSSV2-00601-ROLE`, `VERIFY-BSSV2-00601-REDACTION`, and `VERIFY-BSSV2-00601-WAKEUP-DEDUPE` cover each durable boundary.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00601-RETENTION` leaves future operational-state retention, incident response, and canonical audit policy unresolved.
- **Review bindings:** `REV-READY-BSSV2-00601-01` verifies registration/attempt identity and sensitive-data exclusion; `REV-READY-BSSV2-00601-02` verifies restart-safe windows/reservations/plan attribution; `REV-READY-BSSV2-00601-03` verifies pg-boss-only wakeup and Bridge/Atlas restricted-role isolation.

## Workflow evidence

Implementation must close every Review Contract row using migration, role, restart, idempotency, redaction, and wakeup-deduplication tests, record exact Compose commands/counts in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.
