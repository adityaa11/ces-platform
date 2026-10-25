export type AdminSignInPayload = { email: string; password: string };

export type AdminIdentity = {
  user: { id: string; email: string; name: string };
  role: "admin";
};

export type AdminSignInResult =
  | { kind: "authorized"; identity: AdminIdentity }
  | { kind: "error"; message: string };

type Requester = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const authenticationFailureMessage = "Atlas couldn't sign you in right now. Check your email and password, then try again.";
const sessionVerificationFailureMessage = "Atlas couldn't verify your Admin session right now. Please try again.";
const unauthorizedMessage = "This account is not authorized for Atlas administration.";

function isAdminIdentity(value: unknown): value is AdminIdentity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { user?: unknown; role?: unknown };
  if (candidate.role !== "admin" || !candidate.user || typeof candidate.user !== "object") return false;
  const user = candidate.user as { id?: unknown; email?: unknown; name?: unknown };
  return typeof user.id === "string" && typeof user.email === "string" && typeof user.name === "string";
}

async function bestEffortSignOut(signOut: () => Promise<Response>): Promise<void> {
  try {
    await signOut();
  } catch {
    // The identity failure remains a denial even if cleanup cannot complete.
  }
}

export type AdminSignInSubmission = {
  submit(payload: AdminSignInPayload): Promise<AdminSignInResult>;
};

export function createAdminSignInSubmission(
  request: Requester,
  signOut: () => Promise<Response>,
): AdminSignInSubmission {
  let inFlight: Promise<AdminSignInResult> | null = null;

  return {
    submit(payload) {
      if (inFlight) return inFlight;

      inFlight = (async () => {
        let signIn: Response;
        try {
          signIn = await request("/api/auth/sign-in/email", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
          });
        } catch {
          return { kind: "error", message: authenticationFailureMessage };
        }

        if (!signIn.ok) return { kind: "error", message: authenticationFailureMessage };

        let identityResponse: Response;
        try {
          identityResponse = await request("/api/admin/identity", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          });
        } catch {
          return { kind: "error", message: sessionVerificationFailureMessage };
        }

        if (identityResponse.status === 401) {
          return { kind: "error", message: "Your Admin session could not be verified. Please sign in again." };
        }
        if (identityResponse.status === 403) {
          await bestEffortSignOut(signOut);
          return { kind: "error", message: unauthorizedMessage };
        }
        if (!identityResponse.ok) return { kind: "error", message: sessionVerificationFailureMessage };

        let identity: unknown;
        try {
          identity = await identityResponse.json();
        } catch {
          return { kind: "error", message: sessionVerificationFailureMessage };
        }
        return isAdminIdentity(identity)
          ? { kind: "authorized", identity }
          : { kind: "error", message: sessionVerificationFailureMessage };
      })().finally(() => { inFlight = null; });

      return inFlight;
    },
  };
}

export { authenticationFailureMessage, sessionVerificationFailureMessage, unauthorizedMessage };
