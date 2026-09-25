import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProductionProjectLibrary } from "../../components/ProductionProjectLibrary";
import { getAtlasAuthService, isWorkerAuthRuntime } from "../../lib/auth-server";
import { getAuthenticatedHomeIdentity } from "../../lib/home-session";
import { listHomeProjectCards } from "../../lib/home-projects";

/**
 * Better Auth identifies the caller; Atlas membership scopes the production read.
 */
export default async function HomePage() {
  const service = await getAtlasAuthService();
  try {
    const requestHeaders = await headers();
    const identity = await getAuthenticatedHomeIdentity(service.auth.api.getSession, requestHeaders);
    if (!identity) redirect("/sign-in");

    return <ProductionProjectLibrary projects={await listHomeProjectCards(requestHeaders)} user={identity.user} />;
  } finally {
    if (isWorkerAuthRuntime()) await service.close();
  }
}
