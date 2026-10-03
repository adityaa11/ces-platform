# BSS-V2-004-02: IDSER D1 persistent-Docling perception lifecycle checkpoint

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.02`
- **Dependencies:** BSS-V2-004-01 at CK `PASS`; approved IDSER-003; approved BSS-009/BSS-009-01/BSS-009-02
- **References:** V3 §§3, 15, 31–35; Baseline V2 §§7, 14–15, 28–31; BSS V2 context §§14–15, 22, 28–31

## Outcome and starting seam

Compose the already-approved production-shaped D1 lifecycle with the qualified persistent Docling service from BSS-V2-004-01:

```text
create project / bundle
    -> IDSER-003 schedules D1 perception
    -> pg-boss perception job
    -> BSS-009 source grant
    -> Agents Bridge redeems and verifies exact PDF bytes
    -> qualified private Docling Serve route
         -> persistent ready/warm local CPU service
         -> synchronous bounded conversion
    -> DoclingDocument JSON
    -> deterministic mapper
    -> existing normalization
    -> NormalizedDocument v1
    -> authenticated Atlas result handoff
    -> one accepted logical derived perception result/cache
```

Success means Atlas has accepted one valid `NormalizedDocument v1` for the IDSER-scheduled D1 perception execution and then stops before semantic work.

## Queue and service authority

Atlas already owns job scheduling, retry, lease/fencing, replay, and idempotency through pg-boss/BSS-006/IDSER.

Therefore this ticket must use Docling as a bounded conversion service, not as a second workflow orchestrator.

Required shape:

```text
pg-boss job
    -> Bridge worker
    -> synchronous private Docling Serve conversion call
    -> bounded response/failure
    -> existing Atlas handoff
