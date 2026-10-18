import { timingSafeEqual } from "node:crypto";

export class InternalReceivingUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized internal service request.");
    this.name = "InternalReceivingUnauthorizedError";
  }
}

export type InternalReceivingBoundary<TInput, TResult> = Readonly<{
  receive(
    presentedCredential: string | undefined,
    rawBody: string
  ): Promise<TResult>;
}>;

export function createInternalReceivingBoundary<TInput, TResult>(
  options: Readonly<{
    serviceCredential: string;
    parseBody(rawBody: string): TInput;
    redeem(input: TInput): Promise<TResult>;
  }>
): InternalReceivingBoundary<TInput, TResult> {
  const expected = Buffer.from(options.serviceCredential, "utf8");
  if (expected.byteLength < 32) {
    throw new Error("Internal service credential must be at least 32 bytes.");
  }
  return {
    async receive(presentedCredential, rawBody) {
      if (typeof presentedCredential !== "string") {
        throw new InternalReceivingUnauthorizedError();
      }
      const actual = Buffer.from(presentedCredential, "utf8");
      if (
        actual.byteLength !== expected.byteLength ||
        !timingSafeEqual(actual, expected)
      ) {
        throw new InternalReceivingUnauthorizedError();
      }
      const parsed = options.parseBody(rawBody);
      return options.redeem(parsed);
    },
  };
}
