# SEMSPIKE-006 provider-wire `anyOf` remediation

- **Scope:** offline-only provider-wire compatibility remediation after the
  `SEMSPIKE-006 @ c31a757` pre-semantic Groq rejection.
- **Provider calls made:** `0`
- **Authority:** direct human authorization; no live qualification was run.
- **Internal readiness:** `READY_FOR_CK`

## Confirmed rejection shape

The rejected emitted provider schema had a nested union at
`#/properties/propositions/items/properties/qualifiers/properties/modality`:
the nullable modality wrapper had an `anyOf` branch that was itself an
`anyOf`. Its possibility leaf then represented `appliesTo` as a nullable base
modality union. The provider diagnostic path resolves through that wrapper to
`...modality.anyOf[0].anyOf[1].properties.appliesTo.anyOf`.

This is the exact structural cause reported by Groq: an `anyOf` variant was an
anonymous union wrapper, not an independently closed object or `null` leaf.

## Correction and audit

The provider-wire schema now builds modality directly from its four base leaf
object variants, the possibility object, and `null`. `appliesTo` is likewise
the four base leaf objects plus `null`. The resulting paths are:

- `modality`: six direct branches — four base modalities, possibility, null.
- `modality.anyOf[4].appliesTo`: five direct branches — four base modalities,
  null.

The remaining `anyOf` paths are argument, modality, possibility `appliesTo`,
quantity, and nullable state. All were audited: no `anyOf` branch contains a
nested `anyOf` wrapper. Every reachable object branch is closed and requires
all declared properties.

Nullable primitive provider fields (`discourseRole`, quantity `unit`, and state
`from`) are emitted as `type: ["string", "null"]`; enum nullability retains
`null` in its enum. No Atlas Semantic IR schema or semantic normalization rule
changed: the wire normalizer only removes wire nulls before the unchanged Atlas
parse.

## Strengthened offline proof

`check-semir-006-provider-wire.mjs` now rejects a closed-object schema whose
`appliesTo` `anyOf` contains a nested anonymous `anyOf` wrapper at
`#/properties/appliesTo/anyOf/0`. The same run validates every reachable
`properties`, `items`, `anyOf`, `$defs`, and local `$ref` target and reports all
violations rather than stopping at one.

| Required evidence | Command | Outcome |
| --- | --- | --- |
| SEMIR-001 corpus | `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` | PASS — 43 frozen cases |
| SEMIR-002 schema | `node scripts/semantic-ir-v0/check-semir-002-schema.mjs` | PASS |
| SEMIR-003 oracle | `node scripts/semantic-ir-v0/check-semir-003-oracle.mjs` | PASS — 43 known-good fixtures; 19 semantic and 3 accounting mutations rejected |
| SEMIR-004 harness | `pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts` | PASS — 43 parsed fixtures; 19 semantic and 3 accounting mutations rejected |
| Groq provider wire | `node scripts/semantic-ir-v0/check-semir-006-provider-wire.mjs` | PASS — 42 objects, zero compatibility violations |
| Diff hygiene | `git diff --check` | PASS |

Round-trip assertions prove plain possibility, `possibility(obligation)`,
permission, prohibition, recommendation, and ordinary assertion modality
absence. All validation was offline; no `run-semspike-006.mts` invocation,
authenticated request, provider diagnostic, or live qualification occurred.
