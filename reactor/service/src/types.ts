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

export type JobDocument = {
  id: string;
  language: "cpp";
  source: string;
  status: JobStatus;
  result?: JobResult;
  createdAt: string;
  updatedAt: string;
};
