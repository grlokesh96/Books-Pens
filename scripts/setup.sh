#!/usr/bin/env bash
#
# setup.sh — Prepare a local/remote development environment for Books-Pens.
#
# Installs toolchain prerequisites, installs npm dependencies from the
# lockfile, and creates a local .env from .env.example.
#
# Usage:
#   ./scripts/setup.sh                 # full setup
#   ./scripts/setup.sh --skip-docker   # skip the Docker install step
#   ./scripts/setup.sh --skip-kubectl  # skip the kubectl install step
#   ./scripts/setup.sh --force         # re-create .env even if it exists
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

NODE_VERSION="${NODE_VERSION:-22}"
INSTALL_DIR="${INSTALL_DIR:-/usr/local}"
SKIP_DOCKER=0
SKIP_KUBECTL=0
FORCE_ENV=0

# ── Output helpers ───────────────────────────────────────────────────────────
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'; C_INFO=$'\033[36m'; C_OK=$'\033[32m'
  C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_BOLD=$'\033[1m'
else
  C_RESET=""; C_INFO=""; C_OK=""; C_WARN=""; C_ERR=""; C_BOLD=""
fi

log()  { printf '%s[setup]%s %s\n' "${C_INFO}" "${C_RESET}" "$*"; }
ok()   { printf '%s[setup]%s %s\n' "${C_OK}"   "${C_RESET}" "$*"; }
warn() { printf '%s[setup]%s %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2; }
die()  { printf '%s[setup]%s %s\n' "${C_ERR}"  "${C_RESET}" "$*" >&2; exit 1; }

have() { command -v "$1" >/dev/null 2>&1; }

require_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    have sudo || die "This step needs root. Install sudo or re-run as root."
    SUDO="sudo"
  else
    SUDO=""
  fi
}

# ── Argument parsing ────────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --skip-docker)  SKIP_DOCKER=1 ;;
    --skip-kubectl) SKIP_KUBECTL=1 ;;
    --force)        FORCE_ENV=1 ;;
    -h|--help)      sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)              die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

cd "${PROJECT_ROOT}"

log "${C_BOLD}Books-Pens development setup${C_RESET}"
log "Project root: ${PROJECT_ROOT}"

# ── 1. Node.js + npm ────────────────────────────────────────────────────────
install_node() {
  local current=""
  if have node; then current="$(node -v)"; fi

  if [ -n "${current}" ]; then
    local major="${current#v}"; major="${major%%.*}"
    if [ "${major}" -ge 20 ] 2>/dev/null; then
      ok "Node.js ${current} already installed (>= 20)."
      return
    fi
    warn "Node.js ${current} is too old (need >= 20)."
  fi

  log "Installing Node.js ${NODE_VERSION}.x via NodeSource..."
  require_sudo
  if have curl; then
    ${SUDO} curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | ${SUDO} -E bash -
  elif have wget; then
    ${SUDO} wget -qO- "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | ${SUDO} -E bash -
  else
    die "Neither curl nor wget is available; install one and re-run."
  fi
  ${SUDO} apt-get install -y nodejs
  ok "Node.js installed: $(node -v)"
}

install_node
have npm || die "npm was not installed alongside Node.js."
ok "npm $(npm -v)"

# ── 2. Docker ───────────────────────────────────────────────────────────────
if [ "${SKIP_DOCKER}" -eq 0 ]; then
  if have docker; then
    ok "Docker already installed: $(docker --version)"
    if ! docker info >/dev/null 2>&1; then
      warn "Docker is installed but the daemon is not reachable. Start it and re-run."
    fi
  else
    log "Installing Docker Engine + Compose plugin..."
    require_sudo
    ${SUDO} apt-get update -y
    ${SUDO} apt-get install -y \
      ca-certificates curl gnupg docker-ce docker-ce-cli \
      containerd.io docker-buildx-plugin docker-compose-plugin || {
        warn "Docker install failed — see https://docs.docker.com/engine/install/ubuntu/"
        exit 0
      }
    ${SUDO} systemctl enable --now docker || warn "Could not start Docker via systemd."
    ${SUDO} usermod -aG docker "$(id -un)" 2>/dev/null || true
    warn "Docker installed. Log out/in (or run 'newgrp docker') to use it without sudo."
    ok "Docker installed"
  fi
else
  log "Skipping Docker installation (--skip-docker)."
fi

# ── 3. kubectl (optional, needed for deploy.sh) ─────────────────────────────
if [ "${SKIP_KUBECTL}" -eq 0 ]; then
  if have kubectl; then
    ok "kubectl already installed: $(kubectl version --client -o yaml 2>/dev/null | grep -m1 gitVersion | tr -s ' ' || echo 'unknown')"
  else
    log "Installing kubectl..."
    require_sudo
    local kv="v1.31.0"
    if have curl; then
      ${SUDO} curl -fsSL -o "${INSTALL_DIR}/bin/kubectl" \
        "https://dl.k8s.io/release/${kv}/bin/linux/amd64/kubectl"
    else
      die "curl is required to install kubectl."
    fi
    ${SUDO} chmod +x "${INSTALL_DIR}/bin/kubectl"
    ok "kubectl installed: ${kv}"
  fi
else
  log "Skipping kubectl installation (--skip-kubectl)."
fi

# ── 4. Git + repository sanity ──────────────────────────────────────────────
have git || die "git is required."
if [ -d "${PROJECT_ROOT}/.git" ]; then
  ok "Git repository detected at ${PROJECT_ROOT}"
else
  log "Not a git repository — cloning into ${PROJECT_ROOT}"
  git clone https://github.com/grlokesh96/Books-Pens.git "${PROJECT_ROOT}"
  cd "${PROJECT_ROOT}"
  ok "Repository cloned."
fi

# ── 5. npm dependencies ─────────────────────────────────────────────────────
log "Installing npm dependencies from package-lock.json (npm ci)..."
if [ -f package-lock.json ]; then
  npm ci --prefer-offline --no-audit
else
  warn "No package-lock.json found — falling back to 'npm install'."
  npm install
fi
ok "Dependencies installed."

# ── 6. Environment file ─────────────────────────────────────────────────────
if [ -f .env ]; then
  if [ "${FORCE_ENV}" -eq 1 ]; then
    cp .env ".env.backup.$(date +%s)"
    cp .env.example .env
    ok ".env recreated from .env.example (previous copy saved as .env.backup.*)."
  else
    ok ".env already exists — leaving it untouched (use --force to recreate)."
  fi
else
  cp .env.example .env
  ok ".env created from .env.example — add your GEMINI_API_KEY."
fi

# ── 7. Verify toolchain ─────────────────────────────────────────────────────
log "Verifying toolchain..."
if npm run lint >/dev/null 2>&1; then
  ok "TypeScript type-check passed (npm run lint)."
else
  warn "Type-check reported issues — run 'npm run lint' to see details."
fi

cat <<EOF

${C_BOLD}Setup complete.${C_RESET}

Next steps:
  npm run dev                     Start the dev server on http://localhost:3000
  ./scripts/build.sh               Build the production bundle
  ./scripts/test.sh                Run lint + test suite
  ./scripts/security-scan.sh       Run the local security scan
  ./scripts/deploy.sh --help       Deployment options

EOF
