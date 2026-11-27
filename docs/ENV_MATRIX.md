# 环境变量矩阵

所有包使用 **Bun** 加载 `.env`（勿提交真实密钥）。复制各包 `.env.example` → `.env`。

## Solid（`packages/solid`）— 主 dApp

| 变量 | 必需 | 说明 |
|------|------|------|
| `VITE_WALLET_CONNECT_PROJECT_ID` / `VITE_PROJECT_ID` | 生产必需 | Reown / WalletConnect；开发缺省会 warn |
| `VITE_TARGET_CHAINS` | 可选 | 逗号分隔：`foundry,sepolia,mainnet`（默认 foundry） |
| `VITE_RPC_URL` | 可选 | 默认 RPC；本地未设则 `/api/rpc` |
| `VITE_RPC_URL_<chainId>` | 非本地链推荐 | 如 `VITE_RPC_URL_11155111` |
| `VITE_USE_RPC_PROXY` | 可选 | `0` = 直连 Anvil `http://127.0.0.1:8545` |
| `VITE_PONDER_PROXY` | 可选 | Vite 代理目标，默认 `http://127.0.0.1:42069` |
| `VITE_GRAPHQL_API_KEY` | 可选 | 转发到 indexer GraphQL `x-api-key` |

开发：`bun start`（Vinxi `:5173`）。生产：`bun run build` → `bun start:prod`。

## Foundry（`packages/foundry`）

| 变量 | 必需 | 说明 |
|------|------|------|
| `ALCHEMY_API_KEY` | 非本地部署时 | 见 `foundry.toml` RPC |
| `ETHERSCAN_API_KEY` | 验证合约时 | `bun verify` |
| `LOCALHOST_KEYSTORE_ACCOUNT` | 可选 | 默认 `scaffold-eth-default`（仅本地） |
| `FOUNDRY_KEYSTORE_DIR` | 可选 | 覆盖默认 `~/.foundry/keystores` |
| `SKIP_SIMULATION` | 可选 | `1` 时 live deploy 跳过模拟（危险） |

密钥在 `~/.foundry/keystores`。详见 [DEPLOYER_KEYSTORE.md](./DEPLOYER_KEYSTORE.md)。

## Indexer（`packages/indexer` / bponder）

| 变量 | 必需 | 说明 |
|------|------|------|
| `PONDER_RPC_URL_1` | **必需** | 缺省则配置加载失败 |
| `PONDER_CHAIN_ID` | 可选 | 默认 `31337`（本地 Anvil） |
| `COUNTER_ADDRESS` | 可选 | 默认本地首个 CREATE；空字符串关闭合约索引 |
| `PONDER_START_BLOCK` | 可选 | 数字或 `latest` |
| `DATABASE_SCHEMA` | **必需**（Bun-native） | 如 `xfinalw3` |
| `DATABASE_URL` | 可选 | 默认 pglite；生产建议 Postgres |
| `GRAPHQL_API_KEY` | 生产推荐 | 与 `GRAPHQL_REQUIRE_API_KEY` 配合 |
| `GRAPHQL_REQUIRE_API_KEY` | 可选 | `1` 强制 / `0` 关闭；**生产默认要求 key** |
| `BPONDER_ENV` | 可选 | `production` 时启用生产安全默认 |
| `RPC_GATEWAY_UPSTREAM` | 可选 | `POST /rpc` 上游；默认可回落 Anvil |
| `RPC_GATEWAY_ALLOW_UNKNOWN` | 可选 | `1`/`0`；**生产默认拒绝未知方法** |
| `ADMIN_PASSWORD_SHA256` / `ADMIN_ACCOUNTS` | 管理端 | `/mng` cookie 登录 |
| `CORS_ORIGINS` | 可选 | 逗号分隔；空则 `*` |

API 默认 `:42069`。内置 `/health`；应用就绪 `/app/ready`。

## Job / Cron（`packages/job`，包名 `@w3s/cron`）

| 变量 | 必需 | 说明 |
|------|------|------|
| `PRIVATE_KEY` | **必需** | 作业签名账户 |
| `RPC_URL` | 可选 | 默认 `http://127.0.0.1:8545` |
| `CHAIN_ID` | 可选 | 默认 `31337` |
| `CONTRACT_ADDRESS` | **必需** | Counter（或目标）合约地址 |
| `CRON_WRITE_ENABLED` | 可选 | 默认 `false`；`true` 才允许写链 |
| `CRON_HEALTH_PORT` | 可选 | 默认 `3001` |
| `CRON_DRAIN_TIMEOUT_MS` | 可选 | 关停等待，默认 `30000` |
| `INDEXER_URL` | 可选 | GraphQL base，默认 `http://127.0.0.1:42069` |

## 快速对照

| 包 | `.env.example` |
|----|----------------|
| solid | `packages/solid/.env.example` |
| foundry | `packages/foundry/.env.example` |
| indexer | `packages/indexer/.env.example` |
| job (cron) | `packages/job/.env.example` |
