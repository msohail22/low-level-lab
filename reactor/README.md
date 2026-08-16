# Reactor

Remote C++ execution for Low-Level Lab (PoC).

## Architecture (PoC)

- **`reactor/service`** — TypeScript HTTP API + worker (`POST /v1/jobs`, `GET /v1/jobs/:id`)
- Jobs stored in **Redis**, enqueued on **Kafka** topic `reactor.jobs` (Redis list is a local fallback)
- Worker compiles/runs with real `clang++` / `g++` (3s run timeout)
- Clients use **`@llb/reactor-sdk`** (API proxy + web Playground)

The legacy CMake binary under `src/` remains for experiments; the runnable PoC path is `service/`.

## Docker (recommended)

```bash
docker compose -f reactor/docker/compose.yml up --build redis kafka reactor
```

- Reactor HTTP: http://127.0.0.1:18080/health
- Redis: `6379`
- Kafka UI (full stack): port `8080` when started with the full compose file

## Host service (Redis-only quick start)

```bash
docker compose -f reactor/docker/compose.yml up -d redis
REDIS_URL=redis://127.0.0.1:6379 KAFKA_DISABLED=1 \
  pnpm --dir reactor/service start
```

With Kafka (Compose):

```bash
docker compose -f reactor/docker/compose.yml up --build -d redis kafka reactor
```

## App wiring

1. Start Reactor (`:18080`)
2. `pnpm dev:api` — `REACTOR_URL=http://127.0.0.1:18080`
3. `pnpm dev:web` — log in → **/playground**

## CMake (legacy sample)

```bash
cmake -B build && cmake --build build && ./build/reactor
```
