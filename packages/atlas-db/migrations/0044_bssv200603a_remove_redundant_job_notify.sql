-- pg-boss v12 polling is the durable delivery floor for the admitted queue.
-- The previous direct-SQL trigger emitted a notification even though this
-- queue does not opt into pg-boss notifications and the Bridge worker does
-- not enable a LISTEN/NOTIFY listener. Remove that redundant hint
-- forward-only; it was never a delivery dependency.
DROP TRIGGER IF EXISTS provider_admitted_execution_notify ON pgboss.job;
DROP FUNCTION IF EXISTS bridge.notify_provider_admitted_execution_job();

INSERT INTO atlas.schema_migrations(name) VALUES('0044_bssv200603a_remove_redundant_job_notify') ON CONFLICT DO NOTHING;
