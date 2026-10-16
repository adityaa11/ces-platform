-- BSS-V2-006-02 already owns the atomic direct pg-boss insert.  pg-boss v12
-- uses a transactionally emitted notification as its low-latency wake hint;
-- direct SQL producers must emit the same hint without adding another broker
-- or scheduler.  The trigger is scoped to the single admitted-work queue.
CREATE OR REPLACE FUNCTION bridge.notify_provider_admitted_execution_job()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify(
    'pgboss_' || left(encode(sha224('pgboss'::bytea), 'hex'), 24),
    'bridge-provider-admitted-execution-v1'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_admitted_execution_notify ON pgboss.job;
CREATE TRIGGER provider_admitted_execution_notify
  AFTER INSERT ON pgboss.job
  FOR EACH ROW WHEN (NEW.name = 'bridge-provider-admitted-execution-v1')
  EXECUTE FUNCTION bridge.notify_provider_admitted_execution_job();

ALTER FUNCTION bridge.notify_provider_admitted_execution_job() OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.notify_provider_admitted_execution_job() FROM PUBLIC,atlas_app;
INSERT INTO atlas.schema_migrations(name) VALUES('0043_bssv200603a_admitted_job_notify') ON CONFLICT DO NOTHING;
