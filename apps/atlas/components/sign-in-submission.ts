export type SignInPayload = { email: string; password: string };

export type SignInField = keyof SignInPayload;
export type SignInValidation = { fieldErrors: Partial<Record<SignInField, string>>; formError: string | null };

const serviceFailureMessage = "Atlas couldn't sign you in right now. Check your email and password, then try again.";

export function validateSignInPayload({ email, password }: SignInPayload): SignInValidation {
  const fieldErrors: Partial<Record<SignInField, string>> = {};

  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter your password.";

  return { fieldErrors, formError: null };
}

export async function mapSignInFailure(response: Response): Promise<SignInValidation> {
  // Consume no response details: Better Auth remains the authority for credential errors.
  try {
    await response.json();
  } catch {
    // A non-JSON failure still receives the same bounded, retryable message.
  }

  return { fieldErrors: {}, formError: serviceFailureMessage };
}

export type SignInSubmission = {
  submit(payload: SignInPayload): Promise<Response | null>;
};

export function createSignInSubmission(
  request: (payload: SignInPayload) => Promise<Response>,
  navigate: () => void,
): SignInSubmission {
  let inFlight: Promise<Response | null> | null = null;

  return {
    submit(payload) {
      if (inFlight) return inFlight;

      inFlight = request(payload)
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
