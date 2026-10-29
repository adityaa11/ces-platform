import { timingSafeEqual } from "node:crypto";
import { parseGenericHandoffEnvelopeV1, type GenericHandoffHeaderV1 } from "@atlas/contracts";
import type { FastifyInstance } from "fastify";
import { resolveMainRouteBinding } from "./main-route-index.js";
import { semanticBatchPlanRoute } from "./routes/semantic/branches/batch-plan.route.js";
import { receiveVerifiedBatchPlan } from "./routes/semantic/receivers/batch-plan.receiver.js";

type ReceiverOptions = Readonly<{ credential?: string }>;

const unauthorized = Object.freeze({ error: "unauthorized" });
const invalidHandoff = Object.freeze({ error: "invalid_handoff" });

function selector(header: GenericHandoffHeaderV1) {
  return {
    main: header.route.main,
    branch: header.route.branch,
    producerProcessKey: header.producer.processKey,
    policyVersion: header.route.policyVersion,
    handlerVersion: header.route.handlerVersion,
    bodyContractType: header.bodyContract.type,
    bodyContractVersion: header.bodyContract.version,
  } as const;
}

function authenticated(authorization: unknown, credential: string | undefined): boolean {
  if (!credential || typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return false;
  const actual = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(credential);
  return actual.byteLength === expected.byteLength && timingSafeEqual(actual, expected);
}

/**
 * Registers the GHR-only semantic/batch-plan ingress inside the existing
 * Fastify app. It accepts only an authenticated, route-pinned GHR envelope;
 * it never exposes a general semantic API or invokes a semantic worker.
 */
export function registerAuthenticatedBatchPlanHttpReceiver(app: FastifyInstance, options: ReceiverOptions): void {
  app.register((receiver, _options, done) => {
    receiver.addContentTypeParser("application/json", { parseAs: "buffer" }, (_request, body, next) => next(null, body));
    receiver.setErrorHandler((_error, _request, reply) => reply.code(400).send(invalidHandoff));
    receiver.post(semanticBatchPlanRoute.receiver.path, async (request, reply) => {
      if (!authenticated(request.headers.authorization, options.credential)) return reply.code(401).send(unauthorized);
      if (!Buffer.isBuffer(request.body)) return reply.code(400).send(invalidHandoff);
      try {
        const parsed = parseGenericHandoffEnvelopeV1(request.body);
        const registration = resolveMainRouteBinding(selector(parsed.envelope.header));
        if (registration.receiver.path !== semanticBatchPlanRoute.receiver.path || registration.receiver.method !== "POST" || parsed.rawBodyBytes.byteLength > registration.wrappedBodyByteLimit) {
          return reply.code(400).send(invalidHandoff);
        }
        const decision = receiveVerifiedBatchPlan({
          selector: selector(parsed.envelope.header),
          canContinue: parsed.envelope.body.can_continue,
          payload: parsed.rawPayloadBytes,
        });
        return reply.code(200).send({
          handoffId: parsed.envelope.header.handoffId,
          bodySha256: parsed.envelope.header.integrity.bodySha256,
          disposition: decision.disposition,
        });
      } catch {
        return reply.code(400).send(invalidHandoff);
      }
    });
    done();
  });
}
