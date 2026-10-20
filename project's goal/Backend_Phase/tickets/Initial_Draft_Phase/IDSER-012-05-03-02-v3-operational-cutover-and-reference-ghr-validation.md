# IDSER-012-05-03-02 — V3 operational cutover and reference-only GHR validation

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-03-01` CK PASS.
- **Parent map:** [IDSER-012-05-03](IDSER-012-05-03-immutable-v3-multimodal-handoff.md).

## Sole scope

Inventory existing operational v1/v2 plans and unfinished work read-only. Obtain explicit operator/HMN cancellation, retirement or replan disposition for any in-flight old work; never silently convert immutable rows. Retire v1/v2 writers, parsers, GHR alternatives and implicit defaults at active boundaries. Enable the existing reference-only GHR receiver to validate immutable v3 plan/handoff membership only; it must neither issue nor deliver a message.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0302-01` | Each in-flight old record has explicit authorized cancellation/retirement/replan disposition; historical immutable rows/hashes remain unchanged and are not translated. |
| `RC-01205-0302-02` | Active v1/v2 writer/parser/GHR paths and implicit v1 defaults are unavailable; v1/v2/mixed inputs fail at active boundaries while v3 text/table planning remains usable. |
| `RC-01205-0302-03` | Reference-only GHR validation accepts only internally consistent immutable v3 plan/handoff membership and does not dispatch, queue or create a production delivery path. |

## Boundaries

No mutation of `-03-01` record schema, runtime SEM resolver, execution grant, hydration, provider transport, BSS admission or new GHR delivery. CFC/HMN is limited to cutover disposition and reference-only validation.
