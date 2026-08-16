import { DurableObject } from "cloudflare:workers";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  streak: number;
  updatedAt: string;
}

export class LeaderboardDO extends DurableObject {
  private entries: LeaderboardEntry[] = [];
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    const stored = await this.ctx.storage.get<LeaderboardEntry[]>("rankings");
    this.entries = stored || [];
    this.initialized = true;
  }

  async fetch(request: Request): Promise<Response> {
    await this.ensureInitialized();
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);
      // Send initial rankings on connection
      server.send(
        JSON.stringify({
          type: "INIT",
          leaderboard: this.entries.slice(0, 50),
        }),
      );

      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP Endpoints
    if (request.method === "POST" && url.pathname === "/update") {
      const payload = (await request.json().catch(() => null)) as {
        userId?: string;
        name?: string;
        score?: number;
        streak?: number;
      } | null;

      if (payload && payload.userId) {
        const userId = payload.userId;
        const name = payload.name || "Learner";
        const score = payload.score ?? 1;
        const streak = payload.streak ?? 0;

        const idx = this.entries.findIndex((e) => e.userId === userId);
        if (idx >= 0) {
          this.entries[idx].score += score;
          this.entries[idx].streak = Math.max(this.entries[idx].streak, streak);
          this.entries[idx].updatedAt = new Date().toISOString();
        } else {
          this.entries.push({
            userId,
            name,
            score,
            streak,
            updatedAt: new Date().toISOString(),
          });
        }

        // Sort descending by score then streak
        this.entries.sort((a, b) => b.score - a.score || b.streak - a.streak);
        if (this.entries.length > 200) {
          this.entries = this.entries.slice(0, 200);
        }

        await this.ctx.storage.put("rankings", this.entries);

        // Broadcast to WebSocket clients
        const broadcastMsg = JSON.stringify({
          type: "UPDATE",
          entry: { userId, name, score, streak },
          top: this.entries.slice(0, 50),
        });

        for (const ws of this.ctx.getWebSockets()) {
          try {
            ws.send(broadcastMsg);
          } catch (err) {
            console.error("Failed sending WS update:", err);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "GET" && url.pathname === "/top") {
      return new Response(
        JSON.stringify({ leaderboard: this.entries.slice(0, 50) }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Not Found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Ping/pong or client query handling
    try {
      const text = typeof message === "string" ? message : new TextDecoder().decode(message);
      const data = JSON.parse(text);
      if (data.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG" }));
      }
    } catch {
      // Ignore invalid payload
    }
  }

  async webSocketClose(ws: WebSocket) {
    try {
      ws.close();
    } catch {
      // Ignore
    }
  }
}

/**
 * Helper to notify Leaderboard Durable Object of user attempt / activity
 */
export async function notifyLeaderboardDO(
  env: CloudflareBindings,
  update: { userId: string; name?: string; score?: number; streak?: number },
): Promise<void> {
  if (!env.LEADERBOARD_DO) return;

  try {
    const id = env.LEADERBOARD_DO.idFromName("global-leaderboard");
    const stub = env.LEADERBOARD_DO.get(id);
    await stub.fetch("http://do/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  } catch (err) {
    console.error("[LeaderboardDO] Failed to notify DO:", err);
  }
}
