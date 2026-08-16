import type { UiEventInput } from "@llb/shared";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8787";

type QueuedEvent = UiEventInput;

const QUEUE_KEY = "llb_ui_events";
const SESSION_KEY = "llb_ui_session";

function sessionKey(): string {
  let key = sessionStorage.getItem(SESSION_KEY);
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, key);
  }
  return key;
}

function readQueue(): QueuedEvent[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedEvent[];
  } catch {
    return [];
  }
}

function writeQueue(events: QueuedEvent[]) {
  sessionStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-100)));
}

export function trackUiEvent(event: Omit<UiEventInput, "sessionKey">) {
  const next = [
    ...readQueue(),
    {
      ...event,
      route: event.route ?? window.location.pathname,
      sessionKey: sessionKey(),
    },
  ];
  writeQueue(next);
  if (next.length >= 8) void flushUiEvents();
}


export async function flushUiEvents() {
  const events = readQueue();
  if (events.length === 0) return;
  writeQueue([]);
  try {
    await fetch(`${API_BASE}/api/learn/ui-events`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "web",
      },
      body: JSON.stringify({ events }),
    });
  } catch {
    writeQueue([...events, ...readQueue()].slice(-100));
  }
}

let installed = false;

export function installUiAnalytics() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("pagehide", () => {
    void flushUiEvents();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushUiEvents();
  });
  window.setInterval(() => {
    void flushUiEvents();
  }, 15000);
}
