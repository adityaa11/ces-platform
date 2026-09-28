import type { SemanticBackgroundJob, SemanticSkillId } from "@atlas/contracts";

/**
 * Atlas-owned boundary for semantic work. Implementations validate the stored
 * execution scope; callers never supply an authoritative project scope.
 */
export type SemanticExecutionRequest = Pick<SemanticBackgroundJob, "executionId" | "skill" | "contextCapability">;

export type AuthorizedSemanticContext = {
  readonly executionId: string;
  readonly skill: { readonly id: SemanticSkillId; readonly version: "v1" };
  readonly scope: { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly executionId: string; readonly contractVersion: "v1" };
  /** Contract-valid, bounded extraction or reconciliation context only. */
  readonly context: unknown;
};

export type SemanticAcceptanceHandler = {
  /** Must commit all trusted effects before resolving. */
  accept(input: { readonly executionId: string; readonly completionFingerprint: string; readonly envelope: unknown }): Promise<void>;
};

/** IDSER-007 owns neighborhood policy. IDSER-004 only persists its bounded result. */
export type SemanticReconciliationSelectionPort = {
  select(scope: AuthorizedSemanticContext["scope"]): Promise<unknown>;
};

export interface SemanticAuthority {
  redeem(request: SemanticExecutionRequest): Promise<AuthorizedSemanticContext>;
  /** An unavailable downstream handler must reject rather than acknowledge. */
  deliver(envelope: unknown, handler: SemanticAcceptanceHandler): Promise<void>;
  fail(failure: unknown): Promise<void>;
}
