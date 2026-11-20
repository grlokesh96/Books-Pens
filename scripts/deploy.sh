#!/usr/bin/env bash
#
# deploy.sh — Deploy the Books-Pens container image to Kubernetes.
#
# Targets:
#   local    — a local cluster (kind / minikube / k3d) via kubectl
#   eks      — an Amazon EKS cluster (updates the kubeconfig first)
#
# The script builds the image, loads it into the cluster, applies the
# Kubernetes manifests, and rolls out the deployment with a status wait.
#
# Usage:
#   ./scripts/deploy.sh --target local
#   ./scripts/deploy.sh --target eks --cluster books-cluster --region us-east-1
#   ./scripts/deploy.sh --target local --image books-pens:v1 --dry-run
#   ./scripts/deploy.sh --target eks --skip-build --skip-rollout-status
#
# Environment:
#   NAMESPACE        Kubernetes namespace, default "books-pens"
#   IMAGE_NAME       Image repository, default "books-pens"
#   IMAGE_TAG        Image tag, default "latest"
#   EKS_CLUSTER_NAME Default "books-cluster"
#   AWS_REGION       Default "us-east-1"
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

NAMESPACE="${NAMESPACE:-books-pens}"
IMAGE_NAME="${IMAGE_NAME:-books-pens}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
EKS_CLUSTER_NAME="${EKS_CLUSTER_NAME:-books-cluster}"
AWS_REGION="${AWS_REGION:-us-east-1}"
APP_PORT="${APP_PORT:-3000}"
REPLICAS="${REPLICAS:-1}"

TARGET="local"
DRY_RUN=0
SKIP_BUILD=0
SKIP_ROLLOUT_STATUS=0
SKIP_LOAD=0

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'; C_INFO=$'\033[36m'; C_OK=$'\033[32m'
  C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_BOLD=$'\033[1m'
else
  C_RESET=""; C_INFO=""; C_OK=""; C_WARN=""; C_ERR=""; C_BOLD=""
fi

log()  { printf '%s[deploy]%s %s\n' "${C_INFO}" "${C_RESET}" "$*"; }
ok()   { printf '%s[deploy]%s %s\n' "${C_OK}"   "${C_RESET}" "$*"; }
warn() { printf '%s[deploy]%s %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2; }
die()  { printf '%s[deploy]%s %s\n' "${C_ERR}"  "${C_RESET}" "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --target)          TARGET="${2:-}"; shift ;;
    --cluster)         EKS_CLUSTER_NAME="${2:-}"; shift ;;
    --region)          AWS_REGION="${2:-}"; shift ;;
    --namespace)       NAMESPACE="${2:-}"; shift ;;
    --image)           IMAGE_TAG="${2:-}"; shift ;;
    --replicas)        REPLICAS="${2:-}"; shift ;;
    --dry-run)         DRY_RUN=1 ;;
    --skip-build)      SKIP_BUILD=1 ;;
    --skip-load)       SKIP_LOAD=1 ;;
    --skip-rollout-status) SKIP_ROLLOUT_STATUS=1 ;;
    -h|--help)         sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)                 die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

case "${TARGET}" in
  local|eks) ;;
  *) die "--target must be 'local' or 'eks'." ;;
esac

cd "${PROJECT_ROOT}"

IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
K8S_DIR="${PROJECT_ROOT}/k8s"

log "${C_BOLD}Deploying Books-Pens${C_RESET}"
log "Project root: ${PROJECT_ROOT}"
log "Target: ${TARGET} | Namespace: ${NAMESPACE} | Image: ${IMAGE_REF}"

command -v kubectl >/dev/null 2>&1 || die "kubectl is not installed. Run ./scripts/setup.sh first."
[ -f "${PROJECT_ROOT}/Dockerfile" ] || die "Dockerfile not found at ${PROJECT_ROOT}/Dockerfile."

# ── Cluster context ─────────────────────────────────────────────────────────
if [ "${TARGET}" = "eks" ]; then
  command -v aws >/dev/null 2>&1 || die "The AWS CLI is required for --target eks."
  log "Updating kubeconfig for EKS cluster '${EKS_CLUSTER_NAME}' (${AWS_REGION})..."
  aws eks update-kubeconfig --name "${EKS_CLUSTER_NAME}" --region "${AWS_REGION}" \
    || die "Failed to update kubeconfig for cluster '${EKS_CLUSTER_NAME}'."
  ok "kubeconfig updated."
else
  log "Using the current kubectl context: $(kubectl config current-context 2>/dev/null || echo 'unknown')"
fi

kubectl cluster-info >/dev/null 2>&1 \
  || die "Cannot reach the cluster. Verify your kubeconfig / cluster status."

# ── Build the image ─────────────────────────────────────────────────────────
if [ "${SKIP_BUILD}" -eq 0 ]; then
  command -v docker >/dev/null 2>&1 || die "Docker is not installed. Run ./scripts/setup.sh first."
  docker info >/dev/null 2>&1 || die "Docker daemon is not reachable."

  log "Building image ${IMAGE_REF}..."
  if [ "${DRY_RUN}" -eq 1 ]; then
    log "[dry-run] docker build -t ${IMAGE_REF} -f ${PROJECT_ROOT}/Dockerfile ${PROJECT_ROOT}"
  else
    docker build -t "${IMAGE_REF}" -f "${PROJECT_ROOT}/Dockerfile" "${PROJECT_ROOT}" \
      || die "Image build failed."
    ok "Image built: ${IMAGE_REF}"
  fi
