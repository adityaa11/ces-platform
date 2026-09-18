"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSignUpSubmission, mapSignUpFailure, SignUpField, validateSignUpPayload } from "./sign-up-submission";

const fields: Array<{ id: SignUpField; label: string; helper: string; autoComplete: string; type: "email" | "password" | "text" }> = [
  { id: "name", label: "Name", helper: "This is the name associated with your Atlas account.", autoComplete: "name", type: "text" },
  { id: "email", label: "Email", helper: "Use an email address you can access.", autoComplete: "email", type: "email" },
  { id: "password", label: "Password", helper: "8–128 characters.", autoComplete: "new-password", type: "password" },
];

export function SignUpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignUpField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
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
      setFormError("Atlas couldn't create your account right now. Check your connection and try again.");
      return;
    }

    const validation = validateSignUpPayload({ name, email, password });
    if (Object.keys(validation.fieldErrors).length > 0) {
      setFieldErrors(validation.fieldErrors);
      setFormError(null);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const result = await submission.submit({ name, email, password });
      if (!result) {
        setFormError("Atlas couldn't create your account right now. Check your connection and try again.");
      } else if (!result.ok) {
        const failure = await mapSignUpFailure(result);
        setFieldErrors(failure.fieldErrors);
        setFormError(failure.formError);
      }
    } catch {
      setFormError("Atlas couldn't create your account right now. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form className="sign-up-form" noValidate onSubmit={handleSubmit}>
    {fields.map(({ id, label, helper, autoComplete, type }) => {
      const error = fieldErrors[id];
      const helperId = `${id}-helper`;
      const errorId = `${id}-error`;
      return <div className="form-field" key={id}>
        <label htmlFor={id}>{label} <span aria-hidden="true">* Required</span></label>
        <input aria-describedby={error ? `${helperId} ${errorId}` : helperId} aria-invalid={error ? "true" : undefined} autoComplete={autoComplete} id={id} name={id} required type={type} />
        <p className="field-helper" id={helperId}>{helper}</p>
        {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
      </div>;
    })}
    {formError && <p className="form-error" role="alert">{formError}</p>}
    <button className="button button-primary" disabled={isSubmitting} type="submit">
      {isSubmitting ? "Creating account…" : "Create account"}
    </button>
  </form>;
}
