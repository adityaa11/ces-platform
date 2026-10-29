# BSS-QAP-003 R3 retention decision 001

- **Ticket:** `BSS-QAP-003` — R3 physical quota-accounting-policy column removal
- **Decision authority:** explicit user decision
- **Environment boundary:** this workspace's local Docker development environment and local `atlas_dev` PostgreSQL target
- **Decision:** No export or separate retention of `quota_accounting_policy_id` values is required. Immutable migration history is the retained historical evidence.

## Rationale and boundary

The obsolete value has no retained runtime, admission, ledger, snapshot, or
fingerprint role. R3 therefore must not create a backup table, compatibility
field, duplicate value store, resolver, or any other application-visible
retention mechanism. The decision authorizes only the absence of an external
retention export; it does not authorize `0113`, override the R3 evidence gate,
or change historical migrations.

This records Mandatory R3 GO precondition 5 for the declared local-development
boundary. The remaining R3 preconditions and the explicit GO workflow remain
in force.
