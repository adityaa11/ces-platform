# BSS-V2-007 — Authenticated internal receiving boundary (narrow reusable contract)

- **State:** `planned`; implementation is NOT authorized by this planning document. Separate GO / CK required.
- **Review batch:** `BSS-V2-BATCH-07`.
- **Dependency:** current approved Atlas perception/semantic internal HTTP authentication convention. Neither GHR nor IDSER-012-03-01-03 implementation is a prerequisite for qualifying this BSS library.
- **Downstream:** `IDSER-012-03-01-03` owns the first domain-specific accepted-document read; `BSS-V2-008` is separately planned and NOT activated/implemented here.

## Frozen policy decision — 2026-10-19

The BSS component authenticates an internal caller **before** executing a **server-wired, domain-owned authorized resource operation**. It does NOT issue a transferable principal, generic work token, permission object or delivery receipt. No client-selected route/operation/policy is accepted. The server selects the credential and domain callback when composing the receiver. A successful credential check **alone is never a resource grant**; authorization to act on each resource is part of the domain callback, which must be exercised and proved in its downstream ticket.

The current first service is `agents-bridge`, authenticated by the existing `AGENTS_BRIDGE_SERVICE_CREDENTIAL` mechanism. No universal secret is introduced or shared with unrelated services. This component neither starts work nor decides whether a document is accepted.

**Explicit chosen first-consumer access policy:** an authenticated Atlas-managed Bridge processing service may redeem any `SemanticBatchPlanInput/v1` that matches an *eligible accepted* persisted perception operation; this is a **service-wide constrained read**, NOT proof that an individual GHR task was assigned. GHR delivery/job assignment is separately future-owned. Do not claim per-job sender/receipt authentication or infer it from a hash/ref.

## Exact public TypeScript API

**New module:** `packages/atlas-core/src/internal-receiving-boundary.ts`; export it from `packages/atlas-core/src/index.ts`.

```typescript
import { timingSafeEqual } from "node:crypto";

export class InternalReceivingUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized internal service request.");
    this.name = "InternalReceivingUnauthorizedError";
  }
}

export type InternalReceivingBoundary<TInput, TResult> = Readonly<{
  receive(
    presentedCredential: string | undefined,
    rawBody: string
  ): Promise<TResult>;
}>;

export function createInternalReceivingBoundary<TInput, TResult>(
  options: Readonly<{
    serviceCredential: string;
    parseBody(rawBody: string): TInput;
    redeem(input: TInput): Promise<TResult>;
  }>
): InternalReceivingBoundary<TInput, TResult> {
  const expected = Buffer.from(options.serviceCredential, "utf8");
  if (expected.byteLength < 32) {
    throw new Error("Internal service credential must be at least 32 bytes.");
  }
  return {
    async receive(presentedCredential, rawBody) {
      if (typeof presentedCredential !== "string") {
        throw new InternalReceivingUnauthorizedError();
      }
      const actual = Buffer.from(presentedCredential, "utf8");
      if (
        actual.byteLength !== expected.byteLength ||
        !timingSafeEqual(actual, expected)
      ) {
        throw new InternalReceivingUnauthorizedError();
      }
      const parsed = options.parseBody(rawBody);
      return options.redeem(parsed);
    },
  };
}
```

The block above is the **binding implementation shape**, not pseudocode. Only mechanical formatting/import amendments are permitted during GO. `parseBody` is receiver-owned strict validation; `redeem` is the server-wired domain authorization **and** resource operation. Its caller supplies no `serviceId`, `routeId`, `policyId`, bypass flag or trusted scope. The receiver must never export the configured credential in errors or response. `receive` is the only entry; no unprotected variant or helper that returns an authorization token.

This BSS library does not define wire status codes: each host maps `InternalReceivingUnauthorizedError` to an existing redacted 401; domain parser failures to a bounded invalid request; ineligible resource and infrastructure errors to separate closed failure responses. The HTTP host **must cap request bytes before** constructing `rawBody`.

## Ownership and forbidden implementation

- BSS-V2-007: this one module, public export, tests of credential validation/order and reuse across two domain callbacks. No SQL and no workspace/project/document fields.
- IDSER-012-03-01-03: compose it with strict `parseSemanticBatchPlanInputV1` and Atlas-owned `PostgresAcceptedSemanticBatchPlanDocumentResolver.resolveBackground` (new background entry, existing document validation).
- Existing interactive `resolve(scope,input)` retains Better Auth session/membership checks. It must **never** call `resolveBackground` as a fallback when the user session is expired.
- Existing `createPerceptionInternalRoutes` and `createSemanticInternalRoutes` remain behaviorally frozen. Their credential comparison is the existing qualified pattern; BSS-007 need not refactor those existing reviewed paths merely to demonstrate reuse.
- No GHR issuer/outbox/dispatcher, message queue, planning worker, body envelope, service identity registry, authorization SQL table/migration, global key, source-grant reuse, provider admission, SEM result, truth/publication effect, or new credential rotation policy.

## CK Review Contract

| ID | Exact proof |
| --- | --- |
| RC-BSSV2-007-01 | Public function/type and unauthorized error are implemented exactly as above, with fail-fast secret length validation and timing-safe equality for equal-length candidates. |
| RC-BSSV2-007-02 | Wrong/missing credential calls neither `parseBody` nor `redeem`; correct credential invokes each exactly once in order; no returned permit/context/token is created. |
| RC-BSSV2-007-03 | Two different real test receiving callbacks with distinct strict parsers and authoritative authorization behavior use the *same* BSS function without semantic/document assumptions. An invalid work request is rejected by the owning callback without returning protected data. |
| RC-BSSV2-007-04 | Replay of an authorized read may be verified again; no BSS TTL/grant/replay ledger invented. The generic guard is not claimed to enforce per-job assignment, revocation or GHR delivery. |
| RC-BSSV2-007-05 | Direct perception/semantic internal-route regressions remain PASS; no migrations, direct Bridge Atlas DB access, provider requests, queue publication or persisted Atlas truth mutations. Tests prove their side-effect counters are active, not inert mocks. |

## Security readiness and handoff

**Applicable.** The trust transition is external/internal presented credential → authenticated server-composed receiver → domain `redeem` resource authority. A credential is necessary but not sufficient. In `IDSER-012-03-01-03`, the production document eligibility check must use the exact accepted perception/member/bundle/cache/source/fingerprint/media evidence, with redacted failure and positive persisted-record proof. A separate per-job authorization requirement is a **future GHR work assignment policy**, not silently present in BSS-V2-007.

On CK PASS, publish only the reusable boundary. **HARD STOP** before a GHR route, any new live worker, or IDSER resolver changes.
