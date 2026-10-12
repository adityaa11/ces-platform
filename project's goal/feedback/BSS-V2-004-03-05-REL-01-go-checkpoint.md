# BSS-V2-004-03-05-REL-01 GO checkpoint

- **Ticket:** `BSS-V2-004-03-05-REL-01` — provisional relationship contract and producer
- **Authorization:** `HMN-BSS-V2-004-03-05-REL-005`; explicit user GO continuation for environment recovery and validation
- **State:** `awaiting_review`
- **Implementation commit:** `55dfa87b45b54c24102a3d48543dbf60846405c6`
- **Candidate tree SHA:** `853d3c86842e82ab7b7f675c9d7823ffa2c5e363`
- **Base:** `158eea48df2b259373225b3e1ee6faef476dbc5e`
- **Frozen ticket:** `project's goal/Backend_Phase/relationship-lifecycle-successor-plan/BSS-V2-004-03-05-REL-01-provisional-relationship-contract.md`

The implementation commit changes only the ticket's four permitted paths: additive exports in `packages/atlas-skills/src/index.ts`; new strict envelope/materializer and provenance modules; and the focused test module. The REL-01 repository port remains a port only. Durable adapter/migration and atomic worker composition are explicitly handed to REL-03. No provider, job, reservation, canonical Semantic V1, acceptance, or publication path was added. The legacy extraction schema/compiler and source packet remain unchanged. No lockfile or workspace configuration changed. Existing unrelated staged, modified, and untracked workspace content was left untouched.

## Environment recovery evidence

- Runtime: Node `v24.19.0`; Corepack pnpm `11.19.0`, matching the repository `packageManager` and Node engine.
- Workspace graph: 10 projects. `pnpm-lock.yaml` declares Kysely `0.29.5`; canonical `node_modules/.pnpm/kysely@0.29.5/node_modules/kysely/package.json` existed and was readable. The target manifest through `node_modules/.pnpm/drizzle-orm@0.45.2_kysely@0.29.5_pg@8.23.0_postgres@3.4.7/node_modules/kysely` failed with `EACCES`. `fsutil reparsepoint query` showed it was a relative symlink to the canonical virtual-store package. A second failing relative symlink was `node_modules/.pnpm/tsx@4.21.0/node_modules/esbuild`; its canonical `esbuild@0.27.3` package existed.
- Original-workspace `corepack pnpm --filter @atlas/skills test` failed before test startup with `EACCES` opening the Kysely manifest (pnpm subprocess exit `4294963204`). `corepack pnpm install --frozen-lockfile` verified the lockfile was current, then failed linking bins with `EACCES` reading the esbuild manifest (exit `1`). Evidence supports a damaged local pnpm virtual-store link/install state, not a missing Kysely package or lockfile/workspace defect.
- Recovery: created detached clean checkout `C:\Temp\atlas-rel01-validation` at base `158eea48df2b259373225b3e1ee6faef476dbc5e`, copied only the four candidate paths, then ran `corepack pnpm install --frozen-lockfile`. It exited `0` in 9.8 seconds, reused all 560 lockfile packages, and changed no lockfile. All validation below ran in that checkout using Node `v24.19.0` / pnpm `11.19.0`.
- The legacy prompt test's first run in the clean checkout had 17/18 pass because the checkout's committed `scripts/sem-anm-prompt003/generated/system-prompt.txt` differs from the workspace's protected `assume-unchanged` copy. The committed copy hash was `7FAD8844786B50CD116BD0B6EEC3A8C6E2F7706268513636F2B7DFFA2EE1211C` (32,154 bytes); the existing workspace copy hash was `DA008B14342F9414F6C64FD2315379A82B3B7DCDC4263550D83FD795D6A82ED1` (31,906 bytes). I copied the existing workspace artifact into the isolated checkout for the rerun; the protected original was not changed. The required legacy suite then passed 18/18.

## Validation results

Exact commands and outcomes in `C:\Temp\atlas-rel01-validation` unless stated otherwise:

```text
corepack pnpm install --frozen-lockfile                                      exit 0
corepack pnpm --filter @atlas/contracts typecheck                            exit 0
corepack pnpm --filter @atlas/skills typecheck                               exit 0
corepack pnpm --filter @atlas/contracts test                                 exit 0; 14 passed, 0 failed
corepack pnpm --filter @atlas/skills exec jiti tests/relationship-extraction-envelope.test.ts
                                                                                exit 0; 3 passed, 0 failed
corepack pnpm --filter @atlas/skills test                                    exit 0; 18 passed, 0 failed
corepack pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts exit 0; 18 passed, 0 failed
```

`git diff --cached --check` passed on the exact four-file candidate in the isolated checkout and in the original workspace before commit. `git diff --check HEAD^ HEAD` passed after commit. `git diff --exit-code HEAD -- pnpm-lock.yaml pnpm-workspace.yaml packages/atlas-skills/src/semantic-prompt.ts packages/atlas-skills/src/semantic-source-input-v031.ts packages/atlas-skills/src/semantic-source-packet.ts packages/atlas-contracts` exited `0` in the isolated checkout.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `RC-REL-01-01` | Repeatable immutable `proposed` revisions tied to trusted scope, source and local locators; no authorization. | Focused test `REL-01 materializes deterministic, source-verified proposed revisions without authority` verifies repeat materialization, source/asset locators, scope, ordinal, null confidence/authorization and stable append/stage replay. | PROVEN |
| `RC-REL-01-02` | Strict rejection of malformed/foreign/duplicate/authority-bearing values before append. | Focused rejection test covers unknown field, fenced response, invalid enum, foreign source, wrong evidence pair, dangling candidate, forged predecessor, accepted claim, duplicate proposal/slot, source-SHA mismatch and asset mismatch; asserts append was not called. | PROVEN |
| `RC-REL-01-03` | Provider ordinal/confidence/candidate reference/language remain provenance only; no accepted authority or canonical Semantic V1 output. | Focused positive and boundary tests verify local ordinal, null confidence/authorization, proposed disposition and absence of authority/canonical candidate fields. The materializer has no provider/job/reservation dependency. | PROVEN |
| `RC-REL-01-04` | Append/stage replay is idempotent and materializer performs no provider interaction. | Focused test repeats materialization, append and sidecar staging with identical hashes; duplicate persistence is not created. Type signature accepts only the decoded envelope, trusted identities/provenance and repository port. | PROVEN |

Internal readiness: READY_FOR_CK. This is not a CK `PASS`. CK independently verifies the frozen REL-01 rows and the bounded commit; GO does not begin CK.
