# Infra: Compose + Cloudflare TF + k8s/Argo Design

**Date:** 2026-08-16  
**Status:** Approved for implementation  
**Repo:** `msohail22/low-level-lab`

## Goal

- **API + Web** → Cloudflare Workers (Terraform-managed)
- **Postgres, Redis, Kafka, Reactor, observability** → Kubernetes (home + local), synced by **Argo CD**
- **Laptop quick path** → root **`docker-compose.yml`** with the same infra services
- Terraform also **bootstraps** the cluster (Argo CD install)

## Layout

```text
docker-compose.yml              # laptop quick start
docker/                         # compose-mounted configs (prometheus, loki, …)
infra/
  terraform/
    cloudflare/                 # Workers, Hyperdrive, Queues, vars
    cluster/                    # kube provider: Argo CD helm release, namespaces
  k8s/
    root-app/                   # Argo Application (app-of-apps)
    apps/
      postgres/
      redis/
      kafka/
      reactor/
      # observability later / optional
```

## Out of scope (this pass)

- Rewriting Reactor in C++
- Running API/Web on k8s
- Full production secrets management (Document placeholders; use tfvars/sealed-secrets later)

## Success

- `docker compose up -d` from repo root starts Postgres (+ existing Reactor stack)
- `infra/terraform/cloudflare` and `infra/terraform/cluster` scaffold apply-documented
- Argo root app + Postgres/Redis/Kafka/Reactor k8s manifests present
- Docs in README/AGENTS point to Compose vs TF+Argo paths
