import { z } from "zod";
import { SourceGlossarySchema } from "./index.js";

const CHECKED_AT = "2026-08-11T12:20:00+00:00" as const;

export const CoreSourceRoleSchema = z.enum([
  "certification_anchor",
  "control_guidance",
  "application_security_verification",
  "adversarial_testing",
]);

export const CoreSourceSeedSchema = z.object({
  role: CoreSourceRoleSchema,
  verified_metadata: z.string().min(1),
  hash_scope: z.literal("utf8_sha256_of_verified_metadata"),
  source_content_access: z.object({
    license_or_terms: z.string().min(1),
    machine_use: z.enum([
      "prohibited_without_written_permission",
      "permitted_with_license_compliance",
    ]),
    extraction_prerequisite: z.string().min(1),
  }).strict(),
  verification_evidence_uris: z.array(z.url()).min(1),
  family: z.unknown(),
  release: z.unknown(),
}).strict();

export const CES_POLICY_CORE_SOURCE_SEEDS_V1 = [
  {
    role: "certification_anchor",
    verified_metadata: "ISO/IEC 27001:2022 (Edition 3); Amendment ISO/IEC 27001:2022/Amd 1:2024; published 2022-10-25 and 2024-02-23",
    hash_scope: "utf8_sha256_of_verified_metadata",
    source_content_access: {
      license_or_terms: "ISO copyright and terms of use",
      machine_use: "prohibited_without_written_permission",
      extraction_prerequisite: "Obtain a licensed copy and written permission that explicitly allows the intended AI-assisted extraction before POL-006 processes publication content.",
    },
    verification_evidence_uris: [
      "https://www.iso.org/standard/27001",
      "https://www.iso.org/standard/88435.html",
    ],
    family: {
      family_id: "iso.iec-27001",
      canonical_name: "ISO/IEC 27001",
      publisher: "ISO and IEC",
      lifecycle: "active",
    },
    release: {
      release_id: "iso.iec-27001.2022-amd1-2024",
      family_id: "iso.iec-27001",
      edition: "2022+Amd1:2024",
      release_label: "ISO/IEC 27001:2022 with Amendment 1:2024",
      lifecycle: "published",
      publication: {
        published_on: "2024-02-23",
        authoritative_uri: "https://www.iso.org/standard/27001",
      },
      retrieval: {
        retrieved_at: CHECKED_AT,
        retrieved_from: "https://www.iso.org/standard/27001",
        content_hash: "sha256:7bbf4bdd153b438b70151e814081be1c81569db7eecbaf9c82bad47cbe5a2381",
      },
      last_checked_at: CHECKED_AT,
    },
  },
  {
    role: "control_guidance",
    verified_metadata: "ISO/IEC 27002:2022 (Edition 3); published 2022-02-15; corrected English version 2022-03",
    hash_scope: "utf8_sha256_of_verified_metadata",
    source_content_access: {
      license_or_terms: "ISO copyright and terms of use",
      machine_use: "prohibited_without_written_permission",
      extraction_prerequisite: "Obtain a licensed copy and written permission that explicitly allows the intended AI-assisted extraction before POL-006 processes publication content.",
    },
    verification_evidence_uris: ["https://www.iso.org/standard/75652.html"],
    family: {
      family_id: "iso.iec-27002",
      canonical_name: "ISO/IEC 27002",
      publisher: "ISO and IEC",
      lifecycle: "active",
    },
    release: {
      release_id: "iso.iec-27002.2022",
      family_id: "iso.iec-27002",
      edition: "2022",
      release_label: "ISO/IEC 27002:2022 Edition 3",
      lifecycle: "published",
      publication: {
        published_on: "2022-02-15",
        authoritative_uri: "https://www.iso.org/standard/75652.html",
      },
      retrieval: {
        retrieved_at: CHECKED_AT,
        retrieved_from: "https://www.iso.org/standard/75652.html",
        content_hash: "sha256:ca5d33e342afe99973c58fbdc2f37cd2d5e48e52623e3738ef90331d27606c5c",
      },
      last_checked_at: CHECKED_AT,
    },
  },
  {
    role: "application_security_verification",
    verified_metadata: "OWASP Application Security Verification Standard 5.0.0; tag v5.0.0_release; commit 5cf9b03; released 2025-05-30",
    hash_scope: "utf8_sha256_of_verified_metadata",
    source_content_access: {
      license_or_terms: "Creative Commons Attribution-ShareAlike 4.0 International",
      machine_use: "permitted_with_license_compliance",
      extraction_prerequisite: "Preserve attribution, release identity, and ShareAlike obligations for adapted material.",
    },
    verification_evidence_uris: [
      "https://owasp.org/www-project-application-security-verification-standard/",
      "https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release",
    ],
    family: {
      family_id: "owasp.asvs",
      canonical_name: "OWASP ASVS",
      publisher: "OWASP Foundation",
      lifecycle: "active",
    },
    release: {
      release_id: "owasp.asvs.5-0-0",
      family_id: "owasp.asvs",
      edition: "5.0.0",
      release_label: "OWASP ASVS 5.0.0",
      lifecycle: "published",
      publication: {
        published_on: "2025-05-30",
        authoritative_uri: "https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release",
      },
      retrieval: {
        retrieved_at: CHECKED_AT,
        retrieved_from: "https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release",
        content_hash: "sha256:0d469f3ec6cd68f939aefc012985cf47725282010af080ece5b694057f28d2a6",
      },
      last_checked_at: CHECKED_AT,
    },
  },
  {
    role: "adversarial_testing",
    verified_metadata: "OWASP Web Security Testing Guide 4.2; released 2020-12-03; versioned path v42",
    hash_scope: "utf8_sha256_of_verified_metadata",
    source_content_access: {
      license_or_terms: "Creative Commons Attribution-ShareAlike 4.0 International",
      machine_use: "permitted_with_license_compliance",
      extraction_prerequisite: "Preserve attribution, versioned scenario identifiers, and ShareAlike obligations for adapted material.",
    },
    verification_evidence_uris: [
      "https://owasp.org/www-project-web-security-testing-guide/",
      "https://owasp.org/www-project-web-security-testing-guide/v42/",
    ],
    family: {
      family_id: "owasp.wstg",
      canonical_name: "OWASP WSTG",
      publisher: "OWASP Foundation",
      lifecycle: "active",
    },
    release: {
      release_id: "owasp.wstg.4-2",
      family_id: "owasp.wstg",
      edition: "4.2",
      release_label: "OWASP WSTG 4.2",
      lifecycle: "published",
      publication: {
        published_on: "2020-12-03",
        authoritative_uri: "https://owasp.org/www-project-web-security-testing-guide/v42/",
      },
      retrieval: {
        retrieved_at: CHECKED_AT,
        retrieved_from: "https://owasp.org/www-project-web-security-testing-guide/v42/",
        content_hash: "sha256:7829bca873c5f6b8e8ca21f7851d0e02c5602680373fb837578549bbb3fed081",
      },
      last_checked_at: CHECKED_AT,
    },
  },
] as const;

export const CES_POLICY_CORE_SOURCE_GLOSSARY_V1 = SourceGlossarySchema.parse({
  schema_version: "1.0.0",
  families: CES_POLICY_CORE_SOURCE_SEEDS_V1.map(({ family }) => family),
  releases: CES_POLICY_CORE_SOURCE_SEEDS_V1.map(({ release }) => release),
  supersessions: [],
});

export function validateCoreSourceSeedsV1() {
  const seeds = CES_POLICY_CORE_SOURCE_SEEDS_V1.map((seed) => CoreSourceSeedSchema.parse(seed));
  const expected = new Set(["iso.iec-27001", "iso.iec-27002", "owasp.asvs", "owasp.wstg"]);
  const actual = new Set(CES_POLICY_CORE_SOURCE_GLOSSARY_V1.families.map(({ family_id }) => family_id));
  if (actual.size !== expected.size || [...expected].some((id) => !actual.has(id))) {
    throw new Error("CES Policies v1 must contain exactly the four frozen source families");
  }
  return seeds;
}
