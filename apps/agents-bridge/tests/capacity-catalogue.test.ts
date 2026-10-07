import assert from "node:assert/strict";
import test from "node:test";
import { CapacityCatalogueError, isStructurallyUnavailable, parseProviderCapacityProfile, validateCapacityCatalogue } from "../src/capacity-catalogue.ts";

const profile = (overrides: Record<string, unknown> = {}) => ({
  quotaDomainId: "anoman-shared-prod", profileVersion: "2026-10-08.1", nonSecretProviderAccountAlias: "anoman-production-account-a",
  associatedRoutes: [{ routeId: "semantic-extract-a", providerId: "anoman" }, { routeId: "semantic-extract-b", providerId: "anoman" }],
  limits: { rpm: { state: "known", value: 60 }, tpm: { state: "known", value: 90000 }, rpd: { state: "zero" }, concurrency: { state: "unknown" } },
  windowPolicies: { rpm: { policyId: "rpm-window", policyVersion: "v1", source: "provider_docs", kind: "fixed_window", parameters: { windowSeconds: 60 } }, tpm: { policyId: "tpm-refill", policyVersion: "v2", source: "provider_api", kind: "token_bucket", parameters: { refillUnitsPerSecond: 1500, burstUnits: 90000 } }, rpd: { policyId: "rpd-reset", policyVersion: "v1", source: "qualified_observation", kind: "provider_reset_observation", parameters: { resetObservationIdentity: "provider-rpd-reset-v1" } } },
  quotaAccountingPolicyId: "anoman-quota-tokens-v1", capacitySource: "provider_docs", sourceRef: "provider-docs://limits", sourceVersion: "2026-10", observedAt: "2026-10-08T00:00:00.000Z", effectiveFrom: "2026-10-08T00:00:00.000Z", ...overrides,
});

test("capacity catalogue keeps shared domains secret-free and distinct from route/model identity", () => {
  const parsed = parseProviderCapacityProfile(profile());
  assert.equal(parsed.associatedRoutes.length, 2);
  assert.equal(parsed.limits.rpd.state, "zero");
  assert.equal(parsed.limits.concurrency.state, "unknown");
  assert.equal(isStructurallyUnavailable(parsed), true, "a known zero is structural unavailability, not an inferred positive limit");
  assert.throws(() => parseProviderCapacityProfile(profile({ nonSecretProviderAccountAlias: "apiKey_live_secret" })), CapacityCatalogueError);
  assert.throws(() => parseProviderCapacityProfile(profile({ nonSecretProviderAccountAlias: "sk-proj-EXAMPLE0123456789" })), CapacityCatalogueError);
  assert.throws(() => parseProviderCapacityProfile(profile({ associatedRoutes: [{ routeId: "local-docling", providerId: "docling" }] })), /non-Docling/);
  assert.throws(() => validateCapacityCatalogue([parsed, { ...parsed, quotaDomainId: "other", associatedRoutes: [{ routeId: "semantic-extract-a", providerId: "anoman" }] }]), /multiple quota domains/);
});

test("capacity states and window semantics fail closed", () => {
  assert.throws(() => parseProviderCapacityProfile(profile({ limits: { rpm: { state: "unknown", value: 50 }, tpm: { state: "known", value: 1 }, rpd: { state: "known", value: 1 }, concurrency: { state: "known", value: 1 } } })), /must not carry a value/);
  assert.throws(() => parseProviderCapacityProfile(profile({ limits: { rpm: { state: "known", value: 0 }, tpm: { state: "known", value: 1 }, rpd: { state: "known", value: 1 }, concurrency: { state: "known", value: 1 } } })), /positive finite/);
  assert.throws(() => parseProviderCapacityProfile(profile({ windowPolicies: { rpm: { policyId: "x", policyVersion: "v1", source: "provider_docs", kind: "fixed_window" }, tpm: profile().windowPolicies.tpm, rpd: profile().windowPolicies.rpd } })), /windowSeconds/);
  assert.throws(() => parseProviderCapacityProfile(profile({ windowPolicies: { rpm: profile().windowPolicies.rpm, tpm: profile().windowPolicies.tpm, rpd: { policyId: "x", policyVersion: "v1", source: "operator_config", kind: "conservative_fallback" } } })), /fallbackReason/);
  const dailyCalendar = { policyId: "rpd-calendar", policyVersion: "v1", source: "provider_docs", kind: "daily_calendar", parameters: { timeZone: "UTC", resetTime: "00:00" } };
  assert.doesNotThrow(() => parseProviderCapacityProfile(profile({ windowPolicies: { rpm: profile().windowPolicies.rpm, tpm: profile().windowPolicies.tpm, rpd: dailyCalendar } })));
  assert.throws(() => parseProviderCapacityProfile(profile({ windowPolicies: { rpm: profile().windowPolicies.rpm, tpm: profile().windowPolicies.tpm, rpd: { ...dailyCalendar, parameters: { timeZone: "Not/AZone", resetTime: "00:00" } } } })), /recognized IANA/);
  assert.throws(() => parseProviderCapacityProfile(profile({ windowPolicies: { rpm: profile().windowPolicies.rpm, tpm: profile().windowPolicies.tpm, rpd: { ...dailyCalendar, parameters: { timeZone: "UTC", resetTime: "99:99" } } } })), /HH:mm/);
});

test("billing metadata is rejected rather than being treated as quota accounting", () => {
  assert.throws(() => parseProviderCapacityProfile({ ...profile(), weightedTokens: 3 }), /unsupported field/);
  assert.throws(() => parseProviderCapacityProfile({ ...profile(), limits: { ...profile().limits, billingWeight: 3 } }), /unsupported field/);
});
