import type { ProjectCardViewModel } from "../components/project-card-view-model";

const internalHomeReadUrl = "http://atlas:3001/internal/home-projects";

const signatureFor = async (userId: string, issuedAt: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${userId}.${issuedAt}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);

/** Rejects malformed or extra transport fields instead of reconstituting lifecycle truth in the client. */
export function parseApprovedHomeProjectCards(payload: unknown): readonly ProjectCardViewModel[] {
  if (!exactKeys(payload, ["projects"]) || !Array.isArray(payload.projects)) throw new Error("Invalid Atlas project read.");
  return payload.projects.map((value) => {
    if (!exactKeys(value, ["id", "projectId", "name", "summary", "documentCount", "state", "attentionReason", "master", "initialDraft", "metrics", "action"]) && !exactKeys(value, ["id", "projectId", "name", "summary", "documentCount", "state", "master", "initialDraft", "metrics", "action"])) throw new Error("Invalid Atlas project model.");
    const card = value as Record<string, unknown>;
    if (typeof card.id !== "string" || typeof card.projectId !== "string" || typeof card.name !== "string" || typeof card.summary !== "string" || !Number.isSafeInteger(card.documentCount) || !["waiting-for-extraction", "extracting", "needs-attention", "ready-for-review"].includes(String(card.state)) || (card.state === "needs-attention" ? card.attentionReason !== "Processing needs attention." : card.attentionReason !== undefined) || !exactKeys(card.master, ["label"]) || card.master.label !== "No published work" || !exactKeys(card.initialDraft, ["processedLabel", "progressPercent"]) || typeof card.initialDraft.processedLabel !== "string" || !Number.isSafeInteger(card.initialDraft.progressPercent) || card.initialDraft.progressPercent < 0 || card.initialDraft.progressPercent > 100 || !exactKeys(card.metrics, ["publishedFacts", "uploadedPrds"]) || card.metrics.publishedFacts !== 0 || card.metrics.uploadedPrds !== card.documentCount || !exactKeys(card.action, ["label", "unavailableReason"]) || card.action.label !== "Workspace unavailable" || card.action.unavailableReason !== "A production workspace is not available yet.") throw new Error("Invalid Atlas project model.");
    return card as unknown as ProjectCardViewModel;
  });
}

/** Fixed internal service boundary; the page passes only its already-resolved identity assertion. */
export async function listHomeProjectCardsForUser(userId: string, authSecret: string): Promise<readonly ProjectCardViewModel[]> {
  const issuedAt = String(Date.now());
  const response = await fetch(internalHomeReadUrl, {
    cache: "no-store",
    headers: {
      "x-atlas-home-user-id": userId,
      "x-atlas-home-issued-at": issuedAt,
      "x-atlas-home-signature": await signatureFor(userId, issuedAt, authSecret),
    },
  });
  if (!response.ok) throw new Error("Unable to read Atlas projects.");
  return parseApprovedHomeProjectCards(await response.json());
}
