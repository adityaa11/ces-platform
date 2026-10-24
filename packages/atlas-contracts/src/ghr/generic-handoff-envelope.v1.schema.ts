import { createHash } from "node:crypto";
import { z } from "zod";

export type GenericHandoffJsonValue = null | boolean | number | string | readonly GenericHandoffJsonValue[] | { readonly [key: string]: GenericHandoffJsonValue };
export type GenericHandoffJsonObject = { readonly [key: string]: GenericHandoffJsonValue };

export const genericHandoffIngressLimits = {
  envelopeBytes: 75_776,
  headerBytes: 8_192,
  bodyBytes: 65_536,
  maxDepth: 16,
  maxObjectProperties: 128,
  maxArrayElements: 256,
} as const;

const identity = z.string().min(1).max(200);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const ghrHeaderV1Schema = z.strictObject({
  protocol: z.literal("GenericHandoffEnvelope/v1").describe("Exact GHR protocol/version for the fixed header and routed-body wrapper; written by a trusted Atlas issuer and never an authorization result from caller JSON."),
  handoffId: identity.describe("Immutable trusted-issuer handoff identity for lookup, delivery, retries, and acknowledgement; it is never regenerated on retry."),
  idempotencyKey: identity.describe("Trusted logical transition-publication identity; reusing it with different bytes, mode, or pins is a conflict rather than an overwrite."),
  producer: z.strictObject({
    processKey: identity.describe("Issuer-authenticated originating process key used by later route authorization; incoming JSON does not establish this identity."),
    executionId: identity.describe("Exact accepted Atlas producer execution identity, distinct from the handoff and idempotency identities."),
  }).describe("Trusted producer identity derived from persisted accepted facts and service context, not caller authority."),
  route: z.strictObject({
    main: z.enum(["semantic", "reconciliation", "projection"]).describe("Issuer-authorized top-level Atlas business-process selector, never a provider or BSS route."),
    branch: identity.describe("Exact issuer-authorized child branch name with no wildcard or fallback selection."),
    policyVersion: identity.describe("Immutable trusted producer-to-receiver transition-policy revision selected at issuance."),
    handlerVersion: identity.describe("Immutable trusted receiving-handler pin; retry must not silently select a newer handler."),
  }).describe("Issuer-authorized main/branch routing with immutable policy and handler pins."),
  bodyContract: z.strictObject({
    type: identity.describe("Receiver-owned payload type discriminator; it selects a future payload parser but generic GHR never parses business fields."),
    version: identity.describe("Exact receiver-owned payload schema version, independent from the GHR envelope protocol."),
  }).describe("Registered type/version boundary for opaque body.payload rather than a generic-payload parser."),
  scope: z.strictObject({
    projectId: identity.describe("Issuer-derived project ownership boundary from accepted source facts; receivers recheck when redemption is implemented."),
    workspaceId: identity.describe("Issuer-derived workspace ownership boundary preventing cross-workspace reference mixing at redemption."),
    bundleId: identity.optional().describe("Optional generic issuer-derived bundle identity; individual routes may require it without changing this envelope contract."),
    documentId: identity.optional().describe("Optional generic issuer-derived source document identity; individual routes may require it without changing this envelope contract."),
    batchId: identity.optional().describe("Optional issuer-derived batch identity for explicitly batch-scoped future transitions."),
  }).describe("Trusted project/workspace ownership and route-conditional bundle, document, and batch scope."),
  correlation: z.strictObject({
    workflowId: identity.describe("Trusted issuer-created or inherited workflow-lineage trace ID; it is not authorization or an execution gate."),
    parentHandoffId: identity.optional().describe("Optional trusted persisted upstream-handoff trace link; it does not prove downstream completion."),
    groupId: identity.optional().describe("Optional trusted observability grouping label; it is not fan-in or batch-completeness proof."),
  }).describe("Tracing lineage only, without routing, activation, or fan-in authority."),
  integrity: z.strictObject({
    bodyEncoding: z.literal("canonical-json-v1").describe("Approved trusted-issuer byte-serialization label for the complete wrapped body; arbitrary reordering is not accepted."),
    bodySha256: sha256.describe("Trusted-issuer SHA-256 of the exact wrapped body bytes including can_continue and payload; integrity evidence only, never sender authentication."),
  }).describe("Integrity binding between trusted issuance and the unchanged wrapped-body bytes."),
  issuedAt: z.iso.datetime({ offset: true }).describe("Offset-aware ISO-8601 audit timestamp from the trusted issuer clock; immutable across dispatch and retry."),
}).describe("GenericHandoffEnvelope/v1 fixed header: syntax is validated here while issuer provenance and route authority remain external boundaries.");

export const ghrRoutedBodyV1Schema = z.strictObject({
  can_continue: z.boolean().describe("Required hop-local continuation indicator supplied and pinned by a trusted issuer; no default or coercion, and this generic package performs no continuation work."),
  payload: z.record(z.string(), z.json()).describe("Opaque bounded JSON object owned by the selected receiving body contract; generic GHR does not inspect semantic fields."),
}).describe("Exact two-field generic transport wrapper whose original bytes are covered by the immutable body digest.");

