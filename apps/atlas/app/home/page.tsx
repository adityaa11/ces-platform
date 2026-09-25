import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProductionProjectLibrary } from "../../components/ProductionProjectLibrary";
import { getAtlasAuthSecret, getAtlasAuthService, isWorkerAuthRuntime } from "../../lib/auth-server";
import { getAuthenticatedHomeIdentity } from "../../lib/home-session";
import { listHomeProjectCardsForUser } from "../../lib/home-project-read-service";

/**
 * Better Auth identifies the caller; Atlas membership scopes the production read.
 */
export default async function HomePage() {
  const service = await getAtlasAuthService();
  try {
    const requestHeaders = await headers();
    const identity = await getAuthenticatedHomeIdentity(service.auth.api.getSession, requestHeaders);
    if (!identity) redirect("/sign-in");

    return <ProductionProjectLibrary projects={await listHomeProjectCardsForUser(identity.userId, await getAtlasAuthSecret())} user={identity.user} />;
  } finally {
    if (isWorkerAuthRuntime()) await service.close();
  }
}
