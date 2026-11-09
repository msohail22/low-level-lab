# Server plan: arrakis

This document uses Simplified Technical English (ASD-STE100). All changes to this
document must use the same style. Keep sentences short. Use active voice. Write
one idea in one sentence.

Last change: 2026-10-31.

> **Status note, added 2026-11-09.** This design is sound and stays as written.
> Three parts of it are **deferred**, because the engine accepts latency:
>
> | Section | What it describes | Why it is deferred |
> |---|---|---|
> | 5.2 | C and GNU `as` assembly as accepted input | C++ only for now. `cpp` is the one topic that exists. |
> | 5.6 | Keep the sandboxes ready (a pool) | `isolate --init` per request costs about 10 ms. |
> | 5.7 | Cache the compiled program | Recompile every time. This also closes open question 10.6, the list of language standards, because nothing is keyed any more. |
> | 6 | The data services, Redis in particular | Redis existed to hold the compile cache from 5.7. |
>
> Two decisions were taken against this document and are **not** deferred:
>
> 1. **Section 5.3 is implemented by [`isolate`](https://github.com/ioi/isolate).**
>    The layer list in 5.3 — cgroup v2, user/mount/PID/network namespaces,
>    seccomp-bpf, rlimits, `no_new_privs` — is what isolate already does. It is
>    what the IOI grades on. Nothing here is hand-written, so open question 10.5
>    ("the seccomp list is not written") is closed: isolate ships the list.
> 2. **Section 5.4 is confirmed, not deferred.** The service runs as a systemd
>    unit on the host. isolate's own man page says running in containers is "not
>    recommended", which is the same reason 5.4 already gives. The k8s manifests
>    that contradicted this were removed on 2026-11-09.
>
> Phases 2, 4, 6 and 12 of section 11 therefore drop out of the order of work.
> Phase 2 becomes installing a package.

## 1. Goal

Run a sandbox code execution service on one small server. Serve the largest
number of requests that the hardware permits. Use the same server to learn
Kubernetes, networking, and observability.

## 2. The hardware

```
Machine   arrakis (laptop)
CPU       Intel i5-1135G7, 4 cores, 8 threads
RAM       11 GB
Swap      11 GB
Disk      456 GB, 345 GB free
Network   Tailscale, address 100.114.18.44
OS        Debian 13 (trixie), kernel 6.12
Cgroups   version 2
```

Two limits control every decision in this plan.

1. The CPU has 4 real cores. The sandbox service and the ClickHouse build both
   need CPU. They compete.
2. The RAM is 11 GB. Each service that starts takes RAM away from the sandbox
   service.

The disk is not a limit. 345 GB is enough for all of this plan.

## 3. The existing load

The server already builds ClickHouse master. A timer starts the build. The build
uses 4 compile jobs. The build takes 2 GB to 4 GB of RAM. A cold build takes
about 4 hours.

The plan changes the timer from every 15 minutes to every hour. The build still
competes with the sandbox service. Section 10 holds the open question about this.

The CPU reaches 100 degrees Celsius during a build. The CPU then reduces its own
speed. The CPU does not fail. The server runs at its thermal limit.

## 4. What the server permits

These facts come from tests on the server on 2026-10-31. They decide the design.

| Test | Result |
|---|---|
| Unprivileged user namespace | Works |
| Mount, PID, and network namespaces, with no root | Work |
| Seccomp filters | Supported |
| Delegated cgroup v2 controllers | `cpu`, `memory`, `pids` |
| Delegated `io` controller | **Not available** |

Two results are important.

1. The sandbox needs no root. A program that escapes the sandbox reaches an
   ordinary user account. It does not reach the root account.
2. The service cannot limit disk throughput for each sandbox. The `io`
   controller is absent. The design removes the need for it. The sandbox gets a
   read-only root file system and one small tmpfs. The program has almost
   nothing to write to.

## 5. The sandbox service

### 5.1 What it must do

1. Receive source code from a client.
2. Compile the source code.
3. Run the program in isolation.
4. Return the output.
5. Stop a program that runs too long.
6. Stop a program that uses too much memory.

### 5.2 The accepted input

The service accepts three kinds of source code. It accepts no other kind.

1. C source code.
2. C++ source code.
3. x86 assembly source code, in GNU assembler syntax.

The service uses the GNU assembler (`as`) for the assembly input. It does not
use NASM. It does not use any other assembler.

### 5.3 The isolation method

**IMPLEMENTED BY `isolate` 2026-11-09.** Every layer below is what
[ioi/isolate](https://github.com/ioi/isolate) already does. Do not hand-write
this. Open question 10.5 is closed by adopting it.

The service uses **native execution with namespaces, cgroups, and seccomp**.

The service does not use WebAssembly. WebAssembly cannot run x86 assembly.
WebAssembly has its own instruction set. It also has no threads and no `fork`.
The accepted input in section 5.2 makes WebAssembly incorrect for this service.

The service does not use a virtual machine for each request. A microVM needs
125 MB or more. The RAM budget in section 9 does not permit this.

The isolation uses these layers. The list starts at the outside layer.

| Layer | Purpose |
|---|---|
| cgroup v2 | Limit memory, process count, and CPU |
| User namespace | Remove all real root rights |
| Mount namespace | Give a read-only root and one small tmpfs |
| PID namespace | Hide every other process |
| Network namespace | Remove all network access |
| seccomp-bpf | Permit only a small list of system calls |
| rlimits | Limit CPU time, file size, and open files |
| `no_new_privs` | Stop a setuid program from raising its rights |

Risk of this method: the isolation depends on a correct configuration. A kernel
fault or a wrong filter can give access to the host. The server has no public
address. Tailscale carries all traffic. This risk is acceptable for a server
that you use to learn.

### 5.4 Where the service runs

The sandbox service runs as a **systemd service on the host**. It does not run
in a Kubernetes pod.

Reason: a sandbox inside a container must create namespaces inside namespaces.
This needs more rights and adds delay. The host gives direct access to
namespaces and cgroups.

The API server also runs on the host. The API server receives the HTTP request
and returns the result. It stays beside the compile workers and the sandbox
pool. The three parts then share the local cache directly.

A Kubernetes pod has its own network namespace and its own mount namespace. A
pod therefore cannot read the local cache. Traffic from a pod to the host also
goes through a virtual network device and through address translation. This adds
about 100 to 300 microseconds. Section 5.5 shows a hot path of about 1
millisecond. The delay is therefore too large.

### 5.4.1 What the host does, and what Kubernetes does

Put the work that each request needs on the host. Put the work that stores data
in Kubernetes.

| Work | Host | Kubernetes |
|---|---|---|
| Receive the HTTP request | Yes | No |
| Compile the source code | Yes | No |
| Run the program in the sandbox | Yes | No |
| Hold the local cache of compiled programs | Yes | No |
| Return the result | Yes | No |
| Store the submissions and the users | No | PostgreSQL |
| Store the telemetry and the history | No | ClickHouse |
| Hold the queue | No | Redis Streams |
| Show the dashboards | No | Grafana |
| Deploy the pods | No | ArgoCD |

### 5.4.2 The request must not wait for a database

The hot path must never wait for PostgreSQL. A write to PostgreSQL costs 5 to 20
milliseconds. The hot path costs about 1 millisecond. A write in the hot path
therefore makes the service 5 to 20 times slower.

Use this sequence instead.

1. The API server runs the program and returns the result to the client.
2. The API server writes one line to a local log file. This costs about 5
   microseconds. It uses no network.
3. A separate shipper program reads the log file.
4. The shipper writes the line to a Redis stream in the cluster.
5. A worker in the cluster reads the stream. The worker writes to PostgreSQL,
   to ClickHouse, and to the cold archive.

```
request --> compile and run --> result to the client     (about 1 ms)
                  |
                  +--> one line to a local log file      (about 5 us)

later, and not in the hot path:
  shipper --> Redis stream --> worker --> PostgreSQL
                                      --> ClickHouse
                                      --> Cloudflare R2
```

This design has two results. Accept both.

1. The sandbox service works when Kubernetes stops. It needs no database driver.
2. The data in PostgreSQL arrives after the client gets the result. This is
   correct for a service that you use to learn. It is not correct for a contest
   that shows live ranks.

### 5.4.3 Cloudflare storage

Cloudflare gives 10 GB of object storage (R2) at no cost. It also charges
nothing to read the data out.

Do **not** put the compiled program cache in R2. R2 is in a data centre, not on
this server. A read takes 50 to 200 milliseconds. The sandbox run takes about 1
millisecond. The cache would then be slower than a new build.

Use R2 for data that you write once and read rarely.

1. A cold archive of each submission and its output.
2. Backups of the ClickHouse data.
3. Build logs and compiler output.

R2 is not enabled on the account on 2026-10-31. Enable it in the Cloudflare
dashboard before phase 13.

### 5.4.4 How clients reach the server

The server uses two paths. Each path has one purpose.

| Path | Purpose | Cost |
|---|---|---|
| Tailscale | Administration: kubectl, Grafana, ArgoCD | Free |
| Cloudflare Tunnel | The public sandbox API | Free |

The Cloudflare Tunnel needs no public address and no open port. The tunnel ends
at the API server on the host.

### 5.5 The cost of each request

These are the costs to measure. They are not yet measured.

```
request with a cached program:
  take a ready sandbox      about 0 ms    (the pool holds it)
  load the seccomp filter   about 50 us
  start the program         about 1 ms
  the program runs          variable

request with a new C++ program:
  clang compiles            about 1000 ms, 200 MB to 400 MB of RAM

request with a new assembly program:
  as and ld build           about 10 ms, about 10 MB of RAM
```

Two results follow from these numbers.

1. A C++ build costs about 100 times more than an assembly build.
2. The CPU has 4 cores. The server permits 2 or 3 clang processes at the same
   time. A new C++ program therefore limits the service to about 2 or 3 requests
   for each second.

A cached program has none of this cost. The cache decides the speed of the
service.

### 5.6 Keep the sandboxes ready

**DEFERRED 2026-11-09.** Latency is acceptable, so `isolate --init` runs per
request. Revisit when a measurement says the init cost matters.

The cost to start a sandbox is in the namespace setup, not in `fork`. Start a
pool of sandbox processes when the service starts. Each process waits inside its
own namespaces. Each process waits on a socket for work.

For each request the service then does only two steps.

1. Load the seccomp filter.
2. Start the program.

### 5.7 Cache the compiled program

**DEFERRED 2026-11-09.** The engine recompiles every time. This also closes
open question 10.6: with no cache there is nothing to key by language standard.

Do not compile for each request. Use this sequence.

1. Calculate a hash from the source code and the compiler options.
2. Read the hash from the local disk cache.
3. If the local disk holds the program, run it.
4. If the local disk does not hold the program, read the hash from Redis.
5. If Redis holds the program, write it to the local disk, then run it.
6. If Redis does not hold the program, build it once. Write it to the local disk
   and to Redis. Then run it.

```
request
   |
   v
hash the source and the options
   |
   +-- local disk has it ----> run                     (about 1 ms)
   |
   +-- Redis has it --------> copy to disk, then run
   |
   +-- nobody has it ------> build once, store, run    (about 1 s for C++)
```

The cache holds a compiled ELF program. The sandbox runs the program. A wrong
cache entry therefore stays inside the sandbox. It cannot reach the host.

### 5.8 The toolchains

The server has these tools. It needs no new install for the three languages in
section 5.2. The sizes come from the package data on 2026-10-31.

| Tool | Version | Use |
|---|---|---|
| GNU assembler (`as`) | 2.44 | Assembly input |
| GNU linker (`ld`) | 2.44 | All three languages |
| gcc, g++ | 14.2.0 | C and C++ |
| clang, clang++ | 22.1.8 | C and C++ |

The whole set uses 1.0 GB of disk.

A compiler costs disk when you install it. A compiler costs RAM only when it
runs. These two costs are different. Keep them apart.

```
installed, but idle        0 MB of RAM
clang runs on C++          200 MB to 400 MB for each process
gcc runs on C              100 MB to 200 MB for each process
as runs on assembly        about 10 MB for each process
```

Result: the number of installed versions does not change the RAM use. The
number of builds at the same time changes the RAM use. Section 10 holds the open
question about that number.

More versions have a different cost. They reduce the cache hit rate. The cache
key holds the compiler name and the compiler version.

```
key = sha256(source + compiler + version + options)
```

One toolchain gives one cache entry for each program. Six toolchains give six
cache entries for the same program. The hit rate then falls. Section 5.5 shows
that the hit rate decides the speed of the service.

Rule for this server: offer **gcc 14 and clang 22 only**. Add another version
only to compare the output of two compilers. Accept the lower hit rate when you
add one.

### 5.9 Limits for each run

Set these limits for every run.

1. A maximum run time. Start with 2 seconds.
2. A maximum memory size. Start with 64 MB.
3. A maximum process count. Start with 64.
4. A maximum output size. Start with 64 KB.
5. No network access.
6. No write access, except to one small tmpfs.

## 6. The data services

**DEFERRED 2026-11-09.** Redis here held the compile cache from 5.7, which is
deferred. The site keeps reader progress in Cloudflare D1, not in PostgreSQL.

| Service | Purpose | RAM |
|---|---|---|
| PostgreSQL | Store users, submissions, and results | 300 MB |
| Redis | Hold the queue, the shared cache, and the rate limits | 50 MB |
| ClickHouse | Store telemetry and execution history | 1000 MB |
| Cloudflare R2 | Hold the cold archive and the backups | 0 MB |

The queue uses **Redis Streams**. Redis is already in this list. Redis Streams
therefore cost no more RAM. They give consumer groups, acknowledgements, and
replay.

Do not use RabbitMQ. It needs about 400 MB. Do not use Kafka. It needs about
1000 MB. Do not use Cloudflare Queues. They are not free.

PostgreSQL holds data that must be correct. Redis holds data that the service
can lose and build again. ClickHouse holds data that arrives in large volume.

## 7. Observability

Observability is possible on this server. It is not free. Each tool takes RAM.

This plan does **not** use Prometheus. Prometheus needs 500 MB to 1 GB. The
server already runs ClickHouse. ClickHouse stores metrics, logs, and traces in
one place.

```
the sandbox service and the pods
   |
   |  OpenTelemetry protocol
   v
OpenTelemetry Collector     (150 MB)
   |
   v
ClickHouse                  (1000 MB)
   |
   v
Grafana                     (150 MB)
```

This design has three benefits.

1. It saves about 1 GB of RAM.
2. It uses one query language for metrics, logs, and traces.
3. It uses ClickHouse, which is the subject you already study.

Measure these numbers for the sandbox service.

1. Requests for each second.
2. The 99th percentile of the response time.
3. The cache hit rate.
4. The number of runs that reached the time limit.
5. The number of runs that reached the memory limit.

## 8. Networking

Use Kubernetes to learn networking. The network plugin decides how much you can
learn and how much RAM you pay.

| Plugin | RAM | What it teaches |
|---|---|---|
| Flannel (the k3s default) | 50 MB | Basic pod networking only. No network policy. |
| Calico | 200 MB | Network policy. |
| Cilium | 400 MB | Network policy, eBPF, and traffic inspection with Hubble. |

Cilium teaches the most. Cilium also costs the most RAM. Start with Flannel.
Change to Cilium after you measure the free RAM. Section 11 holds this step.

Learn these subjects in this order.

1. Pod to pod traffic inside one node.
2. Services and the cluster DNS.
3. Ingress and traffic from outside the cluster.
4. Network policy, which blocks traffic between pods.
5. Tailscale, which carries your traffic to the server.
6. Network namespaces, which the sandbox uses to remove all network access.

Subject 6 connects the sandbox to the networking study. The sandbox uses the
same kernel feature that Kubernetes uses for each pod.

## 9. The RAM budget

| Component | RAM |
|---|---|
| k3s server | 600 MB |
| Flannel | 50 MB |
| ArgoCD, with dex and notifications off | 1000 MB |
| PostgreSQL | 300 MB |
| Redis | 50 MB |
| ClickHouse | 1000 MB |
| OpenTelemetry Collector | 150 MB |
| Grafana | 150 MB |
| **Total for Kubernetes** | **3300 MB** |
| Sandbox service and its pool, on the host | 150 MB |
| Two clang processes at the same time | 800 MB |
| **Total for the services** | **4250 MB** |
| ClickHouse build, at the same time | 2000 MB to 4000 MB |
| **Peak** | **6250 MB to 8250 MB** |

The peak fits in 11 GB. The margin is small. The swap holds 11 GB and absorbs a
short peak.

Result: the services and the build fit together. The sandbox response time will
increase during a build.

## 10. Open questions

These questions need a decision. Do not start the work that depends on them.

1. **The build and the sandbox compete for CPU.** An hourly build still takes
   all 4 cores for hours. Options: set a CPU quota on the build, or run the
   build only at night.
2. **The maximum number of concurrent builds is not decided.** Two clang
   processes cost about 800 MB. Measure the effect before you raise the number.
3. **The server is a laptop.** Decide what happens when the lid closes. The
   cluster stops if the machine sleeps.
4. **There is one node.** The cluster has no high availability. This is correct
   for learning. It is not correct for a service that must stay available.
5. **The seccomp list is not written.** The list decides what a program can do.
   A short list is safe and breaks some programs. A long list is permissive.
6. **The language standards are not decided.** Each standard, such as `c++23` or
   `c17`, makes a separate cache entry. Decide a short list of standards.

## 11. The order of work

Do these phases in order. Measure the free RAM after each phase.

| Phase | Work | Status |
|---|---|---|
| 0 | Finish the current ClickHouse build | In progress |
| 1 | Change the build timer to hourly | Not started |
| 2 | Write the sandbox runner: namespaces, cgroups, seccomp | Not started |
| 3 | Measure the cost to start one sandbox | Not started |
| 4 | Add the sandbox pool | Not started |
| 5 | Add the compile step for C, C++, and assembly | Not started |
| 6 | Add the local disk cache for compiled programs | Not started |
| 6a | Write the API server on the host | Not started |
| 6b | Write the local log file and the shipper | Not started |
| 7 | Install k3s with Flannel | Not started |
| 8 | Reach the cluster from the laptop over Tailscale | Not started |
| 9 | Install ArgoCD, with dex off | Not started |
| 10 | Create the GitOps repository for the manifests | Not started |
| 11 | Deploy PostgreSQL and Redis | Not started |
| 12 | Connect the Redis cache to the sandbox service | Not started |
| 13 | Enable R2, then deploy ClickHouse, the Collector, and Grafana | Not started |
| 13a | Add the Cloudflare Tunnel for the public API | Not started |
| 14 | Measure requests for each second | Not started |
| 15 | Change Flannel to Cilium, if RAM permits | Not started |
| 16 | Add network policy between the pods | Not started |

Phases 2 to 6 come before Kubernetes. The sandbox runs on the host. It does not
need the cluster. Build the hard part first.

## 12. How to measure success

Record these numbers after phase 14. Repeat the measurement after each change.

1. The number of requests for each second, with a warm cache.
2. The number of requests for each second, with a cold cache.
3. The 99th percentile response time, during a build.
4. The 99th percentile response time, with no build.
5. The free RAM at the peak.
6. The time to start one sandbox.

A change is an improvement only if these numbers improve.
