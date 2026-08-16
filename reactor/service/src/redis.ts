import Redis from "ioredis";

import type { JobDocument, JobStatus } from "./types.ts";

const JOB_TTL_SECONDS = 60 * 60;

export function createRedis(url: string) {
  return new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
}

function jobKey(id: string) {
  return `reactor:job:${id}`;
}

export async function saveJob(redis: Redis, job: JobDocument) {
  await redis.set(jobKey(job.id), JSON.stringify(job), "EX", JOB_TTL_SECONDS);
}

export async function getJob(
  redis: Redis,
  id: string,
): Promise<JobDocument | null> {
  const raw = await redis.get(jobKey(id));
  if (!raw) return null;
  return JSON.parse(raw) as JobDocument;
}

export async function updateJobStatus(
  redis: Redis,
  id: string,
  status: JobStatus,
  patch: Partial<JobDocument> = {},
) {
  const current = await getJob(redis, id);
  if (!current) return null;
  const next: JobDocument = {
    ...current,
    ...patch,
    status,
    updatedAt: new Date().toISOString(),
  };
  await saveJob(redis, next);
  return next;
}
