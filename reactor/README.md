# Configure once (or after changing CMake)
cmake -B build

# Build
cmake --build build

# Run application
./build/reactor

# Run all tests
ctest --test-dir build

## Docker

This repo now includes a minimal local Docker setup under `docker/`.
It is meant for local development only and keeps the configuration as small as possible.

### Start the stack

From the repository root:

```bash
docker compose -f docker/compose.yml up --build
```

This starts:

- `reactor`
- `redis`
- `kafka` in KRaft mode
- `kafka-ui`
- `minio`
- `prometheus`
- `grafana`
- `loki`
- `tempo`
- `otel-collector`

### Stop the stack

```bash
docker compose -f docker/compose.yml down
```

### Useful local ports

- `3000` - Grafana
- `3100` - Loki
- `3200` - Tempo
- `4317` - OpenTelemetry Collector gRPC
- `4318` - OpenTelemetry Collector HTTP
- `6379` - Redis
- `8080` - Kafka UI
- `9000` - MinIO API
- `9001` - MinIO console
- `9090` - Prometheus
- `9092` - Kafka

### Notes

- The `reactor` image is built from the local `Dockerfile`.
- The current `reactor` binary is a short-lived sample app, so the container exits after it logs a few messages.
- The observability configs are placeholders so Docker Compose can start cleanly without extra setup.

## What changed

- Added a root `Dockerfile` that builds the CMake project and runs `./build/reactor`.
- Added `docker/compose.yml` with all requested local services on one network.
- Added minimal placeholder config files for Prometheus, Loki, Tempo, and the OpenTelemetry Collector.
- Added a tracked placeholder file for `docker/grafana/` so the directory exists in the repo.

