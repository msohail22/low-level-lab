const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8787";

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data?: T; error?: string; status: number }> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Client-Platform", "web");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      status: res.status,
      error:
        typeof json === "object" && json && "error" in json
          ? String((json as { error: string }).error)
          : res.statusText,
    };
  }

  return { status: res.status, data: json as T };
}
