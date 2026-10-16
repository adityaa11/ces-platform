-- Forward-only closure for BSS-V2-006-03A-01 CK-002.a.
--
-- Migration 0038 introduced the resolver-authorized three-argument binding
-- entrypoint.  Its predecessor's six-argument form still let the Bridge role
-- provide capability, adapter, and qualification identity directly.  Remove
-- that obsolete surface rather than leaving a callable bypass beside the
-- resolver-only entrypoint.
DROP FUNCTION IF EXISTS bridge.bind_provider_work_route(text,integer,text,text,text,text);

INSERT INTO atlas.schema_migrations(name)
  VALUES('0038_bssv200603a_legacy_route_binding_closure')
  ON CONFLICT DO NOTHING;