export const ghrEnvelopeV1Schema = z.strictObject({
  header: ghrHeaderV1Schema.describe("Strict GHR-owned header containing issuer-produced identity, routing, scope, correlation, and integrity metadata."),
  body: ghrRoutedBodyV1Schema.describe("Strict generic can_continue/payload wrapper; receiving domains own payload parsing."),
}).describe("GenericHandoffEnvelope/v1 bounded opaque-payload transport contract; schema validation does not authenticate a producer or authorize a route.");

export type GenericHandoffHeaderV1 = z.infer<typeof ghrHeaderV1Schema>;
export type GenericHandoffRoutedBodyV1 = z.infer<typeof ghrRoutedBodyV1Schema>;
export type GenericHandoffEnvelopeV1 = z.infer<typeof ghrEnvelopeV1Schema>;

export class GenericHandoffIngressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenericHandoffIngressError";
  }
}

type RawNode = { readonly value: GenericHandoffJsonValue; readonly start: number; readonly end: number; readonly members?: ReadonlyMap<string, RawNode> };

class RawJsonReader {
  private position = 0;

  constructor(private readonly source: string) {}

  parse(): RawNode {
    this.skipWhitespace();
    const result = this.parseValue(1);
    this.skipWhitespace();
    if (this.position !== this.source.length) this.fail("unexpected data after JSON value");
    return result;
  }

  private parseValue(depth: number): RawNode {
    this.skipWhitespace();
    const start = this.position;
    const character = this.source[this.position];
    if (character === "{") return this.parseObject(depth, start);
    if (character === "[") return this.parseArray(depth, start);
    if (character === "\"") return this.parseStringNode(start);
    if (character === "t" && this.consumeLiteral("true")) return { value: true, start, end: this.position };
    if (character === "f" && this.consumeLiteral("false")) return { value: false, start, end: this.position };
    if (character === "n" && this.consumeLiteral("null")) return { value: null, start, end: this.position };
    return this.parseNumber(start);
  }

  private parseObject(depth: number, start: number): RawNode {
    if (depth > genericHandoffIngressLimits.maxDepth) this.fail("JSON nesting exceeds the frozen limit");
    this.position += 1;
    this.skipWhitespace();
    const value: Record<string, GenericHandoffJsonValue> = Object.create(null) as Record<string, GenericHandoffJsonValue>;
    const members = new Map<string, RawNode>();
    if (this.source[this.position] === "}") {
      this.position += 1;
      return { value, start, end: this.position, members };
    }
    let propertyCount = 0;
    while (true) {
      this.skipWhitespace();
      if (this.source[this.position] !== "\"") this.fail("object key must be a JSON string");
      const key = this.parseStringNode(this.position).value;
      if (typeof key !== "string") this.fail("invalid object key");
      if (key === "__proto__" || key === "prototype" || key === "constructor") this.fail("prototype-sensitive JSON key is forbidden");
      if (members.has(key)) this.fail("duplicate JSON object key");
      propertyCount += 1;
      if (propertyCount > genericHandoffIngressLimits.maxObjectProperties) this.fail("JSON object properties exceed the frozen limit");
      this.skipWhitespace();
      if (this.source[this.position] !== ":") this.fail("expected colon after JSON object key");
      this.position += 1;
      const member = this.parseValue(depth + 1);
      value[key] = member.value;
      members.set(key, member);
      this.skipWhitespace();
      const delimiter = this.source[this.position];
      if (delimiter === "}") {
        this.position += 1;
        return { value, start, end: this.position, members };
      }
      if (delimiter !== ",") this.fail("expected comma or object close");
      this.position += 1;
    }
  }

  private parseArray(depth: number, start: number): RawNode {
    if (depth > genericHandoffIngressLimits.maxDepth) this.fail("JSON nesting exceeds the frozen limit");
    this.position += 1;
    this.skipWhitespace();
    const value: GenericHandoffJsonValue[] = [];
    if (this.source[this.position] === "]") {
      this.position += 1;
      return { value, start, end: this.position };
    }
    while (true) {
      if (value.length >= genericHandoffIngressLimits.maxArrayElements) this.fail("JSON array elements exceed the frozen limit");
      value.push(this.parseValue(depth + 1).value);
      this.skipWhitespace();
      const delimiter = this.source[this.position];
      if (delimiter === "]") {
        this.position += 1;
        return { value, start, end: this.position };
      }
      if (delimiter !== ",") this.fail("expected comma or array close");
      this.position += 1;
    }
  }

