#!/usr/bin/env bash
# One-shot readiness probe for already-running services (no start/stop).
# Exit 0 only if all enabled checks pass.
set -euo pipefail

fail=0
check() {
  local name="$1" url="$2"
  if curl -sf --max-time 3 "$url" >/dev/null; then
    echo "OK  $name  $url"
  else
    echo "FAIL $name  $url"
    fail=1
  fi
}

check_rpc() {
  local url="$1"
  if curl -sf --max-time 3 -X POST "$url" \
    -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' \
    | grep -q '"result"'; then
    echo "OK  anvil-rpc  $url"
  else
    echo "FAIL anvil-rpc  $url"
    fail=1
  fi
}

echo "==> probe"
check_rpc "${ANVIL_RPC:-http://127.0.0.1:8545}"
check "indexer-health" "${INDEXER_URL:-http://127.0.0.1:42069}/health"
check "indexer-ready" "${INDEXER_URL:-http://127.0.0.1:42069}/app/ready"
check "cron-health" "${CRON_HEALTH_URL:-http://127.0.0.1:3001/health}"
check "solid" "${SOLID_URL:-http://127.0.0.1:5173}/"

if [[ "${fail}" != "0" ]]; then
  echo "PROBE_FAIL"
  exit 1
fi
echo "PROBE_OK"
