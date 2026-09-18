"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSignUpSubmission } from "./sign-up-submission";

const signUpFailureMessage = "We couldn't create your account. Check your details and try again.";

export function SignUpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submission = useMemo(() => createSignUpSubmission(
    (payload) => fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    }),
    () => router.push("/demo"),
  ), [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      setError(signUpFailureMessage);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submission.submit({ name, email, password });
      if (result === "failure") {
        setError(signUpFailureMessage);
      }
    } catch {
      setError(signUpFailureMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form className="sign-up-form" onSubmit={handleSubmit}>
    <label>Name<input autoComplete="name" name="name" required type="text" /></label>
    <label>Email<input autoComplete="email" name="email" required type="email" /></label>
    <label>Password<input autoComplete="new-password" name="password" required type="password" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary" disabled={isSubmitting} type="submit">
      {isSubmitting ? "Creating account…" : "Create account"}
    </button>
  </form>;
}
