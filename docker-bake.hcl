// docker-bake.hcl - Canonical build definition for CyberPot
// Usage: docker buildx bake cyberpot-init
//        docker buildx bake --push cyberpot-init
//        CYBERPOT_VERSION=24.04.2 docker buildx bake

variable "CYBERPOT_VERSION" {
  default = "24.04.2"
}

variable "REGISTRY_DOCKERHUB" {
  default = "docker.io/khulnasoft"
}

variable "REGISTRY_GHCR" {
  default = "ghcr.io/khulnasoft"
}

group "default" {
  targets = ["cyberpot-init", "dot-init"]
}

group "all" {
  targets = ["cyberpot-init", "dot-init"]
}

target "_common" {
  platforms = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
  pull = true
  provenance = "mode=max"
  sbom = true
}

target "cyberpot-init" {
  inherits = ["_common"]
  context = "docker/cyberpot-init"
  dockerfile = "Dockerfile"
  args = {
    CYBERPOT_VERSION = CYBERPOT_VERSION
  }
  tags = [
    "${REGISTRY_DOCKERHUB}/cyberpot-init:${CYBERPOT_VERSION}",
    "${REGISTRY_DOCKERHUB}/cyberpot-init:latest",
    "${REGISTRY_GHCR}/cyberpot-init:${CYBERPOT_VERSION}",
    "${REGISTRY_GHCR}/cyberpot-init:latest"
  ]
  labels = {
    "org.opencontainers.image.title" = "cyberpot-init"
    "org.opencontainers.image.version" = CYBERPOT_VERSION
    "org.opencontainers.image.source" = "https://github.com/khulnasoft/cyberpot"
  }
  output = ["type=image,push=false"]
}

target "dot-init" {
  inherits = ["_common"]
  context = "docker/dot-init"
  dockerfile = "Dockerfile"
  args = {
    CYBERPOT_VERSION = CYBERPOT_VERSION
  }
  tags = [
    "${REGISTRY_DOCKERHUB}/dot-init:${CYBERPOT_VERSION}",
    "${REGISTRY_DOCKERHUB}/dot-init:latest",
    "${REGISTRY_DOCKERHUB}/dynamic-init:${CYBERPOT_VERSION}",
    "${REGISTRY_GHCR}/dot-init:${CYBERPOT_VERSION}"
  ]
  labels = {
    "org.opencontainers.image.title" = "dot-init"
    "org.opencontainers.image.description" = "CyberPot dynamic init via dotfiles (XDG, stow, chezmoi)"
    "org.opencontainers.image.version" = CYBERPOT_VERSION
    "org.opencontainers.image.source" = "https://github.com/khulnasoft/cyberpot"
  }
  output = ["type=image,push=false"]
}
