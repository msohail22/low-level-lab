# engine

Compiles and runs untrusted C++ against a question's test cases.

```sh
pnpm engine     # http://localhost:3000
```

| Route | Does |
|---|---|
| `GET /health` | liveness |
| `GET /config` | the limits and binary paths this instance came up with |
| `POST /run` | compile and grade C++ against test cases |

```sh
curl -s -X POST localhost:3000/run -H 'content-type: application/json' -d '{
  "source": "#include <iostream>\nint main(){int n;std::cin>>n;std::cout<<n*2<<\"\\n\";}",
  "tests": [{"in": "21", "out": "42"}]
}'
```

Returns `{verdict, passed, total, firstFailure, results[]}`. Each result carries
`status` — `ok`, `wrong`, `timeout`, `oom`, `crashed` or `error` — plus the
timings from isolate's `--meta` file.

A failing submission is still **HTTP 200**: the caller asked whether it passes,
and "no" is an answer. Non-2xx means the engine could not answer at all.

## Where it runs

A systemd unit in a **dedicated VM on arrakis** — not on the arrakis host, and
not in a Kubernetes pod. D80 in `docs/arrakis/learning.md` has the reasoning;
the short version is that an isolate escape on the hypervisor would reach
`shieldwall`, which holds the secrets.

**Blocked on A9** (zram and KSM). 8704 MB of an 11690 MB host is already
allocated to four VMs, and this needs about 2048 MB more.

## Configuration

Nothing is hard-coded, so moving the service is a unit-file change and never a
code change. See `src/config.ts`.

| Variable | Default |
|---|---|
| `ENGINE_HOST` | `0.0.0.0` — the caller is on another machine |
| `ENGINE_PORT` | `3000` |
| `ISOLATE_BIN` | `isolate` |
| `ENGINE_CXX` | `g++` |
| `ENGINE_CPU_TIME` / `ENGINE_WALL_TIME` | `2` / `10` seconds |
| `ENGINE_MEMORY_KB` / `ENGINE_PROCESSES` / `ENGINE_OUTPUT_KB` | `65536` / `64` / `64` |
| `ENGINE_CONCURRENCY` / `ENGINE_COMPILE_MS` / `ENGINE_CXX_STD` | `4` / `10000` / `c++20` |

`ENGINE_PROCESSES` is a **total** and counts the submitted program itself.
Measured: 64 allows 63 children, 8 allows 7. A question needing 8 threads must
be given 9.

## Next, in order

1. **A9** — zram and KSM on arrakis, then measure the freed RAM.
2. A VM via OpenTofu in `arrakis/tofu/`, sized from that measurement.
3. `isolate` inside it, proven by hand: `isolate --cg --init`, then a
   hello-world, then read the `--meta` file.
4. Only then `/run`.

Step 3 before step 4 on purpose. The `--meta` file is the whole interface, and
it is worth seeing once by hand before code parses it.
