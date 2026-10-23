# Generic Handoff Router (GHR) — Implementation Context v0.6 (review draft)

**Status:** Proposed architecture and bounded implementation context; **NOT** GO, CFC, CK PASS, an activated route, or authority to mutate approved predecessor contracts.  
**Repository evidence rechecked (read-only):** `adityaa11/ces-platform`, branch `codex/new-atlas-backend`, HEAD `b7746dd887e38eb21f0cdef26d5a76040a8a0773`, 2026-10-23. The original v0.3 snapshot was 2026-10-18; its historical statements must not override current code.  
**CURRENT IMPLEMENTATION / CK SCOPE — ONLY TEST 1:** Accepted `NormalizedDocument/v1` / durable `perceived` → atomic trusted handoff issuance with **`body.can_continue=false`** → durable GHR dispatch → real `semantic/batch-plan` receiver → authenticated receive, strict five-field `body.payload` parse, durable `parsed_only` ACK → **STOP**. There is **NO** `can_continue=true` run, IDSER source redemption, v3 planning/persistence, SEM receiving-route implementation, or Test 2 in the present implementation/CK contract. Future `true`/next-hop `false` examples are **informative only**, not implementation tasks or CK oracles.  
**Principle:** **Fixed trusted header validated with Zod + generic bounded body wrapper (`can_continue`, `payload`) + opaque domain-owned versioned `payload` parser**, delivered through a directory-modular, two-level `main → branch` registry. The GHR is a **forwarder / sorting facility**, not a domain payload validator, workflow engine, BSS planner, or truth authority.

**Document state:** This is a **planning artifact for review in chat only**, not a GO, CK PASS, or instruction to edit the repository. **Activation semantics:** A trusted, successfully delivered handoff with `can_continue=true` means the receiving process **continues immediately through its normal workflow** after parse/security/source checks; there is **no second `can_continue` activation flag, activation ticket, or additional receiver activation step**. This is a **future behavior description only**: current delivery/CK uses `false` exclusively and must not prove or execute `true`.

**Review freeze (2026-10-24; still NOT implementation GO):** Test 1 uses **transactional pg-boss as its sole durable dispatch transport**, with no transactional outbox; the first and only enabled policy is `NormalizedDocumentAccepted/v1 → semantic/batch-plan`, `policyVersion=v1`, `handlerVersion=v1`, `bodyContract=SemanticBatchPlanInput/v1`, `can_continue=false`; the §4.1 physical layout is frozen for this scope; and §3.1c freezes the generic transport bounds. `blocked`, `quarantined`, and `retry_exhausted` are terminal in Test 1. Manual replay of any terminal handoff is out of scope; only pg-boss automatic retry for a classified transient failure is supported.

**v0.4 baseline retained:** (1) Zod 4.4.3 for strict generic header/JSON body shape, with business Zod schemas owned by receivers; (2) each main route physically owns `branches/`, `bodies/`, `receivers/` and a local `index.ts`, while the root index only imports registries; (3) first accepted-NDV1 trigger is atomic issuer intent, not SQL `NOTIFY` or NDV1 polling; (4) update stale NDV1 resolver and IDSER v3 facts; (5) separate durable GHR ACK, accepted NDV1 redemption and actual planner completion. All unchanged design constraints below remain binding proposal constraints.

**v0.6 changes vs v0.5:** (1) every illustrative GHR Zod schema field (including nested header fields, `body.can_continue`, and `body.payload`) now has a meaningful **`.describe()`** identifying purpose, trusted source, and boundary rules; keep the field glossary as the canonical dictionary; (2) `can_continue=true` **means continue immediately** at the receiver without any *additional* activation gate, while the ordinary issuer/route/receiving-boundary protections still apply; (3) remove **Test 2**, all `true`-mode E2E evidence, and downstream SEM ingress from **the current** CK/implementation acceptance; (4) GHR-01A, GHR-01B, GHR-02, and GHR-03 and current CK prove **only Test 1 with `false`**. Example 2 remains solely explanatory for future Codex understanding, never a current deliverable. No new domain runtime is claimed by this documentation.

## 1. Intent and architecture

Atlas already has accepted artifacts, staged jobs, and independent process handoffs. The missing connection is a **single Atlas-owned, authorized, durable delivery mechanism** between producer acceptance and the next process's receiving boundary. This is not a new semantic algorithm or a replacement for pg-boss.

```text
Process A produces domain artifact(s)
    ↓
Atlas domain acceptance (authoritative, atomic persistence)
    ↓
Atlas trusted handoff issuer → persisted GenericHandoffEnvelope/v1
    ↓
Generic Handoff Router [HEADER ONLY: authentication/provenance, route, delivery]
    ↓
Main Route Index [imports registries only]
    ├── routes/semantic/index.ts       → semantic/branches/* → semantic/receivers/*
    ├── routes/reconciliation/index.ts → reconciliation/branches/* → reconciliation/receivers/*
    └── routes/projection/index.ts     → projection/branches/* → projection/receivers/*
                                                   ↓
                              BODY wrapper + domain PAYLOAD validation
                                                   ↓
                         can_continue=false → parsed-only durable ACK / STOP
                         can_continue=true  → continue normal receiver workflow (FUTURE EXAMPLE ONLY)
                                                   ↓
                              domain-owned work / worker / downstream handoff
```

The `main` routes are **logical Atlas business processes**, not mandatory services, queues, databases, or separate Docker containers. The main index **only imports and maps domain registries**. Each domain has its **own directory** and owns `branches/`, `bodies/`, `receivers/` and a local `index.ts`. The generic router must not grow a giant `if/else`, domain union of body schemas, or a shared catch-all route module. A branch addition modifies only that domain registry; main index changes only when adding a **new main domain**.

**Ownership boundary:** A sender publishes *an accepted output*; the Atlas issuer authorizes the corresponding destination. The sender can provide a routing intent, but **cannot self-authorize a transition by writing `main=projection`**. The issuer establishes a trusted immutable header using authenticated producer identity, persisted accepted-state evidence and a versioned transition allowlist. The router validates that header and forwards the body unchanged.

## 2. Verified pre-existing contracts and non-duplication

| Current predecessor / contract | What the code or ticket establishes | What GHR must not claim |
| --- | --- | --- |
| `packages/atlas-contracts/src/perception.ts` + `packages/atlas-db/src/perception-authority.ts` | Validated `NormalizedDocument V1`, exact perception execution/source identity, cache and asset grants. For `staged-fair-local-v1`, transaction ends at `perceived` without unsolicited semantic job. | Perception is already producing GHR events; it is **not**. |
| `apps/agents-bridge/src/worker.ts` | Durable pg-boss infrastructure, work handlers, leases and retries. | Another scheduler or a second provider execution lane is necessary. |
| `apps/agents-bridge/src/route-registry.ts` | Qualified **provider/model/adapter** route registry. | This is the Atlas process-handoff registry. Keep them separate, with distinct names and permissions. |
| `packages/atlas-db/src/semantic-batch-plan-input.ts` | Current `SemanticBatchPlanInput/v1` canonical five-field parser, accepted-document fixture derivation, and `PostgresAcceptedSemanticBatchPlanDocumentResolver.resolveBackground()`. SQL joins accepted execution/member/bundle/document/cache and rechecks fingerprint and media manifest. | There is no accepted-document resolver; or this resolver is a GHR scheduler/worker. It is a **read-only consumer** when invoked. |
| `apps/agents-bridge/src/provider-work-admission.ts` | `ProviderWorkAdmission/v1` accepts one `logicalWorkId`, `payloadReference`/`payloadHash`, and a per-attempt resource envelope. | GHR can send an array of batches directly as one BSS reservation. |
| `apps/agents-bridge/src/provider-admitted-worker.ts` | Admitted queue carries only `logicalWorkId`, `attemptNumber`, `reservationId` and is subject to BSS ownership. | GHR can bypass reservation or forward corpus/provider secrets to that queue. |
| `packages/atlas-contracts/src/semantic.ts` + `packages/atlas-db/src/extraction-acceptance.ts` | Qualified document-scoped semantic acceptance includes `partial_accepted` and `qualified_deferred`. Some accepted canonical material can lead to reconciliation under the existing approved path. | Staged per-batch qualified handoff/reconciliation activation is already settled: `OPEN-A` remains unresolved. |
| `packages/atlas-db/src/reconciliation-acceptance.ts` | Existing bundle completion validates expected member count, member/execution state and source/evidence integrity before a historical `ready_for_review` transition. | This is the new per-batch, workspace-single-writer fan-in gate or a projection-ready contract. |
| `IDSER-009-02` | Deterministic project-card UI/read projection from persisted facts, including in-progress states. | All *read-side* projection must wait for reconciliation fan-in. Differentiate completion-gated downstream projection from live project-card read models. |

**Current-code evidence and limits (2026-10-23):** `PostgresAcceptedSemanticBatchPlanDocumentResolver.resolveBackground()` is implemented and tested against PostgreSQL; `apps/agents-bridge/src/idser-multimodal-inventory-candidates.ts`, `idser-multimodal-structural-fit-partition.ts` and read-only prospective-capacity consumer exist; `PostgresImmutableSemanticCorpusPlanRepository.persist()` accepts **v3 only** and requires matching reconstruction `policyBindings`. `semantic-batch-plan-ready-fixture.ts` is a **non-dispatching** fixture. Current `worker-main.ts`/worker composition does not register a GHR intake worker. Do not infer a fully wired production planner from isolated modules/tests. Freeze the authorized BSS effective-route / prospective-capacity read composition and v3 policy-binding constructor before claiming the live IDSER planning integration works. Historical BSS status statements in v0.3 were a 2026-10-18 snapshot, not current blockers.

## 3. Protocol: fixed header + flexible body

