import type { ProjectCardViewModel } from "../components/project-card-view-model";

const internalHomeReadUrl = "http://atlas:3001/internal/home-projects";

const signatureFor = async (userId: string, issuedAt: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${userId}.${issuedAt}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

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
  return (await response.json() as { projects: ProjectCardViewModel[] }).projects;
}
