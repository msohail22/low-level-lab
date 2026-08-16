import { AsyncLocalStorage } from "node:async_hooks";

import type { ClientMeta } from "./types.ts";

export type TelemetryStore = {
  meta: ClientMeta;
  userId: string | null;
  deviceId: string | null;
};

export const telemetryAls = new AsyncLocalStorage<TelemetryStore>();

export function getTelemetryStore(): TelemetryStore | undefined {
  return telemetryAls.getStore();
}

export function setTelemetryUserId(userId: string | null): void {
  const store = telemetryAls.getStore();
  if (store) store.userId = userId;
}

export function setTelemetryDeviceId(deviceId: string | null): void {
  const store = telemetryAls.getStore();
  if (store) store.deviceId = deviceId;
}