The **header is a fixed, strictly validated GHR-owned schema**. The **body is a bounded, generic two-field transport wrapper**: `can_continue` (a hop-local receiver continuation request) and `payload` (the **opaque** object that conforms to the sender ↔ receiving-domain `bodyContract`). GHR validates only the wrapper structure and generic transport integrity; the receiving branch interprets `can_continue` and validates `payload`. Do not place domain `batchRefs`, `sourceLocators`, `reconciliationResults`, or readiness logic into the router header.

### 3.1 Prospective `GenericHandoffEnvelope/v1` shape

```ts
// PROPOSED TYPES — no current exported Atlas API is implied.
type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };
type JsonObject = { [k: string]: JsonValue };

type GhrRoutedBodyV1<TPayload extends JsonObject = JsonObject> = Readonly<{
  can_continue: boolean;             // REQUIRED; hop-local; no implicit default
  payload: TPayload;                  // OPAQUE domain body, owned by receiving route
}>;

type GenericHandoffEnvelopeV1<TPayload extends JsonObject = JsonObject> = Readonly<{
  header: Readonly<{
    protocol: "GenericHandoffEnvelope/v1";
    handoffId: string;                // Immutable issuance identity
    idempotencyKey: string;           // Unique logical handoff publication
    producer: Readonly<{
      processKey: string;             // Server-authenticated, NOT trusted from caller JSON
      executionId: string;
    }>;
    route: Readonly<{
      main: "semantic" | "reconciliation" | "projection";
      branch: string;
      policyVersion: string;         // Exact authorized transition revision
      handlerVersion: string;        // Pinned registered destination
    }>;
    bodyContract: Readonly<{
      type: string;                  // Contract discriminator for RECEIVER parser
      version: string;
    }>;
    scope: Readonly<{
      projectId: string;
      workspaceId: string;
      bundleId?: string;
      documentId?: string;
      batchId?: string;
    }>;
    correlation: Readonly<{
      workflowId: string;            // Correlates a lineage, not an execution gate
      parentHandoffId?: string;
      groupId?: string;              // Observability/group lineage, NOT proof of fan-in
    }>;
    integrity: Readonly<{
      bodyEncoding: "canonical-json-v1";
      bodySha256: string;            // Hash of exact canonical body representation
    }>;
    issuedAt: string;               // Trusted issuer clock, ISO-8601
  }>;
  body: GhrRoutedBodyV1<TPayload>;   // Wrapper checked generically; payload parsed by receiver
}>;
```

### 3.1a Fixed-header field dictionary — definition, provenance, requirement, and use

These meanings are part of the **proposed contract**, not implementation suggestions Codex is free to reinterpret. "Required" describes the generic transport; "conditional" is a route-owned scope constraint. All header values are **trusted issuer-produced/persisted**, never accepted as authoritative merely because a caller sends JSON. `idempotencyKey`, `handoffId`, and `producer.executionId` are intentionally distinct identities.

| Header field | Definition / purpose | Trusted origin & validation rule | Requirement |
| --- | --- | --- | --- |
| `protocol` | Version discriminator for the **whole envelope's fixed header and body wrapper**, including the `can_continue` convention | Issuer writes the literal `GenericHandoffEnvelope/v1`; GHR Zod allows only this value | Required |
| `handoffId` | Immutable identity of one issued handoff; used for durable lookup, receipt/ACK, retry and audit | Issuer allocates or deterministically derives; unique persisted identity; retry preserves same value | Required |
| `idempotencyKey` | Logical publication identity; deduplicates repeated attempts to issue the **same logical transition** | Trusted deterministic derivation; DB uniqueness; same key + different body hash/pins/continuation flag is a **conflict**, never silent overwrite | Required |
| `producer.processKey` | Authenticated originating process, e.g. `perception.acceptance`; route authorization input | From authenticated producer/issuer context and accepted output, never caller-controlled JSON | Required |
| `producer.executionId` | Exact execution that produced the accepted source artifact; distinguishes producer run from delivery attempt | From accepted Atlas execution record; receiving route checks binding to domain payload where applicable | Required |
| `route.main` | First-level Atlas *business-process* routing key (`semantic`, `reconciliation`, `projection`); not a provider/model route | Authorized issuer selects from GHR main-registry allowlist; strict enum | Required |
| `route.branch` | Exact child route inside selected domain registry, e.g. `batch-plan` | Authorized issuer selects; branch registry must have exact matching registration; no default/wildcard | Required |
| `route.policyVersion` | Immutable version of producer→receiver transition authorization applied at issuance | Trusted allowlisted policy version; persisted and checked on dispatch/retry/revocation | Required |
| `route.handlerVersion` | Immutable receiver implementation/registration revision targeted for this handoff | Trusted branch registry pin; retry cannot switch to newest handler silently | Required |
| `bodyContract.type` | Domain payload *type discriminator* selecting the receiving branch's strict parser for `body.payload` | Must match exact route registration; GHR does **not** parse its business fields | Required |
| `bodyContract.version` | Explicit schema version for the receiving **payload**, independent from generic GHR wrapper protocol | Must match registered version; no default compatibility fallback | Required |
| `scope.projectId` | Atlas project ownership boundary of the accepted source/transition | Issuer reads authoritative DB facts; receiver rechecks against redeemed records on `true` | Required |
| `scope.workspaceId` | Atlas workspace ownership boundary; guards cross-workspace reference mixing | Issuer reads authoritative DB facts; receiver rechecks on `true` | Required |
| `scope.bundleId` | Bundle identity when the domain transition operates within an extraction/reconciliation bundle | From accepted bundle/member records; required by first `semantic/batch-plan` route, otherwise route-conditional | Conditional |
| `scope.documentId` | Source document identity when a handoff is document-scoped | From accepted document/member records; required by first `semantic/batch-plan` route, otherwise route-conditional | Conditional |
| `scope.batchId` | Batch identity for per-batch downstream transitions; **not** relevant before IDSER creates batches | From existing persisted batch; required only by explicitly batch-scoped branch | Conditional |
| `correlation.workflowId` | Observability ID correlating multiple handoffs into one lineage; **not** authorization or completion evidence | Issuer-created or inherited from already-trusted lineage | Required by present v1 header shape; future relaxation requires contract amendment |
| `correlation.parentHandoffId` | Optional tracing link to the immediate upstream handoff | From a real persisted upstream handoff; does not prove its downstream completion | Optional |
| `correlation.groupId` | Optional group trace label for N related handoffs | Trusted issuer lineage; **not** fan-in, N-of-N or batch completeness proof | Optional |
| `integrity.bodyEncoding` | Version of the approved canonical-serialization rules for **the full `body` wrapper** | Literal `canonical-json-v1`; issuer/receiver have byte-level parity tests; not arbitrary key reordering | Required |
| `integrity.bodySha256` | SHA-256 digest of exact canonical **wrapped body bytes** (`can_continue` **and** `payload`) to detect mutation | Issuer computes on persisted canonical bytes; GHR recalculates before delivery. Hash alone is not authentication | Required |
| `issuedAt` | Issuance audit timestamp; distinguishes creation time from later dispatch/retry/ACK times | Trusted issuer clock, offset-aware ISO-8601; preserved over retries | Required |

**Wrapper field dictionary (not part of header):**

| Body field | Definition / purpose | Boundary ownership and rule |
| --- | --- | --- |
| `body.can_continue` | Boolean **receiver-local** execution gate. `false` means authenticated receipt, strict payload parse and durable `parsed_only` disposition; **no** business resolver, BSS read/admission, planner work, provider call, follow-on handoff or domain mutation. `true` tells the receiving route to continue its normal work **immediately after successful receive/parse and ordinary security/source checks**, without a second activation switch; it is not a promise that the work succeeds | Required boolean, no default/coercion. The trusted issuer selects/pins the value and binds it to the body hash/idempotency identity. **Current issuance and CK: `false` only**; no test or implementation obligation for `true`. |
| `body.payload` | Unmodified domain-specific payload selected by `header.bodyContract.type/version`, e.g. exactly five `SemanticBatchPlanInput/v1` fields for NDV1 | Must be a bounded JSON object; receiving route strict-parses the exact canonical payload bytes. Authoritative reference redemption belongs to future continued work, not the current `false`-mode CK. GHR does not interpret its domain fields |

**Definition of `parse only`:** `false` must perform transport/delivery authentication and strict **syntactic/canonical** domain payload validation, including rejecting unknown fields. It does **not** query authoritative source tables, redeem NDV1 or media, create a planner job, or claim business eligibility. A parsed-only ACK is therefore **proof of transport and contract compatibility, not proof of accepted source redemption, valid plan or end-to-end processing**. If a route has additional authorization prerequisites before *even accepting* a payload, those gates remain enforced; no mode bypasses producer/issuer/route security.

**Future re-use of an accepted artifact (INFORMATIVE; OUT OF CURRENT SCOPE):** Once continuation is implemented, `can_continue=true` uses a *new* trusted issued handoff for the still-eligible accepted artifact. Never mutate or replay an existing `false` issuance as `true`: `handoffId`, `idempotencyKey`, and `bodySha256` are immutable together. The current implementation does **not** need a reissue API, a `true` test, or a continuation authority matrix; those are future-domain work, not a blocker for Test 1. The ordinary trusted issuer and route allowlist remain mandatory for **all** issuance; the `true` boolean is not independently caller-authoritative.

**Per-hop semantics (INFORMATIVE):** Each handoff independently sets `can_continue`; it does not propagate automatically. In a future complete flow, NDV1 → IDSER may use `true` so IDSER **immediately** executes its normal planning workflow; the resulting IDSER → SEM handoff may then carry `false` so SEM only receives/parses/ACKs. **Neither hop is implemented or tested in the current GHR checkpoint.** There is no separate activation switch on the receiver beyond `can_continue=true`; ordinary issuer/route authentication still applies.

