import Ajv from "ajv/dist/ajv.js";

type Validator = ((value: unknown) => boolean) & { readonly errors?: unknown };
type AjvInstance = { compile(schema: object): Validator; errorsText(errors: unknown): string };
const AjvConstructor = Ajv as unknown as new (options: { readonly allErrors: boolean; readonly strict: boolean }) => AjvInstance;

export type JsonValue = null | boolean | number | string | JsonValue[] | { readonly [key: string]: JsonValue };

export type ExecutionRequest = {
  readonly version: "v1";
  readonly executionId: string;
  readonly mode: "interactive" | "background";
  readonly skill: { readonly id: string; readonly version: string };
  readonly input: { readonly [key: string]: JsonValue };
  readonly context: { readonly boundary: string; readonly items: readonly JsonValue[] };
};

export type ExecutionEvent =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "complete" }
  | { readonly type: "error"; readonly message: string };

export interface ReasoningRuntime {
  execute(request: ExecutionRequest, options: { readonly signal: AbortSignal }): AsyncIterable<ExecutionEvent>;
}

export const executionRequestSchema = {
  $id: "https://atlas.local/contracts/execution-request-v1.json",
  type: "object",
  additionalProperties: false,
  required: ["version", "executionId", "mode", "skill", "input", "context"],
  properties: {
    version: { const: "v1" },
    executionId: { type: "string", minLength: 1, maxLength: 200 },
    mode: { enum: ["interactive", "background"] },
    skill: {
      type: "object", additionalProperties: false, required: ["id", "version"],
      properties: { id: { type: "string", minLength: 1, maxLength: 200 }, version: { type: "string", minLength: 1, maxLength: 100 } }
    },
    input: { type: "object", additionalProperties: true },
    context: {
      type: "object", additionalProperties: false, required: ["boundary", "items"],
      properties: { boundary: { type: "string", minLength: 1, maxLength: 200 }, items: { type: "array", maxItems: 1000 } }
    }
  }
} as const;

const ajv = new AjvConstructor({ allErrors: true, strict: false });
const validate = ajv.compile(executionRequestSchema);

export function parseExecutionRequest(value: unknown): ExecutionRequest {
  if (!validate(value)) throw new Error(`Invalid execution request: ${ajv.errorsText(validate.errors)}`);
  return value as ExecutionRequest;
}
