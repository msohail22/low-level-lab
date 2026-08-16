export type ClientPlatform = "web" | "ios" | "android" | "unknown";

export type ClientMeta = {
  platform: ClientPlatform;
  appVersion: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
  country: string | null;
  city: string | null;
  requestId: string;
};

export type RequestLogMessage = ClientMeta & {
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  userId: string | null;
  deviceId: string | null;
  createdAt: string;
};
