# BSS-V2-004-03-05-REL-04 — offline relationship qualification

**State:** `PENDING_REL-03_CK_PASS`.

**Dependencies:** REL-03 CK PASS. It reuses `08-03-02`'s strict raw-parser/finalizer oracle and `08-03-03`'s integrated fake-provider, final-SHA legacy differential, replay/cancellation, and zero-live-effect oracle. It adds only the successor-specific relationship lifecycle rows below.

## Outcome and boundaries

Qualify the complete REL composition with deterministic local fixtures. REL-04 owns no production finalizer, source packet, schema, database, worker behavior, reviewer workflow, or publication behavior. It may add tests/fixture builders and an evidence ledger only.

The qualification harness uses an injected fake structured provider and in-memory sidecar/replay ports. It must demonstrate that offline fixtures prove only deterministic implementation behavior: they do not prove human confirmation, accepted relationship status, snapshot approval, or Master publication eligibility.

## Successor qualification matrix

| ID | Scenario | Binary oracle |
| --- | --- | --- |
| `RELQ-01` | First extraction, zero stored relationships | Empty extension and one fake provider response succeed; independent candidate canonicalizes; zero relationship is required or fabricated. |
| `RELQ-02` | Valid provider proposal | Source-validated immutable `proposed` revision is retained with null authorization; it is not canonical evidence or semantic correctness proof. |
| `RELQ-03` | Foreign/fabricated/dangling inputs | Source SHA, document/execution, locator/asset, slot, evidence-pair, predecessor, candidate-tuple and claimed acceptance/confirmation/publication attacks fail closed. |
| `RELQ-04` | Independent plus essential dependent tuple | Independent canonical candidate completes; exact dependent tuple is one deferred draft record with relationship revision, no false `non_fact`/canonical candidate. |
| `RELQ-05` | Optional context | It remains projected/provisional but does not enrich completed canonical evidence or issue trusted-context application. |
| `RELQ-06` | Later extraction | Scope-matching provisional revisions project deterministically; refined/challenged revisions append; stale/foreign/duplicate revision never upgrades or replaces history. |
| `RELQ-07` | Duplicate/replay/cancel/failure | Retry/staged winner/cancellation cannot lose or duplicate revision, binding or deferred dependency and cannot make another provider request after a staged winner. |
| `RELQ-08` | Legacy and terminal boundary | Legacy prompt/profile bytes, Semantic V1, provider neutrality, replay/reconciliation and D1 `perceived` stop remain unchanged; counters show no external provider, live semantic/perception job, reservation, review or publication. |

## Scope and expected files

| Path | Change |
| --- | --- |
| `apps/agents-bridge/tests/semantic-relationship-qualification.test.ts` | RELQ-01 through RELQ-07 fake-provider matrix. |
| `apps/agents-bridge/tests/semantic-worker.integration.test.ts` | narrowly additive fake integration/replay counters where the existing harness owns them. |
| `artifacts/relationship-lifecycle/rel-04-offline-evidence.md` | redacted command/result ledger, reviewed SHA and zero-effect counters. |

Do not change production code, schemas, source packet/finalizer implementation, migrations, frozen tickets, historical CK/HMN artifacts, or golden fixtures. Do not run a real provider or new live job/reservation; no test may simulate or assert actual human acceptance/publication.

## Frozen Review Contract

| Row | Binary PASS oracle |
| --- | --- |
| `RC-REL-04-01` | RELQ-01–03 demonstrate valid provisional retention and rejection of every tested forged/foreign/unsupported identity or status claim before canonical staging. |
| `RC-REL-04-02` | RELQ-04–07 demonstrate independent/dependent separation, exact deferred dependency retention, no promotion, and deterministic replay convergence. |
| `RC-REL-04-03` | No result emits fabricated visual-owned assertion, accepted/confirmed/published relationship state, fake canonical candidate, or a claim that offline fixture input is human authorization. |
| `RC-REL-04-04` | RELQ-08 plus reused 08-03-02/03 oracle lanes pass at the reviewed SHA with unchanged legacy bytes and zero live-effect counters. |

## CK handoff and terminal condition

REL-04 reaches `READY_FOR_CK` only when every RELQ case has its named assertion/evidence location, all reused oracle commands pass at the reviewed SHA, and the ledger distinguishes reused from successor-specific evidence. CK PASS is the terminal **offline** successor result. It neither closes historical `03-05` findings nor grants GO to review/publication work.
