import { z } from "zod";
import type { SourceGlossary, SourceRelease } from "./index.js";
import { SourceGlossarySchema, SourceReleaseSchema } from "./index.js";

const IdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const NonEmptyStringSchema = z.string().trim().min(1);

const ObservationBaseSchema = z.object({
  family_id: IdSchema,
  current_release_id: IdSchema,
  checked_at: z.iso.datetime({ offset: true }),
  evidence_uris: z.array(z.url()).min(1),
});

const ObservedReleaseSchema = z.object({
  release_id: IdSchema,
  edition: NonEmptyStringSchema,
  release_label: NonEmptyStringSchema,
  published_on: z.iso.date(),
  authoritative_uri: z.url(),
}).strict();

export const SourceUpdateObservationSchema = z.discriminatedUnion("status", [
  ObservationBaseSchema.extend({ status: z.literal("unchanged") }).strict(),
  ObservationBaseSchema.extend({
    status: z.literal("update_detected"),
    observed_release: ObservedReleaseSchema,
  }).strict(),
  ObservationBaseSchema.extend({
    status: z.literal("ambiguous"),
    reason: NonEmptyStringSchema,
  }).strict(),
  ObservationBaseSchema.extend({
    status: z.literal("failed"),
    error: z.object({
      code: IdSchema,
      message: NonEmptyStringSchema,
      retryable: z.boolean(),
    }).strict(),
  }).strict(),
]);

export const SourceUpdateCandidateSchema = z.object({
  candidate_id: IdSchema,
  family_id: IdSchema,
  current_release_id: IdSchema,
  observed_release: ObservedReleaseSchema,
  detected_at: z.iso.datetime({ offset: true }),
  evidence_uris: z.array(z.url()).min(1),
  status: z.enum(["pending", "accepted", "rejected", "deferred"]),
  review: z.object({
    decision: z.enum(["accepted", "rejected", "deferred"]),
    decided_by: NonEmptyStringSchema,
    decided_at: z.iso.datetime({ offset: true }),
    rationale: NonEmptyStringSchema,
  }).strict().nullable(),
  impact_analysis: z.discriminatedUnion("status", [
    z.object({ status: z.literal("not_assessed"), affected_mapping_ids: z.tuple([]) }).strict(),
    z.object({ status: z.literal("assessed"), affected_mapping_ids: z.array(IdSchema),
      summary: NonEmptyStringSchema }).strict(),
  ]),
}).strict().superRefine((candidate, context) => {
  if (candidate.status === "pending" && candidate.review !== null) {
    context.addIssue({ code: "custom", message: "Pending update candidate cannot have a review" });
  }
  if (candidate.status !== "pending" && candidate.review?.decision !== candidate.status) {
    context.addIssue({ code: "custom", message: "Update candidate status must match its review" });
  }
});

export const SourceUpdateAdapterDescriptorSchema = z.object({
  adapter_id: IdSchema,
  family_id: IdSchema,
  check_uri: z.url(),
}).strict();

export const CORE_SOURCE_UPDATE_ADAPTER_DESCRIPTORS = [
  { adapter_id: "source-update.iso-27001", family_id: "iso.iec-27001",
    check_uri: "https://www.iso.org/standard/27001" },
  { adapter_id: "source-update.iso-27002", family_id: "iso.iec-27002",
    check_uri: "https://www.iso.org/standard/75652.html" },
  { adapter_id: "source-update.owasp-asvs", family_id: "owasp.asvs",
    check_uri: "https://github.com/OWASP/ASVS/releases" },
  { adapter_id: "source-update.owasp-wstg", family_id: "owasp.wstg",
    check_uri: "https://owasp.org/www-project-web-security-testing-guide/" },
] as const;

export type SourceUpdateAdapterDescriptor = z.infer<typeof SourceUpdateAdapterDescriptorSchema>;
export type SourceUpdateObservation = z.infer<typeof SourceUpdateObservationSchema>;
export type SourceUpdateCandidate = z.infer<typeof SourceUpdateCandidateSchema>;
export type SourceUpdateProbe = (
  descriptor: SourceUpdateAdapterDescriptor,
  currentRelease: SourceRelease,
) => Promise<unknown>;

export interface SourceUpdateAdapter {
  readonly descriptor: SourceUpdateAdapterDescriptor;
  check(currentReleaseValue: unknown): Promise<SourceUpdateObservation>;
}

