terraform {
  required_version = ">= 1.5.0"
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.14"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.31"
    }
  }
}

variable "kube_config_path" {
  type    = string
  default = "~/.kube/config"
}

variable "kube_context" {
  type        = string
  default     = ""
  description = "Optional kube context (k3d/kind/home cluster)"
}

variable "argocd_chart_version" {
  type    = string
  default = "7.7.12"
}

provider "kubernetes" {
  config_path    = pathexpand(var.kube_config_path)
  config_context = var.kube_context != "" ? var.kube_context : null
}

provider "helm" {
  kubernetes {
    config_path    = pathexpand(var.kube_config_path)
    config_context = var.kube_context != "" ? var.kube_context : null
  }
}

resource "kubernetes_namespace" "llb" {
  metadata {
    name = "llb"
  }
}

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
  }
}

resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = var.argocd_chart_version
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  depends_on = [kubernetes_namespace.argocd]

  set {
    name  = "configs.params.server\\.insecure"
    value = "true"
  }
}

output "argocd_namespace" {
  value = kubernetes_namespace.argocd.metadata[0].name
}

output "llb_namespace" {
  value = kubernetes_namespace.llb.metadata[0].name
}
