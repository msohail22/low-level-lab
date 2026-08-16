import { describe, expect, it } from "vitest";

import {
  buildFingerprint,
  normalizePlatform,
  redactPath,
} from "./client-meta.ts";

describe("normalizePlatform", () => {
  it("accepts web ios android", () => {
    expect(normalizePlatform("web")).toBe("web");
    expect(normalizePlatform("IOS")).toBe("ios");
    expect(normalizePlatform("android")).toBe("android");
  });

  it("falls back to unknown", () => {
    expect(normalizePlatform(null)).toBe("unknown");
    expect(normalizePlatform("desktop")).toBe("unknown");
  });
});

describe("redactPath", () => {
  it("strips sensitive query keys", () => {
    expect(redactPath("/api/x?token=abc&ok=1")).toBe("/api/x?ok=1");
    expect(redactPath("/health")).toBe("/health");
  });
});

describe("buildFingerprint", () => {
  it("is stable for same inputs", async () => {
    const a = await buildFingerprint({
      platform: "web",
      browserName: "Chrome",
      osName: "macOS",
      deviceType: "desktop",
      appVersion: null,
      userAgent: "Mozilla/5.0",
    });
    const b = await buildFingerprint({
      platform: "web",
      browserName: "Chrome",
      osName: "macOS",
      deviceType: "desktop",
      appVersion: null,
      userAgent: "Mozilla/5.0",
    });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });
});
