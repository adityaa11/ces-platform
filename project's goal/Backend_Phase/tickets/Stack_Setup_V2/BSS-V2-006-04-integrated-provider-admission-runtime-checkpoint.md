# BSS-V2-006-04 — Integrated provider-admission runtime checkpoint (split map)

- **State:** `planned`; non-executable family/traceability map. It is not GO, CFC authority, or CK PASS.
- **Review batch:** `BSS-V2-BATCH-06-04`
- **Dependencies:** BSS-V2-006-01/02, BSS-V2-005-05-04, and every BSS-V2-006-03A-01..06 child must have CK `PASS`. BSS-V2-005-05-04 is the terminal 005-05 child; the 03A and 005-05 parents are traceability-only.
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21 and [consumer interface checkpoint](../../bss-provider-consumer-contract-checkpoint-20261016.md).

## Split decision

The former executable checkpoint combined independent public read, operational command, payload-adapter/send, feedback/recovery, interactive lifecycle, capacity-convergence, and multi-consumer compatibility seams. A defect in any one would force GO, CK, CFC, or HMN to reopen unrelated implementation and evidence. It is therefore too large for one bounded workflow cycle.

The following children preserve the original hard stop without weakening or deleting an oracle:

1. [BSS-V2-006-04-01 — Runtime capacity-constraint read boundary](BSS-V2-006-04-01-runtime-capacity-constraint-read-boundary.md): original RC-11.
2. [BSS-V2-006-04-02 — Provider work admission and exclusive send boundary](BSS-V2-006-04-02-provider-work-admission-exclusive-send-boundary.md): RC-01, background half of RC-12, and registration/TOCTOU portion of RC-14.
3. [BSS-V2-006-04-03 — Operational outcome and feedback recovery projection](BSS-V2-006-04-03-operational-outcome-feedback-recovery-projection.md): RC-03, RC-13, and post-dispatch/replay portion of RC-14.
4. [BSS-V2-006-04-04 — Interactive admitted-work lifecycle](BSS-V2-006-04-04-interactive-admitted-work-lifecycle.md): RC-09, RC-10, and interactive half of RC-12.
5. [BSS-V2-006-04-05 — Constraint convergence and structural-replan projection](BSS-V2-006-04-05-constraint-convergence-structural-replan-projection.md): RC-04, RC-05, RC-07, RC-08.
6. [BSS-V2-006-04-06 — Generic multi-consumer compatibility closure](BSS-V2-006-04-06-generic-multi-consumer-compatibility-closure.md): RC-02, RC-06, RC-15, RC-16 and the final composed deterministic scenario.

## Family invariants (frozen)

All children reuse, rather than clone, the 03A pg-boss admitted-job consumer, transport claim, feedback/accounting/pressure and active-plan wakeup. BSS owns the reservation/attempt/dispatch/feedback fence, not semantic parsing, reconciliation, consumer credentials, prompt bytes, source/media grants, Atlas truth, or consumer lifecycle state. `CapacityPlanningSnapshot/v1` remains BSS-005 policy read; `RuntimeCapacityConstraint/v1` remains BSS-006 transient effective-state read; neither is a send permit.

For any admitted workload, the sole outbound authorization is:

```text
authorized consumer -> ProviderWorkAdmission/v1 -> BSS reservation + pg-boss dispatch
-> 03A claimed transport -> normalized operational feedback -> typed consumer outcome
```

No child may retain a selectable direct adapter send, consumer-local limiter, provider-SDK recursive retry, second broker, BSS-local semantic/reconciliation interpreter, source/secret bytes in BSS metadata, or BSS-005 capacity-policy publication from ambiguous 429/operational intent. A retry always creates a new explicitly admitted attempt. Semantic/reconciliation correctness failures remain consumer-owned.

## Dependency and closure rule

Children execute strictly in numeric order; each requires all earlier children to have CK `PASS`, in addition to the family dependencies. Child `-06` is the only terminal family closure and must consume the approved public surfaces as an external fake consumer, not inspect internal helpers as a substitute. A missing predecessor-owned interface, a need to change BSS-005 policy authority, or an inability to serialize the adapter/result ownership is `BLOCKED_AUTHORITY`, not permission to create a bypass.

Only when `-01` through `-06` independently receive CK `PASS` is BSS-V2-006 the reusable hard stop: authenticated effective-constraint read plus durable provider-work admission/outcomes. This still does not authorize SEM-CUTOVER, chatbot UX, reconciliation implementation, CES, Atlas truth writes, production credentials, or an automatic cutover of historical ordinary semantic extraction.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** approved 005-05 structural-policy read and 03A internal execution/accounting seams.
- **Trust boundaries:** authenticated consumer identity -> immutable logical work/attempt -> BSS reservation/claimed send -> redacted feedback -> typed operational outcome.
- **Identity context:** process/workload/route/quota-domain, service class, logical work/attempt, envelope/payload hash, plan/constraint/fairness revisions, reservation/job/lease/outcome and wakeup identities.
- **Prohibited couplings:** direct transport, consumer limiter/retry, raw payload/secrets, semantic/reconciliation special fields, Atlas truth, BSS-005 publication from runtime pressure.
- **Review bindings:** each child must prove only its mapped oracle(s) with non-inert durable counters; `-06` proves the composed compatibility boundary.

## Workflow evidence

Each child records its exact commands, fixture identity, durable reservations/jobs/claims/sends/outcomes and redacted observations before `READY_FOR_CK`. CK reviews only that child’s mapped oracle(s); CFC repairs only a CK finding traced to that child; HMN may authorize only an unresolved mapped oracle and cannot transfer a defect into a sibling or approved predecessor.
