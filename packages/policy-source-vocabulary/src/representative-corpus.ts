import { z } from "zod";
import { CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1 } from
  "@company/ces-policy-source-glossary/core-sources";
import { RawSourceVocabularySchema, validateGovernedRawSourceVocabulary } from "./index.js";

const EXTRACTED_AT = "2026-08-11T15:00:00+00:00" as const;
const EXTRACTOR_ID = "ces.pol-006.structured-extractor" as const;
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

const ArtifactEvidenceSchema = z.object({
  release_id: z.string().min(1), source_uri: z.url(),
  artifact_format: z.enum(["xlsx", "oscal_json", "csv", "tagged_repository_zip"]),
  sha256: Sha256Schema, pinned_revision: z.string().min(1),
  retrieved_at: z.iso.datetime({ offset: true }), attribution: z.string().min(1),
  reuse_notice: z.string().min(1),
}).strict();

export const Sp80053ContributionSchema = z.enum([
  "UNIQUE_VALUE", "REINFORCES_EXISTING_CONCEPT",
  "OUT_OF_SCOPE_ORGANIZATIONAL", "DUPLICATE_NOISE",
]);

export const RepresentativeExtractionCorpusSchema = z.object({
  corpus_id: z.literal("ces-policies.raw-vocabulary.representative-v1-1"),
  extraction_contract_revision: z.literal("pol-006-r01"),
  artifacts: z.array(ArtifactEvidenceSchema).length(4),
  vocabularies: z.array(RawSourceVocabularySchema).length(4),
  sp800_53_evaluation: z.array(z.object({ concept_id: z.string().min(1),
    contribution: Sp80053ContributionSchema, rationale: z.string().min(1) }).strict()),
}).strict().superRefine((corpus, context) => {
  const releases = corpus.vocabularies.map(({ source_release_id }) => source_release_id);
  if (new Set(releases).size !== releases.length) {
    context.addIssue({ code: "custom", message: "Representative vocabularies must be per-release" });
  }
  const spConceptIds = new Set(corpus.vocabularies
    .find(({ source_release_id }) => source_release_id === "nist.sp-800-53.r5-2-0")
    ?.concepts.map(({ concept_id }) => concept_id) ?? []);
  if (corpus.sp800_53_evaluation.some(({ concept_id }) => !spConceptIds.has(concept_id))) {
    context.addIssue({ code: "custom",
      message: "SP 800-53 evaluation must reference an extracted SP 800-53 concept" });
  }
});

export const CES_POLICY_SOURCE_ARTIFACTS_V1_1 = [
  { release_id: "nist.csf.2-0",
    source_uri: "https://csrc.nist.gov/extensions/nudp/services/json/csf/download",
    artifact_format: "xlsx",
    sha256: "sha256:3c719517ab57cbd4c1a6f30a4c5d9f0b2a4519e5e9cef4e20c1786b87d26e311",
    pinned_revision: "NIST CSF 2.0 Reference Tool final Core export retrieved 2026-08-11",
    retrieved_at: EXTRACTED_AT,
    attribution: "National Institute of Standards and Technology, NIST CSWP 29",
    reuse_notice: "NIST-authored Core only; preserve NIST foreign-rights terms, exclude or separately review third-party material, and do not imply NIST endorsement." },
  { release_id: "nist.sp-800-53.r5-2-0",
    source_uri: "https://raw.githubusercontent.com/usnistgov/oscal-content/78650f02ad9321bb7b817846f8fbd4f2bcd620de/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json",
    artifact_format: "oscal_json",
    sha256: "sha256:01f37cf90ea99d92242c936cbfbdebcc338eef1f71454e2acac36cc56e9bc062",
    pinned_revision: "usnistgov/oscal-content commit 78650f02ad9321bb7b817846f8fbd4f2bcd620de; catalog version 5.2.0",
    retrieved_at: EXTRACTED_AT,
    attribution: "National Institute of Standards and Technology, NIST SP 800-53 Rev. 5 Release 5.2.0",
    reuse_notice: "NIST-authored catalog only; preserve NIST foreign-rights terms, exclude or separately review third-party material, and do not imply NIST endorsement." },
  { release_id: "owasp.asvs.5-0-0",
    source_uri: "https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0_release/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv",
    artifact_format: "csv",
    sha256: "sha256:98c8fe911b9edb403af8ee05d3ce8201ecac2659e313b053890a62847cdcf680",
    pinned_revision: "OWASP/ASVS tag v5.0.0_release commit 5cf9b032440be53ce345ab3c130fda46ba1ce7a2",
    retrieved_at: EXTRACTED_AT,
    attribution: "OWASP Application Security Verification Standard 5.0.0, CC BY-SA 4.0",
    reuse_notice: "Extracted or adapted ASVS material remains subject to attribution and ShareAlike under CC BY-SA 4.0." },
  { release_id: "owasp.wstg.4-2",
    source_uri: "https://codeload.github.com/OWASP/wstg/zip/refs/tags/v4.2",
    artifact_format: "tagged_repository_zip",
    sha256: "sha256:3eb8490a828704ce0c1976b520b09494d312e662ac483f8fe04e522b570a4220",
    pinned_revision: "OWASP/wstg tag v4.2 commit e7267903759671fa38b478628725d8ef78d07c03",
    retrieved_at: EXTRACTED_AT,
    attribution: "OWASP Web Security Testing Guide 4.2, CC BY-SA 4.0",
    reuse_notice: "Extracted or adapted WSTG material remains subject to attribution and ShareAlike under CC BY-SA 4.0." },
] as const;

