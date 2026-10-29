# BSS Quota-Accounting-Policy Cutover Ticket Set

- **State:** `planned`
- **Source authority:** [BSS Accounting Policy Migration Removal Mechanism Audit](../../BSS-Re-organize/BSS_QUOTA_ACCOUNTING_POLICY_MIGRATION_REMOVAL_MECHANISM_AUDIT.md)
- **Decision preserved:** Option C — forward deprecation, application cutover, then physical removal.

## Purpose

Remove the obsolete `quota_accounting_policy_id` metadata from BSS without rewriting historical migrations, weakening current publisher/admission safeguards, or making an old writer fail during a rolling deployment. The source audit is authoritative. This set does not introduce an accounting-policy registry, resolver, dummy/default identifier, new policy, qualification, approval, candidate, activation, or runtime-accounting behavior.

## Ordered release contract

| Order | Ticket / batch | State | Depends on | Review question |
| ---: | --- | --- | --- | --- |
| 1 | [BSS-QAP-001](BSS-QAP-001-r1-nullable-deprecation-migration.md) / `BSS-QAP-BATCH-01` | `approved` | Closed Scope 01B replay history remains immutable; target catalog preflight before DDL | Does R1 add and register only `0112`, making the obsolete columns nullable and removing only the publisher equality predicate while retaining all existing protections? |
| 2 | [BSS-QAP-002](BSS-QAP-002-r2-id-free-writer-contract.md) / `BSS-QAP-BATCH-02` | `planned` | BSS-QAP-001 `PASS` | Does R2 remove every application, fixture, and operational-writer dependency on the obsolete IDs while the nullable R1 schema remains compatible with old writers? |
| 3 | [BSS-QAP-003](BSS-QAP-003-r3-physical-column-removal.md) / `BSS-QAP-BATCH-03` | `planned` | BSS-QAP-001 and BSS-QAP-002 `PASS`; explicit R3 GO after its evidence gate | Does R3 register and execute only `0113` after zero-writer and catalog proof, leaving both final tables column-free without changing runtime or public contracts? |

`0113_bssv2_quota_accounting_policy_removal` must not be registered, shipped to any migration executor, or executed before BSS-QAP-003 is explicitly authorized. An `0113` source file may be prepared/reviewed only within its own ticket; its runner registration remains R3-only.

## Workflow sizing and control

Each ticket owns one independently releasable boundary: database deprecation, writer-contract cutover, or physical DDL finalization. R2 intentionally keeps parser changes, test/script writers, and deployment inventory together: separating any of them would allow an incomplete writer cutover to be declared done and would weaken the source's R3 zero-writer gate.

For a ticket, GO implements only its frozen Review Contract and records a row-level `Review Contract Closure` with actual command evidence before `awaiting_review`. CK reviews all rows in one consolidated review; its `CK-###` clauses must trace to a ticket row and freeze a binary closure oracle. One CFC pass may remediate only those clauses. If a post-CFC result remains unresolved, HMN may authorize exactly the unresolved frozen clause IDs for one further bounded CFC checkpoint; it must not add acceptance criteria, reopen resolved rows, or advance another ticket. The shared contract at `.agents/skills/_shared/atlas-ticket-review-contract.md` governs all four workflow commands.

## Set-wide invariants

- Historical migrations, including `0023`, `0028`, `0076`, `0091`, `0093`, and `0094`, remain byte-for-byte unchanged. Scope 01B remains closed.
- The canonical `0076` Anoman seed remains historical replay evidence; it is not rewritten, requalified, duplicated, or replaced with a synthetic policy value.
- `0112` follows `0111`; it is the sole new registered name in R1/R2. `0113` is registered only in R3 after the recorded evidence gate.
- The publisher keeps its signature, `SECURITY DEFINER`, `search_path`, owner, `agents_bridge` execute grant, candidate-alias repairs, and every guard except the obsolete accounting-ID equality operand.
- Capacity dimensions, source/provenance, window validation, route qualification, effective enforcement, unknown-RPD semantics, reservations, feedback, usage reconciliation, fingerprints/revisions, and `CapacityPlanningSnapshot/v2` remain unchanged.
- No hardcoded policy ID, compatibility field, resolver, registry, permanent dual contract, or unapproved external retention mechanism is allowed.
- Scope 02B may be developed only as a contract-isolated target implementation before R1; its profile-publication integration must not run before BSS-QAP-001 applies the nullable migration, and it must never publish a substitute ID.

## Boundary and evidence handoff

R1 produces the nullable schema, publisher proof, and migration evidence consumed by R2. R2 produces the zero-effective-reference release inventory and affected regression evidence consumed by R3. R3's implementation is not eligible to begin until its ticket's six evidence inputs are present. A missing target catalog result, external-writer inventory, or retention decision is a blocked precondition—not permission to improvise a migration or alter a previous checkpoint.
