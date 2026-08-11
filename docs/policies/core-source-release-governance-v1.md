# CES Policies v1 Core Source Release Governance

**Checked:** 2026-08-11
**Scope:** Release metadata only; no source vocabulary is extracted here.

## Pinned releases

| Family | Pinned release | Official evidence |
|---|---|---|
| ISO/IEC 27001 | ISO/IEC 27001:2022, Edition 3, with Amendment 1:2024 | [Base standard](https://www.iso.org/standard/27001), [Amendment](https://www.iso.org/standard/88435.html) |
| ISO/IEC 27002 | ISO/IEC 27002:2022, Edition 3 | [ISO release page](https://www.iso.org/standard/75652.html) |
| OWASP ASVS | 5.0.0, tag `v5.0.0_release`, commit `5cf9b03` | [OWASP project](https://owasp.org/www-project-application-security-verification-standard/), [versioned release](https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release) |
| OWASP WSTG | 4.2 | [OWASP project](https://owasp.org/www-project-web-security-testing-guide/), [versioned release](https://owasp.org/www-project-web-security-testing-guide/v42/) |

The seed hashes cover the exact normalized `verified_metadata` strings stored
with each seed. They do not claim to hash a licensed ISO publication or a full
OWASP release artifact.

## Access constraints

ISO states that its publications and materials are copyright-protected and
that use with AI or similar technologies requires permission except where its
Open Data terms apply. CES therefore stores only release metadata at this
stage. POL-006 must not process ISO publication content until the project has a
licensed copy and written permission explicitly allowing the intended use.

OWASP ASVS and WSTG are published under Creative Commons
Attribution-ShareAlike 4.0. Later extraction must retain source/release
identity, attribution, and applicable ShareAlike obligations.

## Governance consequence

These records pin identity and update-check provenance only. They do not place
source text, source vocabulary, canonical CES concepts, or policies into the
runtime baseline. A newly detected release becomes an update candidate and
cannot mutate these records automatically.
