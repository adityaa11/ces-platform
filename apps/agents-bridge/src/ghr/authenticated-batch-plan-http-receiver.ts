import { timingSafeEqual } from "node:crypto";
import { parseGenericHandoffEnvelopeV1, type GenericHandoffHeaderV1 } from "@atlas/contracts";
import type { FastifyInstance } from "fastify";
import { resolveMainRouteBinding } from "./main-route-index.js";
import { semanticBatchPlanRoute } from "./routes/semantic/branches/batch-plan.route.js";
import { BatchPlanReceiverError, receiveVerifiedBatchPlan, type BatchPlanAcceptanceStore } from "./routes/semantic/receivers/batch-plan.receiver.js";
import { BatchPlanAcceptanceConflictError } from "../idser-semantic-batch-plan-job.js";

type ReceiverOptions = Readonly<{ credential?: string; acceptance?: BatchPlanAcceptanceStore }>;

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
 * Registers the dormant GHR ingress inside the existing Fastify app.  Its
 * encapsulated parser preserves request bytes without changing parsing for
 * the app's unrelated public routes.
 */
export function registerAuthenticatedBatchPlanHttpReceiver(app: FastifyInstance, options: ReceiverOptions): void {
  app.register((receiver, _options, done) => {
    receiver.addContentTypeParser("application/json", { parseAs: "buffer" }, (_request, body, next) => next(null, body));
    receiver.setErrorHandler((_error, _request, reply) => reply.code(400).send(invalidHandoff));
    receiver.post(semanticBatchPlanRoute.receiver.path, async (request, reply) => {
      if (!authenticated(request.headers.authorization, options.credential)) return reply.code(401).send(unauthorized);
      if (!Buffer.isBuffer(request.body)) return reply.code(400).send(invalidHandoff);
      if (!options.acceptance) return reply.code(503).send({ error: "acceptance_unavailable" });
      try {
        const parsed = parseGenericHandoffEnvelopeV1(request.body);
        const registration = resolveMainRouteBinding(selector(parsed.envelope.header));
        if (registration.receiver.path !== semanticBatchPlanRoute.receiver.path || registration.receiver.method !== "POST" || parsed.rawBodyBytes.byteLength > registration.wrappedBodyByteLimit) {
          return reply.code(400).send(invalidHandoff);
        }
        const decision = await receiveVerifiedBatchPlan({
          selector: selector(parsed.envelope.header),
          canContinue: parsed.envelope.body.can_continue,
          payload: parsed.rawPayloadBytes,
          handoffId: parsed.envelope.header.handoffId,
          bodySha256: parsed.envelope.header.integrity.bodySha256,
          trustedScope: {
            projectId: parsed.envelope.header.scope.projectId,
            workspaceId: parsed.envelope.header.scope.workspaceId,
            bundleId: parsed.envelope.header.scope.bundleId ?? "",
            documentId: parsed.envelope.header.scope.documentId ?? "",
          },
        }, options.acceptance);
        return reply.code(202).send({
          handoffId: parsed.envelope.header.handoffId,
          bodySha256: parsed.envelope.header.integrity.bodySha256,
          disposition: decision.disposition,
        });
      } catch (error) {
        if (error instanceof BatchPlanAcceptanceConflictError) return reply.code(409).send({ error: "handoff_conflict" });
        if (!(error instanceof BatchPlanReceiverError)) return reply.code(503).send({ error: "acceptance_unavailable" });
        return reply.code(400).send(invalidHandoff);
      }
    });
    done();
  });
}
