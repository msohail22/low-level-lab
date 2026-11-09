/**
 * Everything environment-dependent, in one place.
 *
 * This file exists because of D80: the engine runs in a dedicated VM, not on
 * the arrakis host. Nothing here may assume localhost or a fixed path, or the
 * move between machines becomes a code change instead of a unit-file change.
 */

/** Bind address. `0.0.0.0`, not `127.0.0.1`: the caller is on another host. */
export const HOST = process.env.ENGINE_HOST ?? "0.0.0.0";

export const PORT = Number(process.env.ENGINE_PORT ?? 3000);

/**
 * The isolate binary. It is setuid root and lives beside the engine in the
 * same VM, so this is a local path and never a URL. Configurable because the
 * AUR package, a Debian package and a source build do not agree on it.
 */
export const ISOLATE_BIN = process.env.ISOLATE_BIN ?? "isolate";

/** The C++ compiler. Runs outside the sandbox, so this is ours to choose. */
export const CXX = process.env.ENGINE_CXX ?? "g++";

/** Limits for one run. server-plan.md §5.9. */
export const LIMITS = {
  /** Seconds of CPU time. */
  cpuTime: Number(process.env.ENGINE_CPU_TIME ?? 2),
  /** Seconds of wall-clock time. Higher than cpuTime on purpose: isolate's
   *  man page recommends CPU time as the real limit and wall time as a
   *  backstop against a process that sleeps instead of computing. */
  wallTime: Number(process.env.ENGINE_WALL_TIME ?? 10),
  /** KB, whole cgroup. */
  memoryKb: Number(process.env.ENGINE_MEMORY_KB ?? 65536),
  processes: Number(process.env.ENGINE_PROCESSES ?? 64),
  /** KB. server-plan.md §5.9 asks for 64 KB of output. */
  outputKb: Number(process.env.ENGINE_OUTPUT_KB ?? 64),
} as const;

/**
 * How many sandboxes may run at once. Each gets its own `--box-id`, and isolate
 * keeps one directory per id, so two runs sharing an id would overwrite each
 * other's files. The cap is therefore a correctness bound, not a tuning knob.
 *
 * 4 because arrakis has 4 cores. server-plan.md §10.2 says the concurrent
 * compile count is undecided and must be measured, so this is a starting
 * value and is marked as such.
 */
export const MAX_CONCURRENT = Number(process.env.ENGINE_CONCURRENCY ?? 4);

/** Seconds allowed for g++ itself. Compiling is not sandboxed, so this is the
 *  only thing stopping a pathological template from hanging the engine. */
export const COMPILE_TIMEOUT_MS = Number(process.env.ENGINE_COMPILE_MS ?? 10_000);

/** C++ standard. One value, not a list: with no compile cache (D74) there is
 *  nothing to key by standard, so a list would buy nothing. */
export const CXX_STD = process.env.ENGINE_CXX_STD ?? "c++20";

/**
 * Prefix for the isolate command. Empty in production: the binary is setuid
 * root, so it needs no help.
 *
 * Set `ENGINE_ISOLATE_SUDO=1` only for local development on a machine where
 * the current login session predates `usermod -aG isolate`. It requires
 * passwordless sudo and must never be set on the sandbox VM.
 */
export const ISOLATE_PREFIX = process.env.ENGINE_ISOLATE_SUDO === "1" ? ["sudo", "-n"] : [];
