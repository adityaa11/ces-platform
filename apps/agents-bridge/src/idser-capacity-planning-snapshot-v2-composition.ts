import type { CapacityPlanningSnapshotBinding } from "./config.js";
import type { CapacityPlanningSnapshot, CapacityPlanningSnapshotRead } from "./capacity-planning-snapshot.js";
import {
  createIdserCapacityPlanningSnapshotV2Consumer,
  type IdserCapacityPlanningSnapshotV2,
  type IdserCapacityPlanningSnapshotV2Read,
} from "./idser-capacity-planning-snapshot-v2.js";

type CapacityPlanningSnapshotReader = Readonly<{
  read(credential: string, request?: CapacityPlanningSnapshotRead): Promise<CapacityPlanningSnapshot>;
}>;

export type IdserCapacityPlanningSnapshotV2Consumer = Readonly<{
  read(input: IdserCapacityPlanningSnapshotV2Read): Promise<IdserCapacityPlanningSnapshotV2>;
}>;

/**
 * The sole production IDSER composition for the initial v2 handoff.  A
 * deployment may expose other BSS reader principals, but only one
 * non-prospective v2 principal may bind the read-only IDSER planner.  It is
 * deliberately has no substitute path: absent v2 configuration leaves no consumer,
 * and ambiguous configuration prevents startup.
 */
export function createIdserCapacityPlanningSnapshotV2ProductionComposition(options: Readonly<{
  reader: CapacityPlanningSnapshotReader;
  bindings: readonly CapacityPlanningSnapshotBinding[];
}>): IdserCapacityPlanningSnapshotV2Consumer | undefined {
  const v2Bindings = options.bindings.filter((binding) => binding.prospective === false && binding.qualificationVersion === "v2");
  if (v2Bindings.length === 0) return undefined;
  if (v2Bindings.length !== 1) throw new Error("Exactly one non-prospective CapacityPlanningSnapshot/v2 binding is required for the IDSER consumer.");
  const [binding] = v2Bindings;
  return createIdserCapacityPlanningSnapshotV2Consumer({
    reader: options.reader,
    serverCredential: binding.credential,
    expectedIdentity: {
      quotaDomainId: binding.quotaDomainId,
      processId: binding.processId,
      processProfileVersion: binding.processProfileVersion,
      routeId: binding.routeId,
      serviceClass: binding.serviceClass,
    },
  });
}
