# Safara CES Policy Cycle 01

This directory contains the proposed human-reconciled demand-side fixture for
the first CES Policy knowledge-evolution cycle.

It is deliberately outside Atlas runtime data. `manual-facts.json` is not an
Atlas fact bundle and must never be assigned an Atlas revision or approval
identity. It becomes accepted cycle input only when `human-review-record.json`
pins its exact hash with an accepting review decision.

The fixture may be used to test coverage and discover reusable, source-backed
CES knowledge gaps. It cannot produce production Context Bindings or close
POL-016-V01 without later reconciliation to approved Atlas facts.