const artifactByRelease = new Map<string, (typeof CES_POLICY_SOURCE_ARTIFACTS_V1_1)[number]>(
  CES_POLICY_SOURCE_ARTIFACTS_V1_1.map((value) => [value.release_id, value]),
);

function concept(releaseId: string, id: string, locatorType: "section" | "control" |
  "requirement" | "test_scenario", locator: string, sourceTerm: string,
  description: string, semanticRole: "objective" | "control" | "requirement" |
  "risk_concern" | "verification_context", disposition: "software_relevant" |
  "out_of_scope_organizational" | "review_required", sourceUri: string) {
  const artifact = artifactByRelease.get(releaseId);
  if (!artifact) throw new Error(`Missing source artifact for ${releaseId}`);
  return { concept_id: id, source_release_id: releaseId,
    source_locator: { locator_type: locatorType, locator, source_uri: sourceUri, language: "en" },
    source_term: sourceTerm, bounded_description: description, semantic_role: semanticRole,
    scope_disposition: disposition,
    provenance: { extraction_method: "agent_assisted" as const,
      extracted_at: EXTRACTED_AT, extractor_id: EXTRACTOR_ID,
      extraction_input: { hash: artifact.sha256,
        hash_scope: `Complete pinned ${artifact.artifact_format} artifact` } },
    review_status: "candidate" as const };
}

const CSF_URI = "https://csrc.nist.gov/projects/cybersecurity-framework/filters#/csf/filters";
const SP_URI = "https://github.com/usnistgov/oscal-content/blob/78650f02ad9321bb7b817846f8fbd4f2bcd620de/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json";
const ASVS_URI = "https://github.com/OWASP/ASVS/blob/v5.0.0_release/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv";
const WSTG_ROOT = "https://github.com/OWASP/wstg/blob/v4.2/document/4-Web_Application_Security_Testing";

