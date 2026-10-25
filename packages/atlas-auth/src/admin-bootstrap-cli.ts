import { createAtlasAuth, loadAtlasAuthConfig } from "./index.js";
import { AtlasBootstrapError, createAtlasBootstrapCoordinator, type AtlasBootstrapCoordinator } from "./bootstrap-coordinator.js";

export type AtlasCliPrompt = Readonly<{
  password(label: "Initial password" | "Confirm password"): Promise<string>;
}>;

type AtlasCliService = Readonly<{
  coordinator: AtlasBootstrapCoordinator;
  baseURL: string;
  close(): Promise<void>;
}>;

export type AtlasAdminCliDependencies = Readonly<{
  prompt?: AtlasCliPrompt;
  write?: (line: string) => void;
  createService?: () => Promise<AtlasCliService>;
}>;

class AtlasCliError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.stack = undefined;
  }
}

const fail = (code: string): never => { throw new AtlasCliError(code); };
const usage = "Usage: pnpm atlas admin <bootstrap|reconcile> [options]";

function readOption(args: readonly string[], allowed: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index]!;
    if (/^--(?:password|initial-password|confirm-password)(?:=|$)/.test(option)) fail("PASSWORD_ARGUMENT_FORBIDDEN");
    if (!allowed.includes(option)) fail("INVALID_ARGUMENTS");
    const value = args[index + 1];
    if (!value || value.startsWith("--") || values[option]) fail("INVALID_ARGUMENTS");
    values[option] = value;
    index += 1;
  }
  return values;
}

function parseBootstrap(args: readonly string[]) {
  const values = readOption(args, ["--email", "--name"]);
  const email = values["--email"]?.trim().toLowerCase();
  const name = values["--name"]?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("INVALID_EMAIL");
  if (!name) fail("INVALID_NAME");
  return { email, name };
}

function parseReconcile(args: readonly string[]) {
  const values = readOption(args, ["--attempt-id"]);
  const attemptId = values["--attempt-id"]?.trim();
  if (!attemptId) fail("ATTEMPT_ID_REQUIRED");
  return { attemptId };
}

function terminalPrompt(): AtlasCliPrompt {
  return {
    async password(label) {
      if (!process.stdin.isTTY || !process.stdout.isTTY) fail("NON_INTERACTIVE");
      process.stdout.write(`${label}: `);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      return new Promise<string>((resolve, reject) => {
        let value = "";
        const restore = () => {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
        };
        const onData = (chunk: string) => {
          // TTY streams may coalesce a complete password and its line ending
          // into one data event. Process the event character-by-character so
          // line control characters never become password material.
          if (chunk.includes("\u001b")) return;
          for (const character of chunk) {
            if (character === "\r" || character === "\n") {
              restore();
              process.stdout.write("\n");
              resolve(value);
              return;
            }
            if (character === "\u0003") {
              restore();
              reject(new AtlasCliError("INPUT_CANCELLED"));
              return;
            }
            if (character === "\u007f" || character === "\b") {
              value = Array.from(value).slice(0, -1).join("");
              continue;
            }
            value += character;
          }
        };
        process.stdin.on("data", onData);
      });
    },
  };
}

async function createDefaultService(): Promise<AtlasCliService> {
  const config = loadAtlasAuthConfig();
  const service = createAtlasAuth(config);
  return {
    coordinator: createAtlasBootstrapCoordinator(service),
    baseURL: config.baseURL,
    close: () => service.close(),
  };
}

function successOutput(write: (line: string) => void, email: string, baseURL: string): void {
  for (const line of [
    "ATLAS ADMIN BOOTSTRAP",
    "",
    "[PASS] Database connectivity",
    "[PASS] Authentication configuration",
    "[PASS] Bootstrap eligibility",
    "[PASS] Exclusive bootstrap reservation",
    "[PASS] Administrator identity created",
    "[PASS] Super Admin privilege assigned",
    "[PASS] Credentials ready for sign-in",
    "[PASS] Bootstrap state sealed",
    "",
    "SUCCESS",
    "",
    "Atlas Super Admin is ready.",
    "",
    `Email: ${email}`,
    "Role: Super Admin",
    "Status: Active",
    "",
    `Use the configured Better Auth sign-in endpoint: POST ${baseURL}/api/auth/sign-in/email`,
  ]) write(line);
}

