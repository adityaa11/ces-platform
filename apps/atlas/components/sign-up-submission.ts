export type SignUpPayload = { name: string; email: string; password: string };

export type SignUpSubmission = {
  submit(payload: SignUpPayload): Promise<"success" | "failure">;
};

export function createSignUpSubmission(
  request: (payload: SignUpPayload) => Promise<Response>,
  navigate: () => void,
): SignUpSubmission {
  let inFlight: Promise<"success" | "failure"> | null = null;

  return {
    submit(payload) {
      if (inFlight) return inFlight;

      inFlight = request(payload)
        .then((response) => {
          if (!response.ok) return "failure";
          navigate();
          return "success";
        })
        .catch(() => "failure")
        .finally(() => { inFlight = null; });

      return inFlight;
    },
  };
}
