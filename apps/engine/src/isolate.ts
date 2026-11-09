import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import {
  COMPILE_TIMEOUT_MS, CXX, CXX_STD, ISOLATE_BIN, ISOLATE_PREFIX, LIMITS, MAX_CONCURRENT,
} from "./config.ts";
import { parseMeta, outputMatches, type Meta } from "./meta.ts";
import type { CaseStatus, TestCase } from "./schema.ts";

const exec = promisify(execFile);

/**
 * Run a command, write `input` to its stdin, and capture stdout.
 *
 * `spawn` and not `execFile` because only this form can feed stdin on a
 * promise-based path — `execFile`'s `input` option exists on the *Sync*
 * variant only. Never rejects: isolate exits non-zero whenever it kills the
 * program, which is a normal outcome, so the exit code is returned and the
 * meta file decides what happened.
 */
function spawnCapture(
  cmd: string,
  args: string[],
  input: string,
  maxBytes: number,
): Promise<{ stdout: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let total = 0;
    child.stdout.on("data", (d: Buffer) => {
      total += d.length;
      // Stop accumulating past the cap. --fsize already limits what the
      // program may write, but that is isolate's limit on the program; this
      // one protects the engine's own memory if the cap is ever raised.
      if (total <= maxBytes) chunks.push(d);
    });
    // Drained and dropped. isolate writes its own status line here ("OK (0.002
    // sec real...)"), which is not the program's output and not the truth
    // about the run; the meta file is. Left unread, the pipe could fill and
    // block the child.
    child.stderr.resume();
    child.on("error", () => resolve({ stdout: Buffer.concat(chunks).toString("utf8"), code: null }));
    child.on("close", (code) => resolve({ stdout: Buffer.concat(chunks).toString("utf8"), code }));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}


/** `isolate` plus the dev-only sudo prefix, as a command and its leading args. */
function isolateCmd(args: string[]): [string, string[]] {
  const all = [...ISOLATE_PREFIX, ISOLATE_BIN, ...args];
  return [all[0]!, all.slice(1)];
}

/**
 * Box ids are a fixed, exclusive resource: isolate keeps one directory per id,
 * so two concurrent runs on the same id would overwrite each other's binary.
 * This hands out ids and makes the (MAX_CONCURRENT + 1)th caller wait, which
 * is why it is a queue and not a counter.
 */
const freeIds: number[] = Array.from({ length: MAX_CONCURRENT }, (_, i) => i);
const waiting: ((id: number) => void)[] = [];

function takeBoxId(): Promise<number> {
  const id = freeIds.pop();
  if (id !== undefined) return Promise.resolve(id);
  return new Promise((resolve) => waiting.push(resolve));
}

function releaseBoxId(id: number): void {
  const next = waiting.shift();
  if (next) next(id);
  else freeIds.push(id);
}

export type CompileResult =
  | { ok: true; binary: string; dir: string }
  | { ok: false; stderr: string };

/**
 * Compile OUTSIDE the sandbox. Deliberate: the compiler is ours and trusted,
 * the program is not. Sandboxing g++ would cost a sandbox per request and
 * protect against nothing, because the threat is the compiled program.
 *
 * The caller owns `dir` on success and must remove it.
 */
export async function compile(source: string): Promise<CompileResult> {
  const dir = await mkdtemp(join(tmpdir(), "engine-"));
  const src = join(dir, "main.cpp");
  const binary = join(dir, "prog");
  await writeFile(src, source, "utf8");
  try {
    await exec(CXX, [`-std=${CXX_STD}`, "-O2", "-o", binary, src], {
      timeout: COMPILE_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, binary, dir };
  } catch (err) {
    const e = err as { stderr?: string; killed?: boolean };
    await rm(dir, { recursive: true, force: true });
    return {
      ok: false,
      stderr: e.killed
        ? `compiler timed out after ${COMPILE_TIMEOUT_MS} ms`
        : (e.stderr ?? String(err)).slice(0, 16 * 1024),
    };
  }
}

export type CaseResult = {
  index: number;
  status: CaseStatus;
  note?: string;
  stdout: string;
  timeSec?: number;
  wallSec?: number;
  maxRssKb?: number;
  /** isolate's own message, when it has one. */
  message?: string;
};

/** Map isolate's meta plus our own diff into one verdict. */
function verdict(meta: Meta, stdout: string, want: string): CaseStatus {
  if (meta.cgOomKilled) return "oom";
  if (meta.status === "TO") return "timeout";
  if (meta.status === "XX") return "error";
  // SG and RE both mean the program itself failed: a signal, or a non-zero exit.
  if (meta.status === "SG" || meta.status === "RE") return "crashed";
  if (meta.exitcode !== undefined && meta.exitcode !== 0) return "crashed";
  // Only now is the output worth comparing. Checking it first would report a
  // timeout as a wrong answer.
  return outputMatches(stdout, want) ? "ok" : "wrong";
}

/** Run one test case in a fresh sandbox. */
export async function runCase(binary: string, test: TestCase, index: number): Promise<CaseResult> {
  const boxId = await takeBoxId();
  const metaFile = join(await mkdtemp(join(tmpdir(), "meta-")), "meta.txt");
  const idArgs = ["--cg", `--box-id=${boxId}`];
  let boxDir: string | undefined;

  try {
    // --cg must be on EVERY invocation, init and cleanup included. Without it
    // no cgroup is made and --cg-mem silently does nothing, so the memory
    // limit would appear to pass by never being applied.
    const [ic, ia] = isolateCmd([...idArgs, "--init"]);
    boxDir = (await exec(ic, ia)).stdout.trim();
    await copyFile(binary, join(boxDir, "box", "prog"));

    const [rc, ra] = isolateCmd([
      ...idArgs,
      `--meta=${metaFile}`,
      `--time=${LIMITS.cpuTime}`,
      // Far higher than --time on purpose: isolate's man page recommends CPU
      // time as the real limit and wall time as a backstop for a program that
      // sleeps instead of computing.
      `--wall-time=${LIMITS.wallTime}`,
      // --cg-mem, not -m: -m caps one process's address space and forking
      // defeats it. The cgroup form cannot be dodged.
      `--cg-mem=${LIMITS.memoryKb}`,
      // The default is 1 process. Anything threaded fails confusingly without
      // this.
      `--processes=${LIMITS.processes}`,
      `--fsize=${LIMITS.outputKb}`,
      "--run",
      // Ends isolate's flags, so a program argument starting with a dash is
      // passed through rather than eaten.
      "--",
      "/box/prog",
    ]);

    const { stdout } = await spawnCapture(rc, ra, test.in, LIMITS.outputKb * 1024);

    const meta = parseMeta(await readFile(metaFile, "utf8").catch(() => ""));
    return {
      index,
      status: verdict(meta, stdout, test.out),
      note: test.note,
      stdout: stdout.slice(0, LIMITS.outputKb * 1024),
      timeSec: meta.time,
      wallSec: meta.timeWall,
      maxRssKb: meta.maxRssKb,
      message: meta.message,
    };
  } catch (err) {
    return { index, status: "error", note: test.note, stdout: "", message: String(err).slice(0, 2048) };
  } finally {
    if (boxDir) {
      const [cc, ca] = isolateCmd([...idArgs, "--cleanup"]);
      await exec(cc, ca).catch(() => {});
    }
    await rm(join(metaFile, ".."), { recursive: true, force: true }).catch(() => {});
    releaseBoxId(boxId);
  }
}
