# BSS-V2-014-01 contract freeze 001 — Versioned weighted class/process allocation

- **Ticket:** [BSS-V2-014-01 — Versioned weighted class/process allocation contract](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-01-weighted-allocation-contract.md)
- **Action:** initial bounded contract freeze before GO.
- **Operator authorization evidence:** explicit authorization in this task on 2026-10-23 to freeze `BSS-V2-014-01`, then run GO only for that ticket. No authorization ID is invented.
- **Reviewed planning baseline:** `4ec121ed793e1d23fe125faf063fa5a247cd12d0` on `codex/new-atlas-backend`; the baseline is an ancestor of the current branch.
- **Ticket state:** `frozen`. This record preserves the ticket verbatim except for its lifecycle/state link; it is not a CK result or an approval.

## Preconditions verified

| Prerequisite | Evidence | Result |
| --- | --- | --- |
| Current target | `codex/new-atlas-backend` at the reviewed planning baseline descendant; the active ticket resolves uniquely to `BSS-V2-014-01`. | `PROVEN` |
| BSS-V2-005 planning/registry/publication predecessors | `BSS-V2-005-05-04` is `approved` following CK `PASS` at `e76e43f`; its ticket records all named BSS-V2-005 predecessor CK results. | `PROVEN` |
| Effective-enforcement authority | BSS-V2-006-05 family closure is CK `PASS` at `cad0b9c2`, carrying the approved `EffectiveEnforcementPolicy/v1` semantics, including Anoman's authorized `unknown/not_enforced` RPD exclusion. | `PROVEN` |
| Planning readiness | `BSS-V2-014-planning-remediation-report.md` records `READY_FOR_CONTRACT_FREEZE` and no remaining planning blocker. This evidence is consumed here; it was not treated as a pre-existing freeze. | `PROVEN` |

## Frozen Review Contract

The authority is the frozen ticket, its BSS-V2-014 parent/ticket-set rules, the approved BSS-V2-005 registry/planner boundaries, and the accepted BSS-V2-006-05 effective-policy interface. No requirement is added, removed, or reinterpreted by this record.

| Row | Frozen implementation/proof obligation | Security and boundary binding |
| --- | --- | --- |
| `RC-01401-01` | Per eligible dimension, calculate `H=ceil(C*1000/10000)`, `I=ceil(C*2000/10000)`, `B=C-H-I`; prove the OpenAI-like and Anoman exact vectors and conservation with deterministic JSON output. | Server-derived `EffectiveEnforcementPolicy/v1` remains the only eligibility source. |
| `RC-01401-02` | Allocate once per class from positive weights using integer floor plus largest remainder and canonical `(processId, profileVersion)` tie-break; shuffled/tied/zero-seat fixtures prove deterministic conservation and typed `unfit`. | No process is multiplied by route count and no RPM-to-concurrency inference is permitted. |
| `RC-01401-03` | For the approved Anoman policy, materialize only `rpm,tpm,concurrency`; no numeric RPD allocation. Missing, revoked, mismatched, or non-approved exclusions fail closed. | `SR-01401-T1`, `SR-01401-C1`, `SR-01401-R1`. |
| `RC-01401-04` | Add the versioned interactive weight only on the existing server registry/parser path; preserve hard interactive protection; reject invalid service-class field combinations and prove the source boundary. | `SR-01401-T1`, `SR-01401-C1`, `SR-01401-R1`; no shim, second registry, or historical record change. |
| `RC-01401-05` | Honor an explicit cap as a hard upper bound; record cap-caused unused remainder without redistribution to another process or class. | Cap remains planning authority and is not a borrowing exception. |
| `RC-01401-06` | Keep planning pure and prove no database, reservation, job, transport, provider, or request-body side effect through the static dependency test and typecheck. | `SR-01401-T1`, `SR-01401-C1`, `SR-01401-R1`; no second planner or capacity authority. |

## Frozen validations and hard stops

The exact ticket commands are frozen unchanged:

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-capacity-allocation.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

The ticket hard stops remain active: stop for authority if an interactive weight cannot live on the versioned existing registry, class arithmetic cannot conserve a known dimension, or a consumer requires a distinct allocator. No legacy registration adapter, historical-plan change, inferred concurrency, or numeric treatment of authorized unknown RPD is permitted.

## GO boundary

The subsequent explicit `go BSS-V2-014-01` is authorized only to implement this frozen contract through `capacity-planner.ts` and `process-workload-catalogue.ts`, their direct tests, and its bounded evidence/checkpoint artifacts. It does not authorize CK, CFC, HMN, a successor ticket, database migration, publication/activation, provider execution, or consumer work.
