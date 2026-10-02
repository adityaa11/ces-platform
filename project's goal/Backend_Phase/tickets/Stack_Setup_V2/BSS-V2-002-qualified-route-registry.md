# BSS-V2-002: Qualified route registry and deployment-profile foundation

- **State:** `approved` following CK `PASS` for reviewed commit `b83fa36`; **Review batch:** `BSS-V2-BATCH-02`.
- **GO checkpoint:** [BSS-V2-BATCH-02-b83fa36-go.md](../../../feedback/BSS-V2-BATCH-02-b83fa36-go.md).
- **CK review:** [BSS-V2-BATCH-02-b83fa36-review.md](../../../feedback/BSS-V2-BATCH-02-b83fa36-review.md).
- **Dependencies:** BSS-V2-001 at CK `PASS`
- **References:** V3 §§4–6, 24, 31–33; Baseline V2 §§11–12, 30–31, 48; implementation context §§6, 11, 21, 28–29

## Outcome and current seam

Introduce a server-controlled capability-to-qualified-route resolver so generic paths no longer construct a vendor class. Today `BridgeConfig`, `main.ts`, `worker-main.ts`, and Compose select Mistral directly and can silently select `TestRuntime` when no key exists.

## Scope and forbidden work

Define route identity, capability, provider/model/processor identity, adapter and qualification versions, work class, enabled state, and deployment profile. Validate profile selection at config/startup; route resolution is explicit for interactive and worker execution. Provide extension fields/references for future quota, privacy, cost, and fallback without implementing their policy. Test runtime is permitted only under an explicit test profile; development without a live route is unavailable, and live/production-shaped readiness fails safe. Do not add Gemini transport/live calls, ledger, quota enforcement, privacy policy, fallback, or change semantic contracts.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-002-01 | A request names an Atlas capability; resolver returns one enabled qualified route or a stable unavailable/invalid outcome. | Resolver matrix tests. **PASS iff** unknown, disabled, expired, duplicate, and unqualified mappings cannot execute. | Bridge config/runtime |
| RC-BSSV2-002-02 | Provider/model IDs and route selection are server-controlled deployment configuration. | Boundary tests and payload inspection. **PASS iff** client/skill/queue payload cannot select arbitrary vendor/model/endpoint. | BSS-005 contracts; semantic queue |
| RC-BSSV2-002-03 | Profile configuration validates route capability, pinned identity, qualification reference, and adapter availability before a live profile is ready. | Startup/readiness tests. **PASS iff** invalid active configuration fails safe and `*-latest` is rejected unless an explicit qualifying policy is configured. | Compose readiness |
| RC-BSSV2-002-04 | TestRuntime is available only for an explicit test profile; missing live credentials cannot yield deterministic success in a development/live profile. | Profile-selection tests. **PASS iff** no provider-key omission produces a production-shaped test response. | BSS-005 SSE tests |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-002-ROUTING` — Agents Bridge owns provider/model allowlists; Atlas features request capabilities.
- **Trust transition:** `SEAM-BSSV2-002-SERVER-ROUTING` — deployment profile resolves server-side capability configuration.
- **Prohibited coupling:** `COUPLING-BSSV2-002-CLIENT-MODEL` — no caller chooses provider/model/endpoint or qualification identity.
- **Unresolved policy:** `SEC-GAP-BSSV2-002-PRODUCTION-PROFILE` — final production profile composition is deferred.
- **Review bindings:** `REV-READY-BSSV2-002-01` verifies fail-safe profile validation; `REV-READY-BSSV2-002-02` verifies caller-controlled vendor selection is impossible.

## Validation, Docker, and handoff

Run deterministic resolver/profile/readiness tests, existing runtime and worker injection regressions, and affected typechecks. Rebuild/recreate Bridge services if config/Compose changes; verify only redacted config summaries. Hard stop: adding an adapter or live qualification belongs to BSS-V2-003/004. On PASS, BSS-V2-003 consumes the resolver.
