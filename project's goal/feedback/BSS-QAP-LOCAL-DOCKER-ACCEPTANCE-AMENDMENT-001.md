# BSS-QAP local Docker acceptance-boundary amendment 001

- **Planning authority:** explicit user-directed bounded contract amendment
- **Applies to:** `BSS-QAP-002` R2 and `BSS-QAP-003` R3
- **Environment boundary:** this workspace's local Docker development
  environment and its local `atlas_dev` PostgreSQL instance only
- **Historical CK artifact:**
  `project's goal/feedback/BSS-QAP-BATCH-02-42180069-review.md`
- **Historical CFC progress:**
  `project's goal/feedback/BSS-QAP-BATCH-02-42180069-cfc-progress.md`
- **Authority-conflict diagnosis:**
  `project's goal/feedback/BSS-QAP-002-hmn-001-local-docker-authority-conflict.md`
- **Status:** planning amendment only — not a GO, CK result, CFC authorization,
  release authorization, or R3 authorization.

## Reason and historical preservation

The previously frozen R2 oracle in `CK-001.a` requires production-wide
release, rollout, retirement, and external-integration records. The confirmed
environment has no separately operated staging or production deployment. That
oracle is therefore historically correct for its original environment but is
not the applicable evidence boundary for this development-only workspace.

`CK-001.a` remains historically `UNRESOLVED` and must not be rewritten or
marked `PASS`. The existing CFC progress artifact remains evidence of the
missing production-wide records. A subsequent CK rebaseline/replacement freeze
must preserve that outcome and create distinct replacement clause IDs before a
later, explicitly authorized evidence-remediation CFC cycle may use this
amendment. This amendment itself authorizes neither CFC nor R3.

## Exact supersession

Only the following evidence portions are superseded for the stated local
development environment:

| Historical requirement | Local replacement | Preserved obligations |
| --- | --- | --- |
| `BSS-QAP-002` `RC-QAP-002-04` requirement for deployed production/staging revisions, production rollout monitoring, and external-estate records. | A complete local Docker and host-writer inventory, local image/source verification, local `atlas_dev` connection evidence, and the R2 repository/regression proof below. | ID-free writers, no dummy/default ID, no `0113` registration, and every R2 code/regression obligation. |
| `BSS-QAP-003` Mandatory R3 GO precondition 2's target release inventory and production-wide writer proof. | The local-writer retirement gate below, tied to the exact local Docker environment and `atlas_dev` target. | All other R3 preconditions, target catalog/lock safety, regressions, fresh/upgrade convergence, retention decision, and explicit R3 GO. |

No other R2/R3 requirement, existing proven review row, migration boundary, or
forbidden-work list is weakened or superseded.

## Replacement R2 local-Docker acceptance boundary

Independent CK may accept the replacement R2 deployment-evidence clause only
when all of the following are recorded for the exact workspace revision:

1. The committed ID-free TypeScript and SQL-fixture implementation is the
   reviewed R2 implementation, with the allowlisted repository writer search
   recorded.
2. The ticket-required parser, publisher, convergence, admission, and snapshot
   regressions pass against the local R1-compatible database.
3. `docker compose config --services` identifies the current local Compose
   service set, and a full running-and-stopped container inventory accounts for
   every container whose Compose working-directory label is this workspace.
4. Every local writer-capable application, worker, job/bootstrapper, and
   migration-executor artifact is either verified ID-free or explicitly absent.
   A stopped container with an unverified or legacy image is a failure, not an
   exclusion.
5. For each verified artifact, its image ID is recorded and either its mounted
   workspace source or its filesystem payload passes the allowlisted writer
   search. An image ID alone is not proof.
6. The local PostgreSQL target is `atlas_dev`; the local configuration and
   live connection inventory identify every client that can connect to it. An
   unclassified client or external integration is a failure.
7. The executable migration inventory proves that `0113` is unregistered and
   unexecuted. No production/staging rollout manifest or production monitoring
   is required because such environments are out of scope for this amendment.

## Replacement R3 local-writer retirement gate

Before any R3 GO, the future R3 checkpoint must record all of the following;
absence of any item is a local R3 NO-GO:

1. An inventory of all current and stopped Docker containers whose Compose
   working-directory label is this workspace, plus the current Compose service
   configuration.
2. The image ID, state, restart policy, Compose service, and source-mount
   status for every local application, worker, bootstrap/job, and migration
   executor.
3. Proof that each stopped or restartable writer-capable artifact is verified
   ID-free, or is absent. No unverified legacy container/job may reconnect to
   `atlas_dev`.
4. A host-side inventory of repository scripts, scheduled tasks, and processes
   with a local PostgreSQL connection path.
5. An environment-scoped declaration identifying each external database
   integration, or declaring none, supported by redacted configuration evidence
   and the live `atlas_dev` connection inventory. A remote or unclassified
   client is a NO-GO.
6. The existing target PostgreSQL catalog/dependency and lock-safety preflight,
   executed against local `atlas_dev` immediately before DDL.
7. The existing R2 regression matrix and the R3 disposable fresh-database and
   R2-complete upgrade migration tests, all passing for the exact intended R3
   revision.

These local checks prove only the declared local-development boundary. They do
not make claims about uninspected external systems.

## Exact local Docker verification commands

Run from the repository root. Store only the selected fields below; do not
archive Compose environment values, database URLs, API keys, or other secrets.