### 3.1b Zod validation contract — generic GHR versus domain receiver

**Chosen validation library:** use the repository's existing **Zod 4.4.3** (`@atlas/contracts` dependency), rather than a competing generic validator. The following is an **illustrative target schema**, not proof of compiled implementation. `strictObject` rejects unknown header/envelope keys; optional scope/correlation keys remain explicit. Domain payload schemas must **not** be imported by the generic header/core validator.

```ts
// PROPOSED contract shape, not an existing exported Atlas API.
// The field dictionary in §3.1a is authoritative; each .describe() is a
// traceable, human-readable mirror for Codex and schema documentation.
// These descriptions are metadata, NOT security / provenance validation.
import { z } from "zod";

const identity = z.string().min(1).max(200);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const ghrHeaderV1Schema = z.strictObject({
  protocol: z.literal("GenericHandoffEnvelope/v1")
    .describe("GHR-owned: exact protocol/version for header and routed-body wrapper; issued by trusted Atlas issuer."),
  handoffId: identity
    .describe("GHR-owned: immutable unique issuance ID; lookup, delivery, retries and ACK; never regenerate on retry."),
  idempotencyKey: identity
    .describe("GHR-owned: unique logical transition publication key; same key with different bytes, mode or pins is a conflict."),
  producer: z.strictObject({
    processKey: identity
      .describe("Issuer-authenticated producer process key; producer-route allowlist input; never trust incoming JSON as identity."),
    executionId: identity
      .describe("Exact accepted producer execution ID from Atlas DB; distinct from handoffId and idempotencyKey."),
  }).describe("Trusted producer identity determined from persisted accepted facts and service context."),
  route: z.strictObject({
    main: z.enum(["semantic", "reconciliation", "projection"])
      .describe("Top-level Atlas process registry selector, not a provider/BSS route."),
    branch: identity
      .describe("Exact child branch name inside selected main-domain registry; no wildcard or fallback."),
    policyVersion: identity
      .describe("Pinned producer-to-receiver transition policy revision chosen by issuer; checked on retry/revocation."),
    handlerVersion: identity
      .describe("Pinned receiving handler revision; retry must not silently migrate to latest handler."),
  }).describe("Issuer-authorized hierarchical main/branch routing and immutable policy/handler pins."),
  bodyContract: z.strictObject({
    type: identity
      .describe("Receiver-owned payload type discriminator; selects parser for body.payload; GHR does not parse business fields."),
    version: identity
      .describe("Exact receiver-owned payload schema version, independent of GHR envelope version."),
  }).describe("Registered type/version contract of opaque body.payload, not the GHR wrapper."),
  scope: z.strictObject({
    projectId: identity
      .describe("Issuer-derived project owner of accepted source; route receiver rechecks when actually redeeming."),
    workspaceId: identity
      .describe("Issuer-derived workspace owner of accepted source; cross-workspace mix must fail at redemption."),
    bundleId: identity.optional()
      .describe("Issuer-derived bundle ID; optional generically, REQUIRED by the first semantic/batch-plan route."),
    documentId: identity.optional()
      .describe("Issuer-derived document ID; optional generically, REQUIRED by the first semantic/batch-plan route."),
    batchId: identity.optional()
      .describe("Issuer-derived batch ID only for future batch-scoped transitions; absent on NDV1-to-planner route."),
  }).describe("Trusted Atlas project/workspace source ownership and route-conditional bundle/document/batch scope."),
  correlation: z.strictObject({
    workflowId: identity
      .describe("Issuer-created/inherited workflow lineage trace ID; for correlation only, not authorization or execution gate."),
    parentHandoffId: identity.optional()
      .describe("Optional trusted upstream handoff ID for lineage; not downstream completion proof."),
    groupId: identity.optional()
      .describe("Optional observability grouping for related handoffs; not N-of-N/fan-in proof."),
  }).describe("Tracing lineage only; not a routing, activation or fan-in authorization mechanism."),
  integrity: z.strictObject({
    bodyEncoding: z.literal("canonical-json-v1")
      .describe("Approved byte-serialization rule for canonical wrapped body; exact payload order preserved."),
    bodySha256: sha256
      .describe("Issuer-calculated SHA-256 of EXACT canonical body bytes including can_continue and payload; integrity, not authentication."),
  }).describe("Binding between authenticated issuance and unchanged wrapped-body bytes."),
  issuedAt: z.iso.datetime({ offset: true })
    .describe("Issuer-clock ISO-8601 timestamp with offset; immutable across dispatch/retry; audit only."),
}).describe("GenericHandoffEnvelope/v1 fixed header; GHR validates syntax, trusted issuer validates authority.");

export const ghrRoutedBodyV1Schema = z.strictObject({
  can_continue: z.boolean()
    .describe("Required hop-local continuation flag. FALSE: receive, canonical strict parse, durable parsed_only ACK, STOP. TRUE (FUTURE, NOT IN CURRENT CK): immediately run normal receiver workflow after ordinary checks; no additional activation gate. Issuer-pinned; never default/coerce."),
  payload: z.record(z.string(), z.json())
    .describe("Opaque bounded JSON object; strictly parsed by selected receiving-domain bodyContract type/version, NEVER by generic GHR core."),
}).describe("Two-field GHR-owned transport wrapper; both fields covered by immutable bodySha256.");

export const ghrEnvelopeV1Schema = z.strictObject({
  header: ghrHeaderV1Schema
    .describe("GHR-owned, strictly validated trusted routing and provenance header."),
  body: ghrRoutedBodyV1Schema
    .describe("Generic {can_continue,payload} wrapper; domain schema applies only to payload."),
}).describe("GenericHandoffEnvelope/v1; generic GHR routing and bounded opaque payload forwarder.");
```

**`.describe()` coverage rule:** Every field at every nesting level must carry an explicit purpose, trusted value origin / boundary, and meaningful constraints. `z.strictObject()` parent schemas should also have descriptions. Codex may extract these schema descriptions to map fields back to §3.1a; tests should check type/shape behavior, not pretend description metadata itself enforces authorization. A future route's body schema lives in its own `routes/<main>/bodies/` and may use its own `.describe()` annotations. The existing strict semantic five-field parser **remains authoritative** for the first handoff; do not add a parallel runtime validator solely to satisfy this annotation requirement.

| Boundary | Required behavior | What must NOT happen |
| --- | --- | --- |
| **GHR transport guard + Zod** | Bound raw bytes/depth/array members; reject malformed or duplicate-key JSON and dangerous generic keys; parse strict header and the **exact two-field body wrapper** (`can_continue:boolean`, `payload:JsonObject`) | Inspect NDV1 locators, semantic results, or domain-specific body fields |
| **GHR issuer and registry** | Authenticate trusted issuer; check persisted accepted-state evidence, allowed producer/transition, route+policy/handler pins, revocation and body integrity | Treat `safeParse()` as producer authentication or route authorization |
| **Receiving route's Zod/schema/parser** | Use the exact registered `bodyContract.type/version`; strictly parse `body.payload`; on `false` durable parsed-only ACK/STOP; on future `true` continue normal receiver workflow after regular receipt/parse/source checks, without a separate activation gate; current CK only tests `false` | Accept unknown fields, trust GHR hash as an artifact grant, or fork a second active business validator |

**Existing semantic payload exception:** `packages/atlas-db/src/semantic-batch-plan-input.ts` already exports `parseSemanticBatchPlanInputV1()` and `canonicalSemanticBatchPlanInputV1()`. For the first route, `routes/semantic/bodies/semantic-batch-plan-input.v1.ts` is an **owner-side adapter/import** to that canonical **payload** parser (or a single-owner Zod refactor with explicit parity tests), **not a second independent runtime validator**. The new generic `can_continue` wrapper is validated separately; never append `can_continue` as a sixth field to `SemanticBatchPlanInput/v1`. Later receiving body contracts may use Zod from the start under their respective owners.

**Hash/serialization compatibility:** GHR transports a persisted **exact wrapped-body representation** and checks SHA-256 over **those unchanged bytes**, not over a re-serialized `.parse()` output. The first semantic receiver already rejects noncanonical serialization and expects the field order produced by `canonicalSemanticBatchPlanInputV1()` **for `body.payload`**. The proposed canonical wrapped-body bytes, for this route, are EXACTLY:

```ts
// PSEUDOCODE defining byte order for the proposed wrapper, not a current API.
const payloadBytes = canonicalSemanticBatchPlanInputV1(acceptedInput);
const bodyBytes = `{"can_continue":false,"payload":${payloadBytes}}`;
const bodySha256 = sha256Utf8(bodyBytes);
// The receiver verifies exact wrapped bytes/hash, extracts the original payload
// JSON bytes, then uses the ONE existing parseSemanticBatchPlanInputV1 parser.
```

Missing/extra wrapper keys, alternate raw representations, duplicated JSON keys or payloads that fail the domain canonical parser must fail closed. **The `can_continue` bit is covered by the immutable body hash.** Do **not** assume a generic RFC 8785 key-sorting pass is byte-identical to that existing serializer. For current Test 1, `bodyEncoding=canonical-json-v1` is the literal `false` wrapper shown above plus the existing `canonicalSemanticBatchPlanInputV1()` payload serializer. The trusted issuer computes the hash over those receiver-compatible wrapped bytes and the receiver proves byte/hash parity. A future registered body contract needs its own versioned serialization/parity decision; no silent canonical-reordering is allowed.

The fixed header contains just **generic routing, policy, identity, scope, correlation, integrity and delivery information**. The wrapper has one generic per-hop control; the remaining `payload` is opaque to GHR. No `body` field is authoritative simply because its JSON is syntactically valid. An issued envelope is *not* an unrestricted access grant or dispatch permit.

