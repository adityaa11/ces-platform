import { createHash } from "node:crypto";
import { z } from "zod";

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);
const Atom = z.object({ atom_id: Id, subject: Id, action: Id, object: Id,
  qualifier: Id.optional() }).strict();
const Row = z.object({ locator: Text, source_term: Text, exact_excerpt: Text,
  semantic_role: z.literal("requirement"), scope_disposition: z.literal("software_relevant"),
  semantic_atoms: z.array(Atom).min(1) }).strict();
const PredecessorMeaning = z.object({ meaning_id: Id, concept_id: Id,
  semantic_atoms: z.array(Atom).min(1) }).strict();

export const GovernedSourceRowArtifactSchema = z.object({
  schema_version: z.literal("1.0.0"), artifact_id: Id, release_id: Id,
  upstream_artifact_hash: Hash, hash_scope: Text, rows: z.array(Row).min(1), content_hash: Hash,
  predecessor_meanings: z.array(PredecessorMeaning),
}).strict().superRefine((value, context) => {
  const digest = `sha256:${createHash("sha256").update(JSON.stringify({ release_id: value.release_id,
    upstream_artifact_hash: value.upstream_artifact_hash, rows: value.rows,
    predecessor_meanings: value.predecessor_meanings }), "utf8").digest("hex")}`;
  if (digest !== value.content_hash) context.addIssue({ code: "custom",
    message: `Governed source rows do not match content evidence (${digest})` });
  const locators = value.rows.map(({ locator }) => locator);
  if (new Set(locators).size !== locators.length) context.addIssue({ code: "custom",
    message: "Governed source row locators must be unique" });
});

export const CES_POLICY_ASVS_GOVERNED_SOURCE_ROWS_V1 = GovernedSourceRowArtifactSchema.parse({
  schema_version: "1.0.0", artifact_id: "governed-source-rows.owasp-asvs-5-0-0.v1",
  release_id: "owasp.asvs.5-0-0",
  upstream_artifact_hash: "sha256:98c8fe911b9edb403af8ee05d3ce8201ecac2659e313b053890a62847cdcf680",
  hash_scope: "Ordered JSON of release, upstream hash, governed rows, and semantic predecessor mappings",
  rows: [
    { locator: "v5.0.0-V14.1.1", source_term: "Data Protection Documentation",
      exact_excerpt: "Verify that all sensitive data created and processed by the application is identified and classified into protection levels that account for applicable data-protection and privacy requirements, including easily decoded data.",
      semantic_role: "requirement", scope_disposition: "software_relevant",
      semantic_atoms: [{ atom_id: "atom.identify-classify-sensitive-data", subject: "application",
        action: "identify-classify", object: "sensitive-data", qualifier: "protection-requirements" }],
    },
    { locator: "v5.0.0-V14.2.6", source_term: "General Data Protection",
      exact_excerpt: "Verify that the application returns only the minimum sensitive data required for its functionality and, when complete data is required, masks it in the user interface unless the user specifically views it.",
      semantic_role: "requirement", scope_disposition: "software_relevant",
      semantic_atoms: [{ atom_id: "atom.minimize-sensitive-data-disclosure", subject: "application",
        action: "minimize-mask", object: "sensitive-data", qualifier: "functional-need" }],
    },
    { locator: "v5.0.0-V14.2.1", source_term: "General Data Protection",
      exact_excerpt: "Verify that sensitive data is not placed in URLs or query strings and is sent only in appropriate HTTP message locations.",
      semantic_role: "requirement", scope_disposition: "software_relevant",
      semantic_atoms: [{ atom_id: "atom.exclude-sensitive-data-from-url", subject: "application",
        action: "exclude", object: "sensitive-data", qualifier: "url-query-string" }],
    },
  ],
  predecessor_meanings: [{ meaning_id: "meaning.raw-asvs-v14-2-1", concept_id: "raw.asvs.v14-2-1",
    semantic_atoms: [{ atom_id: "atom.exclude-sensitive-data-from-url", subject: "application",
      action: "exclude", object: "sensitive-data", qualifier: "url-query-string" }] }],
  content_hash: "sha256:6172f2a5702120b48a5dd9e0712101add0a37e5e118f39299d47cac0556e129c",
});

export type GovernedSourceRowArtifact = z.infer<typeof GovernedSourceRowArtifactSchema>;
