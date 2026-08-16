import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { which } from "./which.ts";

export type CompileRunResult = {
  ok: boolean;
  status: "succeeded" | "failed" | "timed_out";
  stdout: string;
  stderr: string;
  exitCode: number | null;
  compiler: string;
  durationMs: number;
};

function runCommand(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs: number },
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolve({ stdout, stderr, exitCode: null, timedOut: true });
    }, opts.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, timedOut: false });
    });
  });
}

export async function compileAndRunCpp(
  source: string,
): Promise<CompileRunResult> {
  const started = Date.now();
  const compilerBin = (await which("clang++")) ?? (await which("g++"));
  if (!compilerBin) {
    return {
      ok: false,
      status: "failed",
      stdout: "",
      stderr: "No clang++ or g++ found on PATH.",
      exitCode: null,
      compiler: "none",
      durationMs: Date.now() - started,
    };
  }
  const compiler = compilerBin.includes("clang") ? "clang++" : "g++";
  const dir = await mkdtemp(join(tmpdir(), "llb-reactor-"));
  const srcPath = join(dir, "main.cpp");
  const binPath = join(dir, "a.out");

  try {
    await writeFile(srcPath, source, "utf8");
    const compile = await runCommand(
      compilerBin,
      ["-std=c++17", "-O0", srcPath, "-o", binPath],
      { cwd: dir, timeoutMs: 15_000 },
    );
    if (compile.timedOut) {
      return {
        ok: false,
        status: "timed_out",
        stdout: compile.stdout,
        stderr: compile.stderr || "Compile timed out.",
        exitCode: null,
        compiler,
        durationMs: Date.now() - started,
      };
    }
    if (compile.exitCode !== 0) {
      return {
        ok: false,
        status: "failed",
        stdout: compile.stdout,
        stderr: compile.stderr,
        exitCode: compile.exitCode,
        compiler,
        durationMs: Date.now() - started,
      };
    }

    const run = await runCommand(binPath, [], {
      cwd: dir,
      timeoutMs: 3_000,
    });
    if (run.timedOut) {
      return {
        ok: false,
        status: "timed_out",
        stdout: run.stdout,
        stderr: run.stderr || "Process timed out after 3s.",
        exitCode: null,
        compiler,
        durationMs: Date.now() - started,
      };
    }
    return {
      ok: run.exitCode === 0,
      status: run.exitCode === 0 ? "succeeded" : "failed",
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: run.exitCode,
      compiler,
      durationMs: Date.now() - started,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