export function createCoreSourceUpdateAdapters(probe: SourceUpdateProbe): SourceUpdateAdapter[] {
  return CORE_SOURCE_UPDATE_ADAPTER_DESCRIPTORS.map((value) => {
    const descriptor = SourceUpdateAdapterDescriptorSchema.parse(value);
    return {
      descriptor,
      async check(currentReleaseValue: unknown): Promise<SourceUpdateObservation> {
        const currentRelease = SourceReleaseSchema.parse(currentReleaseValue);
        if (currentRelease.family_id !== descriptor.family_id) {
          throw new Error(`Adapter ${descriptor.adapter_id} cannot check another source family`);
        }
        const observation = SourceUpdateObservationSchema.parse(
          await probe(descriptor, currentRelease),
        );
        if (observation.family_id !== descriptor.family_id ||
            observation.current_release_id !== currentRelease.release_id) {
          throw new Error(`Adapter ${descriptor.adapter_id} returned mismatched source identity`);
        }
        return observation;
      },
    };
  });
}

export type SourceUpdateDetectionResult =
  | { outcome: "unchanged" | "already_tracked"; observation: SourceUpdateObservation }
  | { outcome: "ambiguous" | "failed"; observation: SourceUpdateObservation }
  | { outcome: "candidate"; observation: SourceUpdateObservation; candidate: SourceUpdateCandidate };

export function detectSourceUpdate(
  glossaryValue: unknown,
  observationValue: unknown,
  existingCandidateValues: readonly unknown[] = [],
): SourceUpdateDetectionResult {
  const glossary = SourceGlossarySchema.parse(glossaryValue);
  const observation = SourceUpdateObservationSchema.parse(observationValue);
  assertObservationIdentity(glossary, observation);

  if (observation.status === "unchanged") return { outcome: "unchanged", observation };
  if (observation.status === "ambiguous") return { outcome: "ambiguous", observation };
  if (observation.status === "failed") return { outcome: "failed", observation };
  if (glossary.releases.some(({ release_id }) =>
    release_id === observation.observed_release.release_id)) {
    return { outcome: "already_tracked", observation };
  }

  const candidate = SourceUpdateCandidateSchema.parse({
    candidate_id: `source-update.${observation.observed_release.release_id}`,
    family_id: observation.family_id,
    current_release_id: observation.current_release_id,
    observed_release: observation.observed_release,
    detected_at: observation.checked_at,
    evidence_uris: observation.evidence_uris,
    status: "pending",
    review: null,
    impact_analysis: { status: "not_assessed", affected_mapping_ids: [] },
  });
  const existingCandidates = existingCandidateValues.map((value) =>
    SourceUpdateCandidateSchema.parse(value));
  const existing = existingCandidates.find(({ candidate_id }) =>
    candidate_id === candidate.candidate_id);
  if (existing) {
    if (JSON.stringify(existing.observed_release) !== JSON.stringify(candidate.observed_release) ||
        existing.family_id !== candidate.family_id ||
        existing.current_release_id !== candidate.current_release_id) {
      throw new Error(`Update candidate ${candidate.candidate_id} conflicts with existing evidence`);
    }
    return { outcome: "candidate", observation, candidate: existing };
  }
  return { outcome: "candidate", observation, candidate };
}

export function reviewSourceUpdateCandidate(
  candidateValue: unknown,
  review: { decision: "accepted" | "rejected" | "deferred"; decided_by: string;
    decided_at: string; rationale: string },
): SourceUpdateCandidate {
  const candidate = SourceUpdateCandidateSchema.parse(candidateValue);
  if (candidate.status !== "pending") {
    throw new Error(`Update candidate ${candidate.candidate_id} already has a decision`);
  }
  return SourceUpdateCandidateSchema.parse({ ...candidate, status: review.decision, review });
}

function assertObservationIdentity(
  glossary: SourceGlossary,
  observation: SourceUpdateObservation,
): void {
  if (!glossary.families.some(({ family_id }) => family_id === observation.family_id)) {
    throw new Error(`Update observation references unknown family ${observation.family_id}`);
  }
  const current = glossary.releases.find(({ release_id }) =>
    release_id === observation.current_release_id);
  if (!current || current.family_id !== observation.family_id) {
    throw new Error("Update observation references an invalid current release");
  }
}