**Typing:** At the GHR boundary, `body` is the strict `GhrRoutedBodyV1<JsonObject>` wrapper (not unchecked JavaScript `any` and not arbitrary executable objects). The receiving branch maps `header.bodyContract.{type,version}` to its own independently versioned strict schema and parses **`body.payload`**, while enforcing `body.can_continue` before domain work. Unknown contracts fail closed. Route registration specifies which body contract/version a branch can accept. Schema compatibility is proven by the two endpoints, not by introspection inside GHR.

**Size/serialization:** Use the explicitly frozen `bodyEncoding` + registered payload-contract serializer + frozen wrapper order, compute `bodySha256` once over the **exact canonical wrapped-body bytes** at issuance, and at redemption compare the trusted persisted hash to the exact stored/transmitted bytes **before** any parse/re-serialize operation. `z.json()` does **not** detect duplicate raw JSON keys, enforce byte/depth budgets or authenticate provenance: those remain separate generic ingress and issuer checks. Reject duplicate JSON keys, non-finite numbers, forbidden/prototype-sensitive keys, excessive depth, total bytes and array sizes at a transport safety boundary **without interpreting semantic keys**. Limit metadata/queue payload and use referenced immutable manifests for large collections. Never include raw PDF text, asset bytes, credentials, prompts, provider responses or source storage keys in GHR envelopes/logs. Hash is an integrity binding **only**, not producer authentication.

### 3.1c Frozen Test 1 transport limits

These are GHR generic ingress limits, measured from raw UTF-8 bytes before a generic JSON parse. They apply without inspecting domain payload semantics:

| Item | Frozen limit |
| --- | ---: |
| Full serialized envelope | 75,776 bytes |
| Fixed header | 8,192 bytes |
| Generic `{can_continue,payload}` body wrapper | 65,536 bytes |
| JSON container nesting from root | 16 levels |
| Properties in any one JSON object | 128 |
| Elements in any one JSON array | 256 |

The guard rejects duplicate keys, malformed JSON, non-finite numbers and forbidden/prototype-sensitive keys before Zod. The header has no arrays and the first body payload is an object; the array bound exists for safe generic future body parsing, not as permission to add an array to the current semantic body. `SemanticBatchPlanInput/v1` retains its authoritative 2,048-byte payload maximum. Its current false-only wrapper has 33 bytes of fixed syntax and is therefore limited to **2,081 bytes**, which is stricter than the generic body limit. A later route that needs a different bound must introduce an explicitly approved versioned body contract and cannot override these limits implicitly.

### 3.2 Trusted publication vs untrusted input

1. A domain process persists its authoritative artifact(s), grant/identity/fingerprint, and acceptance state using its established Atlas-owned boundary.
2. An authenticated **Atlas Handoff Issuer** checks accepted-state proof, caller process identity, allowed producer contract/version → destination policy, and scope. It does not read or validate arbitrary business content; domain acceptance already owns that.
3. Issuer **constructs or attests** the fixed header from server-known facts, **authorizes and pins the `can_continue` mode for that hop**, pins route-policy/handler revisions, computes and persists the wrapped-body hash, and atomically records a durable handoff intent with producer acceptance (or an independently proven atomic transactional queue alternative). If an artifact is not eligible for a specific transition, it **does not issue** that route.
4. GHR loads trusted persisted envelope, validates **header, the generic body wrapper shape and integrity/transport bounds only**, re-checks enabled/revoked route authority and dispatches unmodified wrapped body to pinned registered receiver. Route lookup is an allowlist, not `eval`, a dynamic module path, a client-supplied function, URL or queue name.
5. Receiving branch authenticates delivery and strictly parses `body.payload`. If `can_continue=false`, it durably acknowledges **parsed_only** without resolver/work effects. **In the future** if `can_continue=true`, it proceeds directly through its normal source/eligibility checks and domain work; **no separate activation gate** is inserted after the flag. **Current implementation handles `false` only.**

A payload that references `workspace B` while the header is issued for `workspace A` must fail **at receiving redemption on authorized `can_continue=true`**, even when the header itself is valid. On `false`, strict syntax-only ACK must make **no assertion** that such references are valid or belong to this workspace. Do not let domain artifact resolution trust a caller-supplied reference without persisted ownership and state checks.

**Threat model:** A forged producer name, direct client enqueue, wrong route, replay, stale lease, mutated body, unauthorized scope or replaced artifact must fail closed. Prevent arbitrary writing to issuer/outbox/worker queues with database role grants and authenticated service boundaries. For an entirely internal Atlas DB transaction and protected queue, DB ACLs, trusted issuance and hash/fence checks may suffice. For future cross-trust-service handoffs, separately qualify mTLS/service authentication and message authentication (HMAC/signatures with rotation/replay bounds); hashing alone cannot authenticate a sender. GHR need not inspect body domain structure to enforce these protections.

## 4. Two-level, directory-modular registry design (no giant route switch)

### 4.1 Target directory ownership

The directory organization below is the **frozen physical layout for Test 1**; it is not a claim that these files already exist. The GHR runtime owns the core dispatcher, while route-specific bodies/receivers remain under their **main-domain** parent. Existing persistent repository/resolver code stays in `@atlas/db`; do not copy it into GHR. `reconciliation/` and `projection/` own their empty local indexes/directories only: no inactive body, branch, receiver, fixture or runtime API is created for them in this ticket set.

```text
packages/atlas-contracts/src/ghr/
  generic-handoff-envelope.v1.schema.ts     # shared Zod HEADER + two-field generic body wrapper

apps/agents-bridge/src/ghr/
  core/
    issuer-contract.ts                      # trusted-issuer port only
    branch-registry.ts                      # generic registration + exact lookup
    dispatcher.ts                           # header validation, policy lookup, forwarding
    delivery-worker.ts                      # retry/ack/fencing integration
  routes/
    semantic/
      branches/
        batch-plan.route.ts                 # FIRST: acceptance → planner intake
        batch-execution-intake.route.ts     # FUTURE / inactive
      bodies/
        semantic-batch-plan-input.v1.ts     # adapter to EXISTING @atlas/db payload parser
        semantic-batch-plan-ready.v1.ts     # future receiver-owned draft
      receivers/
        batch-plan.receiver.ts              # CURRENT: auth → strict parse → parsed_only ACK / STOP
      index.ts                              # local composition: semantic branches ONLY
    reconciliation/
      branches/
        prepare.route.ts                    # FUTURE / inactive
      bodies/
        qualified-semantic-batch.v1.ts      # future owner-pending draft
      receivers/                             # future; no active receiver required now
      index.ts
    projection/
      branches/
        intake.route.ts                     # FUTURE / inactive, final branch name pending
      bodies/
        projection-input-ready.v1.ts        # future owner-pending draft
      receivers/                             # future; no active receiver required now
      index.ts
  main-route-index.ts                       # imports semantic/reconciliation/projection

packages/atlas-db/src/ghr/                # trusted atomic issuance + durable intent adapter
```

`bodies/` means **domain-owned body-contract adapter/schema**, **not** a list of body validators executed by GHR core. It can import the existing domain parser **only from an application layer that is allowed to depend on that domain package**. This separation must not introduce a `@atlas/contracts → @atlas/db` circular dependency. `core/` and `main-route-index.ts` cannot import `routes/*/bodies/*` or domain-specific business parsers.

### 4.2 Parent registry, child branch and body examples

```ts
// apps/agents-bridge/src/ghr/routes/semantic/branches/batch-plan.route.ts
export const batchPlanRoute = {
  branch: "batch-plan",
  producerContract: "NormalizedDocumentAccepted/v1",
  bodyContract: "SemanticBatchPlanInput/v1",
  requiredAcceptedState: "perceived",
  destination: "semantic-batch-planner-receiver", // registered internal identity, NOT URL
  policyVersion: "v1",  // PROPOSED, not already approved
  enabled: false,        // registration alone never activates a route
} as const;

// apps/agents-bridge/src/ghr/routes/semantic/bodies/semantic-batch-plan-input.v1.ts
// This owner-owned module ADAPTS the existing canonical contract; it does
// not create another business validator for the generic router.
export {
  parseSemanticBatchPlanInputV1,
  canonicalSemanticBatchPlanInputV1,
} from "@atlas/db";

// apps/agents-bridge/src/ghr/routes/semantic/index.ts
import { createBranchRegistry } from "../../core/branch-registry.js";
import { batchPlanRoute } from "./branches/batch-plan.route.js";
export const semanticRegistry = createBranchRegistry([batchPlanRoute]);

// apps/agents-bridge/src/ghr/main-route-index.ts
import { semanticRegistry } from "./routes/semantic/index.js";
import { reconciliationRegistry } from "./routes/reconciliation/index.js";
import { projectionRegistry } from "./routes/projection/index.js";
export const mainRouteIndex = {
  semantic: semanticRegistry,
  reconciliation: reconciliationRegistry,
  projection: projectionRegistry,
} as const;
```

The code is **illustrative registration only**. Future reconciliation/projection local indexes may be empty/inactive until their owner approves routes. `createBranchRegistry()` is a proposed interface, not an existing function. `semantic/batch-execution-intake` is not registered as enabled by this example. The local `semantic/index.ts` only imports its own child routes; the root index imports **only one module per main domain**. New **branch** → change that domain's folder/index only. New **main** → add a new folder and a single root import/map entry.

### 4.3 Exact route resolution and immutable retry

