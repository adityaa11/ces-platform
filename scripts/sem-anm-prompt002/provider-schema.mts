import { z } from "zod";
import { atlasProviderExtractionProposalV1Schema } from "./atlas-semantic-v1-zod-reference.ts";

export const FROZEN_REFERENCE_SHA256 = "67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083";

export function createProviderSchema(): Record<string, unknown> {
  return z.toJSONSchema(atlasProviderExtractionProposalV1Schema) as Record<string, unknown>;
}
