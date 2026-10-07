import { PgBoss } from "pg-boss";
import { initializePgBossInfrastructure } from "./worker.js";
import { loadWorkerConfig } from "./worker-config.js";

// This runs as agents_bridge, the same role that owns pg-boss in production.
// It creates no application authority: it only initializes pg-boss and grants
// Atlas the precise queue access it needs for transactional enqueueing.
const config = loadWorkerConfig();
const boss = new PgBoss({
  connectionString: config.databaseUrl,
  schema: "pgboss",
  application_name: "agents-bridge-pgboss-bootstrap",
  max: 2,
  schedule: false,
  migrate: true,
  createSchema: false,
});

try {
  await boss.start();
  await initializePgBossInfrastructure(boss, config);
  console.log("Bridge pg-boss bootstrap completed");
} finally {
  await boss.stop({ graceful: false }).catch(() => undefined);
}
