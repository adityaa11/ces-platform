# CK review — BSS-V2-005-01

- **Ticket:** BSS-V2-005-01 — External quota-domain and provider-capacity catalogue
- **Batch:** BSS-V2-BATCH-05-01
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-01-external-quota-domain-provider-capacity-catalogue.md` at `84f4452bbe507de4bf889a3d8e38472b2ef431cb`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-05-01-go.md`
- **Reviewed commit:** `84f4452bbe507de4bf889a3d8e38472b2ef431cb` (`feat(admission): add provider capacity catalogue`)
- **Review type:** first consolidated review

## Review target and authority

The GO checkpoint identifies commit `84f4452bbe507de4bf889a3d8e38472b2ef431cb` as its review target; `HEAD` matches. There are no tracked worktree changes. Untracked historical feedback artifacts do not overlap this review target. The ticket is `awaiting_review` and names batch `BSS-V2-BATCH-05-01`.

The six ticket Review Contract rows are the complete acceptance contract. The ticket explicitly incorporates §21.1 of `project's goal/Backend_Phase/atlas-provider-admission-staged-semantic-pipeline-implementation-context.md`. No runtime admission, provider calls, planner allocation, or deferred provider-limit governance is required.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-BSSV2-00501-01` | UNRESOLVED | `capacity-catalogue.ts:93` screens aliases for selected words only. A credential-shaped value without those words passes; the test at `capacity-catalogue.test.ts:19` covers only `apiKey_live_secret`. See `CK-001.a`. |
| `RC-BSSV2-00501-02` | PROVEN | `parseCapacity` distinguishes positive, zero, and unknown and rejects values on zero/unknown; `isStructurallyUnavailable` returns true for any zero dimension. `capacity-catalogue.test.ts` covers known-zero and unknown-with-value rejection. |
| `RC-BSSV2-00501-03` | UNRESOLVED | `capacity-catalogue.ts:77` checks that daily-calendar timezone and reset-time values are non-empty, but accepts syntactically unusable values. See `CK-001.b`. The policy kinds and the fixed-window, token-bucket, provider-reset, and conservative-fallback parameter checks are otherwise represented in the parser. |
| `RC-BSSV2-00501-04` | PROVEN | Migration `0023_bssv200501_provider_capacity_catalogue.sql` stores source/version and observed/effective metadata, uses `(quota_domain_id, profile_version)` as its key, rejects update/delete, assigns ownership to `agents_bridge`, and revokes table access from `atlas_app` and `PUBLIC`. The integration fixture persists two versions and checks app-role access and immutability. The GO checkpoint records that the Compose-backed fixture and migration checks passed. |
| `RC-BSSV2-00501-05` | PROVEN | The parser requires `quotaAccountingPolicyId`, rejects unknown profile/limit fields, and tests rejection of top-level and limit-level billing-weight fields in `capacity-catalogue.test.ts`. |
| `RC-BSSV2-00501-06` | PROVEN | Route parsing rejects `providerId: "docling"`; the fixture tests this case. The committed scope adds no local Docling quota or provider-runtime behavior. |

## Validation and evidence

Executed for this review:

```text
pnpm --filter @atlas/agents-bridge typecheck
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts
pnpm --filter @atlas/db typecheck
git diff --check HEAD^ HEAD
```

Both typechecks and the diff check passed; the focused catalogue suite passed all 3 tests. The database integration fixture was not re-executed because `DATABASE_URL` is not configured in this review environment. Its committed source and the GO checkpoint's recorded successful Compose-backed execution were inspected. No full database migration or migration-check command was run during this review.

## Frozen Finding Closure Matrix

### CK-001 — Input validation admits unusable alias and reset values

**Ticket authority:** `RC-BSSV2-00501-01` requires a server-controlled, non-secret quota-domain identity and says aliases expose no credential. `RC-BSSV2-00501-03` and incorporated §21.1 require explicit per-dimension window/reset semantics and required parameters sufficient to interpret them.

**Unsatisfied evidence:** The alias validator rejects only strings containing selected credential-related words, so a credential-shaped value such as the synthetic sentinel `sk-proj-EXAMPLE0123456789` passes. The daily-calendar validator checks only non-emptiness, so values such as `timeZone: "Not/AZone"` and `resetTime: "99:99"` pass without defining an interpretable daily reset.

#### CK-001.a

- **Required observable state:** The parser rejects credential-shaped values as `nonSecretProviderAccountAlias`; ordinary opaque non-secret aliases remain accepted.
- **Exact evidence / validation:** Add a deterministic assertion in `apps/agents-bridge/tests/capacity-catalogue.test.ts` proving a synthetic credential-shaped alias is rejected by `parseProviderCapacityProfile`, while the existing ordinary alias remains accepted; run `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts` successfully.
- **Direct-regression boundary:** Alias parsing and persistence of capacity profiles only. Route sharing, profile versioning, other metadata, and provider/runtime behavior are outside this clause unless directly changed by the alias validation.

#### CK-001.b

- **Required observable state:** A `daily_calendar` policy is accepted only when its timezone and reset time encode interpretable calendar-reset semantics; invalid timezone or time values fail closed.
- **Exact evidence / validation:** Add deterministic assertions in `apps/agents-bridge/tests/capacity-catalogue.test.ts` proving `Not/AZone` and `99:99` are rejected and a valid timezone/reset-time pair is accepted; run `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts` successfully.
- **Direct-regression boundary:** Validation of `daily_calendar` parameters and direct parser callers. Other window-policy kinds, capacity states, provider calls, and runtime refill behavior are outside this clause unless directly changed by the validation.

## Scope-change observations

None. The findings are implementation-repairable under the frozen ticket and require no product, policy, architecture, provider/runtime, or deployment decision.

## Decision

`CHANGES_REQUIRED`. Four Review Contract rows are proven; `CK-001.a` and `CK-001.b` remain implementation-repairable violations of rows 01 and 03. Keep the ticket at `awaiting_review` and return control to human/planning authority for the bounded remediation workflow.
