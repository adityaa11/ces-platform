export interface AtlasAuthHandler {
  handler(request: Request): Promise<Response>;
}

/** Mounts Better Auth without inspecting or transforming its request or response. */
export function createAuthRouteHandler(auth: AtlasAuthHandler) {
  return (request: Request) => auth.handler(request);
}
