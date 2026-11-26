#!/usr/bin/env bash
# 1) Install Release CLI binary (~/.bponder/bin/bponder) — optional
# 2) Optionally refresh vendor/bponder from a local clone or GitHub tag
#    (npm `bponder@1.0.8` is the default runtime; vendor is for hacking upstream)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BPONDER_VERSION="${BPONDER_VERSION:-1.0.8}"
export BPONDER_VERSION
VENDOR_DIR="${BPONDER_VENDOR:-$ROOT/vendor/bponder}"
# Default: skip vendor (npm bponder contributes to root node_modules).
# Set BPONDER_SKIP_VENDOR=0 or run `bun run bponder:vendor` to sync source CLI.
BPONDER_SKIP_VENDOR="${BPONDER_SKIP_VENDOR:-1}"
# Local monorepo clone (sibling of xfinalw3) used when BPONDER_VENDOR_SRC unset
DEFAULT_SRC="$(cd "$ROOT/.." && pwd)/bponder"

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
  echo "vendor/bponder pruned → ${size:-?} (optional; npm bponder is primary)"
}

setup_vendor() {
  # Skip unless explicitly requested or an old vendor tree is present and stale
  if [[ "${BPONDER_SKIP_VENDOR:-0}" == "1" ]]; then
    echo "Skipping vendor (BPONDER_SKIP_VENDOR=1); using npm bponder"
    return
  fi

  local src="${BPONDER_VENDOR_SRC:-}"
  if [[ -z "$src" && -f "$DEFAULT_SRC/packages/core/package.json" ]]; then
    src="$DEFAULT_SRC"
  fi

  if [[ -L "$VENDOR_DIR" ]]; then
    echo "Replacing symlink vendor/bponder → $(readlink "$VENDOR_DIR")"
    rm -f "$VENDOR_DIR"
  fi

  if [[ -n "$src" && -f "$src/packages/core/src/bin/ponder.ts" ]]; then
    echo "Syncing vendor/bponder from local $src @ $(
      cd "$src" && (git describe --tags --always 2>/dev/null || echo local)
    )"
    mkdir -p "$(dirname "$VENDOR_DIR")"
    rm -rf "$VENDOR_DIR"
    # Copy without node_modules / .git for a lean vendor tree
    rsync -a --delete \
      --exclude node_modules --exclude .git --exclude docs --exclude examples \
      --exclude benchmark --exclude 'packages/react' --exclude 'packages/create-bponder' \
      "$src/" "$VENDOR_DIR/"
  elif [[ ! -f "$VENDOR_DIR/packages/core/src/bin/ponder.ts" ]]; then
    echo "Cloning chy3xyz/bponder@v${BPONDER_VERSION} → $VENDOR_DIR"
    mkdir -p "$(dirname "$VENDOR_DIR")"
    rm -rf "$VENDOR_DIR"
    git clone --depth 1 --branch "v${BPONDER_VERSION}" https://github.com/chy3xyz/bponder.git "$VENDOR_DIR"
  fi

  if [[ -f "$VENDOR_DIR/packages/core/src/bin/ponder.ts" ]]; then
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
    echo "Vendor CLI: bun $VENDOR_DIR/packages/core/src/bin/ponder.ts"
  fi
}

install_binary
setup_vendor

echo "App dependency: bun add bponder@${BPONDER_VERSION} (packages/indexer)"
BIN="${BPONDER_INSTALL:-$HOME/.bponder}/bin"
if [[ ":$PATH:" != *":$BIN:"* ]]; then
  echo ""
  echo "Optional PATH for release binary: export PATH=\"$BIN:\$PATH\""
fi
