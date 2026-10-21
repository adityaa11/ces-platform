import { canonicalMultimodalJson, canonicalMultimodalSha256 } from "@atlas/skills";

type RecordValue = Record<string, unknown>;
export type VersionedIdentity = Readonly<{ identity: string; version: string }>;
export type SemanticMultimodalReconstructionPolicyBindingV1 = Readonly<{
  bindingVersion: "SemanticMultimodalReconstructionPolicyBinding/v1";
  planRef: string;
  handoffRef: string;
  planHash: string;
  handoffHash: string;
  batchId: string;
  batchSlot: number;
  identityBinding: Readonly<{ prompt: VersionedIdentity; schema: VersionedIdentity; composer: VersionedIdentity; route: VersionedIdentity; adapter: VersionedIdentity }>;
  estimatorBinding: Readonly<{
    estimator: VersionedIdentity;
    configuration: VersionedIdentity;
    configurationSha256: string;
    inputBytesPerToken: number;
    framingAllowanceBytes: number;
    requestByteSafetyMargin: number;
    inputTokenSafetyMargin: number;
    reservedOutputTokens: number;
    requestResourceEnvelope: Readonly<{ requestUnits: number; dayUnits: number; concurrencyUnits: number }>;
    imageTokenPolicy: Readonly<{ identity: string; version: string; policySha256: string }>;
  }>;
  routeBinding: Readonly<{
    routeId: string; profileId: string; profileVersion: string; maxPromptBytes: number;
    image: Readonly<{ version: "v1"; mediaTypes: readonly "image/png"[]; maxImageCount: number; maxImageBytes: number; maxImageWidth: number; maxImageHeight: number }>;
    imageTpm: Readonly<{ state: "unknown" }> | Readonly<{ state: "qualified"; tokensPerImage: number }>;
  }>;
  serializerBinding: Readonly<{ identity: "anoman.openai-chat.multipart-data-url"; version: "v1"; model: string; policySha256: string }>;
  bindingSha256: string;
}>;

export class SemanticMultimodalReconstructionPolicyBindingError extends Error {}

