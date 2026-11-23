#!/usr/bin/env bash
# Run Bun-native bponder CLI against this package.
# Prefers vendor source CLI (reliable on v0.18.9); release binary is optional.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
VENDOR_CLI="${BPONDER_VENDOR:-$ROOT/vendor/bponder}/packages/core/src/bin/ponder.ts"

if [[ ! -f "$VENDOR_CLI" ]]; then
  echo "bponder vendor CLI missing. Run: bun run bponder:install" >&2
  exit 127
fi

# Ensure DATABASE_SCHEMA for Bun-native path (release docs require it)
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

exec bun "$VENDOR_CLI" "$@"
