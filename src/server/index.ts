import fs from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { z } from "zod";
import { config } from "./config";
import { getSourceStatuses } from "./db";
import { getOrCreateSnapshot, refreshSnapshot } from "./snapshot";
import { runScenario } from "../shared/calc";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

const scenarioSchema = z.object({
  btcPriceUsd: z.number().positive(),
  mstrPriceUsd: z.number().positive(),
  atmExecutionPct: z.number().min(0).max(100),
  preferredRateShockBps: z.number().min(-1000).max(3000),
  marketDiscountPct: z.number().min(0).max(90),
  streEurUsd: z.number().positive(),
  includeDebtPrincipal: z.boolean(),
  sellBtcPct: z.number().min(0).max(100)
});

app.get("/api/health", async () => ({ ok: true, generatedAt: new Date().toISOString() }));

app.get("/api/snapshot", async () => getOrCreateSnapshot());

app.get("/api/operations", async () => {
  const snapshot = await getOrCreateSnapshot();
  return snapshot.operations;
});

app.get("/api/sources", async () => getSourceStatuses());

app.post("/api/refresh", async () => refreshSnapshot());

app.post("/api/scenario", async (request, reply) => {
  const parsed = scenarioSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const snapshot = await getOrCreateSnapshot();
  return runScenario(snapshot, parsed.data);
});

if (fs.existsSync(config.clientDist)) {
  await app.register(fastifyStatic, {
    root: config.clientDist,
    prefix: "/"
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith("/api/")) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    reply.sendFile("index.html");
  });
} else {
  app.get("/", async () => ({
    name: "mstr-update",
    message: "Client build not found. Run npm run build, or use the Vite dev server."
  }));
}

const boot = async () => {
  await getOrCreateSnapshot();
  setInterval(
    () => {
      refreshSnapshot().catch((error) => app.log.warn({ error }, "scheduled refresh failed"));
    },
    Math.max(5, config.refreshIntervalMinutes) * 60 * 1000
  ).unref();

  await app.listen({ host: config.host, port: config.port });
  app.log.info(`MSTR Update listening at http://${config.host}:${config.port}`);
};

boot().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
