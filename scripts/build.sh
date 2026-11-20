#!/usr/bin/env bash
#
# build.sh — Build the Books-Pens frontend and (optionally) the Docker image.
#
# Usage:
#   ./scripts/build.sh                 # npm build (dist/) only
#   ./scripts/build.sh --docker        # also build the Docker image
#   ./scripts/build.sh --docker --push # build and push the image to the registry
#   ./scripts/build.sh --clean         # remove dist/ and node_modules/ first
#
# Environment:
#   IMAGE_NAME    Image repository, default "books-pens"
#   IMAGE_TAG     Image tag, default "latest"
#   REGISTRY      Registry host, default "" (local only)
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-books-pens}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-}"

BUILD_DOCKER=0
PUSH_IMAGE=0
CLEAN=0
SKIP_NPM=0

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'; C_INFO=$'\033[36m'; C_OK=$'\033[32m'
  C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_BOLD=$'\033[1m'
else
  C_RESET=""; C_INFO=""; C_OK=""; C_WARN=""; C_ERR=""; C_BOLD=""
fi

log()  { printf '%s[build]%s %s\n' "${C_INFO}" "${C_RESET}" "$*"; }
ok()   { printf '%s[build]%s %s\n' "${C_OK}"   "${C_RESET}" "$*"; }
warn() { printf '%s[build]%s %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2; }
die()  { printf '%s[build]%s %s\n' "${C_ERR}"  "${C_RESET}" "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --docker)   BUILD_DOCKER=1 ;;
    --push)     BUILD_DOCKER=1; PUSH_IMAGE=1 ;;
    --clean)    CLEAN=1 ;;
    --skip-npm) SKIP_NPM=1 ;;
    -h|--help)  sed -n '2,17p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)          die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

cd "${PROJECT_ROOT}"

IMAGE_REF="${REGISTRY:+${REGISTRY}/}${IMAGE_NAME}:${IMAGE_TAG}"

log "${C_BOLD}Building Books-Pens${C_RESET}"
log "Project root: ${PROJECT_ROOT}"

# ── Clean ───────────────────────────────────────────────────────────────────
if [ "${CLEAN}" -eq 1 ]; then
  log "Cleaning previous build output..."
  rm -rf dist
  ok "Removed dist/"
fi

# ── Toolchain check ─────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || die "Node.js is not installed. Run ./scripts/setup.sh first."
command -v npm  >/dev/null 2>&1 || die "npm is not installed. Run ./scripts/setup.sh first."
log "Node $(node -v) / npm $(npm -v)"

# ── Dependencies ────────────────────────────────────────────────────────────
if [ "${SKIP_NPM}" -eq 0 ]; then
  if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
    log "Installing dependencies..."
    if [ -f package-lock.json ]; then
      npm ci --prefer-offline --no-audit
    else
      npm install
    fi
    ok "Dependencies ready."
  else
    log "Dependencies up to date — skipping install."
  fi
fi

# ── Type-check ──────────────────────────────────────────────────────────────
log "Running type-check (npm run lint)..."
npm run lint || die "Type-check failed — build aborted."
ok "Type-check passed."

# ── Production bundle ───────────────────────────────────────────────────────
log "Building production bundle (npm run build)..."
npm run build || die "Vite build failed."
[ -d dist ] || die "Build finished but dist/ was not created."
ok "Bundle written to dist/ ($(du -sh dist | cut -f1))"

# ── Docker image ────────────────────────────────────────────────────────────
if [ "${BUILD_DOCKER}" -eq 1 ]; then
  command -v docker >/dev/null 2>&1 || die "Docker is not installed. Run ./scripts/setup.sh first."
  docker info >/dev/null 2>&1 || die "Docker daemon is not reachable."

  log "Building Docker image ${IMAGE_REF}..."
  docker build \
    --tag "${IMAGE_REF}" \
    --tag "${REGISTRY:+${REGISTRY}/}${IMAGE_NAME}:latest" \
    --file "${PROJECT_ROOT}/Dockerfile" \
    "${PROJECT_ROOT}" || die "Docker build failed."

  ok "Image built: ${IMAGE_REF}"
  docker images "${IMAGE_NAME}" || true

  if [ "${PUSH_IMAGE}" -eq 1 ]; then
    [ -n "${REGISTRY}" ] || die "--push requires REGISTRY to be set (e.g. REGISTRY=docker.io/user)."
    log "Pushing ${IMAGE_REF} to ${REGISTRY}..."
    docker push "${IMAGE_REF}" || die "Docker push failed."
    ok "Pushed ${IMAGE_REF}"
  fi
else
  log "Skipping Docker image build (pass --docker to enable)."
fi

cat <<EOF

${C_BOLD}Build complete.${C_RESET}

  dist/          Static bundle (served by 'npm run preview')
  ${IMAGE_REF}   Docker image${REGISTRY:+ (registry: ${REGISTRY})}

EOF
