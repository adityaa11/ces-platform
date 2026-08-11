import { z } from "zod";
import {
  migrateSourceGlossaryV1ToGovernedV1_1,
  SourceGlossarySchema,
  validateSourceGlossaryTransition,
} from "./index.js";

const CHECKED_AT = "2026-08-11T12:20:00+00:00" as const;

export const CoreSourceRoleSchema = z.enum([
  "certification_anchor",
  "control_guidance",
  "application_security_verification",
  "adversarial_testing",
]);

export const CoreSourceSeedSchema = z.object({
  role: CoreSourceRoleSchema,
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
        retrieval_kind: "metadata_observation",
        observed_at: CHECKED_AT,
        observed_from: "https://www.iso.org/standard/27001",
        verified_metadata: "ISO/IEC 27001:2022 (Edition 3); Amendment ISO/IEC 27001:2022/Amd 1:2024; published 2022-10-25 and 2024-02-23",
        observation_hash: "sha256:7bbf4bdd153b438b70151e814081be1c81569db7eecbaf9c82bad47cbe5a2381",
      },
      last_checked_at: CHECKED_AT,
    },
  },
  {
    role: "control_guidance",
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
        retrieval_kind: "metadata_observation",
        observed_at: CHECKED_AT,
        observed_from: "https://www.iso.org/standard/75652.html",
        verified_metadata: "ISO/IEC 27002:2022 (Edition 3); published 2022-02-15; corrected English version 2022-03",
        observation_hash: "sha256:ca5d33e342afe99973c58fbdc2f37cd2d5e48e52623e3738ef90331d27606c5c",
      },
      last_checked_at: CHECKED_AT,
    },
  },
  {
    role: "application_security_verification",
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
        retrieval_kind: "metadata_observation",
        observed_at: CHECKED_AT,
        observed_from: "https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release",
        verified_metadata: "OWASP Application Security Verification Standard 5.0.0; tag v5.0.0_release; commit 5cf9b03; released 2025-05-30",
        observation_hash: "sha256:0d469f3ec6cd68f939aefc012985cf47725282010af080ece5b694057f28d2a6",
      },
      last_checked_at: CHECKED_AT,
    },
  },
  {
    role: "adversarial_testing",
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
        retrieval_kind: "metadata_observation",
        observed_at: CHECKED_AT,
        observed_from: "https://owasp.org/www-project-web-security-testing-guide/v42/",
        verified_metadata: "OWASP Web Security Testing Guide 4.2; released 2020-12-03; versioned path v42",
        observation_hash: "sha256:7829bca873c5f6b8e8ca21f7851d0e02c5602680373fb837578549bbb3fed081",
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

const NIST_SOURCE_ADDITIONS_V1_1 = [
  {
    family: {
      family_id: "nist.csf",
      canonical_name: "NIST Cybersecurity Framework",
      publisher: "National Institute of Standards and Technology",
      lifecycle: "active",
    },
    release: {
      release_id: "nist.csf.2-0",
      family_id: "nist.csf",
      edition: "2.0",
      release_label: "NIST Cybersecurity Framework 2.0 (NIST CSWP 29)",
      lifecycle: "published",
      publication: {
        published_on: "2024-02-26",
        authoritative_uri: "https://doi.org/10.6028/NIST.CSWP.29",
      },
      retrieval: {
        retrieval_kind: "metadata_observation",
        observed_at: CHECKED_AT,
        observed_from: "https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20",
        verified_metadata: "NIST Cybersecurity Framework 2.0; NIST CSWP 29; published 2024-02-26; DOI 10.6028/NIST.CSWP.29",
        observation_hash: "sha256:458021904211ac9ffa2ae48b9c85a765e30df49723502ea77170997734a1cc7c",
      },
      last_checked_at: CHECKED_AT,
    },
  },
  {
    family: {
      family_id: "nist.sp-800-53",
      canonical_name: "NIST SP 800-53",
      publisher: "National Institute of Standards and Technology",
      lifecycle: "active",
    },
    release: {
      release_id: "nist.sp-800-53.r5-2-0",
      family_id: "nist.sp-800-53",
      edition: "Rev. 5, Release 5.2.0",
      release_label: "NIST SP 800-53 Rev. 5, Release 5.2.0",
      lifecycle: "published",
      publication: {
        published_on: "2025-08-27",
        authoritative_uri: "https://csrc.nist.gov/Pubs/sp/800/53/r5/upd1/Final",
      },
      retrieval: {
        retrieval_kind: "metadata_observation",
        observed_at: CHECKED_AT,
        observed_from: "https://csrc.nist.gov/Pubs/sp/800/53/r5/upd1/Final",
        verified_metadata: "NIST SP 800-53 Rev. 5, Release 5.2.0; issued 2025-08-27; official NIST publication record and release announcement",
        observation_hash: "sha256:797939b7b3c451fc1e1cc6a91d0eae1f37b56e2928d177f8dbd3119ce4c958e2",
      },
      last_checked_at: CHECKED_AT,
    },
  },
] as const;

export const CES_POLICY_SOURCE_GLOSSARY_SUCCESSOR_V1_1 =
  validateSourceGlossaryTransition(CES_POLICY_CORE_SOURCE_GLOSSARY_V1, {
    ...CES_POLICY_CORE_SOURCE_GLOSSARY_V1,
    families: [...CES_POLICY_CORE_SOURCE_GLOSSARY_V1.families,
      ...NIST_SOURCE_ADDITIONS_V1_1.map(({ family }) => family)],
    releases: [...CES_POLICY_CORE_SOURCE_GLOSSARY_V1.releases,
      ...NIST_SOURCE_ADDITIONS_V1_1.map(({ release }) => release)],
  });

const AUTHORIZED_PROCESSING = {
  machine_processing: "AUTHORIZED",
  structured_extraction: "AUTHORIZED",
  ai_assisted_analysis: "AUTHORIZED",
} as const;

const REFERENCE_ONLY_PROCESSING = {
  machine_processing: "REFERENCE_ONLY",
  structured_extraction: "REFERENCE_ONLY",
  ai_assisted_analysis: "REFERENCE_ONLY",
} as const;

const DECIDED_AT = "2026-08-11T14:00:00+00:00" as const;
const NIST_RIGHTS_EVIDENCE = [
  "https://www.nist.gov/copyrights-disclaimers",
  "https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications",
] as const;

export const CES_POLICY_SOURCE_GOVERNANCE_V1_1 = [
  {
    release_id: "iso.iec-27001.2022-amd1-2024",
    family_id: "iso.iec-27001",
    role: "certification_alignment_target",
    source_class: "REFERENCE_ONLY",
    corpus_activation: "BLOCKED",
    processing: REFERENCE_ONLY_PROCESSING,
    rights: {
      classification: "ISO copyrighted licensed standard",
      evidence_uris: ["https://www.iso.org/terms-and-conditions.html"],
      attribution: "required",
      third_party_content: "separate_review_or_exclude",
      geographic_condition: "Use only under applicable ISO license and jurisdictional terms",
      additional_conditions: ["Machine extraction requires separately recorded written permission"],
    },
    decision: { revision_id: "pol-000-r01", decided_at: DECIDED_AT,
      rationale: "Retained as a certification alignment target without extraction authority" },
  },
  {
    release_id: "iso.iec-27002.2022",
    family_id: "iso.iec-27002",
    role: "control_alignment_target",
    source_class: "REFERENCE_ONLY",
    corpus_activation: "BLOCKED",
    processing: REFERENCE_ONLY_PROCESSING,
    rights: {
      classification: "ISO copyrighted licensed standard",
      evidence_uris: ["https://www.iso.org/terms-and-conditions.html"],
      attribution: "required",
      third_party_content: "separate_review_or_exclude",
      geographic_condition: "Use only under applicable ISO license and jurisdictional terms",
      additional_conditions: ["Machine extraction requires separately recorded written permission"],
    },
    decision: { revision_id: "pol-000-r01", decided_at: DECIDED_AT,
      rationale: "Retained as a control alignment target without extraction authority" },
  },
  {
    release_id: "owasp.asvs.5-0-0",
    family_id: "owasp.asvs",
    role: "application_security_verification",
    source_class: "CORE",
    corpus_activation: "ACTIVE",
    processing: AUTHORIZED_PROCESSING,
    rights: {
      classification: "Creative Commons Attribution-ShareAlike 4.0 International",
      evidence_uris: ["https://github.com/OWASP/ASVS/blob/v5.0.0_release/LICENSE.md"],
      attribution: "required",
      third_party_content: "separate_review_or_exclude",
      geographic_condition: "Apply the worldwide CC BY-SA 4.0 license terms",
      additional_conditions: ["Preserve attribution and applicable ShareAlike obligations"],
    },
    decision: { revision_id: "pol-000-r01", decided_at: DECIDED_AT,
      rationale: "Retained as a core application-security verification source" },
  },
  {
    release_id: "owasp.wstg.4-2",
    family_id: "owasp.wstg",
    role: "adversarial_testing",
    source_class: "CORE",
    corpus_activation: "ACTIVE",
    processing: AUTHORIZED_PROCESSING,
    rights: {
      classification: "Creative Commons Attribution-ShareAlike 4.0 International",
      evidence_uris: ["https://github.com/OWASP/wstg/blob/v4.2/LICENSE"],
      attribution: "required",
      third_party_content: "separate_review_or_exclude",
      geographic_condition: "Apply the worldwide CC BY-SA 4.0 license terms",
      additional_conditions: ["Preserve attribution and applicable ShareAlike obligations"],
    },
    decision: { revision_id: "pol-000-r01", decided_at: DECIDED_AT,
      rationale: "Retained as a core adversarial security testing source" },
  },
  {
    release_id: "nist.csf.2-0",
    family_id: "nist.csf",
    role: "security_governance_outcomes",
    source_class: "CORE",
    corpus_activation: "ACTIVE",
    processing: AUTHORIZED_PROCESSING,
    rights: {
      classification: "NIST-authored United States government publication",
      evidence_uris: [...NIST_RIGHTS_EVIDENCE,
        "https://www.nist.gov/cyberframework/faqs"],
      attribution: "required",
      third_party_content: "separate_review_or_exclude",
      geographic_condition: "Preserve NIST foreign-rights and worldwide-grant terms",
      additional_conditions: ["Do not imply NIST endorsement or certification"],
    },
    decision: { revision_id: "pol-000-r01", decided_at: DECIDED_AT,
      rationale: "Admitted as the core machine-processable governance outcome source" },
  },
  {
    release_id: "nist.sp-800-53.r5-2-0",
    family_id: "nist.sp-800-53",
    role: "security_control_catalog",
    source_class: "EVALUATION_SOURCE",
    corpus_activation: "ACTIVE",
    processing: AUTHORIZED_PROCESSING,
    rights: {
      classification: "NIST-authored United States government publication",
      evidence_uris: [...NIST_RIGHTS_EVIDENCE,
        "https://csrc.nist.gov/news/2025/nist-releases-revision-to-sp-800-53-controls"],
      attribution: "required",
      third_party_content: "separate_review_or_exclude",
      geographic_condition: "Preserve NIST foreign-rights and worldwide-grant terms",
      additional_conditions: ["Do not imply NIST endorsement or certification"],
    },
    decision: { revision_id: "pol-000-r01", decided_at: DECIDED_AT,
      rationale: "Admitted only for bounded evaluation of control-catalog value" },
  },
] as const;

export const CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1 =
  migrateSourceGlossaryV1ToGovernedV1_1(
    CES_POLICY_SOURCE_GLOSSARY_SUCCESSOR_V1_1,
    "ces-policies.source-glossary.v1-1",
    "ces-policies.source-glossary.v1",
    CES_POLICY_SOURCE_GOVERNANCE_V1_1,
  );