  private parseStringNode(start: number): RawNode {
    this.position += 1;
    while (this.position < this.source.length) {
      const character = this.source[this.position];
      if (character === "\"") {
        this.position += 1;
        try {
          return { value: JSON.parse(this.source.slice(start, this.position)) as string, start, end: this.position };
        } catch {
          this.fail("invalid JSON string");
        }
      }
      if (character === "\\") {
        this.position += 1;
        const escape = this.source[this.position];
        if (escape === "u") this.position += 5;
        else if (escape === "\"" || escape === "\\" || escape === "/" || escape === "b" || escape === "f" || escape === "n" || escape === "r" || escape === "t") this.position += 1;
        else this.fail("invalid JSON escape");
        continue;
      }
      if (character < " ") this.fail("unescaped control character in JSON string");
      this.position += 1;
    }
    this.fail("unterminated JSON string");
  }

  private parseNumber(start: number): RawNode {
    const match = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.source.slice(this.position));
    if (!match || match.index !== 0) this.fail("invalid JSON token");
    this.position += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) this.fail("non-finite JSON number");
    return { value, start, end: this.position };
  }

  private consumeLiteral(literal: string): boolean {
    if (!this.source.startsWith(literal, this.position)) return false;
    this.position += literal.length;
    return true;
  }

  private skipWhitespace(): void {
    while (this.source[this.position] === " " || this.source[this.position] === "\n" || this.source[this.position] === "\r" || this.source[this.position] === "\t") this.position += 1;
  }

  private fail(message: string): never {
    throw new GenericHandoffIngressError(`Invalid generic handoff raw JSON: ${message}.`);
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function toRawText(input: string | Uint8Array): string {
  if (typeof input === "string") return input;
  try {
    return decoder.decode(input);
  } catch {
    throw new GenericHandoffIngressError("Invalid generic handoff raw JSON: input is not valid UTF-8.");
  }
}

function bytesFor(source: string, start: number, end: number): Uint8Array {
  return encoder.encode(source.slice(start, end));
}

export type GenericHandoffRawIngress = {
  readonly value: GenericHandoffJsonValue;
  readonly headerBytes: Uint8Array;
  readonly bodyBytes: Uint8Array;
  /** Present only when the generic wrapper contains a raw payload member. */
  readonly payloadBytes?: Uint8Array;
};

/** Performs the bounded duplicate-key-safe raw JSON guard before any Zod parsing. */
export function guardGenericHandoffEnvelopeV1Raw(input: string | Uint8Array): GenericHandoffRawIngress {
  const source = toRawText(input);
  if (encoder.encode(source).byteLength > genericHandoffIngressLimits.envelopeBytes) throw new GenericHandoffIngressError("Generic handoff envelope exceeds the frozen UTF-8 byte limit.");
  const root = new RawJsonReader(source).parse();
  if (Array.isArray(root.value) || root.value === null || typeof root.value !== "object" || !root.members) throw new GenericHandoffIngressError("Generic handoff envelope root must be a JSON object.");
  const header = root.members.get("header");
  const body = root.members.get("body");
  if (!header || !body) throw new GenericHandoffIngressError("Generic handoff envelope requires raw header and body values.");
  const headerBytes = bytesFor(source, header.start, header.end);
  const bodyBytes = bytesFor(source, body.start, body.end);
  const payload = body.members?.get("payload");
  const payloadBytes = payload ? bytesFor(source, payload.start, payload.end) : undefined;
  if (headerBytes.byteLength > genericHandoffIngressLimits.headerBytes) throw new GenericHandoffIngressError("Generic handoff header exceeds the frozen UTF-8 byte limit.");
  if (bodyBytes.byteLength > genericHandoffIngressLimits.bodyBytes) throw new GenericHandoffIngressError("Generic handoff body exceeds the frozen UTF-8 byte limit.");
  return { value: root.value, headerBytes, bodyBytes, payloadBytes };
}

export function sha256GenericHandoffBody(bodyBytes: Uint8Array): string {
  return createHash("sha256").update(bodyBytes).digest("hex");
}

export type ParsedGenericHandoffEnvelopeV1 = {
  readonly envelope: GenericHandoffEnvelopeV1;
  readonly rawBodyBytes: Uint8Array;
  /** The original JSON bytes for the opaque routed payload, never reserialized. */
  readonly rawPayloadBytes: Uint8Array;
};

/** Validates raw safety first, then strict GHR syntax, then exact wrapped-body integrity. */
export function parseGenericHandoffEnvelopeV1(input: string | Uint8Array): ParsedGenericHandoffEnvelopeV1 {
  const raw = guardGenericHandoffEnvelopeV1Raw(input);
  const parsed = ghrEnvelopeV1Schema.safeParse(raw.value);
  if (!parsed.success) throw new GenericHandoffIngressError("Generic handoff envelope does not match the strict v1 contract.");
  if (!raw.payloadBytes) throw new GenericHandoffIngressError("Generic handoff envelope requires raw payload bytes.");
  if (sha256GenericHandoffBody(raw.bodyBytes) !== parsed.data.header.integrity.bodySha256) throw new GenericHandoffIngressError("Generic handoff body SHA-256 does not match the original wrapped-body bytes.");
  return { envelope: parsed.data, rawBodyBytes: raw.bodyBytes, rawPayloadBytes: raw.payloadBytes };
}
