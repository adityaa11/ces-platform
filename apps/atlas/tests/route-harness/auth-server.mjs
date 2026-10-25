export async function getAtlasAuthService() {
  return globalThis.__atlasDashboardRouteHarness.service;
}

export function isWorkerAuthRuntime() {
  return true;
}
