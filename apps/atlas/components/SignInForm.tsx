"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSignInSubmission, mapSignInFailure, SignInField, validateSignInPayload } from "./sign-in-submission";

export function SignInForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignInField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const submission = useMemo(() => createSignInSubmission(
    (payload) => fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    }),
    () => router.push("/home"),
  ), [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof password !== "string") {
      setFormError("Atlas couldn't sign you in right now. Check your email and password, then try again.");
      return;
    }

    const validation = validateSignInPayload({ email, password });
    if (Object.keys(validation.fieldErrors).length > 0) {
      setFieldErrors(validation.fieldErrors);
      setFormError(null);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const result = await submission.submit({ email, password });
      if (!result) setFormError("Atlas couldn't sign you in right now. Check your email and password, then try again.");
      else if (!result.ok) setFormError((await mapSignInFailure(result)).formError);
    } catch {
      setFormError("Atlas couldn't sign you in right now. Check your email and password, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const emailError = fieldErrors.email;
  const passwordError = fieldErrors.password;
  return <form className="sign-in-form" noValidate onSubmit={handleSubmit}>
    <div className="form-field">
      <label htmlFor="email">Email <span aria-hidden="true">* Required</span></label>
      <input aria-describedby={emailError ? "email-error" : undefined} aria-invalid={emailError ? "true" : undefined} autoComplete="email" id="email" name="email" required type="email" />
      {emailError && <p className="field-error" id="email-error" role="alert">{emailError}</p>}
    </div>
    <div className="form-field">
      <label htmlFor="password">Password <span aria-hidden="true">* Required</span></label>
      <input aria-describedby={passwordError ? "password-error" : undefined} aria-invalid={passwordError ? "true" : undefined} autoComplete="current-password" id="password" name="password" required type="password" />
      {passwordError && <p className="field-error" id="password-error" role="alert">{passwordError}</p>}
    </div>
    <button className="button button-primary" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}</button>
    {formError && <p className="form-error" role="alert">{formError}</p>}
  </form>;
}
