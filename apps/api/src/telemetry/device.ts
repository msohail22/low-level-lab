import { and, eq } from "drizzle-orm";

import { createDb } from "../db/index.ts";
import { device } from "../db/schema.ts";
import { buildFingerprint } from "./client-meta.ts";
import { getTelemetryStore, setTelemetryDeviceId } from "./context.ts";

export async function upsertDeviceForSession(opts: {
  hyperdrive: Hyperdrive;
  userId: string;
  sessionId: string;
}): Promise<string | null> {
  const store = getTelemetryStore();
  const meta = store?.meta;
  if (!meta) return null;

  try {
    const db = createDb(opts.hyperdrive);
    const fingerprint = await buildFingerprint({
      platform: meta.platform,
      browserName: meta.browserName,
      osName: meta.osName,
      deviceType: meta.deviceType,
      appVersion: meta.appVersion,
      userAgent: meta.userAgent,
    });

    const existing = await db
      .select()
      .from(device)
      .where(
        and(
          eq(device.userId, opts.userId),
          eq(device.fingerprint, fingerprint),
        ),
      )
      .limit(1);

    const now = new Date();
    if (existing[0]) {
      await db
        .update(device)
        .set({
          sessionId: opts.sessionId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          browserName: meta.browserName,
          browserVersion: meta.browserVersion,
          osName: meta.osName,
          osVersion: meta.osVersion,
          deviceType: meta.deviceType,
          country: meta.country,
          city: meta.city,
          appVersion: meta.appVersion,
          platform: meta.platform,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(device.id, existing[0].id));
      setTelemetryDeviceId(existing[0].id);
      return existing[0].id;
    }

    const id = crypto.randomUUID();
    await db.insert(device).values({
      id,
      userId: opts.userId,
      sessionId: opts.sessionId,
      platform: meta.platform,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      browserName: meta.browserName,
      browserVersion: meta.browserVersion,
      osName: meta.osName,
      osVersion: meta.osVersion,
      deviceType: meta.deviceType,
      country: meta.country,
      city: meta.city,
      appVersion: meta.appVersion,
      fingerprint,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    });
    setTelemetryDeviceId(id);
    return id;
  } catch (err) {
    console.error("device upsert failed", err);
    return null;
  }
}
