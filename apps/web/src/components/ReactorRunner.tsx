import { useState } from "react";
import {
  createReactorClient,
  ReactorError,
  type GetJobResponse,
} from "@llb/reactor-sdk";

import { Alert, Button } from "@/components/ui";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8787";
const DIRECT_REACTOR = import.meta.env.VITE_REACTOR_URL?.replace(/\/$/, "");

const SAMPLE = `#include <iostream>

int main() {
  std::cout << "hello from reactor\\n";
  return 0;
}
`;

function createClient() {
  if (DIRECT_REACTOR) {
    return createReactorClient({ baseUrl: DIRECT_REACTOR });
  }
  return createReactorClient({
    baseUrl: API_BASE,
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        credentials: "include",
        headers: {
          "X-Client-Platform": "web",
          ...(init?.headers ?? {}),
        },
      }),
    paths: {
      submit: "/api/reactor/jobs",
      get: (id) => `/api/reactor/jobs/${id}`,
    },
  });
}

export function ReactorRunner() {
  const [source, setSource] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<GetJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRun() {
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const client = createClient();
      const submitted = await client.submitJob({ language: "cpp", source });
      setJob(submitted);
      const finished = await client.waitForJob(submitted.id);
      setJob(finished);
    } catch (err) {
      if (err instanceof ReactorError) {
        setError(
          err.message === "REACTOR_UNAVAILABLE" || err.status === 503
            ? "Reactor unavailable — start the local Reactor stack."
            : err.message === "POLL_TIMEOUT"
              ? "Timed out waiting for the job."
              : err.message,
        );
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="block text-sm text-[color:var(--muted)]">
        C++ source
        <textarea
          className="mt-2 w-full min-h-48 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] p-3 font-mono text-sm text-[color:var(--ink)]"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={busy}
          onClick={() => void onRun()}
        >
          {busy ? "Running…" : "Run"}
        </Button>
        {DIRECT_REACTOR && (
          <span className="self-center text-xs text-[color:var(--muted)]">
            Direct Reactor: {DIRECT_REACTOR}
          </span>
        )}
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {job && (
        <div className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-sm">
          <p className="text-[color:var(--muted)]">
            Job <span className="font-mono text-[color:var(--ink)]">{job.id}</span> ·{" "}
            <span className="text-[color:var(--ink)]">{job.status}</span>
          </p>
          {job.result && (
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-[color:var(--ink)]">
              {`compiler: ${job.result.compiler}\nexit: ${job.result.exitCode}\ndurationMs: ${job.result.durationMs}\n\nstdout:\n${job.result.stdout || "(empty)"}\n\nstderr:\n${job.result.stderr || "(empty)"}`}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
