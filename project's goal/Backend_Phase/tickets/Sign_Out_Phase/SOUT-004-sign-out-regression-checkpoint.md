# SOUT-004: Sign-out regression checkpoint

- **State:** `planned`
- **Review batch:** `SOUT-BATCH-04`
- **Depends on:** SOUT-001 `PASS`, SOUT-002 `PASS`, SOUT-003 `PASS`
- **Baseline:** [Sign-Out Implementation Context](../../atlas-sign-out-implementation-context.md) §§14, 18, 21–25; [Backend Phase README](../../README.md) review/delivery and fixture-transition rules; [Sign-Up Ticket Set](../Sign_Up_Phase/README.md); [Sign-In and Authenticated Home Ticket Set](../Sign_In_Phase/README.md); AC-01 through AC-16

## Outcome

Freeze final evidence that real production sign-out is integrated without regressing the approved sign-up, sign-in, authenticated-home, fixture, CSP, build, and Better Auth lifecycle boundaries.

## Scope

- Run the unchanged `packages/atlas-auth/tests/lifecycle.test.ts` and retain its durable session/sign-out evidence.
- Run the focused SOUT-001 submission tests and SOUT-003 application sign-out integration proof.
- Run sign-up and sign-in regression tests, including the approved `/home` identity/empty-production-state checks.
- Exercise representative `/demo` fixture scenarios, including the existing fixture account-menu behavior, to prove fixture authority remains separate.
- Run rendered HTML and strict CSP checks, the application build, and directly affected lint/type checks.
- Inspect the final diff for a new auth route/service/configuration, schema/migration, custom session store/cookie/token path, project/fixture mutation, raw sensitive-data output, fake production logout, or sign-up destination change.
- Record commands, environment limitations, test counts, and the reviewed implementation commit in the checkpoint evidence.

This is a bounded validation checkpoint. Do not use it to redesign authentication, add route-wide middleware, introduce global sign-out, or absorb unrelated product/security requirements.

## Acceptance criteria

- All SOUT-001 through SOUT-003 acceptance criteria remain satisfied at the final reviewed commit.
- BSS-004's package-level lifecycle proof passes unchanged and continues to establish session invalidation authority.
- Application sign-out proof covers the real production menu, POST route, success-only navigation, old-session invalidation, `/home` redirect, account preservation, and test-only cleanup.
- Sign-up, sign-in, authenticated `/home`, `/demo`, rendered HTML, CSP, build, and directly affected lint/type checks remain valid.
- `/demo` remains fixture/golden authority and is not forced into production Better Auth sign-out semantics.
- No project/workspace/membership/role/publication state or fixture state is changed by production sign-out.
- No local/session storage auth state, custom cookie, JWT/bearer/refresh-token path, auth schema/migration, competing auth service, or direct app-side session deletion is present.
- The final evidence identifies the reviewed `HEAD`; no pass is declared from an uncommitted or fixture-only result.

## Validation

- Execute the full relevant command set from SOUT-003 plus sign-up/sign-in regressions, `/demo` fixture regressions, rendered HTML/CSP, build, and directly affected lint/type checks.
- If a database-backed command is unavailable, record the exact limitation and preserve the test rather than weakening or replacing it.
- Run `git diff --check` and inspect the final changed-file list for scope expansion.
- Confirm any existing unrelated lint failures are identified without modifying unrelated files.
- Prepare one consolidated review checkpoint for `SOUT-BATCH-04`; do not create implementation changes from optional review ideas.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SOUT-004-01` Better Auth remains the identity/session authority and BSS-004 remains the package-level lifecycle proof.
- `BOUNDARY-SOUT-004-02` Atlas project authorization/state and `@atlas/fixtures` demo/golden state remain separate from authentication and sign-out.

### Trust boundaries

- `TRUST-SOUT-004-01` The final evidence covers both the browser-facing application boundary and the underlying auth persistence boundary without conflating them.
- `TRUST-SOUT-004-02` Regression fixtures are evidence inputs only and cannot become production authority through shared components.

### Sensitive assets and identity context

- `ASSET-SOUT-004-01` Final logs/evidence must exclude passwords, cookies, auth headers, secrets, database credentials, and raw internal exceptions.
- `IDENTITY-SOUT-004-01` Regression evidence must continue to bind `/home` identity and post-sign-out state to Better Auth session resolution.

### Required seams

- `SEAM-SOUT-004-01` Separate package lifecycle and application-flow evidence allow later security review to attach controls at the correct boundary.
- `SEAM-SOUT-004-02` The explicit production/fixture contract remains visible in final regression evidence.

### Prohibited couplings

- `COUPLING-SOUT-004-01` Do not claim completion from UI navigation, fixture-only tests, or a weakened/replaced auth lifecycle proof.
- `COUPLING-SOUT-004-02` Do not use a regression checkpoint to absorb global session management, account lifecycle, project authorization, or unrelated architecture work.

### Intentionally unresolved security policy

- `SEC-GAP-SOUT-004-01` Full security-baseline review, abuse prevention, global session management, recovery, MFA, invitations, and project authorization remain future work.

### Mandatory review bindings

- `REV-READY-SOUT-004-01`
  Ref: `SEAM-SOUT-004-01`
  Question: Does final evidence cover both Better Auth persistence/invalidation and the application menu/route behavior without replacing either proof?
  Evidence: package/app test results and reviewed commit.
- `REV-READY-SOUT-004-02`
  Ref: `SEAM-SOUT-004-02`
  Question: Do fixture regressions demonstrate `/demo` remains separate from production session sign-out?
  Evidence: fixture test output and production/fixture render assertions.
- `REV-READY-SOUT-004-03`
  Ref: `COUPLING-SOUT-004-02`
  Question: Is the final diff limited to the approved current-session sign-out scope?
  Evidence: changed-file review, `git diff --check`, and scope comparison against the baseline.

## Review checkpoint

- **Review question:** Do the complete auth, fixture, CSP, build, and directly affected checks remain valid with real production sign-out?
- **Combined acceptance:** Real current-session sign-out is proven at package and application boundaries; SUS/SIN behavior and `/demo` remain intact; no sensitive data, custom auth path, Atlas-state mutation, or scope expansion is introduced; and the reviewed commit is identified.
- **Implementation checkpoint:** No implementation is authorized yet. Record the final implementation/validation commit and review file when `SOUT-BATCH-04` enters `awaiting_review`.
