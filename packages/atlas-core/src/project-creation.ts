import { randomUUID } from "node:crypto";
import type { DocumentStore } from "@atlas/document-store";
import { projectIdPattern, type AtlasProjectRepository, type CreateAtlasProjectInput, type ProjectSourceDocument } from "./project.js";

export const maxProjectSourceBytes = 20 * 1024 * 1024;
export const maxProjectSources = 10;
export const maxProjectRequestBytes = 40 * 1024 * 1024;

export type CreateProjectSource = {
  readonly originalFilename: string;
  readonly bytes: Uint8Array;
  readonly mediaType: string;
};

export type CreateStoredAtlasProjectCommand = {
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  /** This identity must come from the authenticated server boundary. */
  readonly creatorUserId: string;
  readonly sources: readonly CreateProjectSource[];
};

export type CreatedAtlasProject = {
  readonly projectId: string;
  readonly name: string;
  readonly documentCount: number;
};

export class ProjectCreationConflictError extends Error {
  constructor(projectId: string) {
    super(`A project with ID ${projectId} already exists.`);
    this.name = "ProjectCreationConflictError";
  }
}

export class ProjectCreationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectCreationValidationError";
  }
}

function assertCommand(command: CreateStoredAtlasProjectCommand): void {
  if (!projectIdPattern.test(command.projectId)) throw new ProjectCreationValidationError("Project ID must be 3-48 lowercase letters, numbers, or hyphens.");
  if (!command.creatorUserId) throw new ProjectCreationValidationError("Creator identity is required.");
  if (!command.name.trim() || command.name.length > 80) throw new ProjectCreationValidationError("Project name must be 1-80 characters.");
  if (command.description !== null && command.description.length > 280) throw new ProjectCreationValidationError("Project description must be at most 280 characters.");
  if (!command.sources.length || command.sources.length > maxProjectSources) throw new ProjectCreationValidationError(`A project must include 1-${maxProjectSources} source documents.`);
  let totalBytes = 0;
  for (const source of command.sources) {
    if (!source.originalFilename || source.originalFilename.length > 255) throw new ProjectCreationValidationError("Source filename is required and must be at most 255 characters.");
    if (source.mediaType.toLowerCase() !== "application/pdf") throw new ProjectCreationValidationError("Source documents must be PDFs.");
    if (!(source.bytes instanceof Uint8Array) || !source.bytes.byteLength) throw new ProjectCreationValidationError("Source document bytes are required.");
    if (source.bytes.byteLength > maxProjectSourceBytes) throw new ProjectCreationValidationError("A source document exceeds the 20 MiB limit.");
    if (new TextDecoder().decode(source.bytes.subarray(0, 5)) !== "%PDF-") throw new ProjectCreationValidationError("Source document does not have a PDF signature.");
    totalBytes += source.bytes.byteLength;
    if (totalBytes > maxProjectRequestBytes) throw new ProjectCreationValidationError("Source documents exceed the total request limit.");
  }
}

function normalizeSha256(contentHash: string): string {
  const match = /^sha256:([a-f0-9]{64})$/.exec(contentHash);
  if (!match) throw new ProjectCreationValidationError("DocumentStore returned an invalid content hash.");
  return match[1];
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (("code" in error && error.code === "23505") || ("message" in error && typeof error.message === "string" && /duplicate key|unique constraint/i.test(error.message)));
}

/** Stores immutable sources before the single Atlas metadata transaction. */
export async function createStoredAtlasProject(command: CreateStoredAtlasProjectCommand, dependencies: { readonly documentStore: DocumentStore; readonly projectRepository: AtlasProjectRepository }): Promise<CreatedAtlasProject> {
  assertCommand(command);
  if (!await dependencies.projectRepository.isProjectIdAvailable(command.projectId)) throw new ProjectCreationConflictError(command.projectId);

  const documents: ProjectSourceDocument[] = [];
  for (const source of command.sources) {
    const stored = await dependencies.documentStore.put({ bytes: source.bytes, mediaType: "application/pdf" });
    if (stored.mediaType !== "application/pdf" || stored.byteSize !== source.bytes.byteLength) throw new ProjectCreationValidationError("DocumentStore returned inconsistent source metadata.");
    documents.push({ id: randomUUID(), originalFilename: source.originalFilename, storageKey: stored.storageKey, sourceSha256: normalizeSha256(stored.contentHash), byteSize: stored.byteSize, mediaType: "application/pdf", createdByUserId: command.creatorUserId });
  }

  const input: CreateAtlasProjectInput = { id: randomUUID(), projectId: command.projectId, name: command.name.trim(), description: command.description, creatorUserId: command.creatorUserId, masterWorkspaceId: randomUUID(), initialDraftWorkspaceId: randomUUID(), documents };
  try {
    await dependencies.projectRepository.create(input);
  } catch (error) {
    if (isUniqueViolation(error)) throw new ProjectCreationConflictError(command.projectId);
    throw error;
  }
  return { projectId: input.projectId, name: input.name, documentCount: documents.length };
}
