type AuthBindings = CloudflareBindings & {
  WEB_ORIGIN?: string;
};

const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function getTrustedOrigins(env: AuthBindings): string[] {
  const fromEnv = env.WEB_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_TRUSTED_ORIGINS, ...(fromEnv ?? [])])];
}
