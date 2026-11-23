# 环境变量矩阵

所有包使用 **Bun** 加载 `.env`（勿提交真实密钥）。复制各包 `.env.example` → `.env`。

## SvelteKit（`packages/sveltekit`）

| 变量 | 必需 | 说明 |
|------|------|------|
| `VITE_PROJECT_ID` | 生产必需 | Reown / WalletConnect Project ID |
| `VITE_ALCHEMY_API_KEY` | 生产必需 | Alchemy（或兼容）RPC key；生产缺省 fail-fast |
| `VITE_WALLET_CONNECT_PROJECT_ID` | 可选 | 若与 `VITE_PROJECT_ID` 分离时使用 |
| `PUBLIC_APP_URL` | 推荐 | 规范站 URL（metadata / 分享） |
| `ORIGIN` | 生产推荐 | 公网 origin，供 Kit / adapter-bun |
| `PORT` | 可选 | 生产监听端口（常见默认 3000） |
| `FOUNDRY_BUILD_INFO_DIR` | 可选 | Foundry `out/build-info` 覆盖路径（blockexplorer server load） |

开发：可用占位密钥（会 `console.warn`）。生产：必须设置真实 `VITE_*`。

## Foundry（`packages/foundry`）

| 变量 | 必需 | 说明 |
|------|------|------|
| `ALCHEMY_API_KEY` | 非本地部署时 | 见 `foundry.toml` RPC |
| `ETHERSCAN_API_KEY` | 验证合约时 | `bun verify` |
| `LOCALHOST_KEYSTORE_ACCOUNT` | 可选 | 默认 `scaffold-eth-default`（仅本地） |
| `SKIP_SIMULATION` | 可选 | 设为 `1` 时 live deploy 跳过模拟（危险，默认关闭） |
| `RPC_URL` / `DEPLOY_SCRIPT` | 部署时 | Makefile / parseArgs 使用 |

密钥在 `~/.foundry/keystores`；`account:reveal-pk` 必须带 `--yes-print`。

## Indexer（`packages/indexer` / bponder）

| 变量 | 必需 | 说明 |
|------|------|------|
| `PONDER_RPC_URL_1` | **必需** | 缺省则配置加载失败 |
| `DATABASE_SCHEMA` | **必需**（Bun-native） | Postgres/PGlite schema 名，例如 `xfinalw3` |
| `DATABASE_URL` | 可选 | 默认可用 pglite；生产建议 Postgres |

API 默认 `:42069`。内置 `/health`；应用就绪 `/app/ready`。`/graphql` 无鉴权——生产加网关。
## Cron（`packages/cron`）

| 变量 | 必需 | 说明 |
|------|------|------|
| `PRIVATE_KEY` | **必需** | 作业签名账户 |
| `RPC_URL` | 可选 | 默认 `http://127.0.0.1:8545` |
| `CHAIN_ID` | 可选 | 默认 `31337`；未知 chainId fail-fast |
| `CONTRACT_ADDRESS` | **必需** | Counter（或目标）合约地址 |
| `CRON_WRITE_ENABLED` | 可选 | 默认 `false`；`true` 才允许写链 |
| `CRON_HEALTH_PORT` | 可选 | 默认 `3001` |
| `CRON_DRAIN_TIMEOUT_MS` | 可选 | 关停等待 in-flight，默认 `30000` |

## 快速对照

| 包 | `.env.example` |
|----|----------------|
| sveltekit | `packages/sveltekit/.env.example` |
| foundry | `packages/foundry/.env.example` |
| indexer | `packages/indexer/.env.example` |
| cron | `packages/cron/.env.example` |
