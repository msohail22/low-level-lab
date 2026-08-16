# Infrastructure

## Paths

| Path | Purpose |
|------|---------|
| `docker-compose.yml` + `docker/` | **Laptop quick start** — Postgres, Redis, Kafka, Reactor, Minio, observability |
| `infra/terraform/cloudflare/` | Cloudflare account: Workers, Hyperdrive, Queues (API + Web) |
| `infra/terraform/cluster/` | Cluster bootstrap: namespace + Argo CD Helm release |
| `infra/k8s/` | What **Argo CD** syncs: Postgres, Redis, Kafka, Reactor |

API and Web stay on **Cloudflare**. Everything else runs on **k8s** (home server or local k3d/kind). Compose is only for a fast single-node laptop stack.

## Laptop (Compose)

```bash
docker compose up -d
# or subset:
docker compose up -d postgres redis

pnpm migrate          # needs DB_URL → localhost:5433
pnpm dev:api
pnpm dev:web
```

Postgres: `postgres://postgres:postgres@localhost:5433/lowlevellab`  
Reactor: `http://127.0.0.1:18080`

## Kubernetes + Argo CD

1. Create a cluster (k3d/kind locally, or your home cluster).
2. `cd infra/terraform/cluster && cp terraform.tfvars.example terraform.tfvars` → fill kube context → `terraform init && terraform apply`
3. Point Argo at this repo’s `infra/k8s/root-app` (or apply `infra/k8s/root-app/application.yaml` once).
4. Argo syncs `infra/k8s/apps/*`.

## Cloudflare (Terraform)

```bash
cd infra/terraform/cloudflare
cp terraform.tfvars.example terraform.tfvars
# set cloudflare_api_token, account_id, zone (optional)
terraform init && terraform plan
```

Wire Worker script deploys via CI (`wrangler deploy`) or extend TF with `cloudflare_workers_script` when ready. Hyperdrive / Queue IDs should match `apps/api/wrangler.jsonc`.
