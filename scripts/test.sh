#!/usr/bin/env bash
#
# test.sh — Run the Books-Pens test suite and quality gates.
#
# Executes, in order:
#   1. Type-check (tsc --noEmit via 'npm run lint')
#   2. Unit tests — vitest or jest, whichever the project declares
#   3. Production build (npm run build) to catch bundling regressions
#   4. Smoke test — serve dist/ and assert it responds on HTTP 200
#
# Usage:
#   ./scripts/test.sh                 # type-check + unit tests + build + smoke
#   ./scripts/test.sh --no-build     # skip the production build
#   ./scripts/test.sh --no-smoke     # skip the smoke test
#   ./scripts/test.sh --coverage     # collect coverage (vitest --coverage)
#   ./scripts/test.sh --watch        # unit tests in watch mode (skips build/smoke)
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

RUN_BUILD=1
RUN_SMOKE=1
COVERAGE=0
WATCH=0
SMOKE_PORT="${SMOKE_PORT:-4173}"
SMOKE_TIMEOUT="${SMOKE_TIMEOUT:-30}"

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET=$'\033[0m'; C_INFO=$'\033[36m'; C_OK=$'\033[32m'
  C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_BOLD=$'\033[1m'
else
  C_RESET=""; C_INFO=""; C_OK=""; C_WARN=""; C_ERR=""; C_BOLD=""; C_BOLD=""
fi

log()  { printf '%s[test]%s %s\n' "${C_INFO}" "${C_RESET}" "$*"; }
ok()   { printf '%s[test]%s %s\n' "${C_OK}"   "${C_RESET}" "$*"; }
warn() { printf '%s[test]%s %s\n' "${C_WARN}" "${C_RESET}" "$*" >&2; }
die()  { printf '%s[test]%s %s\n' "${C_ERR}"  "${C_RESET}" "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --no-build)  RUN_BUILD=0 ;;
    --no-smoke)  RUN_SMOKE=0 ;;
    --coverage)  COVERAGE=1 ;;
    --watch)     WATCH=1 ;;
    -h|--help)   sed -n '2,19p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)           die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

cd "${PROJECT_ROOT}"

log "${C_BOLD}Running Books-Pens test suite${C_RESET}"
log "Project root: ${PROJECT_ROOT}"

command -v npm >/dev/null 2>&1 || die "npm is not installed. Run ./scripts/setup.sh first."

FAILURES=0

# ── 1. Type-check ───────────────────────────────────────────────────────────
log "Step 1/4: Type-check (npm run lint)..."
if npm run lint; then
  ok "Type-check passed."
else
  die "Type-check failed."
fi

# ── 2. Unit tests ───────────────────────────────────────────────────────────
detect_runner() {
  if node -e "process.exit(require('./package.json').devDependencies?.vitest||require('./package.json').dependencies?.vitest?0:1)" 2>/dev/null; then
    echo "vitest"
  elif node -e "process.exit(require('./package.json').devDependencies?.jest||require('./package.json').dependencies?.jest?0:1)" 2>/dev/null; then
    echo "jest"
  else
    echo ""
  fi
}

log "Step 2/4: Unit tests..."
RUNNER="$(detect_runner)"

if [ -z "${RUNNER}" ]; then
  warn "No test runner declared in package.json (vitest/jest) — skipping unit tests."
  warn "Add one to enable:  npm i -D vitest && npm pkg set scripts.test=\"vitest run\""
else
  if [ ! -d node_modules ]; then
    log "Installing dependencies..."
    npm ci --prefer-offline --no-audit
  fi

  if [ "${WATCH}" -eq 1 ]; then
    log "Running ${RUNNER} in watch mode (Ctrl-C to stop)..."
    if [ "${RUNNER}" = "vitest" ]; then npm exec -- vitest watch; else npm exec -- jest --watch; fi
    exit $?
  fi

  if [ "${RUNNER}" = "vitest" ]; then
    VITEST_ARGS="run"
    [ "${COVERAGE}" -eq 1 ] && VITEST_ARGS="run --coverage"
    if npm exec -- vitest ${VITEST_ARGS}; then
      ok "Vitest suite passed."
    else
      warn "Vitest reported failures."
      FAILURES=$((FAILURES + 1))
    fi
  else
    JEST_ARGS=""
    [ "${COVERAGE}" -eq 1 ] && JEST_ARGS="--coverage"
    if npm exec -- jest ${JEST_ARGS}; then
      ok "Jest suite passed."
    else
      warn "Jest reported failures."
      FAILURES=$((FAILURES + 1))
    fi
  fi
fi

# ── 3. Production build ─────────────────────────────────────────────────────
if [ "${RUN_BUILD}" -eq 1 ]; then
  log "Step 3/4: Production build (npm run build)..."
  if npm run build; then
    [ -d dist ] || die "Build reported success but dist/ is missing."
    ok "Build succeeded — dist/ ($(du -sh dist | cut -f1))."
  else
    die "Production build failed."
  fi
else
  log "Step 3/4: Production build skipped (--no-build)."
fi

# ── 4. Smoke test ───────────────────────────────────────────────────────────
if [ "${RUN_SMOKE}" -eq 1 ] && [ "${RUN_BUILD}" -eq 1 ]; then
  log "Step 4/4: Smoke test on http://localhost:${SMOKE_PORT} ..."
  PREVIEW_PID=""
  cleanup() {
    if [ -n "${PREVIEW_PID}" ] && kill -0 "${PREVIEW_PID}" 2>/dev/null; then
      kill "${PREVIEW_PID}" 2>/dev/null || true
      wait "${PREVIEW_PID}" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT

  npm run preview -- --host 127.0.0.1 --port "${SMOKE_PORT}" >/tmp/books-pens-preview.log 2>&1 &
  PREVIEW_PID=$!

  READY=0
  for _ in $(seq 1 "${SMOKE_TIMEOUT}"); do
    if ! kill -0 "${PREVIEW_PID}" 2>/dev/null; then
      warn "Preview server exited early:"
      tail -n 20 /tmp/books-pens-preview.log >&2 || true
      break
    fi
    CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${SMOKE_PORT}/" || true)"
    case "${CODE}" in
      200|301|302)
        READY=1
        break
        ;;
    esac
    sleep 1
  done

  if [ "${READY}" -eq 1 ]; then
    ok "Smoke test passed — app returned HTTP ${CODE}."
  else
    warn "Smoke test failed — app never returned a healthy response on port ${SMOKE_PORT}."
    tail -n 20 /tmp/books-pens-preview.log >&2 || true
    FAILURES=$((FAILURES + 1))
  fi
else
  log "Step 4/4: Smoke test skipped (--no-smoke)."
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo
if [ "${FAILURES}" -eq 0 ]; then
  printf '%s[test]%s %sAll checks passed.%s\n' "${C_OK}" "${C_RESET}" "${C_BOLD}" "${C_RESET}"
  exit 0
fi

printf '%s[test]%s %s%d check(s) failed.%s\n' "${C_ERR}" "${C_RESET}" "${C_BOLD}" "${FAILURES}" "${C_RESET}"
exit 1
