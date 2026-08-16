import { UAParser } from "ua-parser-js";

import type { ClientMeta, ClientPlatform } from "./types.ts";

type CfProperties = { country?: string; city?: string };

const SENSITIVE_QUERY_KEYS = new Set([
  "password",
  "token",
  "secret",
  "access_token",
  "refresh_token",
  "code",
]);

export function normalizePlatform(
  value: string | null | undefined,
): ClientPlatform {
  const v = value?.trim().toLowerCase();
  if (v === "web" || v === "ios" || v === "android") return v;
  return "unknown";
}

export function redactPath(pathWithQuery: string): string {
  const qIndex = pathWithQuery.indexOf("?");
  if (qIndex === -1) return pathWithQuery;
  const pathname = pathWithQuery.slice(0, qIndex);
  const params = new URLSearchParams(pathWithQuery.slice(qIndex + 1));
  for (const key of [...params.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) params.delete(key);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export async function buildFingerprint(input: {
  platform: ClientPlatform;
  browserName: string | null;
  osName: string | null;
  deviceType: string | null;
  appVersion: string | null;
  userAgent: string | null;
}): Promise<string> {
  const raw = [
    input.platform,
    input.browserName ?? "",
    input.osName ?? "",
    input.deviceType ?? "",
    input.appVersion ?? "",
    input.userAgent ?? "",
  ].join("|");
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function extractClientMeta(request: Request): ClientMeta {
  const headers = request.headers;
  const userAgent = headers.get("user-agent");
  const platform = normalizePlatform(headers.get("x-client-platform"));
  const appVersion = headers.get("x-app-version");
  const ipAddress =
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  const cf = (request as Request & { cf?: CfProperties }).cf;
  const parser = new UAParser(userAgent ?? undefined);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  return {
    platform,
    appVersion: appVersion?.trim() || null,
    ipAddress,
    userAgent,
    browserName: browser.name ?? null,
    browserVersion: browser.version ?? null,
    osName: os.name ?? null,
    osVersion: os.version ?? null,
    deviceType: device.type ?? (platform === "web" ? "desktop" : "mobile"),
    country: typeof cf?.country === "string" ? cf.country : null,
    city: typeof cf?.city === "string" ? cf.city : null,
    requestId: headers.get("cf-ray") ?? crypto.randomUUID(),
  };
}
