export async function headers() {
  const state = globalThis.__atlasDashboardRouteHarness;
  state.headerReads += 1;
  return new Headers({ cookie: state.cookie ?? "better-auth.session_token=fixture" });
}