- **Main index:** resolves `header.route.main` to a registry, never a domain body parser. No giant route switch or giant Zod union.
- **Domain branch registry:** resolves exact `branch + producerContract + bodyContract + policyVersion + handlerVersion` to one registered receiver identity/queue binding and activation/state constraints. No wildcard/fallthrough/default handler.
- **Issuer:** checks approved producer→branch transition from trusted accepted facts; the sender may suggest a destination but cannot self-authorize it.
- **Router:** validates authenticated persisted header, matches exact pinned registry revision and revocation state, records deterministic resolution, forwards original body bytes unchanged.
- **Receiving branch:** its **own** `bodies/` schema/adapter validates `bodyContract` against `body.payload`; it **stops after parsed-only receipt when `can_continue=false`**, and only invokes its resolver/workflow when authorized `true`. Consumer-owned rejection remains consumer-owned; router never retries by choosing an alternative domain branch.
- **Retry:** always reuses pinned route/handler/policy versions and identical body hash. Disabled/revoked route blocks/quarantines the intent rather than migrating it to the latest handler.

`apps/agents-bridge/src/route-registry.ts` is the distinct **provider/model selection registry**; BSS process/workload catalogues are distinct **capacity/admission registries**. The GHR registry must not modify or collapse these systems.

## 5. Named sender → receiver body contracts (not loose examples)

### 5.0 Contract authority and implementation rules

**Correction to v0.2:** The body examples must not be treated as free-form illustrations. Codex must be told the **specific expected contract** for the first real delivery boundary and the **intended downstream interface drafts** for the other three routes. No agent may rename fields, add required fields, change cardinality, infer a schema from a fake test alone, or silently treat a proposed contract as a historically approved one.

- **Existing first-route payload contract:** `SemanticBatchPlanInput/v1` already exists in `@atlas/db` (exact five-field canonical serializer/parser) and already has an accepted-source background resolver. It must be **reused** by the semantic owner. GHR work must not replace `NormalizedDocument/v1`, invent another body shape, or claim route-only CK activates the real planner.
- **Bounded intended interfaces for successor domains:** `SemanticBatchPlanReady/v1`, `QualifiedSemanticBatchForReconciliation/v1`, and `ProjectionInputReady/v1` below are **exact proposed shapes for interoperability fixtures**, **not approved runtime contracts**. Each owning IDSER/SEM, Atlas acceptance, reconciliation, or projection ticket must separately freeze/authorize its final domain contract before production use. A change from these drafts requires explicit versioned ownership, not an ad hoc Codex payload.
- **Shared rule:** `header.bodyContract.type/version` selects the receiving branch's strict **`body.payload`** parser; that payload is exactly the matching contract object, nested under the generic `{ can_continue, payload }` wrapper. `additionalProperties: false` (or equivalent) at each receiver; GHR checks only bounded JSON and wrapper keys/types, never semantic payload fields. Source/asset/candidate references are **not security capabilities**. Sender persists authoritative output and creates the matching body in the acceptance transaction; Atlas issuer establishes trusted routing header.
- **No implicit main-route switch:** The main/branch route is an authorized issuer/policy decision, not a sender-provided shortcut. Route registry registration is not process activation.

### 5.1 First integrated route: perception → semantic batch planner (delivery proof first; planning gate separately authorized)

**Producer acceptance owner:** `PostgresPerceptionAuthority.deliver()` for `staged-fair-local-v1`, only after accepted cache, asset manifests and terminal `perceived` plus `document_perception_execution.completed`/`completion_fingerprint` are transactionally established. The current code stores the document in `atlas.normalized_document_cache` indexed by `cache_key` (computed from source SHA, version, capability and capability identity). **The receiver-facing `PostgresAcceptedSemanticBatchPlanDocumentResolver.resolveBackground()` now exists and is integration-tested, but is not automatically invoked by a GHR production worker.**

**Header fixed values:**

| Header selector | Exact target |
| --- | --- |
| `producer.processKey` | `perception.acceptance` (trusted issuer identity) |
| `route.main` | `semantic` |
| `route.branch` | `batch-plan` |
| `bodyContract.type` | `SemanticBatchPlanInput` |
| `bodyContract.version` | `v1` — this identifies **`body.payload`**, while the generic wrapper is defined by `header.protocol` |
| `scope.projectId/workspaceId/bundleId/documentId` | Exact accepted member identity from Atlas DB, never caller-supplied authority |
| `producer.executionId` | The accepted perception execution ID, must agree with the body |
| `route.policyVersion/handlerVersion` | **`v1` / `v1`**, the frozen first-policy and first-handler pins; no other route/pin combination is enabled in this ticket set |

**Payload: exact target `SemanticBatchPlanInput/v1`**, nested under `body.payload`, with **no change to its five fields**:

```ts
// EXISTING RECEIVER-OWNED BODY CONTRACT IN @atlas/db — DO NOT REDEFINE IN GHR CORE.
type SemanticBatchPlanInputV1 = Readonly<{
  normalizedDocumentRef: string;         // Opaque pointer to the accepted normalized_document_cache row
  perceptionExecutionId: string;         // Must equal header.producer.executionId
  sourceSha256: string;                  // Lowercase 64-hex SHA-256 of the original PDF
  normalizedDocumentVersion: "v1";       // Must match accepted NormalizedDocument version
  normalizedDocumentFingerprint: string; // Lowercase 64-hex accepted perception completion_fingerprint
}>;
```

**Receiver-owned payload validation (Zod desired, single-owner cutover only):** The existing `parseSemanticBatchPlanInputV1()` and `canonicalSemanticBatchPlanInputV1()` are **already authoritative**. Keep using them through the `semantic/bodies/` adapter. If IDSER explicitly approves replacing their internal validator with Zod, require **one** canonical parser, identical five fields, exact 2,048-byte bound, exact canonical serialization/field order, duplicate/extra-field and negative/accepted-source parity. Example target for an owner-controlled refactor (NOT a parallel live parser):

```ts
// EXAMPLE ONLY for a FUTURE owner-controlled Zod refactor (NOT current GHR GO).
import { z } from "zod";
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const semanticBatchPlanInputV1ZodSchema = z.strictObject({
  normalizedDocumentRef: sha256
    .describe("Accepted normalized_document_cache.cache_key from Perception; pointer, not access grant."),
  perceptionExecutionId: z.string().min(1).max(200)
    .describe("Accepted Perception execution ID; must match header.producer.executionId on authoritative redemption."),
  sourceSha256: sha256
    .describe("Accepted source/PDF SHA-256 from Atlas document record, 64 lowercase hex."),
  normalizedDocumentVersion: z.literal("v1")
    .describe("NormalizedDocument contract version bound to the accepted execution/cache."),
  normalizedDocumentFingerprint: sha256
    .describe("Accepted canonical NDV1 completion fingerprint; compared with re-computed source on future redemption."),
}).describe("Receiver-owned strict five-field SemanticBatchPlanInput/v1 payload; not a generic GHR body validator.");
// Zod alone does NOT replace the existing raw-byte canonical parser checks.
```

This shape only validates syntax. The **receiving resolver** must independently check source, scope, state, asset grants, cache value and exact accepted fingerprint against trusted Atlas storage.

```json
{
  "can_continue": false,
  "payload": {
    "normalizedDocumentRef": "<persisted-normalized-cache-key>",
    "perceptionExecutionId": "<accepted-perception-execution-id>",
    "sourceSha256": "<64-lowercase-hex-source-sha256>",
    "normalizedDocumentVersion": "v1",
    "normalizedDocumentFingerprint": "<64-lowercase-hex-accepted-completion-fingerprint>"
  }
}
```

The JSON above shows placeholders, **not executable hash values**; the wrapper is a proposed new GHR contract and the nested payload preserves the existing exact five-field `SemanticBatchPlanInput/v1` contract. In GHR-only qualification, `can_continue=false` instructs semantic intake to **strictly parse and ACK only**; it must not call `resolveBackground()` or start planning.

**Semantic receiver required control flow (FIRST IMPLEMENTATION ONLY, illustrative pseudocode):**

```ts
// Authenticate trusted GHR delivery BEFORE accepting/parsing payload.
const routed = parseExactGhrRoutedBody(rawBodyBytes);
const input = parseSemanticBatchPlanInputV1(routed.rawPayloadBytes);
// This implementation issues can_continue=false only.
if (routed.can_continue !== false) {
  throw new Error("Continuation is outside the current GHR Test 1 scope");
}
await recordIdempotentGhrIngressReceipt(handoffId, "parsed_only");
return; // NO resolveBackground(), IDSER planner, BSS, SEM or follow-on handoff.
```

The helper names above are **proposed pseudocode**, not existing exported APIs. Do not implement or test a `true` continuation pipeline in GHR-01A, GHR-01B, GHR-02, or GHR-03. **Future semantic rule (documentation only):** when a trusted envelope carries `can_continue=true`, the receiver **directly runs its normal processing after ordinary parse/source checks**; it does not call an extra `requireAuthorizedContinuation()` activation gate. This sentence is **not** a test case, implementation task, or CK criterion now. An invalid payload is rejected, not `parsed_only` success.

**Field provenance:** The trusted issuer derives `normalizedDocumentRef` from persisted `normalized_document_cache.cache_key`, never a sender-controlled URL or fabricated document ID. Source SHA and execution ID come from accepted Perception facts; `normalizedDocumentFingerprint` comes from `document_perception_execution.completion_fingerprint`. **Only required integration seam now:** same-transaction issuance → durable GHR delivery → **real** semantic receiving boundary → five-field canonical parse + `parsed_only` receipt, with zero downstream effects. A fake-only ACK does not prove this. **Informative future detail, NOT a current CK item:** `normalized_document_cache` uses `ON CONFLICT (cache_key) DO UPDATE`, so the key alone is not immutable artifact identity; the already implemented `resolveBackground()` reparses NDV1 and checks accepted completion fingerprint/media when the receiver later continues work. **Do not** test stale/replaced-cache domain redemption as part of the present `false`-only CK.