const vocabularies = [
  { schema_version: "1.0.0", vocabulary_id: "raw-vocabulary.nist-csf-2-0.representative",
    source_release_id: "nist.csf.2-0", concepts: [
      concept("nist.csf.2-0", "raw.nist-csf.gv-oc-04", "section", "GV.OC-04",
        "Critical objectives, capabilities, and services",
        "Critical objectives, capabilities, and services that external stakeholders depend on or expect from the organization are understood and communicated.",
        "objective", "review_required", CSF_URI),
      concept("nist.csf.2-0", "raw.nist-csf.id-am-05", "section", "ID.AM-05", "Assets are prioritized",
        "Assets are prioritized based on classification, criticality, resources, and impact on the mission.",
        "objective", "software_relevant", CSF_URI),
      concept("nist.csf.2-0", "raw.nist-csf.pr-aa-05", "section", "PR.AA-05",
        "Access permissions, entitlements, and authorizations",
        "Access permissions, entitlements, and authorizations are defined in policy, managed, enforced, and reviewed with least privilege and separation of duties.",
        "objective", "software_relevant", CSF_URI),
      concept("nist.csf.2-0", "raw.nist-csf.de-cm-01", "section", "DE.CM-01",
        "Networks and network services are monitored",
        "Networks and network services are monitored to find potentially adverse events.",
        "objective", "software_relevant", CSF_URI),
      concept("nist.csf.2-0", "raw.nist-csf.rs-ma-01", "section", "RS.MA-01",
        "The incident response plan is executed",
        "The incident response plan is executed in coordination with relevant third parties once an incident is declared.",
        "objective", "review_required", CSF_URI),
      concept("nist.csf.2-0", "raw.nist-csf.rc-rp-03", "section", "RC.RP-03",
        "The integrity of backups and other restoration assets",
        "The integrity of backups and other restoration assets is verified before using them for restoration.",
        "objective", "software_relevant", CSF_URI),
    ] },
  { schema_version: "1.0.0", vocabulary_id: "raw-vocabulary.nist-sp-800-53-5-2-0.representative",
    source_release_id: "nist.sp-800-53.r5-2-0", concepts: [
      concept("nist.sp-800-53.r5-2-0", "raw.nist-sp800-53.ac-3", "control", "AC-3", "Access Enforcement",
        "Enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.",
        "control", "software_relevant", SP_URI),
      concept("nist.sp-800-53.r5-2-0", "raw.nist-sp800-53.au-2", "control", "AU-2", "Event Logging",
        "Identify and coordinate event types for system logging so the audit function and after-the-fact incident investigations are supported.",
        "control", "software_relevant", SP_URI),
      concept("nist.sp-800-53.r5-2-0", "raw.nist-sp800-53.cp-10", "control", "CP-10", "System Recovery and Reconstitution",
        "Provide for recovery and reconstitution of the system to a known state after disruption, compromise, or failure.",
        "control", "software_relevant", SP_URI),
      concept("nist.sp-800-53.r5-2-0", "raw.nist-sp800-53.si-2", "control", "SI-2", "Flaw Remediation",
        "Identify, report, and correct system flaws and test security-relevant updates for effectiveness and side effects before installation.",
        "control", "software_relevant", SP_URI),
      concept("nist.sp-800-53.r5-2-0", "raw.nist-sp800-53.sr-3", "control", "SR-3", "Supply Chain Controls and Processes",
        "Establish processes to identify and address weaknesses or deficiencies in supply chain elements and processes.",
        "control", "review_required", SP_URI),
    ] },
  { schema_version: "1.0.0", vocabulary_id: "raw-vocabulary.owasp-asvs-5-0-0.representative",
    source_release_id: "owasp.asvs.5-0-0", concepts: [
      concept("owasp.asvs.5-0-0", "raw.asvs.v2-3-1", "requirement", "v5.0.0-V2.3.1", "Business Logic Security",
        "Verify that the application processes a user's business logic flow in the expected sequential order without skipped steps.",
        "requirement", "software_relevant", ASVS_URI),
      concept("owasp.asvs.5-0-0", "raw.asvs.v2-3-3", "requirement", "v5.0.0-V2.3.3", "Business Logic Security",
        "Verify that a business logic operation succeeds in its entirety or is rolled back to the previous correct state.",
        "requirement", "software_relevant", ASVS_URI),
      concept("owasp.asvs.5-0-0", "raw.asvs.v6-2-1", "requirement", "v5.0.0-V6.2.1", "Password Security",
        "Verify that user-set passwords satisfy the source requirement's minimum length expectations.",
        "requirement", "software_relevant", ASVS_URI),
      concept("owasp.asvs.5-0-0", "raw.asvs.v7-2-1", "requirement", "v5.0.0-V7.2.1", "Fundamental Session Management Security",
        "Verify that the application performs all session-token verification using a trusted backend service.",
        "requirement", "software_relevant", ASVS_URI),
      concept("owasp.asvs.5-0-0", "raw.asvs.v13-2-1", "requirement", "v5.0.0-V13.2.1", "Backend Communication Configuration",
        "Verify that communications between backend application components are authenticated when they do not use the application's standard user-session mechanism.",
        "requirement", "software_relevant", ASVS_URI),
      concept("owasp.asvs.5-0-0", "raw.asvs.v14-2-1", "requirement", "v5.0.0-V14.2.1", "General Data Protection",
        "Verify that sensitive data is not placed in URLs or query strings and is sent only in appropriate HTTP message locations.",
        "requirement", "software_relevant", ASVS_URI),
    ] },
  { schema_version: "1.0.0", vocabulary_id: "raw-vocabulary.owasp-wstg-4-2.representative",
    source_release_id: "owasp.wstg.4-2", concepts: [
      concept("owasp.wstg.4-2", "raw.wstg.athz-04.context", "test_scenario", "WSTG-v42-ATHZ-04",
        "Testing for Insecure Direct Object References",
        "Identify object-reference points and assess whether their access-control measures are vulnerable to insecure direct object references.",
        "verification_context", "software_relevant", `${WSTG_ROOT}/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References.md`),
      concept("owasp.wstg.4-2", "raw.wstg.athz-04.concern", "test_scenario", "WSTG-v42-ATHZ-04",
        "Insecure Direct Object References",
        "An object reference may expose a resource when access-control measures do not enforce the requesting subject's authorization.",
        "risk_concern", "software_relevant", `${WSTG_ROOT}/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References.md`),
      concept("owasp.wstg.4-2", "raw.wstg.sess-07", "test_scenario", "WSTG-v42-SESS-07", "Testing Session Timeout",
        "Validate that a hard session timeout exists and that the server prevents replay of destroyed session identifiers.",
        "verification_context", "software_relevant", `${WSTG_ROOT}/06-Session_Management_Testing/07-Testing_Session_Timeout.md`),
      concept("owasp.wstg.4-2", "raw.wstg.busl-04", "test_scenario", "WSTG-v42-BUSL-04", "Test for Process Timing",
        "Review system functionality affected by time and develop and execute misuse cases.",
        "verification_context", "software_relevant", `${WSTG_ROOT}/10-Business_Logic_Testing/04-Test_for_Process_Timing.md`),
    ] },
] as const;

