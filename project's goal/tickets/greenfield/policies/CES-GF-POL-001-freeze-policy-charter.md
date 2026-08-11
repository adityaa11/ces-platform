# CES-GF-POL-001 - Freeze Policy Charter

**Status:** Accepted
**Depends on:** None

## Outcome

Adopt the frozen CES Policies v1 context as the authoritative boundary for all
subsequent Policies work.

## Scope

- Record the purpose, WHAT-not-HOW boundary, four core source families,
  Atlas/Policies boundary, agent boundary, and bounded review protocol.
- Identify decisions that are frozen and those intentionally left open.
- Establish the P01-P17 delivery order.

## Acceptance contract

- The ASCII frozen-context document is readable without non-ASCII characters.
- It names exactly ISO/IEC 27001, ISO/IEC 27002, OWASP ASVS, and OWASP WSTG as
  v1 core source families.
- It prohibits implementation prescriptions and silent baseline mutation.
- It requires concrete Atlas fact binding and deterministic validation.
- It defines terminal, bounded review outcomes.

## Explicit non-goals

- Defining schemas, policy IDs, source editions, mappings, prompts, UI, or
  implementation technology.
- Implementing any runtime behavior.

## Acceptance evidence

- Commit `7271cc9` introduced the bounded P01-P17 ticket sequence.
- Commit `04e66e7` committed the stable authoritative ASCII context and closed
  the two Round 1 findings.
- Round 2 result: `ACCEPTED`.
