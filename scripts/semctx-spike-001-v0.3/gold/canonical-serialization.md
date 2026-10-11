# Canonical serialization contract

This oracle uses `JCS-UTF8-v1`, defined here without relying on a future planner:

1. Payloads are JSON values. Object member names are ordered by Unicode code point ascending; arrays retain their declared order.
2. A payload is serialized recursively with JSON string escaping, no insignificant whitespace, no trailing newline, decimal JSON numbers only, and UTF-8 encoding.
3. Request payload object keys are exactly `context`, `document`, `owned`, `profile_id`, and `simulation`; this alphabetical order follows rule 1. `document` keys are `scope` then `sha256`; slot keys are `content`, `id`, `kind`, `locator`, `role`.
4. `content` is the source `text`, expanded by exact string repetition when `repeat` is present. Context slots use `role: "essential_context"`; the sole owned slot uses `role: "owner"`. Context slots are sorted by source ID.
5. SHA-256 hashes are lowercase hexadecimal digests of canonical UTF-8 bytes. Byte counts are `Buffer.byteLength(canonical_payload, "utf8")`.

No alternate serializer, pretty-printing, source-input order, omitted empty `context`, or whitespace normalization is permitted.
