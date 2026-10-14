# HMN Authorization Amendment: REL-03-DURABLE-001

- Ticket: `REL-03-DURABLE-001` — fenced durable composite staging and replay
- Batch: SEM-CUTOVER durable prerequisites
- HMN authorization ID: `HMN-REL-03-DURABLE-001-007`
- Invocation: explicit user `HMN-006 Amendment — Correct Source-Authority Ownership`
- Current workflow state: `awaiting_review`
- Current HEAD at assessment: `c8254b986651fb774fd227db3733af306894372d`
- Prior result: `OWNERSHIP_CONFLICT_BLOCKED`
- Prior authorization: `HMN-REL-03-DURABLE-001-006`

## Frozen references

- Frozen ticket: `project's goal/Backend_Phase/relationship-lifecycle-successor-plan/REL-03-DURABLE-001-fenced-durable-composite-staging-and-replay.md`
- Original predecessor authorization: `project's goal/feedback/REL-03-DURABLE-001-hmn-006.md`
- Prior blocked GO evidence: `project's goal/feedback/REL-03-DURABLE-001-predecessor-go-blocked.md`
- Source-authority implementation: `packages/atlas-db/src/semantic-authority.ts`
- Bridge authority client: `apps/agents-bridge/src/atlas-semantic-client.ts`
- Approved source authority: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
- Authority evidence: `packages/atlas-db/tests/semantic-authority.integration.test.ts` and `apps/agents-bridge/tests/semantic-worker.integration.test.ts`

## Diagnosis

The earlier block conflated two boundaries. A pure predecessor request/hash is
not independent authentication of original source authority, and it must not
claim to be. That fact does not make the pure qualification contract
insufficient when its runtime caller supplies the request from Atlas's existing
authorized extraction context.

`PostgresSemanticAuthority.redeem()` locks the persisted semantic execution,
checks lifecycle/expiry, exact skill/version/contract, and the capability
fingerprint. For extraction it then loads the normalized document from the
Atlas cache through the persisted bundle/document relation and perception
execution. `extractionContext()` rejects unless the returned normalized
document has that exact perception execution ID, authorized document/artifact
ID, and persisted source SHA. It returns a schema-validated extraction context.

`createAtlasSemanticClient().context()` sends only the schema-validated job
over the internal service-credential route and parses the returned extraction
context. The established worker consumes `extractionContext.normalizedDocument`
to derive its source packet; it does not receive an arbitrary source document
from the job payload. IDSER-004 is approved and its PostgreSQL evidence covers
credential, capability, scope, lifecycle, cache/perception binding, and Bridge
SQL isolation.

Therefore the existing Atlas context is the runtime source-of-truth handoff.
It is not a claim that a standalone `StepwiseRelationshipEnvelopeRequest` is
authenticated, and the predecessor's pure contracts must not make that claim.

## Ticket-authority trace

| Boundary | Existing authority/evidence | Decision |
| --- | --- | --- |
| Semantic execution authorization | `redeem()` validates the persisted execution, capability fingerprint, skill/version, contract, lifecycle, and expiry under an Atlas transaction. | Sufficient runtime authorization boundary. |
| Original normalized document | `extractionContext()` loads it from Atlas cache using the persisted bundle/document and perception execution, then requires matching perception execution, artifact/document, and source SHA. | Sufficient authoritative input for future stepwise request derivation. |
| Bridge handoff | Internal service credential plus `createAtlasSemanticClient().context()` schema validation; existing worker derives its packet from `normalizedDocument`. | No new attestation or source-owner API is required. |
| Pure predecessor contracts | REL-03, SEM-006, and SEM-005 derive/verify deterministic completeness against their supplied authoritative input. | Must not assert independent end-to-end source authentication. |
| Future runtime integration | Stepwise composition has not yet been wired to the authorized context in this predecessor batch. | Required future integration proof; not a predecessor-CK claim. |

## Decision

`PREDECESSOR_GO_REAUTHORIZED`

HMN-006 is amended, not expanded. Its original seven-file REL-03/SEM-006/SEM-005
predecessor GO allowlist and positive/negative matrix remain authorized. GO
must treat the exact request as its authoritative pure input and prove
completeness relative to that request plus the strict provider proposal. It
must not treat matching hashes as independent proof of original document
authenticity.

## Authorized scope

The next separately invoked GO may proceed under `HMN-REL-03-DURABLE-001-006`
as amended by this record, only in the original seven owned implementation/test
files and bounded GO evidence. No runtime source-authority, worker, client,
database, migration, durable replay, or acceptance-context file is authorized
for that GO.

## Required validation

The original HMN-006 pure-contract tests remain required: exact request source
coverage; strict-provider candidate-universe coverage; REL-03 classification,
lineage, source/asset, provenance and deferred-reference qualification;
SEM-006 mixed and `canonicalResult: null` projection; SEM-005 complete source
and tuple accounting; pending visuals; distinct execution identities; and the
original deterministic adversarial matrix.

The separately authorized runtime integration stage must additionally prove:

1. the semantic execution is redeemed through Atlas authority;
2. the normalized document matches authorized perception execution, artifact,
   and source identity;
3. its stepwise request is derived from that exact context;
4. post-authorization source-content or inventory substitution is rejected;
5. those bindings persist through qualified composite staging and replay.

This runtime proof is explicitly pending and is not proven by predecessor CK.

## Forbidden work

- No GO, CFC, or CK execution in this HMN invocation.
- No source-authority, signature, attestation, qualification-flag, database,
  migration, worker, client, provider, durable replay, delivery,
  acknowledgement, accepted-context, publication, reconciliation, Master, or
  `SEM-CUTOVER-007` implementation change.
- Do not reopen PostgreSQL fencing, immutable-winner, role-isolation, or other
  resolved durable rows.
- Do not claim standalone request hashes authenticate the original document.

## Handoff

Expected next command: separately invoked predecessor `GO` under HMN-006 as
amended here, followed by independent CK only after its bounded checkpoint.
The later runtime source-authenticity integration proof requires its own
authorization. `REL-03-DURABLE-001` remains `awaiting_review` and
`SEM-CUTOVER-007` remains blocked.
