import { auth } from "@/lib/auth-server";

/** Preserve Better Auth's request and response semantics at the browser boundary. */
const handle = (request: Request) => auth.handler(request);

export const GET = handle;
export const POST = handle;
