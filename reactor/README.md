# Reactor Docker notes

Infra for laptop: use the **repo root** compose file:

```bash
docker compose up -d
```

Kubernetes + Argo: see [`infra/README.md`](../infra/README.md).

The CMake binary under `src/` remains a legacy sample. The current runnable PoC service is `reactor/service` (TypeScript); a future C++-only Reactor can replace it without changing the Compose/k8s service names.
