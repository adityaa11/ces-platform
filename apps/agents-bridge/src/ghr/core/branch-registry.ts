import type { GenericHandoffHeaderV1 } from "@atlas/contracts";

/**
 * The immutable header pins that select one branch-owned body contract.  This
 * is a composition type only: it neither authenticates the producer nor
 * authorizes, forwards, or executes a handoff.
 */
export type ExactBranchSelector = Readonly<{
  branch: GenericHandoffHeaderV1["route"]["branch"];
  producerProcessKey: GenericHandoffHeaderV1["producer"]["processKey"];
  policyVersion: GenericHandoffHeaderV1["route"]["policyVersion"];
  handlerVersion: GenericHandoffHeaderV1["route"]["handlerVersion"];
  bodyContractType: GenericHandoffHeaderV1["bodyContract"]["type"];
  bodyContractVersion: GenericHandoffHeaderV1["bodyContract"]["version"];
}>;

/**
 * Metadata for an inert branch declaration.  Future issuer and delivery work
 * must establish authority and execution separately from this registry.
 */
export type BranchRegistration = ExactBranchSelector & Readonly<{
  canContinue: false;
  payloadByteLimit: number;
  wrappedBodyByteLimit: number;
  receiverIdentity: string;
}>;

export class BranchRegistryResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BranchRegistryResolutionError";
  }
}

const selectorKey = (selector: ExactBranchSelector): string => [
  selector.branch,
  selector.producerProcessKey,
  selector.policyVersion,
  selector.handlerVersion,
  selector.bodyContractType,
  selector.bodyContractVersion,
].join("\u0000");

/** Creates an immutable, exact-match-only local domain registry. */
export function createBranchRegistry<const TRegistration extends BranchRegistration>(registrations: readonly TRegistration[]) {
  const entries = new Map<string, TRegistration>();
  for (const registration of registrations) {
    if (!registration.branch || !registration.producerProcessKey || !registration.policyVersion || !registration.handlerVersion || !registration.bodyContractType || !registration.bodyContractVersion || !registration.receiverIdentity) {
      throw new BranchRegistryResolutionError("Branch registrations require every exact selector and a symbolic receiver identity.");
    }
    if (!Number.isInteger(registration.payloadByteLimit) || registration.payloadByteLimit < 0 || !Number.isInteger(registration.wrappedBodyByteLimit) || registration.wrappedBodyByteLimit < registration.payloadByteLimit) {
      throw new BranchRegistryResolutionError("Branch registrations require non-negative integral payload and wrapper bounds.");
    }
    const key = selectorKey(registration);
    if (entries.has(key)) throw new BranchRegistryResolutionError("Duplicate exact branch registration.");
    entries.set(key, Object.freeze({ ...registration }));
  }

  return Object.freeze({
    resolve(selector: ExactBranchSelector): TRegistration {
      const registration = entries.get(selectorKey(selector));
      if (!registration) throw new BranchRegistryResolutionError("No exact branch registration matches the pinned handoff selector.");
      return registration;
    },
  });
}
