#!/usr/bin/env bash
# Print the local full-stack terminal recipe (framework DX).
cat <<'EOF'
Xfinalw3 local stack (4 terminals / panes):

  1) bun chain                 # Anvil :8545 + scaffold keystore
  2) bun deploy:local          # Counter → packages/solid contracts
  3) bun indexer               # bponder :42069 (Heartbeat + Counter)
  4) bun start                 # Solid Vinxi :5173

Optional:
  bun cron                     # @w3s/cron keepers (:3001 /health)
  bun landing                  # static site :8931

Env templates:
  packages/solid/.env.example
  packages/indexer/.env.example
  packages/foundry/.env.example
  packages/job/.env.example

Docs: docs/DEPLOY_LOCAL.md  docs/ENV_MATRIX.md  docs/HEALTH.md
EOF
