const CSP_HEADER = "content-security-policy";
const CSP_REPORT_ONLY_HEADER = "content-security-policy-report-only";

export type CspMode = "enforce" | "report-only";

export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let value = "";

  for (const byte of bytes) value += String.fromCharCode(byte);

  return btoa(value);
}

export function createPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self'",
    "style-src-attr 'none'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function withCspRequest(request: Request, policy: string, mode: CspMode): Request {
  const headers = new Headers(request.headers);
  headers.delete(mode === "enforce" ? CSP_REPORT_ONLY_HEADER : CSP_HEADER);
  headers.set(mode === "enforce" ? CSP_HEADER : CSP_REPORT_ONLY_HEADER, policy);

  return new Request(request, { headers });
}

export function withCspResponse(response: Response, policy: string, mode: CspMode): Response {
  const headers = new Headers(response.headers);
  headers.delete(mode === "enforce" ? CSP_REPORT_ONLY_HEADER : CSP_HEADER);
  headers.set(mode === "enforce" ? CSP_HEADER : CSP_REPORT_ONLY_HEADER, policy);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}
