import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { compileAndRunCpp } from "./compile.ts";
import {
  createConsumer,
  createKafka,
  createProducer,
  publishJobId,
} from "./kafka.ts";
import {
  createRedis,
  getJob,
  saveJob,
  updateJobStatus,
} from "./redis.ts";
import type { JobDocument } from "./types.ts";

const PORT = Number(process.env.PORT ?? 18080);
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS ?? "127.0.0.1:9092").split(",");
const MAX_SOURCE_BYTES = 200_000;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
const QUEUE_KEY = "reactor:queue";

const submitSchema = z.object({
  language: z.literal("cpp"),
  source: z.string().min(1).max(MAX_SOURCE_BYTES),
});

const redis = createRedis(REDIS_URL);
const kafka = createKafka(KAFKA_BROKERS);

async function processJob(id: string) {
  const job = await getJob(redis, id);
  if (!job) {
    console.warn(`[worker] missing job ${id}`);
    return;
  }
  if (job.status !== "queued") {
    return;
  }

  await updateJobStatus(redis, id, "running");
  const result = await compileAndRunCpp(job.source);
  await updateJobStatus(redis, id, result.status, {
    result: {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      compiler: result.compiler,
      durationMs: result.durationMs,
    },
  });
  console.info(`[worker] ${id} -> ${result.status}`);
}

async function startKafkaWorker(): Promise<Awaited<
  ReturnType<typeof createProducer>
> | null> {
  if (process.env.KAFKA_DISABLED === "1") {
    console.info("[reactor] kafka disabled; using redis queue only");
    return null;
  }
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const producer = await createProducer(kafka);
      const consumer = await createConsumer(kafka);
      await consumer.run({
        eachMessage: async ({ message }) => {
          const raw = message.value?.toString("utf8");
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw) as { id?: string };
            if (parsed.id) await processJob(parsed.id);
          } catch (err) {
            console.error("[worker] bad kafka message", err);
          }
        },
      });
      console.info("[reactor] kafka worker connected");
      return producer;
    } catch (err) {
      console.warn(`[reactor] kafka connect attempt ${attempt} failed`, err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.warn("[reactor] kafka unavailable; continuing with redis queue only");
  return null;
}

async function startRedisFallbackWorker() {
  console.info("[reactor] redis queue fallback worker started");
  for (;;) {
    try {
      const popped = await redis.brpop(QUEUE_KEY, 5);
      if (!popped) continue;
      const id = popped[1];
      await processJob(id);
    } catch (err) {
      console.error("[worker] redis fallback error", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function main() {
  await redis.connect();
  const producer = await startKafkaWorker();
  void startRedisFallbackWorker();

  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(","),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));

  app.post("/v1/jobs", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "INVALID_BODY", details: parsed.error.flatten() }, 400);
    }
    if (Buffer.byteLength(parsed.data.source, "utf8") > MAX_SOURCE_BYTES) {
      return c.json({ error: "SOURCE_TOO_LARGE" }, 400);
    }

    const now = new Date().toISOString();
    const job: JobDocument = {
      id: randomUUID(),
      language: "cpp",
      source: parsed.data.source,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };
    await saveJob(redis, job);
    await redis.lpush(QUEUE_KEY, job.id);
    if (producer) {
      try {
        await publishJobId(producer, job.id);
      } catch (err) {
        console.warn("[reactor] kafka publish failed; redis queue still has job", err);
      }
    }
    return c.json({ id: job.id, status: job.status }, 201);
  });

  app.get("/v1/jobs/:id", async (c) => {
    const job = await getJob(redis, c.req.param("id"));
    if (!job) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({
      id: job.id,
      status: job.status,
      result: job.result,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  });

  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.info(`[reactor] listening on http://127.0.0.1:${info.port}`);
    console.info(`[reactor] redis=${REDIS_URL} kafka=${KAFKA_BROKERS.join(",")}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
