# IDSER-012-03-01-01 — Strict input body and accepted-fixture derivation

- **State:** `approved`; independent CK review passed at `81c19e61b6e248f64542fddaf1e5be963c1bf7d5`.
- **Batch:** `IDSER-BATCH-12-03-01-01`.
- **Parent:** [IDSER-012-03-01 split map](IDSER-012-03-01-ghr-body-contract-accepted-document-resolver.md).
- **Dependencies:** approved IDSER-012-01 / PERC-RESET-008 accepted `NormalizedDocument v1` authority and one qualified isolated accepted RUN-003 record or authorized read-only existing fixture record.

## Outcome

Produce a reproducible, authentic-data-derived five-field `SemanticBatchPlanInput/v1` fixture and its strict receiver-owned parser. The fixture is a test-delivery artifact only; it grants neither document access nor GHR authority. **STOP before resolver implementation, partitioning, durable writes, GHR issuance, BSS activity, or SEM activity.**

## Authorized scope

The parser accepts exactly this bounded canonical JSON object:

```ts
type SemanticBatchPlanInputV1 = Readonly<{
  normalizedDocumentRef: string;
  perceptionExecutionId: string;
  sourceSha256: string;
  normalizedDocumentVersion: "v1";
  normalizedDocumentFingerprint: string;
}>;
```

All fields are required. Reject extra, missing, duplicate, prototype-bearing, oversized, malformed, noncanonical, or wrong-version bodies. Enforce lowercase 64-hex for both hash values and bounded nonempty execution identity. Do not alter a generic GHR header or create a generic envelope, issuer signature, policy grant, route, outbox, or queue.

Fixture derivation reads actual accepted evidence only: completed `document_perception_execution`, matching `extraction_bundle_document.state='perceived'`, persisted `normalized_document_cache`, original document source SHA, accepted normalized version and completion fingerprint. Record reproducible fixture provenance without copying raw source/media bytes. `cache_key` and `completion_fingerprint` remain distinct values with distinct derivations; no caller input derives either.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| RC-012030101-01 | A fixture can be reproducibly derived from real persisted accepted facts, including the correct cache key, source SHA, completed execution and completion fingerprint; a JSON lookalike without accepted facts fails. |
| RC-012030101-02 | The exact five-field strict parser accepts the qualified fixture and rejects missing, extra, duplicate, prototype, oversize, malformed-hash, malformed-execution, and wrong-version inputs. |
| RC-012030101-03 | The parsed result remains an opaque reference value: parser/fixture tests prove zero resolver, cache mutation, planner, BSS, GHR, SEM, provider, reconciliation, or Atlas semantic-truth effects. |
| RC-012030101-04 | The fixture is replaceable by a future receiver adapter using this same parser, without claiming a trusted GHR issuer, route, or header contract. |

## Security Readiness

- `SR-012030101-T1`: untrusted JSON body → strict bounded typed value.
- `SR-012030101-T2`: accepted Atlas fixture evidence → non-authorizing test body.
- `SR-012030101-C1`: no body field, ref, or hash may become an access grant; no raw source/media or GHR machinery is allowed.
- `SR-012030101-R1`: CK verifies actual accepted-fixture provenance and exact reject cases; `SR-012030101-R2` verifies durable zero side-effect counters.

## Evidence and hard stop

Use the actual accepted record under its existing read authority and retain the selected identity, query/repository path, canonical fixture bytes/digest, and negative-parser matrix. If that authority cannot expose a qualified accepted record, STOP `NORMALIZED_DOCUMENT_AUTHORIZED_READ_GAP`; do not make a synthetic acceptance fixture. A CK `PASS` permits only `-03-01-02` to redeem the parsed reference.
