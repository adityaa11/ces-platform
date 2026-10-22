# BSS-V2-014-02-02 — Shared-domain calculated-allocation publication

- **State:** `planned`; executable BSS-V2-005 successor. No GO, admission, provider operation, or route enablement is authorized.
- **Parent:** [BSS-V2-014-02 split map](BSS-V2-014-02-model-route-shared-domain-publication.md).
- **Dependencies:** BSS-V2-014-01 and BSS-V2-014-02-01 CK `PASS`; approved BSS-V2-005 immutable desired-plan publication/activation and BSS-V2-006-05 effective-policy provenance contracts. Production activation additionally requires the parent-owned BSS-V2-014 activation/cutover gate; this child does not grant it.

## Exact scope

Evolve the existing desired-plan publication seam atomically. Replace successor writes to the active single-route association with `DesiredAdmissionProfileRouteBinding/v2`, keyed by `(quotaDomainId, desiredProfileVersion, routeId, authorityVersion)`, and persist exactly one immutable `CalculatedClassProcessAllocation/v1` for that desired-plan identity. A binding references the full immutable `-02-01` authority tuple, rather than treating `routeId` as an independently resolvable identity. All bindings reference the same allocation and same capacity profile/effective mask; none copy provider quota or process baseline. The existing activation/epoch mechanism activates the complete immutable plan only after the parent-owned production gate is satisfied.

Before successor DDL is selected, inventory every production caller, exact PostgreSQL signature, `EXECUTE` grant, owner, synonym/wrapper, trigger/dependent object, and test harness for `bridge.publish_effective_policy_converged_desired_admission_profile`, including the currently executable `_v1` signature. A future additive successor migration must migrate every authorized caller and, in the same deployment/cutover, retire the former executable single-route callable by drop or revoked execution as appropriate. Historical plans and references stay readable; they do not preserve an active publisher. An overload alone is prohibited.

This child consumes only durable authority from `-02-01`. It neither changes registry publication, reader shape, runtime admission, consumer code, resolver behavior, provider activation, nor historical rows.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140202-01` | Two already-qualified routes in one quota domain bind one capacity profile, one effective mask, one calculated process allocation, and their exact immutable authority versions; exact vectors/fingerprint occur once, not per route. | Shared-domain two-route isolated PostgreSQL fixture. |
| `RC-0140202-02` | A stale/forged authority version, different effective mask or capacity-profile version, foreign domain, inactive process/route, duplicate canonical binding, or missing allocation fails before publication/activation. | Negative SQL publication fixtures and zero activation assertion. |
| `RC-0140202-03` | A route/model/process/weight/policy revision publishes a new immutable desired-plan identity and candidate activation revision. Historical plans, bindings, reservations, and claimed work remain readable with their prior identities and liabilities; production activation remains blocked by `RC-0140202-05`. | Publication/revision plus existing recovery fixture; historical immutability assertions and zero premature-activation assertion. |
| `RC-0140202-04` | A complete caller/signature/grant/dependent-object inventory proves every authorized production caller uses the successor shared-domain publication seam. During the same cutover, the former single-route signature, including any `_v1` callable, is dropped or has no executable grant; only the successor can publish or activate a plan. | Migration review, `pg_proc`/`information_schema` signature-and-privilege assertions, dependent-object inventory, and negative invocation of every retired signature. |
| `RC-0140202-05` | Successor publication can create immutable candidate data and qualify it in isolation, but cannot make it production-active until the parent BSS-V2-014 gate proves compatible `-04` admission enforcement and the `-03/-05` one-reader v2 cutover. | Parent-gate integration fixture: publication succeeds while premature activation is rejected with zero runtime-policy change. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140202-T1`: durable route authority and allocation cross into immutable activation.
- `SR-0140202-A1`: effective mask, capacity/profile versions, allocation, bindings, fingerprints, and historical liabilities.
- `SR-0140202-C1`: prohibit authority substitution, quota cloning, mutable history, alternate publication/activation, route fan-out, executable legacy signature, and premature production activation.
- `SR-0140202-R1`: `RC-0140202-01..05` verify shared-domain uniqueness, closed publication negatives, immutable revisioning, legacy retirement, and the activation gate.

## Hard stop

Stop if the existing publication/activation primitive cannot represent the complete binding/allocation relation or retire the former executable signature without a parallel active model, legacy dual write, resolver expansion, or cloning quotas. Do not defer the failed authority check to runtime admission or leave an old callable executable.
