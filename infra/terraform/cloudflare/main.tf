terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "API token with Workers, Account, and Queue permissions"
}

variable "account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "hyperdrive_id" {
  type        = string
  description = "Existing Hyperdrive config ID (matches wrangler.jsonc)"
  default     = "99045301314f4530817f32abff2f2445"
}

variable "request_logs_queue_name" {
  type    = string
  default = "llb-request-logs"
}

# Queue used by the API Worker for request-log ingest
resource "cloudflare_queue" "request_logs" {
  account_id = var.account_id
  name       = var.request_logs_queue_name
}

output "request_logs_queue_id" {
  value = cloudflare_queue.request_logs.id
}

output "hyperdrive_id" {
  value       = var.hyperdrive_id
  description = "Pass-through; create/update Hyperdrive in dashboard or extend this module"
}

# NOTE: Worker script upload is typically done via `wrangler deploy` in CI.
# Add cloudflare_workers_script / routes here when you want TF to own deploys.
