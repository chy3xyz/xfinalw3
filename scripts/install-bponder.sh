#!/usr/bin/env bash
# 1) Install Release CLI binary (~/.bponder/bin/bponder)
# 2) Ensure vendor/bponder source is cloned + built (Bun-native CLI)
# 3) Prune vendor disk: drop node_modules / docs / examples after build
#    (runtime resolves deps from the monorepo root — CLI still works)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BPONDER_VERSION="${BPONDER_VERSION:-0.18.9}"
export BPONDER_VERSION
VENDOR_DIR="${BPONDER_VENDOR:-$ROOT/vendor/bponder}"

install_binary() {
  if command -v bponder >/dev/null 2>&1; then
    installed="$(bponder --version 2>/dev/null || true)"
    if [[ "$installed" == "$BPONDER_VERSION" ]]; then
      echo "bponder binary $BPONDER_VERSION ok ($(command -v bponder))"
      return
    fi
  fi
  local candidate="${BPONDER_INSTALL:-$HOME/.bponder}/bin/bponder"
  if [[ -x "$candidate" ]] && [[ "$("$candidate" --version 2>/dev/null || true)" == "$BPONDER_VERSION" ]]; then
    echo "bponder binary $BPONDER_VERSION ok ($candidate)"
    return
  fi
  curl -fsSL "https://raw.githubusercontent.com/chy3xyz/bponder/v${BPONDER_VERSION}/install.sh" | bash
}

prune_vendor() {
  # Keep: packages/{utils,client,core,schema} (built dist + CLI entry)
  # Drop: nested install (~1GB+), docs/examples, unused packages, .git
  (
    cd "$VENDOR_DIR"
    rm -rf \
      node_modules \
      docs examples benchmark simulation-test spikes codedb.snapshot \
      packages/react packages/create-bponder packages/create-ponder \
      .git \
      .DS_Store
  )
  local size
  size="$(du -sh "$VENDOR_DIR" 2>/dev/null | awk '{print $1}')"
  echo "vendor/bponder pruned → ${size:-?} (CLI uses monorepo root deps at runtime)"
}

setup_vendor() {
  if [[ -L "$VENDOR_DIR" ]]; then
    echo "Replacing symlink vendor/bponder → $(readlink "$VENDOR_DIR")"
    rm -f "$VENDOR_DIR"
  fi

  if [[ ! -f "$VENDOR_DIR/packages/core/src/bin/ponder.ts" ]]; then
    echo "Cloning chy3xyz/bponder@v${BPONDER_VERSION} → $VENDOR_DIR"
    mkdir -p "$(dirname "$VENDOR_DIR")"
    rm -rf "$VENDOR_DIR"
    git clone --depth 1 --branch "v${BPONDER_VERSION}" https://github.com/chy3xyz/bponder.git "$VENDOR_DIR"
  fi

  if [[ ! -f "$VENDOR_DIR/packages/core/dist/esm/index.js" ]]; then
    echo "Building bponder packages (utils, client, core)…"
    (
      cd "$VENDOR_DIR"
      bun install --frozen-lockfile || bun install
      bun run --cwd packages/utils build
      bun run --cwd packages/client build
      bun run --cwd packages/core build
    )
  else
    echo "bponder packages already built"
  fi

  prune_vendor

  test -f "$VENDOR_DIR/packages/core/src/bin/ponder.ts"
  echo "Bun-native CLI: bun $VENDOR_DIR/packages/core/src/bin/ponder.ts"
}

install_binary
setup_vendor

BIN="${BPONDER_INSTALL:-$HOME/.bponder}/bin"
if [[ ":$PATH:" != *":$BIN:"* ]]; then
  echo ""
  echo "Optional PATH for release binary: export PATH=\"$BIN:\$PATH\""
fi