const corpusValue = { corpus_id: "ces-policies.raw-vocabulary.representative-v1-1",
  extraction_contract_revision: "pol-006-r01", artifacts: CES_POLICY_SOURCE_ARTIFACTS_V1_1,
  vocabularies, sp800_53_evaluation: [
    { concept_id: "raw.nist-sp800-53.ac-3", contribution: "REINFORCES_EXISTING_CONCEPT",
      rationale: "Reinforces application authorization coverage already represented by ASVS." },
    { concept_id: "raw.nist-sp800-53.au-2", contribution: "REINFORCES_EXISTING_CONCEPT",
      rationale: "Reinforces event logging and investigation awareness." },
    { concept_id: "raw.nist-sp800-53.cp-10", contribution: "UNIQUE_VALUE",
      rationale: "Adds explicit recovery-to-known-state vocabulary beyond the sampled application controls." },
    { concept_id: "raw.nist-sp800-53.si-2", contribution: "UNIQUE_VALUE",
      rationale: "Adds lifecycle awareness for flaw remediation and update validation." },
    { concept_id: "raw.nist-sp800-53.sr-3", contribution: "OUT_OF_SCOPE_ORGANIZATIONAL",
      rationale: "The broad organizational supply-chain process needs later software-scope decomposition." },
  ] } as const;

export function buildRepresentativeExtractionCorpus() {
  const corpus = RepresentativeExtractionCorpusSchema.parse(corpusValue);
  for (const vocabulary of corpus.vocabularies) {
    validateGovernedRawSourceVocabulary(CES_POLICY_GOVERNED_SOURCE_GLOSSARY_V1_1, vocabulary);
  }
  return corpus;
}

export const CES_POLICY_REPRESENTATIVE_EXTRACTION_CORPUS_V1_1 =
  buildRepresentativeExtractionCorpus();
export type RepresentativeExtractionCorpus = z.infer<typeof RepresentativeExtractionCorpusSchema>;
