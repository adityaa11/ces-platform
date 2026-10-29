import assert from "node:assert/strict";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

test("BSS-V2-006-05-01 derives only explicitly fixture-authorized, provenance-bound effective policy", { skip: !databaseUrl }, async () => {
  const bridgeUrl = new URL(databaseUrl!);
  bridgeUrl.username = "agents_bridge";
  bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
  const atlasUrl = new URL(databaseUrl!);
  atlasUrl.username = "atlas_app";
  atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const bridge = postgres(bridgeUrl.toString(), { max: 1 });
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const domain = `enforcement-policy-${Date.now()}`;
  const profile = "fixture-v1";
  const route = "fixture-route";
  const dimensions = {
    rpm: { mode: "enforced", limitSource: "provider" },
    tpm: { mode: "enforced", limitSource: "provider" },
    rpd: { mode: "not_enforced", providerState: "unknown", reason: "not_published", approvalRef: "fixture-approval" },
    concurrency: { mode: "enforced", limitSource: "provider" },
  };
  const insertCapacity = async (targetDomain = domain, targetProfile = profile, targetRoute = route, limits: object = { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40000 }, rpd: { state: "unknown" }, concurrency: { state: "known", value: 25 } }, windowPolicies: object = { rpm: { kind: "fixed_window" }, tpm: { kind: "fixed_window" }, rpd: { kind: "unknown" } }) => {
    await bridge.unsafe("INSERT INTO bridge.provider_capacity_profile(quota_domain_id,profile_version,provider_account_alias,associated_routes,limits,window_policies,capacity_source,source_ref,source_version,observed_at,effective_from) VALUES($1,$2,'fixture',$3::jsonb,$4::jsonb,$5::jsonb,'provider_api','fixture://capacity','v1',now(),now())", [targetDomain, targetProfile, [{ routeId: targetRoute, providerId: "fixture" }], limits, windowPolicies]);
  };
  const insertApprovalAndPolicy = async (approvalRef = "fixture-approval", targetDomain = domain, targetProfile = profile, targetRoute = route, policyDimensions = dimensions, effectiveFrom = "2026-10-18T00:00:00Z") => {
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_approval(approval_ref,quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,permitted_unknown_dimensions,approved_by,approved_at) VALUES($1,$2,$3,$4,'capacity-dimension-enforcement','fixture-v1','{\"rpd\":{\"providerState\":\"unknown\",\"reason\":\"not_published\"}}','policy-owner',now())", [approvalRef, targetDomain, targetProfile, targetRoute]);
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,$3,'capacity-dimension-enforcement','fixture-v1',$4,$5::jsonb,$6)", [targetDomain, targetProfile, targetRoute, approvalRef, policyDimensions, effectiveFrom]);
  };
  const expectRejected = async (operation: () => Promise<unknown>, expected: RegExp) => {
    await bridge.unsafe("SAVEPOINT expected_failure");
    await assert.rejects(operation, expected);
    await bridge.unsafe("ROLLBACK TO SAVEPOINT expected_failure");
  };
  try {
    await bridge.unsafe("BEGIN");

    await expectRejected(
      () => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy('anoman-shared-prod','2026-10-18.1','anoman-semantic')"),
      /authorized enforcement policy is missing or stale/,
    );
    assert.equal((await bridge.unsafe("SELECT limits->'rpd' AS rpd FROM bridge.provider_capacity_profile WHERE quota_domain_id='anoman-shared-prod' AND profile_version='2026-10-18.1'"))[0].rpd.state, "unknown");

    await insertCapacity();
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [domain, profile, route]), /missing or stale/);
    await insertApprovalAndPolicy();
    assert.equal((await bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3) AS policy", [domain, profile, route]))[0].policy.dimensions.rpd.mode, "not_enforced");

    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,'wrong-route')", [domain, profile]), /binding is not qualified/);
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,'wrong-version',$2)", [domain, route]), /binding is not qualified/);

    await expectRejected(() => bridge.unsafe("UPDATE bridge.provider_enforcement_policy SET policy_id='forged' WHERE quota_domain_id=$1", [domain]), /immutable/);
    await assert.rejects(() => atlas.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [domain, profile, route]), /permission denied/);
    await expectRejected(() => bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,'different-route','capacity-dimension-enforcement','forged',$3,$4::jsonb,now())", [domain, profile, "fixture-approval", { ...dimensions, rpd: { mode: "enforced", limitSource: "provider" } }]), /conflicting enforcement/);

    const zeroDomain = `${domain}-zero`;
    await insertCapacity(zeroDomain, profile, route, { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40000 }, rpd: { state: "zero" }, concurrency: { state: "known", value: 25 } });
    await insertApprovalAndPolicy("zero-approval", zeroDomain, profile, route, { ...dimensions, rpd: { mode: "enforced", limitSource: "provider" } });
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [zeroDomain, profile, route]), /unusable/);

    const unknownEnforcedDomain = `${domain}-unknown-enforced`;
    await insertCapacity(unknownEnforcedDomain);
    await insertApprovalAndPolicy("unknown-enforced-approval", unknownEnforcedDomain, profile, route, { ...dimensions, rpd: { mode: "enforced", limitSource: "provider" } });
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [unknownEnforcedDomain, profile, route]), /exact authorized exclusion/);

    const knownRpdDomain = `${domain}-known-rpd`;
    const knownRpdLimits = { rpm: { state: "known", value: 20 }, tpm: { state: "known", value: 40000 }, rpd: { state: "known", value: 30 }, concurrency: { state: "known", value: 25 } };
    const enforcedRpdDimensions = { ...dimensions, rpd: { mode: "enforced", limitSource: "provider" } };
    await insertCapacity(knownRpdDomain, profile, route, knownRpdLimits, { rpm: { kind: "fixed_window" }, tpm: { kind: "fixed_window" }, rpd: { kind: "fixed_window" } });
    await insertApprovalAndPolicy("known-rpd-approval", knownRpdDomain, profile, route, enforcedRpdDimensions);
    assert.equal((await bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3) AS policy", [knownRpdDomain, profile, route]))[0].policy.dimensions.rpd.mode, "enforced");

    const unknownWindowDomain = `${domain}-unknown-window`;
    await insertCapacity(unknownWindowDomain, profile, route, knownRpdLimits, { rpm: { kind: "fixed_window" }, tpm: { kind: "fixed_window" }, rpd: { kind: "unknown" } });
    await insertApprovalAndPolicy("unknown-window-approval", unknownWindowDomain, profile, route, enforcedRpdDimensions);
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [unknownWindowDomain, profile, route]), /unknown accounting or reset/);

    const staleDomain = `${domain}-stale`;
    await insertCapacity(staleDomain);
    await insertApprovalAndPolicy("stale-approval", staleDomain, profile, route, { ...dimensions, rpd: { ...dimensions.rpd, approvalRef: "stale-approval" } }, "2099-01-01T00:00:00Z");
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [staleDomain, profile, route]), /missing or stale/);

    const approvalDomain = `${domain}-approval`;
    const forgedDomain = `${domain}-forged`;
    await insertCapacity(approvalDomain);
    await insertCapacity(forgedDomain);
    await insertApprovalAndPolicy("foreign-approval", approvalDomain, profile, route, { ...dimensions, rpd: { ...dimensions.rpd, approvalRef: "foreign-approval" } });
    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,approval_ref,dimensions,effective_from) VALUES($1,$2,$3,'capacity-dimension-enforcement','forged-v1','foreign-approval',$4::jsonb,now())", [forgedDomain, profile, route, { ...dimensions, rpd: { ...dimensions.rpd, approvalRef: "foreign-approval" } }]);
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [forgedDomain, profile, route]), /forged or foreign/);

    await bridge.unsafe("INSERT INTO bridge.provider_enforcement_policy_revocation(quota_domain_id,provider_capacity_profile_version,route_id,policy_id,policy_version,revocation_ref,revoked_by) VALUES($1,$2,$3,'capacity-dimension-enforcement','fixture-v1','fixture-revocation','policy-owner')", [domain, profile, route]);
    await expectRejected(() => bridge.unsafe("SELECT bridge.derive_effective_enforcement_policy($1,$2,$3)", [domain, profile, route]), /revoked/);
  } finally {
    await bridge.unsafe("ROLLBACK");
    await Promise.all([bridge.end(), atlas.end()]);
  }
});
