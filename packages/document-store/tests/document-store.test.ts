import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DocumentAlreadyExistsError, LocalFilesystemDocumentStore, createDocumentStorageKey } from "../src/index.ts";

test("local store preserves bytes and returns storage metadata without a local path", async () => {
  const root = await mkdtemp(join(tmpdir(), "atlas-document-store-"));
  try {
    const store = new LocalFilesystemDocumentStore(root);
    const document = await store.put({ bytes: new TextEncoder().encode("immutable source"), mediaType: "text/plain" });
    assert.match(document.storageKey, /^documents\//);
    assert.equal(document.contentHash, "sha256:fc17afe4af56fca9d2943b7901e7517611b37a36db7a7775b3e341e7d20a6ba0");
    assert.equal(document.byteSize, 16);
    assert.equal(document.mediaType, "text/plain");
    assert.equal(document.storageKey.includes(root), false);
    assert.deepEqual(await store.read(document.storageKey), new TextEncoder().encode("immutable source"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local store rejects overwrites and unsafe keys without leaving its root", async () => {
  const root = await mkdtemp(join(tmpdir(), "atlas-document-store-"));
  try {
    const store = new LocalFilesystemDocumentStore(root);
    const storageKey = createDocumentStorageKey();
    await store.put({ bytes: new Uint8Array([1]), mediaType: "application/octet-stream", storageKey });
    await assert.rejects(
      () => store.put({ bytes: new Uint8Array([2]), mediaType: "application/octet-stream", storageKey }),
      DocumentAlreadyExistsError,
    );
    await assert.rejects(() => store.read("../outside"), /generated documents UUID key/);
    await assert.rejects(() => store.put({ bytes: new Uint8Array([1]), mediaType: "application/octet-stream", storageKey: "documents/../../outside" }), /generated documents UUID key/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local store rejects a documents-directory reparse point", async () => {
  const root = await mkdtemp(join(tmpdir(), "atlas-document-store-root-"));
  const outside = await mkdtemp(join(tmpdir(), "atlas-document-store-outside-"));
  try {
    await symlink(outside, join(root, "documents"), process.platform === "win32" ? "junction" : "dir");
    const store = new LocalFilesystemDocumentStore(root);
    await assert.rejects(
      () => store.put({ bytes: new Uint8Array([1]), mediaType: "application/octet-stream" }),
      /reparse point/,
    );
    assert.deepEqual(await readdir(outside), []);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