```powershell
$evidenceRoot = "project's goal/feedback/evidence/BSS-QAP-local-docker"
New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
git rev-parse HEAD | Set-Content "$evidenceRoot/revision.txt"
docker compose config --services | Set-Content "$evidenceRoot/compose-services.txt"
docker compose config --images | Set-Content "$evidenceRoot/compose-images.txt"
```

```powershell
$workspaceRoot = (Resolve-Path .).Path
$containers = foreach ($containerId in (docker ps -aq)) {
  $container = (docker inspect $containerId | ConvertFrom-Json)[0]
  if ($container.Config.Labels.'com.docker.compose.project.working_dir' -eq $workspaceRoot) {
    [pscustomobject]@{
      Id = $container.Id
      Name = $container.Name
      Image = $container.Image
      ImageName = $container.Config.Image
      Service = $container.Config.Labels.'com.docker.compose.service'
      Project = $container.Config.Labels.'com.docker.compose.project'
      State = $container.State.Status
      RestartPolicy = $container.HostConfig.RestartPolicy.Name
      SourceMounts = @($container.Mounts | Where-Object Type -eq 'bind' | ForEach-Object Source)
    }
  }
}
$containers | Sort-Object Name | ConvertTo-Json -Depth 4 | Set-Content "$evidenceRoot/workspace-container-inventory.json"
$containers | Format-Table -AutoSize
```

For every `atlas`, `agents-bridge`, `agents-bridge-worker`,
`agents-bridge-pgboss-bootstrap`, or `atlas-migrate` entry in that inventory,
record the image ID and inspect its writer payload without starting it or
connecting it to a database. Replace `<image-id>` with the recorded ID. The
command succeeds only if all matches are in the immutable history/R1 allowlist.

```powershell
docker run --rm --network none --read-only --entrypoint sh <image-id> -lc '
  cd /workspace || exit 1
  matches=$(grep -R -n -E "quota_accounting_policy_id|quotaAccountingPolicy(Id|Ids)|anoman-quota-tokens-v1" apps packages scripts --exclude="*.tsbuildinfo" || true)
  printf "%s\\n" "$matches"
  unexpected=$(printf "%s\\n" "$matches" | grep -v -E "^packages/atlas-db/migrations/(0023|0028|0067|0076|0078|0091|0112)_" || true)
  test -z "$unexpected"
'
```

For the host-side and local connection inventory, record selected fields only:

```powershell
Get-ScheduledTask | Where-Object State -ne 'Disabled' |
  Select-Object TaskName, TaskPath, State | Sort-Object TaskPath, TaskName |
  Format-Table -AutoSize | Out-File "$evidenceRoot/scheduled-task-inventory.txt"

Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess |
  Format-Table -AutoSize | Out-File "$evidenceRoot/postgres-host-connections.txt"

rg -n --glob '!*.tsbuildinfo' --glob "!project's goal/**" 'postgres(ql)?://|DATABASE_URL|ATLAS_DATABASE_URL|AGENTS_BRIDGE_DATABASE_URL|5432' apps packages scripts docker-compose.yml .env.example |
  Out-File "$evidenceRoot/local-connection-config-search.txt"

docker exec ces-platform-postgres-1 psql -U postgres -d atlas_dev -P pager=off -c @'
SELECT pid, usename, application_name, client_addr, state, backend_type
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY backend_type, usename, application_name, pid;
'@ | Out-File "$evidenceRoot/atlas-dev-active-connections.txt"
```

The named PostgreSQL container must first be confirmed from the container
inventory; substitute its recorded name if it differs. The resulting evidence
must classify each non-local connection. A remote, unknown, or unclassified
client causes `BLOCKED — UNVERIFIED LOCAL WRITER OR EXTERNAL CONNECTION`.

For the R2/R3 migration boundary, record:

```powershell
rg -n '0113_bssv2_quota_accounting_policy_removal|0113' packages/atlas-db/scripts packages/atlas-db/migrations
docker exec ces-platform-postgres-1 psql -U postgres -d atlas_dev -P pager=off -c @'
SELECT migration_name
FROM atlas.schema_migrations
WHERE migration_name LIKE '0113%';
'@
```

The first command must show no runner registration and the second must return
zero rows before R3 GO. These commands are evidence collection only: they do
not reset Docker volumes, start services, execute `0113`, or alter `atlas_dev`.

## Required rebaseline sequence

1. CK validates this planning amendment and writes an append-only replacement
   closure matrix with new replacement clause IDs. It maps the superseded
   portion of historical `CK-001.a` and leaves all historical statuses visible.
2. A fresh, explicit user `hmn` invocation may then authorize only unresolved
   replacement clause IDs for one evidence-remediation CFC pass.
3. CFC records the local evidence against that frozen replacement oracle and
   hands off one bounded checkpoint to CK. CK alone may decide `PASS`.
4. R3 remains `planned` until its amended local-writer retirement gate and all
   unchanged R3 preconditions are independently proven.

## Restrictions retained

- Do not reset Docker volumes or `atlas_dev`.
- Do not modify or execute migrations `0112` or `0113` under this amendment.
- Do not perform physical-column removal, introduce deployment infrastructure,
  or change unrelated runtime behavior.
- Do not self-approve CK, authorize R3, or silently change historical CK/CFC
  evidence.
