import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { AtlasAdminAccessError, createAtlasAdminGuard, createPersistedAdminAuthorizationReader } from "@/lib/admin-guard";
import { getAtlasAuthService, isWorkerAuthRuntime } from "@/lib/auth-server";

/**
 * The authorization boundary deliberately lives on the page rather than an
 * Admin layout: /admin/sign-in must remain reachable without a session.
 */
export default async function AdminDashboardPage() {
  const service = await getAtlasAuthService();
  let identity;
  try {
    const requestHeaders = await headers();
    identity = await createAtlasAdminGuard(
      service.auth.api.getSession,
      createPersistedAdminAuthorizationReader(service.db),
    )(requestHeaders);
  } catch (error) {
    if (error instanceof AtlasAdminAccessError) {
      if (error.status === 401) redirect("/admin/sign-in");
      forbidden();
    }
    throw error;
  } finally {
    if (isWorkerAuthRuntime()) await service.close();
  }

  // AAD-002 replaces this bounded placeholder with the reusable Admin shell.
  return (
    <main>
      <h1>Atlas Admin Console</h1>
      <p>Welcome, {identity.name}.</p>
    </main>
  );
}
