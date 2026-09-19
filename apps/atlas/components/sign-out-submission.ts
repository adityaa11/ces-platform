const serviceFailureMessage = "Atlas couldn't sign you out right now. Try again.";

export type SignOutSubmission = {
  submit(): Promise<Response | null>;
};

export async function requestSignOut(): Promise<Response> {
  return fetch("/api/auth/sign-out", {
    body: JSON.stringify({}),
    headers: { "content-type": "application/json" },
    method: "POST",
    credentials: "same-origin",
  });
}

export function mapSignOutFailure(): string {
  return serviceFailureMessage;
}

export function createSignOutSubmission(
  request: () => Promise<Response>,
  navigate: () => void,
): SignOutSubmission {
  let inFlight: Promise<Response | null> | null = null;

  return {
    submit() {
      if (inFlight) return inFlight;

      inFlight = request()
        .then((response) => {
          if (!response.ok) return response;
          navigate();
          return response;
        })
        .catch(() => null)
        .finally(() => { inFlight = null; });

      return inFlight;
    },
  };
}
