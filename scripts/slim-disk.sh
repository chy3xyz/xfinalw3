#!/usr/bin/env bash
# Free disk used by vendor/bponder nests + Bun global install cache.
# Optional: SKIP_SVELTEKIT=1 also drops the legacy Svelte workspace install.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="${BPONDER_VENDOR:-$ROOT/vendor/bponder}"

echo "== before =="
du -sh "$ROOT/node_modules" "$ROOT/vendor" "$ROOT/packages"/*/node_modules 2>/dev/null | sort -hr || true
du -sh "$HOME/.bun/install/cache" 2>/dev/null || true

if [[ -d "$VENDOR_DIR" ]]; then
  echo "Pruning vendor/bponder…"
  rm -rf \
    "$VENDOR_DIR/node_modules" \
    "$VENDOR_DIR/docs" \
    "$VENDOR_DIR/examples" \
    "$VENDOR_DIR/benchmark" \
    "$VENDOR_DIR/simulation-test" \
    "$VENDOR_DIR/spikes" \
    "$VENDOR_DIR/codedb.snapshot" \
    "$VENDOR_DIR/packages/react" \
    "$VENDOR_DIR/packages/create-bponder" \
    "$VENDOR_DIR/packages/create-ponder" \
    "$VENDOR_DIR/.git"
fi

if [[ "${SKIP_SVELTEKIT:-0}" == "1" ]]; then
  echo "Removing packages/sveltekit/node_modules (legacy UI)…"
  rm -rf "$ROOT/packages/sveltekit/node_modules"
fi

if [[ "${CLEAR_BUN_CACHE:-1}" == "1" ]]; then
  echo "Clearing Bun install cache (~/.bun/install/cache)…"
  bun pm cache rm 2>/dev/null || rm -rf "$HOME/.bun/install/cache"
fi

echo "== after =="
du -sh "$ROOT/node_modules" "$ROOT/vendor" "$ROOT/packages"/*/node_modules 2>/dev/null | sort -hr || true
du -sh "$HOME/.bun/install/cache" 2>/dev/null || echo "(bun cache cleared)"
echo "Done. Re-run bun install / bun run bponder:install only if something breaks."
