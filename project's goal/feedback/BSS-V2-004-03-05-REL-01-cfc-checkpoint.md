# BSS-V2-004-03-05-REL-01 CFC checkpoint

- **Ticket:** `BSS-V2-004-03-05-REL-01` — provisional relationship contract and producer
- **Remediation base:** `cf57d88cc375ef46f1060dee1314e15a0e001fcd`
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-004-03-05-REL-01-55dfa87-review.md`
- **CK result remediated:** `CHANGES_REQUIRED`
- **State:** `awaiting_review`

## Bounded remediation

This CFC pass addresses only `CK-001.a` through `CK-001.c` from the frozen CK
closure matrix. The ticket authority is `RC-REL-01-02`. The implementation
modules and all already-proven CK rows were preserved. The sole implementation
change is the focused negative-case coverage in
`packages/atlas-skills/tests/relationship-extraction-envelope.test.ts`.

## Frozen finding closure matrix

| Clause | Ticket authority and frozen oracle | Evidence / command | Status |
| --- | --- | --- | --- |
| `CK-001.a` | `RC-REL-01-02`; an omitted required relationship slot rejects before append. | The `missing relationship slot` mutation omits `context_source_slot`; the shared loop asserts rejection and `repository.appendCalls === 0`. `corepack pnpm --filter @atlas/skills exec jiti tests/relationship-extraction-envelope.test.ts` exited 0 (3 passed). | PROVEN — oracle passed |
| `CK-001.b` | `RC-REL-01-02`; a malformed decoded envelope object rejects before append. | The `malformed decoded envelope object` mutation uses `relationship_proposals: [null]`; the shared loop asserts rejection and `repository.appendCalls === 0`. Focused command exited 0 (3 passed). | PROVEN — oracle passed |
| `CK-001.c` | `RC-REL-01-02`; provider-supplied `confirmed` and `published` claims each reject before append. | The `confirmed claim` and `published claim` mutations add the respective strict-object fields; the shared loop asserts rejection and `repository.appendCalls === 0` for each. Focused command exited 0 (3 passed). | PROVEN — oracle passed |

## Direct-regression validation

Validation ran in the existing isolated checkout `C:\Temp\atlas-rel01-validation`, whose dependency installation is healthy. The primary checkout remains unable to start pnpm because its existing virtual-store `tsx`/`esbuild` link raises `EACCES`; this is the already-recorded local environment fault and does not affect the isolated results.

```text
corepack pnpm --filter @atlas/skills exec jiti tests/relationship-extraction-envelope.test.ts
exit 0; 3 passed, 0 failed

corepack pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts
exit 0; 18 passed, 0 failed
```

The focused command is the frozen closure-oracle harness. The legacy semantic
suite is the ticket-mandated direct-regression check. No provider, job,
reservation, worker, finalizer, migration, canonical Semantic V1, acceptance,
or publication behavior was changed.

Internal readiness: READY_FOR_CK.

This is a CFC handoff only, not a CK `PASS`. CK must verify the three frozen
clauses, this remediation diff, and direct regressions without reopening
already-proven rows.
