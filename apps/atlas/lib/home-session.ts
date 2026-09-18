import type { AuthenticatedUser } from "../components/authenticated-user";

type SessionResult = { user?: { email?: string | null; name?: string | null } } | null;
type GetSession = (context: { headers: Headers }) => Promise<SessionResult>;

/** Resolves only the session-owned identity needed by the authenticated home. */
export async function getAuthenticatedHomeUser(getSession: GetSession, requestHeaders: Headers): Promise<AuthenticatedUser | null> {
  const session = await getSession({ headers: requestHeaders });
  if (!session?.user?.name || !session.user.email) return null;
  return { name: session.user.name, email: session.user.email };
}
