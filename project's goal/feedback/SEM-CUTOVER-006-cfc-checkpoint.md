# CFC checkpoint: SEM-CUTOVER-006

- **Ticket:** `SEM-CUTOVER-006` — BSS-V2-004-03-05 contextual-trust remediation
- **Batch:** `SEM-CUTOVER`
- **Review target:** `0d8a8a13a3ee968923a543de915dc7c681fbfd37` (`fix(sem-cutover): bind finalizer lineage to relationship basis`)
- **Original CK artifact:** `project's goal/feedback/SEM-CUTOVER-006-0954233-review.md`
- **HMN authorization consumed:** `HMN-SEM-CUTOVER-006-003`
- **Workflow state:** `awaiting_review`

## CFC working progress view

| Frozen clause | Status | Closure evidence | Required command and outcome | Frozen oracle |
|---|---|---|---|---|
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/src/semantic-extraction-finalizer.ts`: `validateRevision` now derives the lineage with `relationshipSha256({ scope, ownedSource, contextSource, relationship })` and rejects a mismatch before verifier invocation. `apps/agents-bridge/tests/semantic-extraction-finalizer.sem-cutover-006.test.ts` constructs a forged lineage, recomputes its revision hash, and proves `SOURCE_RELATIONSHIP_BLOCKED`. | `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS. `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-extraction-finalizer.sem-cutover-006.test.ts` — PASS, 3/3. | PASS: forged-but-rehashed lineage is rejected before canonical output; valid derived lineage passes the focused suite. |

## Provenance and bounded change

The transferred basis is the permitted finalizer and focused-test delta from
`0954233c5393995d600a316264e1b9ffd5f8c37e`, whose parent was the authorized
primary-branch base `b3984b0dbac5288dbcb036c941285d474f131ce5`. The resulting
primary-branch implementation target is `0d8a8a13a3ee968923a543de915dc7c681fbfd37`.

The resulting target preserves that finalizer-only verified-context transfer
and adds the frozen CK correction: the relationship lineage must equal the
SHA-256 basis derived from immutable scope, owned source, context source, and
relationship content. The focused regression recomputes `revisionHash` after
forging the lineage, so structural hash consistency alone cannot qualify the
revision.

## Direct regressions checked

- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` — PASS, 7/7.
- `git diff --check` — PASS.

No provider, worker composition, schema, grant, repository, persistence,
publication, Master, admission, Docker, or deployment path changed. Historical
`RC-006-02` through `RC-006-05` were not redesigned; the retained worker
regression is passing evidence only.

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint for frozen clause `CK-001.a`.
It does not issue `PASS`; independent CK must verify this target, the frozen
oracle, and direct regressions only.
