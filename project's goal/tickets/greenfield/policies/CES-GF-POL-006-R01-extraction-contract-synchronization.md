# CES-GF-POL-006-R01 - Extraction Contract Synchronization

**Status:** Proposed
**Review class:** BATCHABLE
**Depends on:** Accepted Frozen Context v1.1 and POL-002-R01; provisionally consumes POL-003-R01, POL-004-R01, and POL-005-V01

## Outcome

Synchronize the proposed POL-006 extraction acceptance contract with the
accepted source strategy and reconciled upstream interfaces without executing
any extraction operation.

## Scope

- Replace the historical four-source extraction requirement with the exact
  four governed machine inputs.
- Distinguish required CORE extraction from SP 800-53 evaluation extraction.
- Exclude ISO content explicitly.
- Carry accepted NIST and OWASP rights conditions into the execution contract.
- Define the SP 800-53 evaluation evidence categories.
- Keep extraction blocked until every reconciliation and this contract close.

## Acceptance contract

- NIST CSF 2.0, ASVS 5.0.0, and WSTG 4.2 are required CORE inputs.
- SP 800-53 Rev. 5 Release 5.2.0 remains an EVALUATION_SOURCE input.
- Both ISO releases are excluded from all vocabulary extraction.
- POL-005-V01 governed input validation is mandatory.
- Rights, attribution, third-party, geographic, ShareAlike, and
  non-endorsement conditions are preserved.
- SP 800-53 evaluation cannot change source admission automatically.
- No external source content is retrieved or processed by this ticket.
- POL-006 execution remains explicitly blocked pending accepting outcomes.

## Explicit non-goals

- Running extraction or producing raw concepts.
- Downloading source artifacts.
- Canonicalization or source-to-policy mapping.
- Changing source governance, rights authorization, or SP 800-53 status.
- Resuming POL-006 before the batch's real dependencies are accepted.

## Implementation evidence

- The POL-006 ticket names the exact governed inputs and release roles.
- Its acceptance contract carries the complete processing and evaluation
  boundary from Frozen Context v1.1.
- Its execution gate prevents this documentation synchronization from being
  mistaken for extraction authority.

