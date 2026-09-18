import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectLibrary } from "../../components/ProjectLibrary";
import { getAtlasAuthService, isWorkerAuthRuntime } from "../../lib/auth-server";
import { getAuthenticatedHomeUser } from "../../lib/home-session";

/**
 * `/home` is an identity guard only. Atlas project authorization remains a
 * separate future boundary, so the production library begins genuinely empty.
 */
export default async function HomePage() {
  const service = await getAtlasAuthService();
  try {
    const user = await getAuthenticatedHomeUser(service.auth.api.getSession, await headers());
    if (!user) redirect("/sign-in");

    return <ProjectLibrary mode="production" projects={[]} user={user} />;
  } finally {
    if (isWorkerAuthRuntime()) await service.close();
  }
}
