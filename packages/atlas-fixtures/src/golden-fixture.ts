export type GoldenFixtureBundle = {
  repository: {
    branches: Array<{ branchId: string; label: string; headRevisionId: string }>;
    materializedStates: Array<{ branchId: string; headRevisionId: string; state: { assertionIds: string[]; resolvedFacts: Array<{ semanticKey: string; assertionId: string; value: unknown }> } }>;
  };
  projections: Array<{ branchId: string; headRevisionId: string; surfaces: Array<{ surface: string; branchId: string; headRevisionId: string; records: unknown[] }> }>;
};

/** Resolve one branch-relative read model without replaying artifacts or revisions. */
export function resolveGoldenFixtureBranch(bundle: GoldenFixtureBundle, branchId: string) {
  const branch = bundle.repository.branches.find((entry) => entry.branchId === branchId);
  if (!branch) throw new Error(`Unknown fixture branch ${JSON.stringify(branchId)}.`);
  const state = bundle.repository.materializedStates.find((entry) => entry.branchId === branchId && entry.headRevisionId === branch.headRevisionId);
  const projection = bundle.projections.find((entry) => entry.branchId === branchId && entry.headRevisionId === branch.headRevisionId);
  if (!state || !projection) throw new Error(`Fixture branch ${JSON.stringify(branchId)} lacks a HEAD-keyed read model.`);
  return { branch, headRevisionId: branch.headRevisionId, materializedState: state, projection };
}
