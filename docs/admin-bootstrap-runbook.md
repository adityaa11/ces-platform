# Atlas first Super Admin bootstrap

Use this runbook once for a new Atlas installation. It creates the first
Atlas Platform Super Admin through Better Auth and seals the one-time
bootstrap marker. It is an infrastructure operation: do not run it from an
Admin UI, public endpoint, or automated application startup.

## Prerequisites

- A migrated Atlas PostgreSQL database with the `atlas_app` application role.
- The repository's runtime environment has `DATABASE_URL`,
  `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`; set
  `BETTER_AUTH_TRUSTED_ORIGINS` when it differs from that URL.
- An interactive TTY, plus a unique operator email and display name. Keep the
  database URL and Better Auth secret out of terminal transcripts and tickets.

## Bootstrap and verify

From the repository root, run:

```bash
pnpm atlas admin bootstrap --email admin@example.com --name "Atlas Administrator"
```

The command prompts for `Initial password` and `Confirm password`. Input is
not a command-line argument, is masked where the terminal supports it, and is
never printed. A password policy failure or mismatch ends the command without
creating a usable administrator.

On success, the output identifies database/configuration checks, identity
creation, `Super Admin privilege assigned`, `Credentials ready for sign-in`,
and `Bootstrap state sealed`; it prints the email, role, and active status.
It never prints a password, hash, raw cookie, session token, database URL, or
secret.

Sign in through the configured Better Auth endpoint using the created email
and password:

```text
POST ${BETTER_AUTH_URL}/api/auth/sign-in/email
Content-Type: application/json

{"email":"admin@example.com","password":"<entered privately>"}
```

Use the session cookie issued by that response only in a protected client or
test harness; do not paste it into logs. A request with that cookie to
`GET ${BETTER_AUTH_URL}/api/admin/identity` succeeds with only the user ID,
email, name, and `admin` role. Missing or invalid sessions receive `401`; a
valid ordinary-user session receives `403`.

## Repeat and recovery

A completed bootstrap is final. Repeating `pnpm atlas admin bootstrap ...`
reports that bootstrap is sealed and creates no account. Do not use force,
reset, direct SQL changes, or a second administrator command to bypass it.

If the process stops after it has reserved an attempt, keep the reservation in
place. Obtain the recorded attempt ID from the controlled infrastructure
record and run only:

```bash
pnpm atlas admin reconcile --attempt-id <recorded-attempt-id>
```

Reconciliation verifies and seals that same Better Auth identity or fails
closed; it does not create, delete, or replace credentials. An unknown or
mismatched attempt ID must be treated as an error and escalated through the
normal infrastructure recovery process.
