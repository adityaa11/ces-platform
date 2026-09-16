import Ajv from "ajv/dist/ajv.js";

type Validator = ((value: unknown) => boolean) & { readonly errors?: unknown };
type AjvInstance = { compile(schema: object): Validator; errorsText(errors: unknown): string };
const AjvConstructor = Ajv as unknown as new (options: { readonly allErrors: boolean; readonly strict: boolean }) => AjvInstance;

export const documentPerceptionContractVersion = "v1" as const;

export type DocumentPerceptionRequest = {
  readonly version: typeof documentPerceptionContractVersion;
  readonly executionId: string;
  readonly artifact: { readonly id: string; readonly mimeType: "application/pdf"; readonly byteSize: number; readonly sourceSha256: string };
  readonly source: { readonly grant: string };
  readonly perception: { readonly capability: "atlas.document.perceive"; readonly contractVersion: typeof documentPerceptionContractVersion };
};

export type BoundingBox = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
export type NormalizedDocument = {
  readonly version: typeof documentPerceptionContractVersion;
  readonly executionId: string;
  readonly artifactId: string;
  readonly sourceSha256: string;
  readonly perception: { readonly capability: "atlas.document.perceive"; readonly contractVersion: typeof documentPerceptionContractVersion };
  readonly provider: { readonly name: string; readonly processor: string; readonly executionId: string; readonly processedAt: string };
  readonly pages: readonly {
    readonly number: number;
    readonly width?: number;
    readonly height?: number;
    readonly textBlocks: readonly { readonly id: string; readonly text: string; readonly kind?: string; readonly boundingBox?: BoundingBox; readonly confidence?: number }[];
    readonly tables: readonly { readonly id: string; readonly content: string; readonly boundingBox?: BoundingBox }[];
    readonly visualRegions: readonly { readonly id: string; readonly label?: string; readonly boundingBox?: BoundingBox; readonly assetRef?: string }[];
  }[];
};

const sha256 = "^[a-f0-9]{64}$";
const boundedString = (maxLength: number) => ({ type: "string", minLength: 1, maxLength });
const opaqueGrant = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.[A-Za-z0-9_-]{43}$";
const opaqueIdentifier = "^(?![A-Za-z]:[\\\\/])(?!/)(?!file:)[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$";
const boundingBox = { type: "object", additionalProperties: false, required: ["x", "y", "width", "height"], properties: { x: { type: "number", minimum: 0 }, y: { type: "number", minimum: 0 }, width: { type: "number", exclusiveMinimum: 0 }, height: { type: "number", exclusiveMinimum: 0 } } } as const;

export const documentPerceptionRequestSchema = {
  type: "object", additionalProperties: false, required: ["version", "executionId", "artifact", "source", "perception"], properties: {
    version: { const: documentPerceptionContractVersion }, executionId: boundedString(200),
    artifact: { type: "object", additionalProperties: false, required: ["id", "mimeType", "byteSize", "sourceSha256"], properties: { id: { ...boundedString(200), pattern: opaqueIdentifier }, mimeType: { const: "application/pdf" }, byteSize: { type: "integer", minimum: 1, maximum: 20 * 1024 * 1024 }, sourceSha256: { type: "string", pattern: sha256 } } },
    source: { type: "object", additionalProperties: false, required: ["grant"], properties: { grant: { type: "string", pattern: opaqueGrant } } },
    perception: { type: "object", additionalProperties: false, required: ["capability", "contractVersion"], properties: { capability: { const: "atlas.document.perceive" }, contractVersion: { const: documentPerceptionContractVersion } } },
  },
} as const;

export const normalizedDocumentSchema = {
  type: "object", additionalProperties: false, required: ["version", "executionId", "artifactId", "sourceSha256", "perception", "provider", "pages"], properties: {
    version: { const: documentPerceptionContractVersion }, executionId: boundedString(200), artifactId: boundedString(200), sourceSha256: { type: "string", pattern: sha256 },
    perception: { type: "object", additionalProperties: false, required: ["capability", "contractVersion"], properties: { capability: { const: "atlas.document.perceive" }, contractVersion: { const: documentPerceptionContractVersion } } },
    provider: { type: "object", additionalProperties: false, required: ["name", "processor", "executionId", "processedAt"], properties: { name: boundedString(100), processor: boundedString(200), executionId: boundedString(200), processedAt: { type: "string", minLength: 20, maxLength: 40, pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T" } } },
    pages: { type: "array", minItems: 1, maxItems: 10000, items: { type: "object", additionalProperties: false, required: ["number", "textBlocks", "tables", "visualRegions"], properties: {
      number: { type: "integer", minimum: 1 }, width: { type: "number", exclusiveMinimum: 0 }, height: { type: "number", exclusiveMinimum: 0 },
      textBlocks: { type: "array", maxItems: 100000, items: { type: "object", additionalProperties: false, required: ["id", "text"], properties: { id: boundedString(200), text: { type: "string", maxLength: 1_000_000 }, kind: boundedString(100), boundingBox, confidence: { type: "number", minimum: 0, maximum: 1 } } } },
      tables: { type: "array", maxItems: 10000, items: { type: "object", additionalProperties: false, required: ["id", "content"], properties: { id: boundedString(200), content: { type: "string", maxLength: 1_000_000 }, boundingBox } } },
      visualRegions: { type: "array", maxItems: 100000, items: { type: "object", additionalProperties: false, required: ["id"], properties: { id: boundedString(200), label: boundedString(1000), boundingBox, assetRef: { type: "string", minLength: 1, maxLength: 500, pattern: "^derived/" } } } },
    } } },
  },
} as const;

const ajv = new AjvConstructor({ allErrors: true, strict: false });
const validateRequest = ajv.compile(documentPerceptionRequestSchema);
const validateNormalized = ajv.compile(normalizedDocumentSchema);

function parse<T>(validator: Validator, value: unknown, label: string): T {
  if (!validator(value)) throw new Error(`Invalid ${label}: ${ajv.errorsText(validator.errors)}`);
  return value as T;
}

export function parseDocumentPerceptionRequest(value: unknown): DocumentPerceptionRequest { return parse<DocumentPerceptionRequest>(validateRequest, value, "document perception request"); }
export function parseNormalizedDocument(value: unknown): NormalizedDocument { return parse<NormalizedDocument>(validateNormalized, value, "normalized document"); }
