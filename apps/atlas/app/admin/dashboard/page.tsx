import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { AtlasAdminAccessError, createAtlasAdminGuard, createPersistedAdminAuthorizationReader } from "@/lib/admin-guard";
import { getAtlasAuthService, isWorkerAuthRuntime } from "@/lib/auth-server";
import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardWelcome } from "@/components/admin/DashboardWelcome";

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

  return (
    <AdminShell name={identity.name}>
      <header className="admin-page-heading">
        <p>Atlas / Administration</p>
        <h1>Dashboard</h1>
        <span>Atlas Admin Console</span>
      </header>
      <DashboardWelcome name={identity.name} />
    </AdminShell>
  );
}