```

Do not enable or depend on Docling Serve RQ/Redis/distributed task persistence for the D1 lifecycle.

Docling's own async endpoints may exist in the service implementation, but Atlas's production D1 path must not delegate lifecycle ownership to them in this ticket.

## Preconditions consumed from BSS-V2-004-01

This ticket does not requalify Docling itself.

It consumes a route that already proved:

- pinned Docling/docling-serve/image/runtime identity;
- Compose-private service exposure;
- explicit CPU execution profile;
- models/artifacts available before work;
- exact no-OCR digital-PDF option profile warm/reusable;
- deterministic mapping and unchanged `NormalizedDocument v1`;
- bounded HTTP/service failure handling;
- warm-route end-to-end latency <=20 seconds for the qualification fixture matrix.

If the active deployment no longer matches that qualified identity/profile, D1 readiness fails closed instead of silently executing an unqualified route.

## Scope

- Wire the BSS-V2-004-01 qualified persistent service route through the existing IDSER-003 D1 job, BSS-009 grant redemption, perception worker, deterministic mapper, normalizer, authenticated result handoff, cache/fence, pg-boss retry/replay, and existing Compose stack.
- Send only the already redeemed and verified PDF bytes from Bridge to Docling over the private Compose network.
- Keep the Docling request option fingerprint server-controlled and identical to the qualified BSS-V2-004-01 profile.
- Prove the success path with the real resident Docling service and inherited Atlas/Bridge/PostgreSQL/pg-boss boundaries.
- Prove applicable failure, recovery, and exactly-once logical completion behavior without changing inherited lifecycle semantics.
- Preserve Docling service/process/model lifetime independently from individual D1 jobs: worker retry does not imply service recreation; service restart does not create Atlas truth or duplicate completion.

## Required failure/recovery cases

Freeze evidence for applicable cases including:

```text
expired/tampered source grant
source hash mismatch
source size mismatch
MIME mismatch
Docling service unavailable
Docling service not ready
Docling HTTP connection/reset/5xx failure
Docling processing failure
Bridge-side timeout/cancellation
malformed/incomplete Docling response
mapper rejection
normalization/integrity failure
result-delivery outage
acknowledgement loss
duplicate pg-boss delivery
stale/conflicting result
Bridge worker restart/replay
Docling service restart between jobs
```

A service restart may require its configured warm/readiness sequence before routing resumes. Atlas must not send a normal D1 request while the route is not ready.

## Forbidden and non-authority work

- Do not alter BSS-009 source grants, Atlas acceptance/fencing/cache semantics, IDSER-003 transaction kickoff, BSS-006 queue semantics, `NormalizedDocument v1`, or approved ticket/evidence history.
- Do not give Docling database, DocumentStore, pg-boss, project/workspace, or Atlas truth credentials.
- Do not pass DocumentStore paths/storage keys instead of exact authorized bytes.
- Do not use a per-document Python subprocess fallback when the Docling service is unavailable/not ready.
- Do not add Redis/RQ or another durable queue for this lifecycle.
- Do not start D2, semantic extraction, semantic reconciliation, Gemini/Groq/OpenRouter/another reasoning provider, bundle Ready for Review, CES, chatbot work, candidate persistence, reconciliation state, or project-truth advancement.
- A perception failure/retry must not fabricate a semantic candidate, acceptance, reconciliation state, or truth progression.
- Do not make Docling a direct Atlas persistence client.

## Frozen Review Contract

| Row | Exact bounded behavior | Required proof / binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-004-02-01 | A real IDSER-003 project/bundle kickoff creates only its D1 execution/job and reaches the already-qualified resident Docling service through BSS-009 redemption and the Bridge private HTTP adapter. | Compose PostgreSQL/pg-boss integration observes creation, job, bounded grant redemption, exact-byte service call, mapper/normalizer/parser success, authenticated handoff, and one accepted cache/result. **PASS iff** inherited authorities are preserved and no raw PDF/grant/storage key enters queue or ordinary DB transport. | IDSER-003 and BSS-009 integration suites. |
| RC-BSSV2-004-02-02 | D1 uses the exact qualified BSS-V2-004-01 service identity/profile and routes only while it is ready/warm. | Compose config/readiness/version evidence plus service-restart case. **PASS iff** mismatched/not-ready service identity fails closed, D1 waits/retries according to inherited worker rules, and routing resumes only after qualified readiness. | BSS-V2-002 route readiness and BSS-V2-004-01 readiness regressions. |
| RC-BSSV2-004-02-03 | Invalid source authority/fidelity fails before Docling receives a usable request. | Compose cases for expired/tampered grant, hash, size, and MIME mismatch. **PASS iff** no valid conversion request/result handoff/cache is created and errors remain bounded/redacted. | BSS-009 grant/source verification tests. |
| RC-BSSV2-004-02-04 | Docling service/network/processing failure, timeout/cancellation, malformed response, mapper rejection, and normalization/integrity failure remain perception-only operational failures. | Controlled Compose service/HTTP/worker cases. **PASS iff** failure/retry follows inherited contracts, no parser-invalid result is accepted, no subprocess/remote-provider fallback occurs, and no semantic continuation/job/state is created. | BSS-006 worker, BSS-009 failure, and BSS-V2-004-01 failure tests. |
| RC-BSSV2-004-02-05 | Delivery outages and acknowledgement loss recover without duplicate logical completion. | Force delivery failure and post-acceptance acknowledgement loss, then replay. **PASS iff** one logical result/cache remains, completion acknowledgement is idempotent, and no fresh unauthorized source or duplicate semantic continuation occurs. | BSS-009 result-handoff/cache tests. |
| RC-BSSV2-004-02-06 | Duplicate queue delivery, stale/conflicting result, Bridge restart/replay, and Docling service restart cannot replace or multiply accepted perception state. | Compose pg-boss duplicate, stale/conflict, worker-restart, and between-job service-restart scenarios inspect execution/cache/fence counts. **PASS iff** identical completion is idempotent, different completed content fails closed, route warm/readiness is re-established after service restart, and one logical completion/cache remains. | BSS-006 replay/fencing and BSS-009 authority tests. |
| RC-BSSV2-004-02-07 | The lifecycle preserves source/truth/database-role boundaries and one job authority. | Queue/DB/network/log inspection plus role-denial proof. **PASS iff** Bridge writes no trusted Atlas semantic state, Docling has no Atlas/DocumentStore/pg-boss credentials, raw source/credentials/grants are absent from observable records, RQ/Redis is not introduced, and perception failure cannot advance semantic/project truth. | Restricted-role, queue-authority, and IDSER semantic-boundary regressions. |

## Required validation and Docker procedure

Rebuild/recreate only altered Atlas/Bridge/Docling services and verify:

```text
reviewed image/config active
pinned Docling/docling-serve/runtime identity
CPU profile matches 004-01 qualification
model artifacts local
Docling /health healthy
Docling /ready ready
exact Atlas option profile warm
Bridge route readiness true
migrations current
scoped pg-boss state clean
no stale worker/service process serving
```

Then run:

```text
real IDSER-003 D1 success path
all named source-authority negatives
Docling unavailable/not-ready/network/5xx/processing negatives
timeout/cancellation
malformed response / mapper / normalization negatives
delivery outage / acknowledgement-loss replay
duplicate delivery
stale/conflicting result
Bridge restart/replay
Docling service restart and readiness recovery
PostgreSQL role-denial
IDSER-003 kickoff regressions
BSS-009 authority/cache/grant regressions
BSS-V2-004-01 route/readiness regressions
affected worker tests/typechecks
git diff --check
```

Inspect state using scoped test identities. Do not use `docker compose down --volumes` as routine repair.

The actual D1 run should record end-to-end perception latency as operational evidence, but this ticket consumes rather than redefines the <=20-second qualification gate already frozen in BSS-V2-004-01.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `BOUNDARY-BSSV2-004-02-KICKOFF` — IDSER-003 owns atomic D1 creation; `BOUNDARY-BSSV2-004-02-SOURCE` — BSS-009 owns grant redemption/cache acceptance; `BOUNDARY-BSSV2-004-02-ROLE` — Bridge lacks trusted Atlas write authority.
- **Trust boundaries / assets:** authenticated project creation -> pg-boss metadata job -> scoped grant/verified bytes -> Bridge -> private resident Docling service -> untrusted conversion response -> mapper/normalizer -> authenticated result delivery.
- **Identity context:** project/workspace/bundle/document/execution, source hash, route/service/image/processor qualification, option-profile fingerprint, completion fingerprint, grant and lease/fence identities.
- **Extension seams:** `SEAM-BSSV2-004-02-SERVICE-READINESS`; `SEAM-BSSV2-004-02-FAILURE-DELIVERY`; `SEAM-BSSV2-004-02-REPLAY`.
- **Prohibited couplings:** `COUPLING-BSSV2-004-02-DIRECT-ATLAS-WRITE`, `COUPLING-BSSV2-004-02-SEMANTIC-ADVANCE`, `COUPLING-BSSV2-004-02-SOURCE-LEAK`, `COUPLING-BSSV2-004-02-SECOND-QUEUE`, and `COUPLING-BSSV2-004-02-SUBPROCESS-FALLBACK`.
- **Unresolved security policy:** final production host/network/resource sizing remains outside this ticket; inherited source/role/network controls remain mandatory.

| Mandatory review binding | Readiness reference | Narrow question / expected evidence |
| --- | --- | --- |
| REV-READY-BSSV2-004-02-01 | SEAM-BSSV2-004-02-SERVICE-READINESS / SOURCE | Does D1 invoke only the exact qualified ready private service with exact authorized bytes and server-controlled options? Compose route/request/readiness evidence. |
| REV-READY-BSSV2-004-02-02 | SEAM-BSSV2-004-02-REPLAY | Do real queue/delivery/restart cases prove one logical accepted cache/result even across Bridge/Docling restarts? Scoped state/count evidence. |
| REV-READY-BSSV2-004-02-03 | COUPLING-BSSV2-004-02-SEMANTIC-ADVANCE / SECOND-QUEUE | Can every failure/retry remain perception-only while pg-boss remains the sole Atlas job lifecycle authority? Negative integration and topology inspection. |
| REV-READY-BSSV2-004-02-04 | COUPLING-BSSV2-004-02-DIRECT-ATLAS-WRITE | Does Docling remain a conversion service with no Atlas persistence authority? Network/credential/role-denial evidence. |

## GO hard stop and CK-ready completion

After Atlas accepts one valid D1 `NormalizedDocument v1` through the qualified **persistent private Docling service**, **STOP**.

GO must not continue into semantic extraction, reconciliation, external model qualification, D2, Ready for Review, CES, or chatbot behavior.

`READY_FOR_CK` requires all seven Review Contract rows proven by the named Compose/real lifecycle evidence. CK-ready success is exclusively the accepted D1 `NormalizedDocument v1` lifecycle checkpoint with pg-boss remaining the sole Atlas job authority.
