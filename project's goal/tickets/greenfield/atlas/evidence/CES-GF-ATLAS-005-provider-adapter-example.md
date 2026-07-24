# ATLAS-005 CES-Compatible Provider Adapter

`HttpAtlasProvider` sends an HTTPS `POST` request with:

```json
{
  "contract": "1.0.0",
  "model": "configured-model",
  "request": {
    "schema_version": "1.0.0",
    "prompt_contract_version": "1.0.0",
    "source_documents": [],
    "project_intent": {}
  }
}
```

When `CES_ATLAS_API_KEY` is set, it is sent as a bearer authorization header.
It is not included in the JSON body, run manifest, hashes, or artifacts.

The adapter endpoint is responsible for:

1. authenticating the inbound request;
2. building provider-specific system and user messages from `request`;
3. requiring structured output that matches `AtlasProviderResult`;
4. converting the model API response into the CES contract;
5. returning that object as the HTTPS response body.

The returned body has this root shape:

```json
{
  "schema_version": "1.0.0",
  "candidate_requirements": [],
  "candidate_business_rules": [],
  "uncertainties": [],
  "conflicts": [],
  "clarification_questions": []
}
```

The endpoint must not return approved, confirmed, derived, or observed
candidates. Provider/model/prompt metadata supplied by the endpoint is ignored
and replaced by trusted CLI configuration.

The adapter sends only normalized source documents. Original PDF bytes are not
part of the provider request. Provider-specific response IDs, token counts,
reasoning fields, safety metadata, and prose must be removed before returning
the strict CES result.

Illustrative endpoint flow:

```ts
const envelope = validateCesEnvelope(await request.json());
const modelResponse = await callModel({
  model: envelope.model,
  instructions: atlasPrompt(envelope.request.prompt_contract_version),
  input: envelope.request,
  responseSchema: atlasProviderJsonSchema,
});
const result = convertModelResponse(modelResponse);
return Response.json(validateAtlasProviderResult(result));
```

The actual schema validator should import the version-pinned
`AtlasProviderResultSchema` from `@company/ces-agent-provider-sdk`. Do not copy a
provider's unvalidated JSON directly into the response.

