# Atlas Backend Phase

## Phase principle

Every implementation in this directory is part of Atlas's controlled transition from fixture-backed prototype behavior to real, production-shaped implementations.

The transition is intentionally incremental:

```text
fixture-backed behavior
        |
        | preserve as regression and golden-scenario evidence
        v
real implementation behind an approved boundary
        |
        v
validated production-shaped behavior
```

This is why Atlas fixtures live in a separate package. The fixture package is not a temporary copy of production truth that backend work should silently rewrite or delete. It remains an explicit test, golden-scenario, and prototype-data boundary while real services are introduced around it.

## Package boundary

```text
@atlas/fixtures
    |
    +-- prototype/demo scenarios
    +-- golden scenarios
    +-- regression data
    +-- deterministic test inputs
    |
    +-- not production identity, authorization, or trusted Atlas state

production-shaped packages and services
    |
    +-- real authentication and sessions
    +-- PostgreSQL persistence
    +-- Atlas-owned authorization and project state
    +-- immutable document storage
    +-- queue and provider boundaries
    +-- later knowledge, review, approval, and publication workflows
```

Production implementations must not use fixture identities, fixture memberships, fixture project ownership, or fixture records as runtime authority. Tests may use fixtures deliberately to preserve deterministic scenarios and to compare the new implementation against the established product behavior.

## Safe transitional state

It is valid for the application to temporarily combine real infrastructure with fixture-backed surfaces:

```text
real authenticated identity/session
        |
        v
fixture-backed demo or golden scenario
```

For example, the sign-up implementation creates a real Better Auth identity and durable session, then enters the existing fixture-backed `/demo` surface. That does not mean sign-up created a project, workspace, membership, role, permission, Master, or Initial Draft.

The transitional state is safe when the boundary is explicit and independently testable. Backend work must replace one responsibility at a time without pretending that adjacent fixture behavior has already become production behavior.

## Authority rules

- Better Auth owns authentication identity, credentials, authentication persistence, and session cookies.
- Atlas owns project authorization and Atlas project state.
- PostgreSQL is the canonical persistence boundary for approved production state.
- `@atlas/fixtures` remains test and golden-scenario material, not production truth.
- The browser does not own authentication truth through local storage, custom tokens, or fixture identities.
- Model, provider, document, and reasoning services do not gain authority over accepted Atlas state merely because a backend implementation now reaches them.
- A real implementation must consume an approved dependency boundary rather than duplicating or silently replacing it.

## Implementation expectations

Each Backend Phase ticket should make the fixture-to-real transition visible by defining:

- which fixture behavior is being replaced or composed;
- which production package or service becomes authoritative;
- which fixture scenarios remain available for regression and golden validation;
- which authority boundary prevents accidental state or permission leakage; and
- how the new behavior is validated before the next dependent ticket begins.

Do not remove fixtures as a shortcut to claiming completion. Preserve them until the relevant real implementation has passed its bounded review, and keep fixture changes separate from production behavior changes unless the ticket explicitly requires a fixture update.

## Review and delivery

Backend work follows the Atlas review protocol:

1. Define a bounded ticket against the approved product and architecture baselines.
2. Implement only the currently authorized ticket or review batch.
3. Validate the real boundary and the fixture/regression boundary it must preserve.
4. Commit the checkpoint and mark it `awaiting_review`.
5. Use `ck` for one consolidated review, `cfc` for the bounded remediation pass, and `go` before beginning the next dependency-ready ticket.

A later implementation may extend an approved boundary, but it must not silently turn fixtures into production authority, reopen an approved predecessor, or absorb a new product requirement without a recorded scope change.

## References

- [Atlas Backend Production Baseline](atlas-backend-production-baseline-mistral-synced.md)
- [Atlas Core Architecture — Updated Checkpoint](atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md)
- [Sign-Up Implementation Context](atlas-sign-up-implementation-context.md)
- [Backend ticket sets](tickets/)
