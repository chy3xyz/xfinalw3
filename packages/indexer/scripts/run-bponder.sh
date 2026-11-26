#!/usr/bin/env bash
# Run bponder CLI against this package.
# Prefer: BPONDER_CLI → node_modules bin → PATH → vendor source (BPONDER_USE_VENDOR=1).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PKG="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_CLI="${BPONDER_VENDOR:-$ROOT/vendor/bponder}/packages/core/src/bin/ponder.ts"
NM_CLI="$PKG/node_modules/.bin/bponder"
ROOT_NM_CLI="$ROOT/node_modules/.bin/bponder"

# Ensure DATABASE_SCHEMA for Bun-native path
if [[ -z "${DATABASE_SCHEMA:-}" ]]; then
  if [[ -f .env ]]; then
    # shellcheck disable=SC1091
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
  fi
fi
if [[ -z "${DATABASE_SCHEMA:-}" ]]; then
  export DATABASE_SCHEMA=xfinalw3
fi

run_cli() {
  if [[ -n "${BPONDER_CLI:-}" ]]; then
    exec "$BPONDER_CLI" "$@"
  fi
  if [[ -x "$NM_CLI" ]]; then
    exec "$NM_CLI" "$@"
  fi
  if [[ -x "$ROOT_NM_CLI" ]]; then
    exec "$ROOT_NM_CLI" "$@"
  fi
  if command -v bponder >/dev/null 2>&1; then
    exec bponder "$@"
  fi
  if [[ "${BPONDER_USE_VENDOR:-0}" == "1" && -f "$VENDOR_CLI" ]]; then
    exec bun "$VENDOR_CLI" "$@"
  fi
  echo "bponder CLI missing. Run: bun install && bun run bponder:install" >&2
  exit 127
}

run_cli "$@"
