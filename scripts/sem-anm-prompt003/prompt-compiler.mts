import { compileExtractionPrompt } from "../sem-anm-prompt002/prompt-compiler.mts";
import { createProviderSchema } from "../sem-anm-prompt002/provider-schema.mts";
import { CROSS_FIELD_POLICY_BODY, CROSS_FIELD_SECTION_TITLE } from "./cross-field-policy.mts";

type PredecessorSection = {
  id: string;
  generatedSection: string;
  sourceSchemaProperty: string;
  sourceDescription: string;
  sourceDescriptions: { sourceSchemaProperty: string; sourceDescription: string }[];
  ownership: string;
  generatedText: string;
};

type PredecessorProvenance = { formatVersion: number; sections: PredecessorSection[] };

const INSERT_AFTER = "questions";
const INSERT_BEFORE = "source-result-classification";
const POLICY_ID = "cross-field-semantic-composition";

function insertPolicy(sections: readonly PredecessorSection[]): PredecessorSection[] {
  const afterIndex = sections.findIndex((section) => section.id === INSERT_AFTER);
  const beforeIndex = sections.findIndex((section) => section.id === INSERT_BEFORE);
  if (afterIndex < 0 || beforeIndex < 0 || beforeIndex !== afterIndex + 1) {
    throw new Error("PROMPT-002 structured provenance no longer has the frozen questions/source-classification insertion boundary");
  }
  if (sections.filter((section) => section.id === POLICY_ID).length !== 0) {
    throw new Error("PROMPT-002 predecessor must not already contain the PROMPT-003 cross-field policy");
  }

  const policy: PredecessorSection = {
    id: POLICY_ID,
    generatedSection: CROSS_FIELD_SECTION_TITLE,
    sourceSchemaProperty: "(fixed policy)",
    sourceDescription: CROSS_FIELD_POLICY_BODY,
    sourceDescriptions: [],
    ownership: "STATIC_POLICY",
    generatedText: CROSS_FIELD_POLICY_BODY,
  };
  return [...sections.slice(0, beforeIndex), policy, ...sections.slice(beforeIndex)];
}

/**
 * Derives PROMPT-003 only from PROMPT-002's structured compiler result.  This
 * deliberately never parses or patches the predecessor's rendered prompt.
 */
export function compileCrossFieldPrompt(schema = createProviderSchema()) {
  const predecessor = compileExtractionPrompt(schema);
  const predecessorProvenance = predecessor.provenance as PredecessorProvenance;
  const sections = insertPolicy(predecessorProvenance.sections);
  const prompt = sections.map((section) => `${section.generatedSection.toUpperCase()}\n\n${section.generatedText}`).join("\n\n");
  const provenance = { formatVersion: predecessorProvenance.formatVersion, sections };
  return { prompt, provenance, predecessor };
}

export { POLICY_ID };
