import { z } from 'zod';

// This is an untrusted qualification proposal shape. Parsing it deliberately
// creates no Atlas truth, canonical vocabulary, persistence, or routing effect.
export const evidenceReferenceSchema = z.object({
  sourceSlot: z.string().min(1).describe('Authorized source-unit slot cited by this evidence.'),
  quote: z.string().min(1).describe('Exact normalized-source substring from the cited slot.'),
}).strict().describe('Source-grounded evidence reference; later validation verifies the quote against the slot.');

const evidenceList = z.array(evidenceReferenceSchema).min(1);

export const semanticArgumentSchema = z.union([
  z.object({
    role: z.enum(['actor', 'object', 'subject', 'target', 'recipient', 'source', 'destination', 'value', 'entity']),
    value: z.string().min(1),
    evidence: evidenceList,
  }).strict(),
  z.object({
    role: z.literal('other'),
    roleDescription: z.string().min(1).describe('Source-specific role label for the bounded other role.'),
    value: z.string().min(1),
    evidence: evidenceList,
  }).strict(),
]).describe('Bounded, source-grounded proposition argument.');

const baseModalitySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('obligation'), evidence: evidenceList }).strict(),
  z.object({ type: z.literal('permission'), evidence: evidenceList }).strict(),
  z.object({ type: z.literal('prohibition'), evidence: evidenceList }).strict(),
  z.object({ type: z.literal('recommendation'), evidence: evidenceList }).strict(),
]);

export const semanticModalitySchema = z.union([
  baseModalitySchema,
  z.object({
    type: z.literal('possibility').describe('Possibility may qualify one non-possibility semantic force.'),
    appliesTo: baseModalitySchema.optional().describe('The bounded semantic force qualified by possibility.'),
    evidence: evidenceList,
  }).strict(),
]).describe('Explicit modality; absence means an assertion.');

const semanticConditionSchema = z.object({ text: z.string().min(1), evidence: evidenceList }).strict();
const temporalRelationSchema = z.object({
  relation: z.enum(['before', 'after', 'during', 'until', 'other']),
  target: z.string().min(1),
  evidence: evidenceList,
}).strict();
const quantitySchema = z.union([
  z.object({ comparator: z.enum(['equal', 'maximum', 'minimum', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal']), value: z.number(), unit: z.string().min(1).optional(), evidence: evidenceList }).strict(),
  z.object({ comparator: z.literal('range'), lowerBound: z.number(), upperBound: z.number(), unit: z.string().min(1).optional(), evidence: evidenceList }).strict().refine((value) => value.lowerBound <= value.upperBound, 'range lowerBound must not exceed upperBound'),
]).describe('Bounded quantity or range from the source.');

export const unresolvedAspectSchema = z.object({
  aspect: z.enum(['actor', 'object', 'condition', 'trigger', 'threshold', 'quantity', 'scope', 'timing', 'outcome', 'reference', 'relationship', 'other']).describe('Semantic component that remains unresolved.'),
  knownMeaning: z.string().min(1).describe('Only what the source establishes.'),
  missingInformation: z.string().min(1).describe('The missing semantic component, without an invented answer.'),
  clarificationQuestion: z.string().min(1).describe('Question that asks for the missing information without implying it.'),
  evidence: evidenceList,
}).strict().describe('Explicit incompleteness retained alongside safe proposition meaning.');

const semanticPropositionSchema = z.object({
  predicate: z.string().min(1).describe('Source-grounded predicate phrase; not a global canonical vocabulary term.'),
  arguments: z.array(semanticArgumentSchema),
  qualifiers: z.object({
    modality: semanticModalitySchema.optional(),
    polarity: z.enum(['positive', 'negative']).default('positive'),
    conditions: z.array(semanticConditionSchema).default([]),
    triggers: z.array(semanticConditionSchema).default([]),
    temporal: z.array(temporalRelationSchema).default([]),
    quantities: z.array(quantitySchema).default([]),
    scopes: z.array(z.object({ text: z.string().min(1), evidence: evidenceList }).strict()).default([]),
    state: z.object({ kind: z.enum(['assertion', 'transition']), from: z.string().min(1).optional(), to: z.string().min(1), evidence: evidenceList }).strict().optional(),
  }).strict(),
  unresolvedAspects: z.array(unresolvedAspectSchema),
  evidence: evidenceList,
}).strict().describe('One source-grounded proposition with independent semantic dimensions.');

export const sourceSemanticResultSchema = z.object({
  sourceSlot: z.string().min(1).describe('Exact authorized source-unit slot.'),
  sourceDisposition: z.enum(['semantic', 'non_semantic', 'needs_review']).describe('Disposition of the source unit, not a truth decision.'),
  discourseRole: z.enum(['assertion', 'example', 'rationale', 'reference']).optional().describe('Optional source discourse role, independent from disposition.'),
  propositions: z.array(semanticPropositionSchema).describe('Zero or more untrusted, source-grounded semantic proposals.'),
}).strict().superRefine((value, context) => {
  if (value.sourceDisposition === 'semantic' && value.propositions.length === 0) context.addIssue({ code: 'custom', message: 'semantic sources require at least one proposition', path: ['propositions'] });
  if (value.sourceDisposition === 'non_semantic' && value.propositions.length !== 0) context.addIssue({ code: 'custom', message: 'non_semantic sources must not contain propositions', path: ['propositions'] });
}).describe('Untrusted Semantic IR proposal for one authorized source slot.');

export const providerJsonSchema = z.toJSONSchema(sourceSemanticResultSchema, { target: 'draft-2020-12' });
