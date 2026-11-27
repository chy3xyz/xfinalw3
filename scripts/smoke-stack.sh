#!/usr/bin/env bash
# Stack smoke: Anvil → deploy → (optional indexer) → solid static headers.
# Env:
#   SMOKE_INDEXER=0|1   default 1 when DATABASE_URL set, else 0
#   SMOKE_SOLID=0|1     default 1 if .output/public exists (or build first)
#   SKIP_DEPLOY=1       skip forge deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ANVIL_PID=""
INDEXER_PID=""
SOLID_PID=""
OWNED_ANVIL=0

cleanup() {
  [[ -n "${SOLID_PID}" ]] && kill "${SOLID_PID}" 2>/dev/null || true
  [[ -n "${INDEXER_PID}" ]] && kill "${INDEXER_PID}" 2>/dev/null || true
  if [[ "${OWNED_ANVIL}" == "1" && -n "${ANVIL_PID}" ]]; then
    kill "${ANVIL_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

rpc_ok() {
  curl -sf -X POST "http://127.0.0.1:8545" \
    -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' \
    | grep -q '"result"'
}

echo "==> Anvil"
if rpc_ok; then
  echo "    already up on :8545"
else
  command -v anvil >/dev/null || { echo "anvil not on PATH"; exit 1; }
  anvil --host 127.0.0.1 --port 8545 >/tmp/xfinalw3-smoke-anvil.log 2>&1 &
  ANVIL_PID=$!
  OWNED_ANVIL=1
  for _ in $(seq 1 30); do
    rpc_ok && break
    sleep 0.5
  done
  rpc_ok || { echo "anvil failed to start"; cat /tmp/xfinalw3-smoke-anvil.log; exit 1; }
  echo "    started pid=${ANVIL_PID}"
fi

if [[ "${SKIP_DEPLOY:-0}" != "1" ]]; then
  echo "==> deploy:local"
  bun deploy:local
fi

USE_INDEXER="${SMOKE_INDEXER:-}"
if [[ -z "${USE_INDEXER}" ]]; then
  if [[ -n "${DATABASE_URL:-}" ]]; then
    USE_INDEXER=1
  else
    USE_INDEXER=0
  fi
fi

if [[ "${USE_INDEXER}" == "1" ]]; then
  echo "==> indexer"
  export PONDER_RPC_URL_1="${PONDER_RPC_URL_1:-http://127.0.0.1:8545}"
  export PONDER_CHAIN_ID="${PONDER_CHAIN_ID:-31337}"
  export DATABASE_SCHEMA="${DATABASE_SCHEMA:-smoke_xfinalw3}"
  export RPC_GATEWAY_UPSTREAM="${RPC_GATEWAY_UPSTREAM:-http://127.0.0.1:8545}"
  export GRAPHQL_REQUIRE_API_KEY="${GRAPHQL_REQUIRE_API_KEY:-0}"
  bun indexer >/tmp/xfinalw3-smoke-indexer.log 2>&1 &
  INDEXER_PID=$!
  ready=0
  for _ in $(seq 1 90); do
    if curl -sf "http://127.0.0.1:42069/health" >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 2
  done
  if [[ "${ready}" != "1" ]]; then
    echo "indexer health timeout"
    tail -n 80 /tmp/xfinalw3-smoke-indexer.log || true
    exit 1
  fi
  curl -sf "http://127.0.0.1:42069/app/ready" >/dev/null
  curl -sf -X POST "http://127.0.0.1:42069/rpc" \
    -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' \
    | grep -q '"result"'
  echo "    indexer OK (/health /app/ready /rpc)"
else
  echo "==> indexer skipped (set DATABASE_URL + SMOKE_INDEXER=1 to enable)"
fi

USE_SOLID="${SMOKE_SOLID:-1}"
PUBLIC_DIR="${ROOT}/packages/solid/.output/public"
if [[ "${USE_SOLID}" == "1" ]]; then
  echo "==> solid static + security headers"
  if [[ ! -f "${PUBLIC_DIR}/index.html" ]]; then
    echo "    building solid…"
    VITE_WALLET_CONNECT_PROJECT_ID="${VITE_WALLET_CONNECT_PROJECT_ID:-ci-placeholder}" \
      VITE_PROJECT_ID="${VITE_PROJECT_ID:-ci-placeholder}" \
      VITE_USE_RPC_PROXY=0 \
      bun --filter @w3s/solid build
  fi
  PORT="${SMOKE_SOLID_PORT:-4177}" bun "${ROOT}/scripts/serve-solid-static.ts" \
    >/tmp/xfinalw3-smoke-solid.log 2>&1 &
  SOLID_PID=$!
  for _ in $(seq 1 30); do
    curl -sf "http://127.0.0.1:${SMOKE_SOLID_PORT:-4177}/" >/dev/null 2>&1 && break
    sleep 0.3
  done
  HEADERS="$(curl -sI "http://127.0.0.1:${SMOKE_SOLID_PORT:-4177}/")"
  echo "${HEADERS}" | grep -qi 'content-security-policy:'
  echo "${HEADERS}" | grep -qi 'x-content-type-options: *nosniff'
  echo "${HEADERS}" | grep -qi 'x-frame-options: *DENY'
  echo "    solid OK (CSP / nosniff / DENY)"
fi

echo "SMOKE_OK"
