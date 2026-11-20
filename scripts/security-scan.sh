#!/usr/bin/env bash
#
# security-scan.sh — Local security scanning for Books-Pens.
#
# Mirrors the DevSecOps pipeline stages so issues are caught before CI:
#   1. Secret scanning        — Gitleaks
#   2. Dependency audit       — npm audit (SCA)
#   3. Static analysis       — Semgrep (SAST)
#   4. Filesystem scan       — Trivy (vulnerabilities + misconfigurations)
#   5. Container image scan  — Trivy against the built image
#
# Usage:
#   ./scripts/security-scan.sh                     # all enabled stages
#   ./scripts/security-scan.sh --secrets           # only secret scanning
#   ./scripts/security-scan.sh --deps --sast       # only audit + semgrep
#   ./scripts/security-scan.sh --image books-pens:latest
#   ./scripts/security-scan.sh --severity CRITICAL # tighten the gate
#   ./scripts/security-scan.sh --no-install        # don't auto-install missing tools
#
# Exit codes: 0 = clean, 1 = findings above threshold, 2 = tool error.
#
set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

SEVERITY="${SEVERITY:-CRITICAL,HIGH}"
IMAGE_REF="${IMAGE_REF:-}"
INSTALL_BIN_DIR="${INSTALL_BIN_DIR:-${HOME}/.local/bin}"
export INSTALL_BIN_DIR
RUN_SECRETS=1
RUN_DEPS=1
RUN_SAST=1
RUN_FS=1
RUN_IMAGE=0
AUTO_INSTALL=1
SCAN_DIR="${SCAN_DIR:-src}"

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'; C_INFO=$'\033[36m'; C_OK=$'\033[32m'
  C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_BOLD=$'\033[1m'
else
  C_RESET=""; C_INFO=""; C_OK=""; C_WARN=""; C_ERR=""; C_BOLD=""
fi

log()  { printf '%s[scan]%s %s\n' "${C_INFO}" "${C_RESET}" "$*"; }
ok()   { printf '%s[scan]%s %s\n' "${C_OK}"   "${C_RESET}" "$*"; }
warn() { printf '%s[scan]%s %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2; }
die()  { printf '%s[scan]%s %s\n' "${C_ERR}"  "${C_RESET}" "$*" >&2; exit 2; }
skip() { printf '%s[scan]%s %s\n' "${C_WARN}" "${C_RESET}" "$*"; }

FAILURES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --secrets)   RUN_DEPS=0; RUN_SAST=0; RUN_FS=0; RUN_IMAGE=0 ;;
    --deps)      RUN_SECRETS=0; RUN_SAST=0; RUN_FS=0; RUN_IMAGE=0 ;;
    --sast)      RUN_SECRETS=0; RUN_DEPS=0; RUN_FS=0; RUN_IMAGE=0 ;;
    --fs)        RUN_SECRETS=0; RUN_DEPS=0; RUN_SAST=0; RUN_IMAGE=0 ;;
    --image)     RUN_IMAGE=1; IMAGE_REF="${2:-}"; shift ;;
    --severity)  SEVERITY="${2:-}"; shift ;;
    --no-install) AUTO_INSTALL=0 ;;
    -h|--help)   sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)           die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

cd "${PROJECT_ROOT}"

log "${C_BOLD}Security scan — Books-Pens${C_RESET}"
log "Project root: ${PROJECT_ROOT}"
log "Severity gate: ${SEVERITY}"

have() { command -v "$1" >/dev/null 2>&1; }

# Write to a system path when we are root, otherwise to ~/.local/bin.
install_bin() {
  local src="$1"; local name="$2"
  mkdir -p "${INSTALL_BIN_DIR}"
  if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
    sudo install -m 0755 "${src}" "${INSTALL_BIN_DIR}/${name}"
  else
    install -m 0755 "${src}" "${INSTALL_BIN_DIR}/${name}"
  fi
}
export -f install_bin

# ── Tool bootstrap ──────────────────────────────────────────────────────────
install_tool() {
  local tool="$1"; shift
  if have "${tool}"; then return 0; fi
  if [ "${AUTO_INSTALL}" -eq 0 ]; then
    skip "${tool} not installed — skipping. (install: ${*})"
    return 1
  fi
  log "Installing ${tool}..."
  if "$@" >/dev/null 2>&1; then
    ok "${tool} installed."
    return 0
  fi
  skip "Could not install ${tool} — skipping that stage."
  return 1
}