const plain = (value: unknown): value is RecordValue => !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exact = (value: unknown, keys: readonly string[]): value is RecordValue => plain(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const sha = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && Buffer.byteLength(value, "utf8") <= 200;
const positive = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const nonNegative = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const identity = (value: unknown): value is VersionedIdentity => exact(value, ["identity", "version"]) && text(value.identity) && text(value.version);
const clone = <T>(value: T): T => JSON.parse(canonicalMultimodalJson(value)) as T;
const fail = (message: string): never => { throw new SemanticMultimodalReconstructionPolicyBindingError(`Semantic multimodal policy binding is invalid: ${message}`); };

function validImageTpm(value: unknown): boolean {
  return (exact(value, ["state"]) && value.state === "unknown")
    || (exact(value, ["state", "tokensPerImage"]) && value.state === "qualified" && positive(value.tokensPerImage));
}

/** Exact schema parser.  It excludes source payloads and any extension keys. */
export function parseSemanticMultimodalReconstructionPolicyBindingV1(value: unknown): SemanticMultimodalReconstructionPolicyBindingV1 {
  if (!plain(value)) fail("base fields are malformed");
  const parsed = value as RecordValue;
  if (!exact(parsed, ["bindingVersion", "planRef", "handoffRef", "planHash", "handoffHash", "batchId", "batchSlot", "identityBinding", "estimatorBinding", "routeBinding", "serializerBinding", "bindingSha256"])
    || parsed.bindingVersion !== "SemanticMultimodalReconstructionPolicyBinding/v1" || ![parsed.planRef, parsed.handoffRef, parsed.batchId].every(text) || ![parsed.planHash, parsed.handoffHash, parsed.bindingSha256].every(sha) || !positive(parsed.batchSlot)) fail("base fields are malformed");
  const identities = parsed.identityBinding;
  if (!exact(identities, ["prompt", "schema", "composer", "route", "adapter"]) || !Object.values(identities).every(identity)) fail("composition identities are malformed");
  const estimator = parsed.estimatorBinding;
  if (!exact(estimator, ["estimator", "configuration", "configurationSha256", "inputBytesPerToken", "framingAllowanceBytes", "requestByteSafetyMargin", "inputTokenSafetyMargin", "reservedOutputTokens", "requestResourceEnvelope", "imageTokenPolicy"])
    || !identity(estimator.estimator) || !identity(estimator.configuration) || !sha(estimator.configurationSha256) || !positive(estimator.inputBytesPerToken) || !nonNegative(estimator.framingAllowanceBytes) || !nonNegative(estimator.requestByteSafetyMargin) || !nonNegative(estimator.inputTokenSafetyMargin) || !positive(estimator.reservedOutputTokens)
    || !exact(estimator.requestResourceEnvelope, ["requestUnits", "dayUnits", "concurrencyUnits"]) || !Object.values(estimator.requestResourceEnvelope).every(positive)
    || !exact(estimator.imageTokenPolicy, ["identity", "version", "policySha256"]) || !text(estimator.imageTokenPolicy.identity) || !text(estimator.imageTokenPolicy.version) || !sha(estimator.imageTokenPolicy.policySha256)) fail("estimator binding is malformed");
  const parsedEstimator = estimator as RecordValue;
  const estimatorConfiguration = {
    estimator: parsedEstimator.estimator,
    configuration: parsedEstimator.configuration,
    inputBytesPerToken: parsedEstimator.inputBytesPerToken,
    framingAllowanceBytes: parsedEstimator.framingAllowanceBytes,
    requestByteSafetyMargin: parsedEstimator.requestByteSafetyMargin,
    inputTokenSafetyMargin: parsedEstimator.inputTokenSafetyMargin,
    reservedOutputTokens: parsedEstimator.reservedOutputTokens,
    requestResourceEnvelope: parsedEstimator.requestResourceEnvelope,
  };
  if (canonicalMultimodalSha256(estimatorConfiguration) !== parsedEstimator.configurationSha256) fail("estimator configuration hash is inconsistent");
  const route = parsed.routeBinding;
  if (!exact(route, ["routeId", "profileId", "profileVersion", "maxPromptBytes", "image", "imageTpm"]) || ![route.routeId, route.profileId, route.profileVersion].every(text) || !positive(route.maxPromptBytes)
    || !exact(route.image, ["version", "mediaTypes", "maxImageCount", "maxImageBytes", "maxImageWidth", "maxImageHeight"]) || route.image.version !== "v1" || !Array.isArray(route.image.mediaTypes) || route.image.mediaTypes.length !== 1 || route.image.mediaTypes[0] !== "image/png" || ![route.image.maxImageCount, route.image.maxImageBytes, route.image.maxImageWidth, route.image.maxImageHeight].every(positive) || !validImageTpm(route.imageTpm)) fail("route binding is malformed");
  const serializer = parsed.serializerBinding;
  if (!exact(serializer, ["identity", "version", "model", "policySha256"]) || serializer.identity !== "anoman.openai-chat.multipart-data-url" || serializer.version !== "v1" || !text(serializer.model) || !sha(serializer.policySha256)) fail("serializer binding is malformed");
  const body = { ...parsed }; delete (body as { bindingSha256?: unknown }).bindingSha256;
  if (canonicalMultimodalSha256(body) !== parsed.bindingSha256) fail("binding hash is inconsistent");
  return clone(parsed) as SemanticMultimodalReconstructionPolicyBindingV1;
}

/** Computes the sole persisted commitment; callers cannot choose a hash. */
export function bindSemanticMultimodalReconstructionPolicyV1(input: Omit<SemanticMultimodalReconstructionPolicyBindingV1, "bindingSha256">): SemanticMultimodalReconstructionPolicyBindingV1 {
  const body = clone(input);
  return parseSemanticMultimodalReconstructionPolicyBindingV1({ ...body, bindingSha256: canonicalMultimodalSha256(body) });
}