else
  log "Skipping image build (--skip-build)."
fi

# ── Load the image into the cluster ─────────────────────────────────────────
if [ "${SKIP_LOAD}" -eq 0 ]; then
  CLUSTER_TYPE="$(kubectl config current-context 2>/dev/null || echo "")"
  if [[ "${CLUSTER_TYPE}" == *kind* ]]; then
    log "Loading image into the kind cluster..."
    if [ "${DRY_RUN}" -eq 1 ]; then
      log "[dry-run] kind load docker-image ${IMAGE_REF}"
    else
      command -v kind >/dev/null 2>&1 || die "kind is required to load images into a kind cluster."
      kind load docker-image "${IMAGE_REF}" || warn "kind load failed — the node may pull the image instead."
    fi
  elif [[ "${CLUSTER_TYPE}" == *minikube* ]]; then
    log "Loading image into minikube..."
    if [ "${DRY_RUN}" -eq 1 ]; then
      log "[dry-run] minikube image load ${IMAGE_REF}"
    else
      command -v minikube >/dev/null 2>&1 || die "minikube is required to load images into a minikube cluster."
      minikube image load "${IMAGE_REF}" || warn "minikube image load failed."
    fi
  else
    log "Cluster type '${CLUSTER_TYPE:-unknown}' — the node will pull ${IMAGE_REF} from the registry."
    log "Push the image first if the node has no registry access:"
    log "  docker push ${IMAGE_REF}"
  fi
fi

# ── Manifests ───────────────────────────────────────────────────────────────
# Prefer committed manifests in k8s/. If that directory was removed, generate
# equivalent ones so the script stays usable on its own.
MANIFEST_DIR=""

generate_manifests() {
  local out="${PROJECT_ROOT}/.deploy-manifests"
  mkdir -p "${out}"

  cat > "${out}/namespace.yaml" <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
EOF

  cat > "${out}/deployment.yaml" <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: ${NAMESPACE}
  labels:
    app: frontend
spec:
  replicas: ${REPLICAS}
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: ${IMAGE_REF}
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: ${APP_PORT}
          readinessProbe:
            httpGet:
              path: /
              port: ${APP_PORT}
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /
              port: ${APP_PORT}
            initialDelaySeconds: 20
            periodSeconds: 15
            timeoutSeconds: 5
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /
              port: ${APP_PORT}
            periodSeconds: 5
            failureThreshold: 30
            timeoutSeconds: 5
EOF

  cat > "${out}/service.yaml" <<EOF
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: ${NAMESPACE}
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: ${APP_PORT}
      targetPort: ${APP_PORT}
EOF

  echo "${out}"
}

if [ -d "${K8S_DIR}" ] && [ -n "$(ls -A "${K8S_DIR}" 2>/dev/null)" ]; then
  MANIFEST_DIR="${K8S_DIR}"
  log "Using committed manifests from ${MANIFEST_DIR}."
else
  log "No k8s/ directory found — generating manifests inline."
  MANIFEST_DIR="$(generate_manifests)"
  ok "Manifests generated in ${MANIFEST_DIR}"
fi

MANIFESTS=()
for f in namespace.yaml deployment.yaml service.yaml; do
  [ -f "${MANIFEST_DIR}/${f}" ] && MANIFESTS+=("${MANIFEST_DIR}/${f}")
done
[ "${#MANIFESTS[@]}" -gt 0 ] || die "No recognised manifests found in ${MANIFEST_DIR}."

# ── Apply manifests ─────────────────────────────────────────────────────────
for manifest in "${MANIFESTS[@]}"; do
  log "Applying $(basename "${manifest}")..."
  if [ "${DRY_RUN}" -eq 1 ]; then
    log "[dry-run] kubectl apply -f ${manifest}"
  else
    kubectl apply -f "${manifest}" || die "kubectl apply failed for ${manifest}."
  fi
done
ok "Manifests applied."

# ── Rollout ─────────────────────────────────────────────────────────────────
if [ "${SKIP_ROLLOUT_STATUS}" -eq 0 ] && [ "${DRY_RUN}" -eq 0 ]; then
  log "Waiting for rollout of deployment/frontend in namespace ${NAMESPACE}..."
  if kubectl rollout status deployment/frontend -n "${NAMESPACE}" --timeout=180s; then
    ok "Rollout complete."
  else
    warn "Rollout did not complete in time. Recent events:"
    kubectl describe deployment/frontend -n "${NAMESPACE}" 2>/dev/null | tail -n 30 >&2 || true
    exit 1
  fi

  kubectl get pods -n "${NAMESPACE}" -o wide || true
  kubectl get svc  -n "${NAMESPACE}" || true
fi

# ── Summary ─────────────────────────────────────────────────────────────────
cat <<EOF

${C_BOLD}Deployment complete.${C_RESET}

  Target       ${TARGET}
  Namespace    ${NAMESPACE}
  Image        ${IMAGE_REF}
  Replicas     ${REPLICAS}
  App port     ${APP_PORT}
  Manifests    ${MANIFEST_DIR}

Check status:
  kubectl get pods -n ${NAMESPACE}
  kubectl port-forward -n ${NAMESPACE} svc/frontend ${APP_PORT}:${APP_PORT}

EOF
