export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "timed_out";

export type JobResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  compiler: string;
  durationMs: number;
};

export type SubmitJobInput = {
  language: "cpp";
  source: string;
};

export type SubmitJobResponse = {
  id: string;
  status: JobStatus;
};

export type GetJobResponse = {
  id: string;
  status: JobStatus;
  result?: JobResult;
  createdAt?: string;
  updatedAt?: string;
};

export type ReactorClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Defaults match Reactor HTTP: /v1/jobs */
  paths?: {
    submit?: string;
    get?: (id: string) => string;
  };
};

export type WaitForJobOptions = {
  pollMs?: number;
  timeoutMs?: number;
};

const TERMINAL: ReadonlySet<JobStatus> = new Set([
  "succeeded",
  "failed",
  "timed_out",
]);

export class ReactorError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ReactorError";
    this.status = status;
    this.body = body;
  }
}

export function createReactorClient(opts: ReactorClientOptions) {
  const baseUrl = opts.baseUrl.replace(/\/$/, "");
  const fetchFn = opts.fetch ?? fetch;
  const submitPath = opts.paths?.submit ?? "/v1/jobs";
  const getPath = opts.paths?.get ?? ((id: string) => `/v1/jobs/${id}`);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetchFn(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        typeof body === "object" && body && "error" in body
          ? String((body as { error: string }).error)
          : res.statusText;
      throw new ReactorError(msg || "Reactor request failed", res.status, body);
    }
    return body as T;
  }

  async function submitJob(input: SubmitJobInput): Promise<SubmitJobResponse> {
    return request<SubmitJobResponse>(submitPath, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async function getJob(id: string): Promise<GetJobResponse> {
    return request<GetJobResponse>(getPath(id));
  }

  async function waitForJob(
    id: string,
    waitOpts: WaitForJobOptions = {},
  ): Promise<GetJobResponse> {
    const pollMs = waitOpts.pollMs ?? 400;
    const timeoutMs = waitOpts.timeoutMs ?? 30_000;
    const started = Date.now();
    for (;;) {
      const job = await getJob(id);
      if (TERMINAL.has(job.status)) return job;
      if (Date.now() - started > timeoutMs) {
        throw new ReactorError("POLL_TIMEOUT", 408, { id, status: job.status });
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }

  return { submitJob, getJob, waitForJob };
}

export type ReactorClient = ReturnType<typeof createReactorClient>;
