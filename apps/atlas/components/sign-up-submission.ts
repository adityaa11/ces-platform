export type SignUpPayload = { name: string; email: string; password: string };

export type SignUpField = keyof SignUpPayload;
export type SignUpValidation = { fieldErrors: Partial<Record<SignUpField, string>>; formError: string | null };

const serviceFailureMessage = "Atlas couldn't create your account right now. Check your connection and try again.";

function hasCode(value: unknown, codes: readonly string[]) {
  return typeof value === "string" && codes.includes(value.toUpperCase());
}

export function validateSignUpPayload({ name, email, password }: SignUpPayload): SignUpValidation {
  const fieldErrors: Partial<Record<SignUpField, string>> = {};

  if (!name.trim()) fieldErrors.name = "Enter your name.";
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter a password.";
  else if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters.";
  else if (password.length > 128) fieldErrors.password = "Password must be 128 characters or fewer.";

  return { fieldErrors, formError: null };
}

export async function mapSignUpFailure(response: Response): Promise<SignUpValidation> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { fieldErrors: {}, formError: serviceFailureMessage };
  }

  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const rawCode = record.code ?? record.errorCode;
  const code = typeof rawCode === "string" ? rawCode.toUpperCase() : null;
  if (hasCode(code, ["USER_ALREADY_EXISTS", "EMAIL_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"])) {
    return { fieldErrors: { email: "An account already exists for this email. Try signing in or use a different email." }, formError: null };
  }
  if (hasCode(code, ["PASSWORD_TOO_SHORT", "PASSWORD_TOO_LONG"])) {
    return { fieldErrors: { password: code === "PASSWORD_TOO_SHORT" ? "Password must be at least 8 characters." : "Password must be 128 characters or fewer." }, formError: null };
  }

  return { fieldErrors: {}, formError: serviceFailureMessage };
}

export type SignUpSubmission = {
  submit(payload: SignUpPayload): Promise<Response | null>;
};

export function createSignUpSubmission(
  request: (payload: SignUpPayload) => Promise<Response>,
  navigate: () => void,
): SignUpSubmission {
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
