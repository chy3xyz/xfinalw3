#!/usr/bin/env bash
# Reclaim disk: prune nested installs, vendor trees, caches.
# Default keeps npm `bponder`; set REMOVE_VENDOR=1 to delete vendor/bponder entirely.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="${BPONDER_VENDOR:-$ROOT/vendor/bponder}"

echo "== before =="
du -sh "$ROOT" "$ROOT/node_modules" "$ROOT/vendor" 2>/dev/null || true
du -sh "$ROOT/packages"/*/node_modules 2>/dev/null | sort -hr || true
du -sh "$HOME/.bun/install/cache" 2>/dev/null || true

# Nested package node_modules should be empty under Bun hoisted linker —
# remove leftover caches / accidental nests.
echo "Cleaning nested package node_modules caches…"
for pkg in "$ROOT"/packages/*/node_modules; do
  [[ -d "$pkg" ]] || continue
  rm -rf "$pkg"/.cache "$pkg"/.vinxi "$pkg"/.vite
  # Drop real nested installs (symlinks to root are fine; wipe if large)
  size_kb="$(du -sk "$pkg" 2>/dev/null | awk '{print $1}')"
  if [[ "${size_kb:-0}" -gt 1024 ]]; then
    echo "  removing nested $pkg (${size_kb}K)"
    rm -rf "$pkg"
  fi
done

if [[ -d "$VENDOR_DIR" ]]; then
  if [[ "${REMOVE_VENDOR:-0}" == "1" ]]; then
    echo "Removing vendor/bponder (npm bponder is primary)…"
    rm -rf "$VENDOR_DIR"
  else
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
fi

if [[ "${SKIP_SVELTEKIT:-0}" == "1" ]]; then
  echo "Removing packages/sveltekit/node_modules (legacy UI)…"
  rm -rf "$ROOT/packages/sveltekit/node_modules"
fi

# Optional forge artifacts
if [[ "${CLEAR_FOUNDRY_OUT:-0}" == "1" ]]; then
  echo "Clearing foundry out/cache…"
  rm -rf "$ROOT/packages/foundry/out" "$ROOT/packages/foundry/cache"
fi

if [[ "${CLEAR_BUN_CACHE:-1}" == "1" ]]; then
  echo "Clearing Bun install cache (~/.bun/install/cache)…"
  bun pm cache rm 2>/dev/null || rm -rf "$HOME/.bun/install/cache"
fi

echo "== after =="
du -sh "$ROOT" "$ROOT/node_modules" "$ROOT/vendor" 2>/dev/null || true
du -sh "$ROOT/packages"/*/node_modules 2>/dev/null | sort -hr || true
du -sh "$HOME/.bun/install/cache" 2>/dev/null || echo "(bun cache cleared)"
echo "Done. Shared deps live in root node_modules (catalog + hoisted linker)."
echo "Re-run: bun install   # if anything missing"
echo "Optional: bun run bponder:vendor   # only when hacking upstream CLI"
