# Implementation Task

Requirement: REQ-USER-014
Source Policy Manifest: sha256:c39bf3df838631b6cd3a645af16d29e514ee86bf6b1c94e793d4d74c14cd082d
Adapter: laravel@0.1.0
Mapping version: 0.1.0

## Implementation plan

- [ATOMIC_RESOURCE_REPLACEMENT] Wrap database replacement state in DB::transaction
- [FILE_CONTENT_VERIFICATION] Verify detected MIME content and decode images before acceptance
- [FILE_SIZE_LIMIT] Apply the resolved maximum size in the Form Request file rule
- [INPUT_VALIDATION] Use a Laravel Form Request with explicit validation rules
- [REPLACED_RESOURCE_LIFECYCLE] Dispatch an idempotent queued cleanup job with afterCommit
- [RESOURCE_LEVEL_AUTHORIZATION] Use a Laravel Policy and authorize the target model instance
- [SAFE_IMAGE_DELIVERY] Return the stored image with an explicit safe content type
- [SAFE_LOGGING] Log allowlisted metadata without raw request or file content
- [SERVER_GENERATED_STORAGE_KEY] Generate a trusted storage path and write through Laravel Storage

## Required tests

- [ATOMIC_RESOURCE_REPLACEMENT] PHPUnit integration test proves rollback preserves prior state
- [FILE_CONTENT_VERIFICATION] PHPUnit integration test rejects spoofed file content
- [FILE_SIZE_LIMIT] PHPUnit feature test rejects a file above the resolved limit
- [INPUT_VALIDATION] PHPUnit feature test rejects malformed and missing input
- [REPLACED_RESOURCE_LIFECYCLE] PHPUnit tests prove after-commit dispatch and retry-safe cleanup
- [RESOURCE_LEVEL_AUTHORIZATION] PHPUnit feature tests deny another user's resource
- [SAFE_IMAGE_DELIVERY] PHPUnit feature test asserts safe response media headers
- [SAFE_LOGGING] PHPUnit test proves raw uploaded content is absent from logs
- [SERVER_GENERATED_STORAGE_KEY] PHPUnit test proves client filenames never select storage paths

## Completion

Implement the plan, add the required tests, and retain the declared policy evidence.
