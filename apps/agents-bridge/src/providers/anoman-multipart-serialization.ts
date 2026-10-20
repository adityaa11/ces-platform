import type { MultipartChatMessage } from "../provider-capabilities.js";

/** The versioned adapter policy shared by Anoman transport and IDSER sizing. */
export const anomanMultipartSerializationPolicy = Object.freeze({
  identity: "anoman.openai-chat.multipart-data-url",
  version: "v1",
});

type SerializedMessage = Readonly<{
  role: MultipartChatMessage["role"];
  content: readonly (
    | Readonly<{ type: "text"; text: string }>
    | Readonly<{ type: "image_url"; image_url: Readonly<{ url: string }> }>
  )[];
}>;

export type AnomanMultipartSerializationProjection = Readonly<{
  model: string;
  messages: readonly Readonly<{
    role: MultipartChatMessage["role"];
    parts: readonly (
      | Readonly<{ type: "text"; text: string }>
      | Readonly<{ type: "image"; media: Readonly<{ mimeType: "image/png"; byteLength: number }> }>
    )[];
  }>[];
}>;

const positiveSafeInteger = (value: unknown): value is number => Number.isSafeInteger(value) && typeof value === "number" && value > 0;

export function projectedBase64DataUrlBytes(mimeType: "image/png", byteLength: number): number {
  if (!positiveSafeInteger(byteLength)) throw new Error("ANOMAN_SERIALIZER_POLICY_GAP: image byte length must be a positive safe integer.");
  const base64Length = Math.ceil(byteLength / 3) * 4;
  const dataUrlBytes = Buffer.byteLength(`data:${mimeType};base64,`, "utf8") + base64Length;
  if (!Number.isSafeInteger(base64Length) || !Number.isSafeInteger(dataUrlBytes)) throw new Error("ANOMAN_SERIALIZER_POLICY_GAP: projected data URL exceeds safe integer bounds.");
  return dataUrlBytes;
}

function transportBody(model: string, messages: readonly SerializedMessage[]) {
  return { model, messages, temperature: 0, stream: false, response_format: { type: "json_object" } };
}

function serialize(model: string, messages: readonly SerializedMessage[]): string {
  if (typeof model !== "string" || model.trim().length === 0) throw new Error("ANOMAN_SERIALIZER_POLICY_GAP: model identity must be pinned.");
  return JSON.stringify(transportBody(model, messages));
}

/** The exact live adapter serialization, kept in one place for drift safety. */
export function serializeAnomanMultipartRequest(model: string, messages: readonly MultipartChatMessage[]): string {
  return serialize(model, messages.map((message) => ({
    role: message.role,
    content: message.parts.map((part) => part.type === "text"
      ? { type: "text" as const, text: part.text }
      : { type: "image_url" as const, image_url: { url: `data:${part.media.mimeType};base64,${Buffer.from(part.media.bytes).toString("base64")}` } }),
  })));
}

/** Projects exact JSON bytes with placeholder base64, without observing image bytes. */
export function projectAnomanMultipartRequestBytes(input: AnomanMultipartSerializationProjection): number {
  const messages: SerializedMessage[] = input.messages.map((message) => ({
    role: message.role,
    content: message.parts.map((part) => part.type === "text"
      ? { type: "text" as const, text: part.text }
      : { type: "image_url" as const, image_url: { url: `data:${part.media.mimeType};base64,${"A".repeat(projectedBase64DataUrlBytes(part.media.mimeType, part.media.byteLength) - Buffer.byteLength(`data:${part.media.mimeType};base64,`, "utf8"))}` } }),
  }));
  return Buffer.byteLength(serialize(input.model, messages), "utf8");
}