**Receiver proof — CURRENT `false` ONLY:** Parse exact wrapped bytes + existing five-field `SemanticBatchPlanInput/v1`, reject wrong keys/contract/hash, durably record an idempotent `parsed_only` ACK and **STOP**. No `resolveBackground()` or accepted-source redemption, even when the source reference appears valid. Foreign/stale/invalid source facts are **not** proven by parse-only CK; do not add them as missing Test 1 criteria. Real source resolution and read-only BSS prospective planning remain existing/future IDSER domain responsibilities and are expressly **out of current GHR implementation and CK scope**. No raw PDF/media bytes in the envelope.

**Do not invent a separate `derivedAssetManifestRef` field.** Verified asset metadata currently lives in accepted `atlas.document_perception_derived_manifest` records bound to perception execution/artifact/source and per-locator asset identities. The receiver derives and checks these from Atlas authority rather than presuming a pre-existing standalone manifest reference API.

### 5.2 Future fan-out: semantic batch planner → semantic batch execution intake

This domain's already planned output is **one immutable document plan and N durable `PlannedSemanticCorpusHandoff` artifacts, one per batch**, each carrying owner/context/REL/media/resource-envelope proofs. Do not put those full contents into the GHR body.

**Header selectors (INFORMATIVE ONLY):** `main=semantic`, `branch=batch-execution-intake`, `bodyContract={type:"SemanticBatchPlanReady",version:"v1"}`; source scope remains the single originating document. **Not part of current implementation/CK; no SEM receiver activation or tests.**

**Exact proposed successor `body.payload` (to be wrapped in `{ can_continue, payload }`), for contract ownership / parse-only compatibility tests:**

```ts
// PROPOSED FUTURE CONTRACT — NOT YET IDSER-AUTHORIZED / EXECUTABLE.
type SemanticBatchPlanReadyV1 = Readonly<{
  documentPlanRef: string;             // Immutable accepted document plan reference
  planHash: string;                    // 64 lowercase hex SHA-256 / documented canonical digest
  batchCount: number;                  // Positive integer, equals length below
  batchHandoffRefs: readonly Readonly<{
    batchId: string;                  // Unique within documentPlanRef
    ref: string;                      // Durable individual PlannedSemanticCorpusHandoff ref
    hash: string;                     // Its accepted immutable content hash
  }>[];
}>;
```

The producer issues this **after atomically persisting the entire immutable plan and every referenced batch handoff**; the receiver validates `batchCount`, nonempty bounded array, uniqueness, plan/hash/ref membership, exact owned-source once-only coverage and context-only semantics. `documentId` remains the *single* source ID in header scope; **`batchHandoffRefs`**, not `documentRef`, becomes the array.

If the array exceeds a qualified envelope-size/count limit, the owner must explicitly version or approve a manifest-pointer alternative; **do not silently accept unbounded arrays or invent a second optional body shape**. Current Test 1 does **not** test this downstream contract, its size limits, fixtures, or receiver at all.

**Receiving branch fan-out:** Register N independent BSS logical work IDs / payload refs after checking the whole plan. Each actual provider attempt subsequently passes `ProviderWorkAdmission/v1` and receives its own reservation/worker fence. A routing ack does **not** imply BSS registration or execution. This is a description of future **normal SEM domain processing**, not an extra GHR activation gate; ordinary BSS admission remains the provider-work authority whenever SEM eventually executes. **None of this is tested/implemented in current GHR CK.**

### 5.3 Future per-batch semantic acceptance → reconciliation preparation

**The sender is an Atlas-accepted, qualified SEM/Atlas batch handoff**—not a non-truth batch fragment and not a successful HTTP response. `OPEN-A` still governs partial/deferred acceptance and reconciliation activation.

**Header selectors:** `main=reconciliation`, `branch=prepare`, `bodyContract={type:"QualifiedSemanticBatchForReconciliation",version:"v1"}`; exact trusted project/workspace/bundle/document/batch scope. **Out of current implementation/CK.**

**Exact proposed future `body.payload` (wrapped in `{ can_continue, payload }`), for future-owner review / parse-only interoperability:**

```ts
// PROPOSED FUTURE CONTRACT — MUST NOT BE ACTIVATED UNTIL OPEN-A IS RESOLVED.
type QualifiedSemanticBatchForReconciliationV1 = Readonly<{
  qualifiedBatchHandoffRef: string;     // Atlas-accepted, durable qualified batch result
  qualifiedBatchHandoffHash: string;    // Lowercase 64-hex immutable result hash
  documentPlanRef: string;             // Approved upstream plan
  batchId: string;                     // Must match trusted header scope and result
  acceptedCandidateSetRef: string;     // Non-empty materialized canonical candidate set
  relationshipRevisionSetHash: string; // Lowercase 64-hex accepted REL revision identity
}>;
```

**Eligibility is outside GHR.** Issuer must not emit this transition for a fully `qualified_deferred` batch without materialized canonical candidates. Actual per-batch accepted truth / canonical candidate-set reference **does not yet exist as an approved runtime API**, so no GHR implementation may fabricate or populate it. The final contract, including partially accepted semantics and any alternate deferred/no-work outcomes, is **owned by the future Atlas/SEM reconciliation handoff ticket**, not by router-only GO. Eligible batches may be prepared independently; workspace reconciliation mutations remain single-writer.

### 5.4 Future fan-in: reconciliation → projection-ready input

The **reconciliation domain** owns the completion barrier and independent immutable proof for an authorized frozen bundle/workspace manifest. It must not issue projection-ready output solely because one worker completed or a `count==N` assertion happens to match. Project-card read projection remains available during work and is not gated by this terminal handoff.

**Header selectors:** `main=projection`, `branch=<explicitly registered projection branch>`, `bodyContract={type:"ProjectionInputReady",version:"v1"}`, exact scope and pinned transition policy. **Out of current implementation/CK.**

**Exact proposed future `body.payload` (wrapped in `{ can_continue, payload }`), for future-owner review / parse-only interoperability:**

```ts
// PROPOSED FUTURE CONTRACT — NOT A PROJECTION / PUBLICATION AUTHORIZATION.
type ProjectionInputReadyV1 = Readonly<{
  scopeManifestRef: string;            // Immutable expected members + revision identity
  reconciliationSnapshotRef: string;   // Accepted workspace/bundle reconciliation result
  completionProofRef: string;          // Domain-authored completion/fan-in proof
  completionRevision: string;          // Frozen monotonic/versioned completion snapshot
  expectedDocumentCount: number;      // Nonnegative integer, informational
  accountedDocumentCount: number;     // Nonnegative integer, informational
}>;
```

The sender/reconciliation authority must establish the **exact terminal status of every member** and necessary policy for failed/partial/deferred cases. The projection receiver checks that proof from authoritative persisted state, not by trusting counts or header correlation. Historical bundle completion checks are a useful prior pattern but **not proof of the new staged per-batch fan-in**. This route grants no Master publication, CES, or automatic project-truth promotion. Future owner freezes its ultimate body contract and activates separately.

### 5.5 Registry → body contract compatibility matrix

| Sender accepted handoff | GHR main/branch | Body contract | Receiver validator/owner | Current test scope |
| --- | --- | --- | --- | --- |
| Perceived `NormalizedDocument/v1` | `semantic/batch-plan` | `SemanticBatchPlanInput/v1` **existing exact parser** | Semantic accepted-document resolver + planner intake | **Test 1 only: real receiver parse-only ACK (`false`); NO redemption/planning** |
| Persisted document plan + N `PlannedSemanticCorpusHandoff` | `semantic/batch-execution-intake` | `SemanticBatchPlanReady/v1` **proposed** | IDSER/SEM batch intake | **Informative shape only; NO test, receiver or dispatch** |
| Atlas-qualified semantic batch | `reconciliation/prepare` | `QualifiedSemanticBatchForReconciliation/v1` **proposed** | Atlas/SEM acceptance + reconciliation preparation | **Informative only; NO current test** |
| Qualified frozen reconciliation completion | `projection/<registered branch>` | `ProjectionInputReady/v1` **proposed** | Reconciliation issuer / projection receiver | **Informative only; NO current test** |

**Codex instruction:** reuse/validate the **existing** first-payload canonical parser through `routes/semantic/bodies/`; put generic Zod header/`{ can_continue, payload }` wrapper schema in GHR contracts/core, **never a semantic field validator in the generic router**. Preserve header/wrapped-body/domain-payload separation; use strict schemas and negative fixtures for each explicitly tested body. For future rows, **DO NOT create tests, fake routes, receivers, production APIs, or CK oracles in the current scope**; these definitions are explanatory placeholders only. If actual predecessor data lacks a required reference/qualified artifact, **STOP with named owner and evidence gap**; do not fill it with synthetic authoritative data.

### 5.6 Hop-local `can_continue` — explanation vs current implementation

**Meaning, independent of which domain receives the handoff:**

| Flag in current handoff body | Receiving-route behavior | Current status |
| --- | --- | --- |
| `can_continue: false` | Authenticate GHR delivery → strict parse header/wrapper/domain payload → durably ACK `parsed_only` → STOP, without domain resolver or work. | **ONLY implementation/CK scenario now (Test 1).** |
| `can_continue: true` | Authenticate and parse → proceed **immediately** through the receiving process's normal workflow (including its normal source/eligibility checks). No additional activation step; the flag itself selects continuation. | **Conceptual behavior ONLY. Do NOT implement, issue, simulate, or test `true` now.** |

**Test 1 — only current implementation and CK acceptance:**

```text
Accepted NDV1
    → Trusted GHR issuance + durable delivery (can_continue: false)
    → semantic/batch-plan real receiver
    → authenticate + parse exact SemanticBatchPlanInput/v1 payload
    → durable idempotent parsed_only ACK
    → STOP (0 NDV1 source redemption, 0 IDSER planning, 0 SEM)
```

**Example 2 — future explanatory scenario for Codex ONLY; NOT an executable test or CK condition:**

```text
Accepted NDV1
    → GHR (can_continue: true)
    → IDSER performs normal planning up to SEM-facing handoff
    → new GHR handoff (can_continue: false)
    → SEM authenticates + parses payload only → ACK → STOP
```

