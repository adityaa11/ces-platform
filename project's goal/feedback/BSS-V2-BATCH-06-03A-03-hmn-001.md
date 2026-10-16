# HMN Authorization: BSS-V2-006-03A-03

- **HMN authorization ID:** `HMN-BSS-V2-006-03A-03-001`
- **Decision:** `AUTHORIZE_NEXT_CFC`
- **Ticket:** `BSS-V2-006-03A-03`
- **Batch:** `BSS-V2-BATCH-06-03A-03`
- **Reviewed commit:** `c07a80285dd6010d4e2041fce1b176f0b505b248`
- **CK result:** `CHANGES_REQUIRED`
- **Authorized clause:** `CK-001.d` only
- **Protected clauses:** `CK-001.a`, `CK-001.b`, and `CK-001.c` remain resolved and must not be reopened.

The user-supplied HMN decision authorizes exactly one bounded post-CFC
remediation pass and one subsequent independent CK verification for the frozen
post-cooldown domain-pressure mismatch. The implementation must remain within
the existing BSS-006 pressure authority, use a uniquely named forward
migration, add the deterministic post-cooldown regression, preserve route and
independent-domain semantics, and stop for CK after the bounded checkpoint.

This authorization is consumed by the bounded CFC checkpoint for this cycle.
