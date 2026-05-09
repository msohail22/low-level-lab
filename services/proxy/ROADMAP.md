# Edge Proxy (C++) — Roadmap

## Phase 0 — Setup
- [ ] Create `services/proxy` with CMake
- [ ] Setup basic build + run workflow
- [ ] Add logging (stdout-based)
- [ ] Define project structure:
  - core/
  - net/
  - http/
  - cache/
  - rate_limit/
  - worker/

---

## Phase 1 — Networking Fundamentals
- [ ] Create TCP server (listen, accept)
- [ ] Implement non-blocking sockets
- [ ] Setup epoll event loop
- [ ] Handle multiple concurrent connections
- [ ] Basic connection lifecycle (open → read → close)

---

## Phase 2 — HTTP Parsing
- [ ] Parse HTTP request line (GET / POST)
- [ ] Parse headers
- [ ] Handle partial reads (streaming input)
- [ ] Build internal request representation
- [ ] Serialize HTTP response

---

## Phase 3 — Basic Reverse Proxy
- [ ] Connect to upstream server
- [ ] Forward request to upstream
- [ ] Read upstream response
- [ ] Send response back to client
- [ ] Handle timeouts and failures

---

## Phase 4 — Connection Management
- [ ] Implement keep-alive support
- [ ] Connection pooling (reuse upstream connections)
- [ ] Limit max connections
- [ ] Graceful connection close

---

## Phase 5 — Routing
- [ ] Map domain → upstream (config-based)
- [ ] Support multiple routes
- [ ] Add config loader (JSON file)
- [ ] Reload config without restart (optional)

---

## Phase 6 — Caching
- [ ] Implement in-memory cache
- [ ] Key: URL + headers (basic)
- [ ] TTL-based expiration
- [ ] LRU eviction policy
- [ ] Cache hit/miss tracking

---

## Phase 7 — Rate Limiting
- [ ] Implement token bucket
- [ ] Per-IP rate limiting
- [ ] Configurable limits
- [ ] Return 429 responses on limit breach

---

## Phase 8 — Worker Layer (Hooks)
- [ ] Add request hooks (before proxy)
- [ ] Add response hooks (after upstream)
- [ ] Modify headers/body
- [ ] Simple rule engine (if/then logic)

---

## Phase 9 — Observability
- [ ] Request logging (method, path, latency)
- [ ] Metrics:
  - req/sec
  - latency (avg, p95)
  - cache hit ratio
- [ ] Expose metrics endpoint (optional)

---

## Phase 10 — Performance & Optimization
- [ ] Benchmark (wrk / ab)
- [ ] Profile CPU (perf)
- [ ] Identify bottlenecks
- [ ] Optimize:
  - memory allocations
  - parsing
  - syscalls
- [ ] Optional: SIMD / small GNU asm optimization

---

## Phase 11 — Robustness
- [ ] Handle malformed HTTP
- [ ] Handle partial writes
- [ ] Retry upstream on failure
- [ ] Add timeouts everywhere
- [ ] Prevent memory leaks

---

## Phase 12 — Polish
- [ ] Clean code structure
- [ ] Add comments + docs
- [ ] Write README:
  - architecture
  - design decisions
  - benchmarks
- [ ] Add sample config

---

## Final Goal
- High-performance C++ reverse proxy
- Measured benchmarks (latency + throughput)
- Clean architecture (core + modules)
- Demonstrable system design

---

## Rule
Focus on:
- correctness first
- then performance
- then optimization