The example shows why the boolean exists; it **MUST NOT** be converted into a GHR-01A, GHR-01B, GHR-02, or GHR-03 task, an extra test file, a `true` smoke/integration/unit test, SEM receiver work, or an independent activation-gate requirement. After successful `true` parse, the receiving process simply proceeds—no secondary flag/approval step inserted by GHR. The ordinary issuer authentication and route allowlist are not bypassed.

**Current CK evidence:** must positively prove the actual real receiver receives, strictly parses and durably ACKs Test 1, and must measure **zero** downstream effects using DB/queue observations or spies. Missing/invalid `can_continue`, modified body hash, invalid payload and duplicate/lost ACK negatives must be tested **only in `false`-mode fixtures**. Mode replay/pinning is proven by verifying persisted original `false` remains immutable; do not need to issue or simulate `true`.

## 6. Reliable durable pipeline and security boundaries

**Frozen Test 1 transport:** use the existing **same-transaction pg-boss producer as the sole durable dispatch transport**. Do **not** add a transactional outbox or another durable handoff system. The `atlas_app` acceptance transaction persists its trusted immutable GHR intent and sends one pointer-only `atlas-generic-handoff-v1` job using the same PostgreSQL transaction and a stable pg-boss singleton key. The job contains only `GenericHandoffJob/v1` plus `handoffId`; it contains no payload, source bytes, grant, provider data or destination string.

**Frozen persistence and authority split:** `atlas.generic_handoff_intent` is Atlas-owned immutable issuance truth, keyed by `handoffId` and unique `idempotencyKey`, and persists the trusted header, exact wrapped `body_bytes`, `bodySha256`, body encoding and route/policy/handler pins. `atlas.generic_handoff_route_policy` is Atlas-owned and its only Test 1 enabled row is `NormalizedDocumentAccepted/v1 → semantic/batch-plan`, `policyVersion=v1`, `handlerVersion=v1`, `SemanticBatchPlanInput/v1`, `can_continue=false`. `bridge.generic_handoff_delivery` is Bridge-owned runtime state only: it records the immutable handoff binding, lease owner/generation/expiry, terminal disposition and sanitized error class. `atlas_app` may write intent/policy and transactionally enqueue; `agents_bridge` may claim/ACK only its delivery row and gets a narrow read-only dispatch view/function for one known `handoffId`. Neither role gains the other's write authority. Existing pg-boss queue declaration/consumption remains Bridge-owned.

1. **Atomic acceptance + issuance:** Document acceptance, the immutable GHR intent and its pointer-only pg-boss job commit/rollback together in the `PostgresPerceptionAuthority.deliver()` transaction, according to the frozen trusted issuer and route allowlist; first scope issues only `false`. A failure rolls back all three; no NDV1 polling, SQL trigger or outbox backfill is permitted.
2. **Router claim:** Durable idempotent consumer loads a known issued record using least-privilege credentials; validates fixed header, **generic wrapper structure**, trusted issuer provenance, hash/encoding (including `can_continue`), body size, route policy and revocation. It treats `body.payload` as opaque; never executes a destination string or uses client-provided queue routing.
3. **Pinned resolution:** Store route-policy/handler revisions and a stable delivery idempotency key. Unknown/disabled/conflicting routes become a **durable blocked/quarantined state** with sanitized diagnostics, not silent drops or automatic fallback.
4. **Delivery:** Dispatch a handoff pointer or unchanged bounded envelope to the registered receiving route. Worker/receiver authenticates context, loads it from Atlas-owned storage, checks freshness, strictly parses `body.payload`, then either durably ACKs `parsed_only`/STOP for `false` or, in the future, directly continues the receiver's normal workflow for `true` with ordinary idempotency/fencing; NO extra activation gate. **Current worker delivers `false` only.**
5. **Ack:** Router ACK means *receiver durably received/registered or rejected* the message under a documented contract—not that the semantic/reconciliation/projection job has completed. For `can_continue=false`, `parsed_only` is the explicit successful terminal delivery status; for `true`, business completion is a separate domain-owned result. Business results are written by their owning worker only.
6. **Recovery:** Only a classified transient failure uses existing pg-boss retry/backoff and always preserves the same `handoffId`, body bytes/hash and pins. A restart may reclaim an expired Bridge lease or resume an eligible persisted pg-boss job; it does not scan NDV1 or create a new job. `parsed_only` is terminal success. Missing/disabled/revoked route policy or destination is terminal `blocked`; invalid/corrupt/forged header, body or hash is terminal `quarantined`; exhausted automatic retry is terminal `retry_exhausted`. **Manual replay of `blocked`, `quarantined` or `retry_exhausted` is out of scope**: there is no endpoint, CLI, SQL procedure or reissue/promotion mechanism in Test 1. Delivery may be at-least-once; **logical effects** must be exactly-once-like through receiver durability and fencing. Do not claim exactly-once physical execution.
7. **Privacy:** No raw PRD/PDF content, image bytes, provider credentials, provider responses or confidential payload dumps in queue, dead-letter records, CK evidence or logs. Use bounded metadata and sanitized error classes.

**Optional trust strengthening:** if boundary changes from one protected Atlas PostgreSQL transaction/worker realm to different services or accounts, require independently qualified service authentication, anti-replay and message authentication (e.g. mTLS plus keyed MAC/signature). Never assume a bare hash proves issuer identity.

## 7. Strict ownership and transition activation

| Actor | Owns | Explicitly does not own |
| --- | --- | --- |
| **Domain sender + Atlas acceptance** | Source output, business validity, accepted state, immutable artifact(s), sender-owned body shape | Authority to bypass transition policy |
| **Atlas Handoff Issuer** | Authenticated provenance, allowed producer→route transition, trusted fixed header, **authorized/pinned hop-local `can_continue`**, atomic intent | Parsing arbitrary domain body fields |
| **Generic Handoff Router** | Fixed-header + generic wrapper shape validation, hierarchical index resolution, immutable delivery decision, replay-safe forwarding, sanitized diagnostics | Corpus parsing, batch fan-out, fan-in gate, provider admission, semantic truth, reconciliation state, projection eligibility |
| **Receiving branch / resolver** | Strict `body.payload` parser, `can_continue=false` parsed-only STOP, and (future `true` semantics only) normal artifact reference/scope/hash/grant/lifecycle validation and domain work, without a second activation gate | Trusting body refs simply because GHR forwarded them |
| **BSS-V2-005/006** | Provider capacity planning and exclusive per-attempt fair admission | Atlas process-handoff routing decisions |
| **SEM-CUTOVER + IDSER** | Sole semantic methodology/qualification + planner/batch ownership as separately specified | Second extractor created in GHR |
| **Reconciliation single writer** | Shared workspace mutation order and authoritative fan-in/terminal proof under explicit lifecycle policy | Generic router-level `wait for N` logic |
| **Projection owner** | Accepted snapshot validation and authorized read/result derivation | Master publication merely because a handoff arrived |

**Current stop boundary:** Today the staged Perception path stops at `perceived`. This GHR implementation adds an **atomic, trusted `can_continue=false` handoff** and dispatches it to the **real semantic receiver for strict parse-only ACK**. It does not call the already-existing `resolveBackground()` or execute IDSER. This first GHR checkpoint is **complete when Test 1 passes**; it is **not** incomplete merely because future IDSER v3 planning or SEM execution was not tested. `true` is a future self-contained continue instruction, **not** a request for an additional activation switch. Normal issuer and route authorization remain required for every handoff.

## 8. Current GHR CK acceptance contract — TEST 1 ONLY / FALSE ONLY

**CK scope lock:** **Only** accepted NDV1 → GHR → real `semantic/batch-plan` receiver with `body.can_continue=false`. Do **not** implement/test `true`, the future SEM route, `SemanticBatchPlanReady/v1` dispatch, v3 planning, or domain fan-out/fan-in. Example 2 (§5.6) and future body contract shapes (§5.2–5.4) are **documentation only**, not hidden acceptance clauses. A real positive, durable `parsed_only` ACK is enough for the first GHR implementation when all transport/recovery negatives pass.