install_gitleaks() {
  install_tool gitleaks bash -c '
    set -e
    VERSION=v8.21.2
    curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/${VERSION}/gitleaks_${VERSION#v}_linux_x64.tar.gz" \
      -o /tmp/gitleaks.tgz
    tar -xzf /tmp/gitleaks.tgz -C /tmp gitleaks
    install_bin /tmp/gitleaks gitleaks
  '
}

install_trivy() {
  install_tool trivy bash -c '
    set -e
    VERSION=0.58.1
    curl -fsSL "https://github.com/aquasecurity/trivy/releases/download/v${VERSION}/trivy_${VERSION}_Linux-64bit.tar.gz" \
      -o /tmp/trivy.tgz
    tar -xzf /tmp/trivy.tgz -C /tmp trivy
    install_bin /tmp/trivy trivy
  '
}

install_semgrep() {
  install_tool semgrep bash -c '
    set -e
    if python3 -m pip install --quiet semgrep; then
      :
    elif python3 -m pip install --quiet --user semgrep; then
      export PATH="${HOME}/.local/bin:${PATH}"
    else
      exit 1
    fi
  '
}

# ── 1. Secret scanning (Gitleaks) ───────────────────────────────────────────
if [ "${RUN_SECRETS}" -eq 1 ]; then
  log "Stage 1: Secret scanning (Gitleaks)..."
  if install_gitleaks; then
    if gitleaks detect --source . --no-banner --redact --exit-code 1; then
      ok "No secrets detected."
    else
      warn "Gitleaks found potential secrets (values redacted). Remove them and commit an allowlist entry if false positive."
      FAILURES=$((FAILURES + 1))
    fi
  fi
fi

# ── 2. Dependency audit (npm audit) ─────────────────────────────────────────
if [ "${RUN_DEPS}" -eq 1 ]; then
  log "Stage 2: Dependency audit (npm audit)..."
  if have npm; then
    if [ ! -d node_modules ] && [ -f package-lock.json ]; then
      log "Installing dependencies for an accurate audit..."
      npm ci --prefer-offline --no-audit >/dev/null 2>&1 || warn "npm ci failed; audit may be based on the lockfile only."
    fi
    if npm audit --audit-level=high; then
      ok "No high/critical dependency vulnerabilities."
    else
      warn "npm audit reported vulnerabilities at or above 'high'."
      FAILURES=$((FAILURES + 1))
    fi
  else
    skip "npm not installed — skipping dependency audit."
  fi
fi

# ── 3. Static analysis (Semgrep) ───────────────────────────────────────────
if [ "${RUN_SAST}" -eq 1 ]; then
  log "Stage 3: Static analysis (Semgrep)..."
  if install_semgrep; then
    if semgrep scan --config auto --quiet --severity ERROR --error; then
      ok "Semgrep found no ERROR-level issues."
    else
      warn "Semgrep reported findings (see output above)."
      FAILURES=$((FAILURES + 1))
    fi
  fi
fi

# ── 4. Filesystem scan (Trivy) ──────────────────────────────────────────────
if [ "${RUN_FS}" -eq 1 ]; then
  log "Stage 4: Filesystem scan (Trivy) on ${SCAN_DIR} ..."
  if install_trivy; then
    trivy fs --scanners vuln,misconfig,secret \
      --severity "${SEVERITY}" \
      --exit-code 1 \
      --quiet \
      "${SCAN_DIR}" || {
        warn "Trivy found issues at/above ${SEVERITY} in ${SCAN_DIR}."
        FAILURES=$((FAILURES + 1))
      }
    trivy fs --scanners vuln,misconfig,secret --severity "${SEVERITY}" --quiet "${SCAN_DIR}" 2>/dev/null \
      | grep -E 'Total:|HIGH|CRITICAL' | head -20 || true
    ok "Trivy filesystem scan completed."
  fi
fi

# ── 5. Container image scan (Trivy) ─────────────────────────────────────────
if [ "${RUN_IMAGE}" -eq 1 ]; then
  log "Stage 5: Container image scan (Trivy) on ${IMAGE_REF} ..."
  if ! have docker; then
    skip "Docker not installed — skipping image scan."
  elif ! docker image inspect "${IMAGE_REF}" >/dev/null 2>&1; then
    skip "Image '${IMAGE_REF}' not found locally. Build it first: ./scripts/build.sh --docker"
  elif install_trivy; then
    trivy image --severity "${SEVERITY}" --exit-code 1 --quiet "${IMAGE_REF}" || {
      warn "Trivy found vulnerabilities at/above ${SEVERITY} in ${IMAGE_REF}."
      FAILURES=$((FAILURES + 1))
    }
    ok "Image scan completed."
  fi
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo
if [ "${FAILURES}" -eq 0 ]; then
  printf '%s[scan]%s %sNo security findings above %s.%s\n' "${C_OK}" "${C_RESET}" "${C_BOLD}" "${SEVERITY}" "${C_RESET}"
  exit 0
fi

printf '%s[scan]%s %s%d stage(s) reported findings.%s\n' "${C_ERR}" "${C_RESET}" "${C_BOLD}" "${FAILURES}" "${C_RESET}"
exit 1