function safeMessage(error: unknown): string {
  const code = error instanceof AtlasCliError || error instanceof AtlasBootstrapError ||
    (typeof error === "object" && error !== null && typeof (error as { code?: unknown }).code === "string")
    ? (error as { code: string }).code
    : "CONFIGURATION_FAILED";
  switch (code) {
    case "PASSWORD_ARGUMENT_FORBIDDEN": return "Passwords must be entered only at the interactive prompts.";
    case "INVALID_EMAIL": return "A valid --email value is required.";
    case "INVALID_NAME": return "A non-empty --name value is required.";
    case "ATTEMPT_ID_REQUIRED": return "A non-empty --attempt-id value is required for reconciliation.";
    case "NON_INTERACTIVE": return "Interactive password input requires a TTY.";
    case "PASSWORD_MISMATCH": return "The password confirmation did not match.";
    case "INPUT_CANCELLED": return "Password input was cancelled.";
    case "PROVISIONING_FAILED": return "Bootstrap provisioning failed. Verify configuration and the Better Auth password policy.";
    case "BOOTSTRAP_SEALED": return "Bootstrap is already sealed; no new administrator was created.";
    case "BOOTSTRAP_RESERVED": return "Bootstrap is reserved by an existing attempt; use only the recorded attempt ID with 'atlas admin reconcile --attempt-id'.";
    case "EMAIL_COLLISION": return "The requested email already belongs to an existing identity; no changes were made.";
    case "ATTEMPT_MISMATCH": return "The supplied attempt ID does not match the active bootstrap reservation.";
    case "RECONCILIATION_UNVERIFIED": return "The recorded attempt cannot be verified and remains unsealed.";
    case "INVALID_ARGUMENTS": return usage;
    default: return "Bootstrap configuration is unavailable or invalid.";
  }
}

/**
 * The sole native operator surface for AA-004. Privileged work is delegated
 * unchanged to AA-003; this module never reads or writes privileged tables.
 */
export async function runAtlasAdminCommand(args: readonly string[], dependencies: AtlasAdminCliDependencies = {}): Promise<number> {
  const write = dependencies.write ?? ((line: string) => process.stdout.write(`${line}\n`));
  try {
    if (args[0] !== "admin" || !args[1]) fail("INVALID_ARGUMENTS");
    const action = args[1];
    if (action !== "bootstrap" && action !== "reconcile") fail("INVALID_ARGUMENTS");

    if (action === "reconcile") {
      const { attemptId } = parseReconcile(args.slice(2));
      const service = await (dependencies.createService ?? createDefaultService)();
      try {
        const result = await service.coordinator.reconcile({ attemptId });
        write(`Bootstrap attempt ${result.attemptId} is sealed.`);
        return 0;
      } finally {
        await service.close();
      }
    }

    const { email, name } = parseBootstrap(args.slice(2));
    const prompt = dependencies.prompt ?? terminalPrompt();
    const password = await prompt.password("Initial password");
    const confirmation = await prompt.password("Confirm password");
    if (password !== confirmation) fail("PASSWORD_MISMATCH");
    const service = await (dependencies.createService ?? createDefaultService)();
    try {
      const result = await service.coordinator.provision({ email, name, password });
      if (result.state !== "SEALED") fail("PROVISIONING_FAILED");
      successOutput(write, email, service.baseURL);
      return 0;
    } finally {
      await service.close();
    }
  } catch (error) {
    write(`ERROR: ${safeMessage(error)}`);
    return 1;
  }
}
