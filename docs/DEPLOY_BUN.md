# 使用 Bun 部署 dApp（SolidStart / Vinxi）

本仓库生产路径是 **SolidStart + Vinxi**（`packages/solid` / `@w3s/solid`），由 Bun 构建并启动。

> 生产路径是 **Solid 静态输出**（Vinxi `preset: static`）+ Bun 带安全头的静态服务器。旧 SvelteKit/`adapter-bun` 已移出 workspaces。

## 前置要求

- [Bun](https://bun.sh) >= 1.4.0
- [Foundry](https://book.getfoundry.sh/getting-started/installation)（若需同机部署合约）
- Git

## 1. 安装依赖

```bash
bun install
# 可选：Release CLI
bun run bponder:install
```

## 2. 配置环境变量

见 [ENV_MATRIX.md](./ENV_MATRIX.md)。dApp 生产至少需要：

```bash
export VITE_WALLET_CONNECT_PROJECT_ID=your-reown-project-id
# 或 VITE_PROJECT_ID=...
```

复制示例：

```bash
cp packages/solid/.env.example packages/solid/.env
cp packages/indexer/.env.example packages/indexer/.env
```

Indexer 生产建议：

```bash
export BPONDER_ENV=production
export GRAPHQL_API_KEY=...          # 生产默认要求
export RPC_GATEWAY_ALLOW_UNKNOWN=0  # 生产默认已是拒绝未知方法
export DATABASE_URL=postgres://...
export DATABASE_SCHEMA=xfinalw3
```

## 3. 构建

```bash
bun run build
# → bun --filter @w3s/solid build（vinxi build）
```

## 4. 启动生产服务

```bash
bun run build
bun start:prod
# → scripts/serve-solid-static.ts（`.output/public` + CSP / nosniff / DENY）
# 可选：bun --filter @w3s/solid start:vinxi
```

开发：

```bash
bun start   # :5173
```

静态托管（Netlify/Cloudflare）会读取 `packages/solid/public/_headers`。Caddy 草图见 `deploy/Caddyfile`。

### 同机辅助进程

```bash
bun chain && bun deploy:local   # 本地合约
bun indexer                     # :42069
bun cron                        # packages/job → @w3s/cron
```

## 5. 反向代理（推荐）

在 Nginx / Caddy 后终止 TLS，反代到 Vinxi 生产端口（以启动日志为准，常见 3000）。  
`/api`、`/rpc`、`/ponder` 可反代到 indexer `:42069`（与 `packages/solid/app.config.ts` 开发代理一致）。

## 6. 健康检查

| 服务 | 默认 | 路径 |
|------|------|------|
| dApp (Vinxi) | 生产端口 | `GET /` |
| Cron (`@w3s/cron`) | `:3001` | `GET /health` |
| Indexer | `:42069` | `GET /health`、`GET /app/ready` |

详见 [HEALTH.md](./HEALTH.md)。

## 7. 安全默认（Indexer）

- **GraphQL**：`BPONDER_ENV=production`（或 `NODE_ENV=production`）时默认要求 `GRAPHQL_API_KEY`；可用 `GRAPHQL_REQUIRE_API_KEY=0` 显式关闭。
- **RPC 代理**：生产默认 `RPC_GATEWAY_ALLOW_UNKNOWN=0`（拒绝未知方法）；开发默认允许。

## 相关文档

- [ENV_MATRIX.md](./ENV_MATRIX.md)
- [HEALTH.md](./HEALTH.md)
- [DEPLOY_LOCAL.md](./DEPLOY_LOCAL.md)
- [DEPLOYER_KEYSTORE.md](./DEPLOYER_KEYSTORE.md)
- [BUN_DISK.md](./BUN_DISK.md)
