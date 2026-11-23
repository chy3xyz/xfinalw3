# 使用 Bun 部署 dApp（adapter-bun）

本仓库生产路径是 **SvelteKit 3 + `@sveltejs/adapter-bun`**：构建产物由 `Bun.serve` 提供服务，不是静态 CDN 为主路径。

> 旧的 `docs/DEPLOY_STATIC.md`（adapter-static / Nginx 纯静态）已归档，仅作历史参考。

## 前置要求

- [Bun](https://bun.sh) >= 1.4.0
- [Foundry](https://book.getfoundry.sh/getting-started/installation)（若需同机部署合约）
- Git

## 1. 安装依赖

在仓库根目录：

```bash
bun install
```

## 2. 配置环境变量

见 [ENV_MATRIX.md](./ENV_MATRIX.md)。生产至少需要：

```bash
export VITE_PROJECT_ID=your-reown-project-id
export VITE_ALCHEMY_API_KEY=your-alchemy-key
export PUBLIC_APP_URL=https://your.domain
export ORIGIN=https://your.domain   # adapter-bun / Kit 常用
export PORT=3000                    # 可选，默认常见为 3000
```

开发可用占位；**生产缺少密钥会 fail-fast**（见 `scaffold.config.ts`）。

也可在 `packages/sveltekit/.env` 中放置（勿提交真实密钥）：

```bash
cp packages/sveltekit/.env.example packages/sveltekit/.env
```

## 3. 构建

必须在 Bun runtime 下构建（adapter 调用 Bun build API）：

```bash
# 仓库根目录
bun run build
```

等价：

```bash
bun --filter @w3s/sveltekit build
```

输出目录：`packages/sveltekit/build/`（含 `index.js` / server 与客户端资源）。

## 4. 启动生产服务

```bash
bun start:prod
```

等价：

```bash
bun --filter @w3s/sveltekit start
# → bun ./build
```

默认监听 `http://0.0.0.0:3000`（以日志为准）。可用 `PORT` / `ORIGIN` 覆盖。

### 生产依赖

运行时需要：

- `packages/sveltekit/build/`
- 该包的 `package.json`
- production `node_modules`（或在 monorepo 根安装后从正确 cwd 启动）

精简部署示例：

```bash
bun install --frozen-lockfile
bun run build
# 拷贝 build + 必要 lock/package 到运行镜像后：
cd packages/sveltekit && bun install --production --frozen-lockfile
bun ./build
```

可选：adapter-bun 的 `buildOptions.compile` 打单文件可执行（见 [官方文档](https://svelte.dev/docs/kit/adapter-bun)）；本脚手架默认未开启。

## 5. 反向代理（推荐）

在 Nginx / Caddy 后终止 TLS，反代到 `127.0.0.1:3000`。设置：

- `ORIGIN=https://your.domain`（与公网 URL 一致）
- 转发 `Host` / `X-Forwarded-*`（按你的代理惯例）

应用已设置基础安全头（`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、CSP）。钱包（WalletConnect）需要 `connect-src` 允许 `https:` / `wss:`——当前 CSP 已按此放宽。

## 6. 健康检查

| 服务 | 默认 | 路径 | 说明 |
|------|------|------|------|
| dApp (adapter-bun) | `:3000` | `/` | HTTP 200 即进程可服务；无独立 `/health` |
| Cron | `:3001` | `GET /health` | `{ ok, writesEnabled }`，见 `CRON_HEALTH_PORT` |
| Indexer (Ponder API) | `:42069` | `GET /health` | 无合约配置时 `degraded` + 503 |

详见 [HEALTH.md](./HEALTH.md)。

## 7. 同机辅助进程（可选）

```bash
# 合约（本地或目标链）
bun chain          # 仅本地
bun deploy:local   # 或 bun deploy …

# 索引 / 定时任务
bun indexer
bun cron
```

Indexer GraphQL **默认无鉴权**，生产务必加网关。Cron 写链默认关闭（`CRON_WRITE_ENABLED=false`）。

## 8. Docker 草图

见 `deploy/docker/` 下示例 Dockerfile（非强制 CI 构建）。

## 相关文档

- [ENV_MATRIX.md](./ENV_MATRIX.md) — 全包环境变量
- [HEALTH.md](./HEALTH.md) — 探活约定
- [DEPLOY_LOCAL.md](./DEPLOY_LOCAL.md) — 本地 Anvil / 合约
- [ANVIL_SETUP.md](./ANVIL_SETUP.md) — Anvil
