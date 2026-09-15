import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export type PutDocumentInput = {
  readonly bytes: Uint8Array;
  readonly mediaType: string;
  /** An optional previously generated key, useful when a caller retries its own request. */
  readonly storageKey?: string;
};

export type StoredDocument = {
  readonly storageKey: string;
  readonly contentHash: string;
  readonly byteSize: number;
  readonly mediaType: string;
};

export interface DocumentStore {
  put(input: PutDocumentInput): Promise<StoredDocument>;
  read(storageKey: string): Promise<Uint8Array>;
}

/** Storage keys are opaque document identities, never filesystem paths or business identifiers. */
export function createDocumentStorageKey(): string {
  return `documents/${randomUUID()}`;
}

function assertStorageKey(storageKey: string): void {
  if (!/^documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storageKey)) {
    throw new Error("Document storage key must be a generated documents UUID key.");
  }
}

function assertMediaType(mediaType: string): void {
  if (!/^[a-z]+\/[a-z0-9.+-]+(?:;[a-z0-9=._-]+)?$/i.test(mediaType)) {
    throw new Error("Document media type must be a valid media type.");
  }
}

export class DocumentAlreadyExistsError extends Error {
  constructor(storageKey: string) {
    super(`Document storage key already exists: ${storageKey}`);
    this.name = "DocumentAlreadyExistsError";
  }
}

/**
 * Development-only adapter. Production document persistence requires an
 * S3-compatible DocumentStore implementation using this same contract.
 */
export class LocalFilesystemDocumentStore implements DocumentStore {
  readonly #rootDirectory: string;

  constructor(rootDirectory = resolve(process.cwd(), ".atlas-data")) {
    this.#rootDirectory = resolve(rootDirectory);
  }

  async put(input: PutDocumentInput): Promise<StoredDocument> {
    if (!(input.bytes instanceof Uint8Array)) throw new Error("Document bytes must be a Uint8Array.");
    assertMediaType(input.mediaType);
    const storageKey = input.storageKey ?? createDocumentStorageKey();
    const targetPath = this.#resolveStorageKey(storageKey);
    const bytes = Buffer.from(input.bytes);
    try {
      await this.#prepareWriteTarget(targetPath);
      await writeFile(targetPath, bytes, { flag: "wx" });
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST") {
        throw new DocumentAlreadyExistsError(storageKey);
      }
      throw error;
    }
    return {
      storageKey,
      contentHash: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      byteSize: bytes.byteLength,
      mediaType: input.mediaType,
    };
  }

  async read(storageKey: string): Promise<Uint8Array> {
    const targetPath = this.#resolveStorageKey(storageKey);
    await this.#assertSafeExistingPath(this.#rootDirectory);
    await this.#assertSafeExistingPath(join(this.#rootDirectory, "documents"));
    await this.#assertSafeExistingPath(targetPath);
    return new Uint8Array(await readFile(targetPath));
  }

  #resolveStorageKey(storageKey: string): string {
    assertStorageKey(storageKey);
    const targetPath = resolve(this.#rootDirectory, storageKey);
    if (!targetPath.startsWith(`${this.#rootDirectory}\\`) && !targetPath.startsWith(`${this.#rootDirectory}/`)) {
      throw new Error("Document storage key escapes the configured root.");
    }
    return targetPath;
  }

  async #prepareWriteTarget(targetPath: string): Promise<void> {
    await mkdir(this.#rootDirectory, { recursive: true });
    await this.#assertSafeExistingPath(this.#rootDirectory);
    const documentsDirectory = join(this.#rootDirectory, "documents");
    await mkdir(documentsDirectory, { recursive: true });
    await this.#assertSafeExistingPath(documentsDirectory);
    await this.#assertSafeExistingPath(targetPath);
  }

  async #assertSafeExistingPath(path: string): Promise<void> {
    try {
      const entry = await lstat(path);
      if (entry.isSymbolicLink()) throw new Error("Document storage path contains a filesystem reparse point.");
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return;
      throw error;
    }
  }
}
