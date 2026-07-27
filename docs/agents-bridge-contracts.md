# CES Agents Bridge Contract Boundary

This document records the AGB-001 trust boundary implemented by
`@company/ces-agents-bridge`. The authoritative product direction remains
[CES Agents Bridge Architecture](<../project's goal/CES_AGENTS_BRIDGE_ARCHITECTURE.md>).

## Boundary

```text
untrusted caller
  → authenticated client identity
  → route and agent authorization
  → strict generic or compatibility request
  → registered agent and policy
  → controlled model alias
  → registered provider
  → validated intermediate result
  → agent-owned trusted transformation
  → validated workflow result
```

Caller credentials authenticate bridge clients. Provider credentials belong to
provider implementations and are deliberately absent from all AGB-001 public
contracts. An agent receives validated input and execution context, not
provider credentials. A provider receives a provider-neutral request and
execution context, not Atlas contracts.

The canonical route is `POST /v1/agents/:agentId/execute`.
`POST /v1/atlas/analyze` is a compatibility route for the existing Atlas SDK
and must delegate through the same registered-agent executor in AGB-002.

## Contract ownership

| Boundary | Owns | Must not accept or own |
|---|---|---|
| Caller | Agent version, agent input, bounded request ID | Prompt, provider URL, credential, physical model, response schema, tools |
| Shared bridge | Authentication, authorization, registries, model aliases, ceilings, errors | Workflow semantics or provider credentials |
| Agent | Input/intermediate/output schemas, prompt, policy, transformation, review requirement | Provider transport or credentials |
| Provider | Transport translation, completion handling, retry classification, usage | Atlas schemas, provenance, IDs, review rules |

Only the mode-specific structured-generation definition is executable. Future
mode names are reserved but have no partial lifecycle contract.

## Registry validation

Startup validation rejects:

- duplicate agent ID/version pairs;
- duplicate provider IDs and model aliases;
- malformed identifiers and versions;
- unresolved providers, aliases, or tools;
- aliases resolving to providers disallowed by an agent;
- providers without structured-output capability;
- an Atlas extraction policy without mandatory human review;
- policies exceeding service ceilings.

Registration is explicit and in-process. There is no dynamic package download
or caller-controlled registration.

## Atlas deterministic identity

Atlas normalization validates source documents and line bounds, orders
candidates using original document position and explicit location rules,
normalizes semantic text, and uses a canonical semantic SHA-256 tie-breaker.
Temporary model IDs are removed before business-rule ordering. Trusted source
paths, hashes, provider identity, model identity, and prompt-contract version
come from the Atlas request and execution context.

Sequential candidate and result IDs are deterministic for the same normalized
intermediate result. They are run-local and can change when source position,
candidate content, or candidate membership changes.

Unknown sources, duplicate semantic candidates, duplicate temporary IDs,
out-of-bounds locations, and dangling references fail closed.

## Error and diagnostic boundary

The shared error schema contains a known code, bounded message, and optional
bounded request ID. It has no arbitrary details or provider body field.
Logging, HTTP handling, and credential loading are AGB-002/003 concerns and
must retain this bounded boundary.

