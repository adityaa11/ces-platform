# BSS-V2-004-02: IDSER D1 Docling perception lifecycle checkpoint

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.02`
- **Dependencies:** BSS-V2-004-01 at CK `PASS`; approved IDSER-003; approved BSS-009/BSS-009-01/BSS-009-02
- **References:** V3 §§3, 15, 31–35; Baseline V2 §§7, 14–15, 28–31; BSS V2 context §§14–15, 22, 28–31

## Outcome and starting seam

Compose the already-approved production-shaped lifecycle with the qualified local Docling route:

```text
create project / bundle -> IDSER-003 schedules D1 -> BSS-009 source grant
-> Agents Bridge redeems verified PDF bytes -> qualified Docling route -> Docling
-> existing normalization -> NormalizedDocument v1 -> authenticated Atlas handoff
-> one accepted logical derived perception result/cache
```

Success means Atlas has accepted a valid `NormalizedDocument v1` for the IDSER-scheduled D1 perception execution.

## Scope

- Wire the BSS-V2-004-01 qualified route through the existing IDSER-003 D1 job, BSS-009 grant redemption, existing perception worker, normalizer, authenticated result handoff, cache/fence, pg-boss retry/replay, and existing Compose stack.
- Prove the stated success path with a real local Docling execution and the inherited production-shaped Atlas/Bridge/PostgreSQL/pg-boss boundaries.
- Prove applicable failure, recovery, and exactly-once logical completion behavior without changing inherited lifecycle semantics: expired/tampered grant; source hash/size/MIME mismatch; local startup/processing failure; timeout/cancellation; malformed mapping; normalization/integrity failure; result-delivery outage; acknowledgement loss; duplicate delivery; stale/conflicting result; worker restart/replay.

## Forbidden and non-authority work

- Do not alter BSS-009 source grants, Atlas acceptance/fencing/cache semantics, IDSER-003 transaction kickoff, BSS-006 queue semantics, `NormalizedDocument v1`, or approved ticket/evidence history.
- Do not start D2, semantic extraction, semantic reconciliation, Gemini/Groq/OpenRouter/another reasoning provider, bundle Ready for Review, CES, chatbot work, candidate persistence, reconciliation state, or project-truth advancement.
- A perception failure/retry must not fabricate a semantic candidate, acceptance, reconciliation state, or truth progression. Do not make Docling a direct Atlas persistence client.

## Frozen Review Contract

| Row | Exact bounded behavior | Required proof / binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-004-02-01 | A real IDSER-003 project/bundle kickoff creates only its D1 execution/job and reaches Docling through BSS-009 redemption. | Compose PostgreSQL/pg-boss integration observes creation, job, bounded grant redemption, local execution, normalizer/parser success, authenticated handoff, and one accepted cache/result. **PASS iff** every transition uses the inherited authorities and no raw PDF/grant/storage key enters queue or ordinary DB transport. | IDSER-003 and BSS-009 integration suites. |
| RC-BSSV2-004-02-02 | Invalid source authority or fidelity fails before a usable local perception result. | Compose cases for expired/tampered grant, hash, size, and MIME mismatch. **PASS iff** the processor/result handoff does not create an accepted result/cache and errors remain bounded/redacted. | BSS-009 grant/source verification tests. |
| RC-BSSV2-004-02-03 | Docling startup/processing failure, timeout/cancellation, malformed mapped output, and normalization/integrity failure remain non-semantic operational failures. | Controlled Compose worker/process cases. **PASS iff** failure status/retry behavior follows inherited contracts, no parser-invalid result is accepted, and no semantic continuation/job/state is created. | BSS-006 worker and BSS-009 failure tests. |
| RC-BSSV2-004-02-04 | Delivery outages and acknowledgement loss recover without duplicate logical completion. | Force delivery failure and post-acceptance acknowledgement loss, then replay. **PASS iff** one logical result/cache remains, completion acknowledgement is idempotent, and no fresh unauthorized source or duplicate semantic continuation occurs. | BSS-009 result-handoff/cache tests. |
| RC-BSSV2-004-02-05 | Duplicate queue delivery, stale/conflicting result, and restart/replay cannot replace or multiply accepted perception state. | Compose pg-boss duplicate, stale/conflict, and worker-restart scenarios inspect execution/cache/fence counts. **PASS iff** identical completion is idempotent, different completed content fails closed, and restart preserves one logical completion/cache. | BSS-006 replay/fencing and BSS-009 authority tests. |
| RC-BSSV2-004-02-06 | The lifecycle preserves source/truth and database-role boundaries. | Queue/DB/log inspection plus role-denial proof. **PASS iff** Bridge writes no trusted Atlas semantic state, raw source/credentials/grants are absent from observable records, and perception failure cannot advance bundle semantics or project truth. | Restricted-role and IDSER semantic-boundary regressions. |

## Required validation and Docker procedure

Rebuild/recreate only altered Atlas/Bridge/local-processor services; verify reviewed image/config, migrations, effective Docling/runtime identity, readiness, and scoped pg-boss state before testing. Run Compose-backed success, each named negative/recovery/replay case, PostgreSQL role-denial checks, IDSER-003 kickoff regression, BSS-009 authority/cache/grant tests, affected worker tests/typechecks, and `git diff --check`. Inspect state using scoped test identities. Do not use `docker compose down --volumes` as routine repair.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `BOUNDARY-BSSV2-004-02-KICKOFF` — IDSER-003 owns atomic D1 creation; `BOUNDARY-BSSV2-004-02-SOURCE` — BSS-009 owns grant redemption and cache acceptance; `BOUNDARY-BSSV2-004-02-ROLE` — Bridge lacks trusted Atlas write authority.
- **Trust boundaries / assets:** authenticated project creation -> pg-boss metadata job -> scoped grant/verified bytes -> local processor -> authenticated result delivery; source bytes, grant, execution/fence identities, cache, and process/runtime state.
- **Identity context:** project/workspace/bundle/document/execution, source hash, route/processor qualification, completion fingerprint, grant and lease/fence identities.
- **Extension seams:** `SEAM-BSSV2-004-02-FAILURE-DELIVERY` for bounded authenticated failure/result reporting; `SEAM-BSSV2-004-02-REPLAY` for exactly-once logical cache completion.
- **Prohibited couplings:** `COUPLING-BSSV2-004-02-DIRECT-ATLAS-WRITE`, `COUPLING-BSSV2-004-02-SEMANTIC-ADVANCE`, and `COUPLING-BSSV2-004-02-SOURCE-LEAK` prohibit bridge truth writes, perception-to-semantics shortcuts, and source/grant leakage.
- **Unresolved security policy:** final deployment resource allocation and local process isolation policy remain outside this ticket; inherited source/role controls must still be preserved.

| Mandatory review binding | Readiness reference | Narrow question / expected evidence |
| --- | --- | --- |
| REV-READY-BSSV2-004-02-01 | SEAM-BSSV2-004-02-REPLAY | Do real queue/delivery/restart cases prove one logical accepted cache/result? Compose state/count evidence. |
| REV-READY-BSSV2-004-02-02 | COUPLING-BSSV2-004-02-SEMANTIC-ADVANCE | Can every listed failure/retry remain perception-only with no semantic/project truth advance? Negative integration inspections. |
| REV-READY-BSSV2-004-02-03 | COUPLING-BSSV2-004-02-DIRECT-ATLAS-WRITE | Does Bridge remain restricted to authenticated handoff rather than trusted database writes? Role-denial and route evidence. |

## GO hard stop and CK-ready completion

After Atlas accepts the one valid D1 `NormalizedDocument v1`, **STOP**. GO must not continue into semantic extraction, reconciliation, external model qualification, D2, Ready for Review, CES, or chatbot behavior.

`READY_FOR_CK` requires every Review Contract row proven by the named Compose/real lifecycle evidence. CK-ready success is exclusively the accepted D1 `NormalizedDocument v1` lifecycle checkpoint.