| ID | Required proof IN CURRENT SCOPE |
| --- | --- |
| GHR-RC-01 | Zod 4.4.3 strict generic header/envelope + two-field `{can_continue,payload}` structure; **every schema field has `.describe()`** matching its field dictionary, and genuine auth/provenance is validated **outside** Zod. Generic router does not inspect business payload keys. |
| GHR-RC-02 | Directory isolation: `routes/{semantic,reconciliation,projection}/{branches,bodies,receivers,index.ts}` root index imports only domain indexes; no giant switch/body union/core domain validator. `semantic/batch-plan` exact route pins and no wildcard/fallback proven. Empty future domain registries are acceptable. |
| GHR-RC-03 | First route: real `semantic/batch-plan` receiver gets a valid **`false`** wrapped body, authenticates delivery, strictly parses the existing unchanged canonical five-field `SemanticBatchPlanInput/v1` payload and durably ACKs `parsed_only`. **Do not call `resolveBackground()`.** Fake-only ACK fails; real receiver delivery must be observed. |
| GHR-RC-04 | Reject forged issuer/producer, wrong route/scope/policy/handler pins, unsupported contract, invalid header, changed body hash/bytes, malformed/extra payload fields and stale/disabled route policy. Test negative cases through **`false` only**; no domain source-redemption negatives are required. |
| GHR-RC-05 | NDV1 staged acceptance, immutable GHR intent and pointer-only transactional pg-boss job commit/rollback atomically; retry and completed-execution replay preserve one original **`false`** logical handoff. Prove restart, queue delivery, lost ACK, duplicate/reordered events, concurrent claims, lease fences and stable dedup using isolated real PostgreSQL/pg-boss. No NDV1 polling, SQL trigger or transactional outbox. |
| GHR-RC-06 | Enforce the frozen 75,776-byte envelope, 8,192-byte header, 65,536-byte generic body, depth-16, object-128 and array-256 guards; reject duplicate-key/invalid JSON. The first route additionally enforces the 2,048-byte canonical payload and 2,081-byte exact false-only wrapper. Header `bodyContract` selects receiver parser, wrapped body is unchanged, `bodySha256` includes `can_continue` and exact serialized payload; no raw PDF/media/prompt/secrets/PII in logs. |
| GHR-RC-07 | Generic routing is demonstrably extensible from isolated domain registry composition and type-safe interfaces **without implementing/testing any future route**. **Do not** create fixture tests for SEM/reconciliation/projection body contracts in this CK. |
| GHR-RC-08 | During **`false`** receipt: positive `parsed_only` proof plus explicit **zero** `resolveBackground()` lookup, IDSER candidate/partition/persistence, BSS read/admission, SEM dispatch/execution, provider calls, reconciliation or projection effects. |
| GHR-RC-09 | Unknown/missing/disabled destination produces a durable sanitized terminal `blocked`/`quarantined` outcome without silent loss or hot retry. Only classified transient failures use automatic pg-boss retry with the original pinned routing/header identity; manual replay, reissue and mode promotion are out of scope. |
| GHR-RC-10 | Schema `.describe()` coverage, field glossary and behavioral tests establish required/conditional header fields, issuer authority, body schema bounds, byte hashes, and issued timestamps—**all tests use the current `false` mode**. |
| GHR-RC-11 | Missing/nonboolean `can_continue`, extra wrapper keys, invalid/changed payload hash, replay conflict, invalid domain payload and malformed receipt are rejected; `false` is never coerced/defaulted and cannot accidentally continue. **No test is allowed to issue or execute `true` for this CK.** |

**Explicitly not CK evidence:** NDV1 redemption, multimodal measurement, v3 plan/child handoff persistence, semantic batch-execution intake, future `can_continue=true` behavior, example 2, BSS planning, SEM provider execution, reconciliation, and projection. These should **not** be added to a CK checklist as prerequisites. Existing modules and contracts may be referenced as architectural context only; no tests/writes outside the above boundary are required.

## 9. Bounded GHR implementation checkpoints — TEST 1 ONLY

**Current milestone (complete at Test 1):** `accepted NDV1 → same-transaction GHR intent with can_continue=false → durable GHR dispatch → real semantic/batch-plan receiver → strict payload parse → durable parsed_only ACK → STOP`. This is **the complete current implementation target and CK sign-off boundary**, not a partial result awaiting `true` or SEM.

**GHR-01A — Generic envelope, raw ingress, and byte-integrity contract**
Freeze the `GenericHandoffEnvelope/v1` header + `{can_continue,payload}` Zod wrapper. **Apply `.describe()` to every nested header and body field** (including optional fields and container objects), maintain §3.1a field dictionary, enforce the §3.1c generic bounds and exact byte/hash parity, and keep the payload opaque. No issuer, registry, directory composition, domain-parser import, issuance, or dispatch is in this ticket.

**GHR-01B — Directory-modular main → branch registry foundation**
After GHR-01A CK PASS, establish frozen `routes/{semantic,reconciliation,projection}/` directory ownership (`branches/`, `bodies/`, `receivers/`, `index.ts`), the root main index that imports domain indexes only, and exact pinned registration interfaces with no wildcard, fallback, dynamic path, or provider/BSS-registry reuse. It may represent the prospective false-only `perception.acceptance` → `semantic/batch-plan` binding and its 2,048/2,081-byte bounds only in type/unit evidence; no live branch, body adapter, receiver, issuer, authorization, issuance, or dispatch exists until later tickets.

**GHR-02 — Same-transaction accepted-NDV1 issuance + durable dispatch**  
Bind trusted issuance to the `staged-fair-local-v1` branch in `PostgresPerceptionAuthority.deliver()`, after accepted NDV1 cache/manifests and member/execution lifecycle updates, within the SAME transaction. Issue/persist **only `can_continue=false`** plus exact `SemanticBatchPlanInput/v1` payload and header under the sole `v1`/`v1` policy/handler pins. Persist immutable Atlas intent/policy records and dispatch a pointer-only job through the existing transactional pg-boss producer—**no outbox**—with Bridge-only delivery receipt/lease state and narrow read authority. No NDV1 table poll/notification trigger. Test atomic rollback, stable idempotency, restart, automatic transient retry and queue/lease handling. No `true` issuance, reissue API, manual terminal replay or IDSER processing.

**GHR-03 — Actual `semantic/batch-plan` receiver ingress and parsed-only ACK**  
Register the first `semantic/branches/batch-plan.route.ts`, `semantic/bodies/semantic-batch-plan-input.v1.ts` adapter and actual `semantic/receivers/batch-plan.receiver.ts`. Make the route deliverable for **`false`**. The receiving handler authenticates the trusted GHR delivery, strictly parses `body.payload` with the one existing canonical parser, writes an idempotent durable `parsed_only` receipt, and stops. Prove real pg-boss handoff, restart/lost-ACK/replay negatives and no downstream DB/queue/resolver/BSS/IDSER/SEM effects. The presence of a live receiver does **not** trigger planner execution; a fake-only receiver is insufficient. Passing GHR-RC-01..11 **closes the current ticket set**.

**Future continuation illustration — not a GHR-01A, GHR-01B, GHR-02, or GHR-03 ticket or CK item:** In a later change, a trusted NDV1 handoff using `can_continue=true` makes IDSER immediately run its normal planning process through the next handoff, which may be `can_continue=false` at SEM. **Do not implement or test either hop now. Do not insert a second activation flag/gate for future `true`.** Continued work must still use the existing `resolveBackground()` and sole IDSER v3 planning path when it is built, not a legacy parallel workflow.

## 10. Non-goals, blockers, and exact stop boundary

- No second BSS provider-admission/reservation or quota scheduler; no provider call triggered by GHR.
- No second SEM-CUTOVER extractor, source packet/prompt builder, parser, truth materialization, candidate/evidence/index writer or reconciliation writer.
- No generic GHR algorithm to split batch arrays or wait for `N of N` documents; those are **receiving/sender domain operations**.
- No publication of Master, CES result, or projection eligibility derived merely from delivery.
- Do not treat standalone IDSER modules or a BSS prospective reader as evidence of a wired production planner; **that wiring is not part of Test 1**. No circular or legacy semantic path.
- No implicit/manual promotion of a `false` handoff to `true` via retry; trusted issuer/route provenance is still required. Manual replay of `blocked`, `quarantined` or `retry_exhausted` handoffs is out of scope; this document defines automatic transient retry only. This document does not authorize repository changes.
- **CURRENT ONLY:** real semantic receiver strict payload parse + durable `parsed_only` ACK + zero domain processing under `can_continue=false`. **No `true` tests, SEM receiver tests, IDSER v3 plan tests, separate activation-gate tests, or downstream handoff execution in current CK.**

**Decision summary (v0.6):** One generic GHR Zod header with **every field annotated via `.describe()`** + a strict generic `{can_continue,payload}` wrapper, trusted atomic issuance, modular main→branch directories, one durable transport and real receiver-owned canonical payload parsing. **Current deliverable and CK = Test 1 ONLY (`can_continue=false`, parsed-only ACK, STOP).** `true` means immediate receiver continuation whenever introduced in the future, **without a separate activation gate**, but no `true`-mode code/tests, IDSER v3 execution, SEM receiver or Test 2 are required in this ticket set. Generic GHR never interprets domain payloads.

## 11. Codex implementation review checklist — GHR TEST 1 ONLY

- [ ] Header, nested fields, wrapper `can_continue` and `payload` all have **individual `.describe()`** strings consistent with the §3.1a dictionary. Annotate parent objects too; description metadata is not authentication.
- [ ] Shared generic Zod checks strict header + exact wrapper only. Body `payload` stays domain opaque to GHR; `semantic/bodies/` delegates to existing canonical five-field parser; no duplicate active validator.
- [ ] Root `main-route-index.ts` imports only individual main-domain indexes. Each domain owns `branches/`, `bodies/`, `receivers/` and local `index.ts`. No giant switch, giant body union, or provider-routing collision.
- [ ] Trusted issuer atomically records **only `can_continue=false`** for accepted NDV1, with immutable body hash/idempotency/route pins. Durable work transport never polls NDV1 directly.
- [ ] **Only required positive:** accepted NDV1 → real `semantic/batch-plan` receiver → strict canonical parse → durable idempotent `parsed_only` ACK → STOP.
- [ ] False-only negative proofs: missing/invalid flag, extra keys, corrupted hash, forged header/route, wrong parser, replay/duplicate/lost ACK, restart and concurrent delivery. Preserve original false-mode issuance identity.
- [ ] Enforce §3.1c generic ingress limits and the stricter 2,081-byte Test 1 wrapper limit before parsing domain data.
- [ ] Only the existing automatic pg-boss retry path handles classified transient faults. `blocked`, `quarantined` and `retry_exhausted` are terminal; no manual replay/reissue/promotion surface exists.
- [ ] Strong **zero-downstream-effects** proof: no `resolveBackground()`, no planning, no BSS, no SEM, no provider/reconciliation/projection side effects.
- [ ] **DO NOT** create/execute/require Test 2, any `can_continue=true` test or code path, real IDSER v3 planning, SEM receiver tests, future body fixtures, or downstream route delivery for this CK.
- [ ] Future rule only: when a later issued `can_continue=true` message is received by a completed receiver, it immediately continues through the process's normal workflow **without a second activation gate**. The current CK never exercises that rule.
- [ ] No repository edits, commits, pushes, or canonical Docker volume mutation are authorized by this document alone.
