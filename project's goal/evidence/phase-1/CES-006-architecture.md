# Adapter SDK evolution boundary

The Phase 1 Adapter SDK treats each adapter as one complete, explicitly registered unit. Its versioned metadata, mappings, compatibility declarations, and derived-output schemas are separate from the stack-agnostic Policy Manifest contract.

A future SDK schema version may add component kinds, component compatibility metadata, and composition provenance to adapter metadata and adapter-derived output headers. Resolution of those components would occur before the existing manifest-to-mapping preflight. The selected composition would still consume the same Policy Manifest obligations and could not add, remove, weaken, or rewrite them.

This evolution requires a deliberate Adapter SDK schema migration. It does not require component fields in the Policy Manifest, changes to requirement facts, or framework knowledge in core policy resolution. Phase 1 intentionally contains no component dependency solver, downloading, marketplace, approval, profile expansion, or generic production fallback.
