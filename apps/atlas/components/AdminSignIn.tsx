"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTheme } from "./ThemeProvider";
import { createAdminSignInSubmission, type AdminSignInSubmission } from "./admin-sign-in-submission";
import { validateSignInPayload } from "./sign-in-submission";

const styles = {
  page: "admin-sign-in-page", header: "admin-sign-in-header", headerBrand: "admin-sign-in-header-brand", headerRight: "admin-sign-in-header-right", themeToggle: "admin-sign-in-theme-toggle", themeButton: "admin-sign-in-theme-button", mark: "admin-sign-in-mark", brandName: "admin-sign-in-brand-name", brandDivider: "admin-sign-in-brand-divider", brandContext: "admin-sign-in-brand-context", privateAccess: "admin-sign-in-private-access", main: "admin-sign-in-main", mainInner: "admin-sign-in-main-inner", supra: "admin-sign-in-supra", card: "admin-sign-in-card", overline: "admin-sign-in-overline", description: "admin-sign-in-description", form: "admin-sign-in-form", field: "admin-sign-in-field", fieldWrap: "admin-sign-in-field-wrap", fieldIcon: "admin-sign-in-field-icon", iconButton: "admin-sign-in-icon-button", signIn: "admin-sign-in-submit", formResult: "admin-sign-in-result", accessNotice: "admin-sign-in-access-notice", underCard: "admin-sign-in-under-card", footer: "admin-sign-in-footer",
} as const;

function SunIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
}

function MoonIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.9 13.05A9 9 0 0 1 10.95 3.1 9 9 0 1 0 20.9 13.05Z" /></svg>;
}

function MailIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="14" rx="2.5" width="18" x="3" y="5" /><path d="m4 7 8 6 8-6" /></svg>;
}

function LockIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="11" rx="2" width="14" x="5" y="10" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function EyeIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function EyeOffIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3l18 18" /><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a18.2 18.2 0 0 1-3.1 3.7M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

function ShieldIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 2 8 4v6c0 5-3.5 8.1-8 10-4.5-1.9-8-5-8-10V6l8-4Z" /><path d="m9 12 2 2 4-4" /></svg>;
}

export function AdminSignIn() {
  const { theme, setTheme } = useTheme();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submissionRef = useRef<AdminSignInSubmission | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === "loading") return;

    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    const validation = validateSignInPayload({ email, password });
    const nextErrors: { email?: string; password?: string } = { ...validation.fieldErrors };
    if (!email) nextErrors.email = "Enter your email address.";

    setErrors(nextErrors);
    setResultMessage(null);
    setSubmitState("idle");

    if (nextErrors.email) emailRef.current?.focus();
    else if (nextErrors.password) passwordRef.current?.focus();
    else {
      setSubmitState("loading");
      submissionRef.current ??= createAdminSignInSubmission(
        (input, init) => fetch(input, init),
        () => fetch("/api/auth/sign-out", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({}),
        }),
      );
      const result = await submissionRef.current.submit({ email, password });
      if (result.kind === "authorized") {
        setSubmitState("success");
        setResultMessage(`Admin access verified for ${result.identity.user.name}.`);
      } else {
        setSubmitState("error");
        setResultMessage(result.message);
      }
    }
  }

  function handleFieldEdit(field: "email" | "password") {
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
    setResultMessage(null);
    setSubmitState("idle");
  }

  function togglePasswordVisibility() {
    setPasswordVisible((visible) => !visible);
    passwordRef.current?.focus();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div aria-label="Atlas Admin Console" className={styles.headerBrand}>
          <span aria-hidden="true" className={styles.mark}>A</span>
          <span className={styles.brandName}>Atlas</span>
          <span aria-hidden="true" className={styles.brandDivider} />
          <span className={styles.brandContext}>Admin Console</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.privateAccess}>Private access</span>
          <div aria-label="Appearance" className={styles.themeToggle} role="group">
            <button aria-label="Light theme" aria-pressed={theme === "light"} className={styles.themeButton} onClick={() => setTheme("light")} type="button"><SunIcon /></button>
            <button aria-label="Dark theme" aria-pressed={theme === "dark"} className={styles.themeButton} onClick={() => setTheme("dark")} type="button"><MoonIcon /></button>
          </div>
        </div>
      </header>

      <section aria-labelledby="admin-sign-in-title" className={styles.main}>
        <div className={styles.mainInner}>
          <p aria-hidden="true" className={styles.supra}><span /><span>Atlas / Administration</span><span /></p>
          <section className={styles.card}>
            <p className={styles.overline}>Authorized operators only</p>
            <h1 id="admin-sign-in-title">Welcome back.</h1>
            <p className={styles.description}>Sign in with your administrator account to access the Atlas platform console.</p>

            <form className={styles.form} noValidate onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="admin-email">Email address <span aria-hidden="true">*</span></label>
                <div className={styles.fieldWrap}>
                  <span className={styles.fieldIcon}><MailIcon /></span>
                  <input aria-describedby={errors.email ? "admin-email-error" : undefined} aria-invalid={errors.email ? true : undefined} autoComplete="username" id="admin-email" inputMode="email" name="email" onChange={() => handleFieldEdit("email")} placeholder="admin@company.com" ref={emailRef} required spellCheck={false} type="email" />
                </div>
                {errors.email ? <p className="admin-sign-in-field-error" id="admin-email-error" role="alert">{errors.email}</p> : null}
              </div>
              <div className={styles.field}>
                <label htmlFor="admin-password">Password <span aria-hidden="true">*</span></label>
                <div className={styles.fieldWrap}>
                  <span className={styles.fieldIcon}><LockIcon /></span>
                  <input aria-describedby={errors.password ? "admin-password-error" : undefined} aria-invalid={errors.password ? true : undefined} autoComplete="current-password" id="admin-password" name="password" onChange={() => handleFieldEdit("password")} placeholder="Enter your password" ref={passwordRef} required type={passwordVisible ? "text" : "password"} />
                  <button aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} className={styles.iconButton} onClick={togglePasswordVisibility} type="button">{passwordVisible ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                {errors.password ? <p className="admin-sign-in-field-error" id="admin-password-error" role="alert">{errors.password}</p> : null}
              </div>
              <button aria-busy={submitState === "loading"} aria-describedby={submitState === "error" ? "admin-sign-in-result" : undefined} className={styles.signIn} disabled={submitState === "loading"} type="submit">{submitState === "loading" ? "Signing in…" : "Sign in to Admin Console"} <ArrowIcon /></button>
              {resultMessage ? <div aria-live={submitState === "error" ? "assertive" : "polite"} className={`${styles.formResult}${submitState === "error" ? " admin-sign-in-result-error" : ""}`} id="admin-sign-in-result" role={submitState === "error" ? "alert" : "status"}>{resultMessage}</div> : null}
            </form>

            <aside className={styles.accessNotice}><ShieldIcon /><p><strong>Restricted platform access.</strong> Administrator accounts are provisioned through the authorized Atlas CLI—not public registration.</p></aside>
          </section>
          <p className={styles.underCard}>Access is limited to <strong>Atlas platform administrators.</strong></p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><span>© 2026 Atlas</span><i aria-hidden="true" /><span>Platform Administration</span></div>
        <p><LockIcon /><span><strong>Admin login</strong> · UI concept</span></p>
      </footer>
    </main>
  );
}
