# Indexer

使用 [bponder](https://github.com/chy3xyz/bponder)（Bun-native Ponder fork）构建的区块链索引器，支持自定义 API 端点。

- **运行时**：`bponder@1.0.8`（npm）；`bun run bponder:install` 可选安装 Release 二进制，并可从本地 `../bponder` 同步 `vendor/bponder` 供源码 CLI 调试。
- **库 API**：`import … from "bponder"`；虚拟模块 `bponder:registry` / `bponder:schema` / `bponder:api`。

## 快速开始

### 1. 安装依赖

```bash
# 仓库根目录
bun install
bun run bponder:install   # 可选：Release CLI + vendor 同步
```

### 2. 配置环境变量

```bash
cd packages/indexer
cp .env.example .env
```

```env
PONDER_RPC_URL_1=http://127.0.0.1:8545
PONDER_CHAIN_ID=31337
DATABASE_SCHEMA=xfinalw3
```

本地默认索引 Anvil 上的 Counter（`CountUpdated` → `count_update` 表）+ Heartbeat。  
生产设置 `BPONDER_ENV=production` 与 `GRAPHQL_API_KEY`（见 `docs/ENV_MATRIX.md`）。

### 3. 生成类型定义

在添加合约到 `ponder.config.ts` 后：

```bash
bun indexer:codegen
```

生成 `bponder:registry` / `bponder:api` / `bponder:schema` 等虚拟模块类型。

### 4. 运行索引器

```bash
bun indexer
```

或：

```bash
cd packages/indexer
bun dev
```

## 可用命令

- `bun indexer` — 开发模式（索引 + API）
- `bun indexer:build` — 构建
- `bun indexer:codegen` — 生成类型
- `bun indexer:db` — 数据库管理
- `bun indexer:serve` — 仅 API（不索引）
- `bun run bponder:install` — 安装 Release CLI / 同步 vendor

## 项目结构

```
packages/indexer/
├── src/
│   ├── api/
│   │   ├── index.ts         # Hono 入口
│   │   ├── adminAuth.ts       # Cookie 会话 / 角色（mmm 抽出）
│   │   ├── graphqlGuard.ts    # API key + 敏感字段 deny
│   │   ├── rpcGatewayCore.ts  # JSON-RPC 闸门纯逻辑
│   │   ├── rpcProxy.ts        # POST /rpc 有闸转发
│   │   └── runtime.ts         # createLimiter / apiRpcUrl
│   └── index.ts               # 索引逻辑
├── scripts/run-bponder.sh
├── ponder.config.ts
└── ponder.schema.ts
```

## API 端点

默认 `http://localhost:42069`（Solid 经 `/api` 代理）：

- `GET /health` — bponder 内置 liveness
- `GET /app/ready` — 应用就绪（`/health`/`/ready` 为保留路径）
- `GET|POST /graphql` — GraphQL（可选 `GRAPHQL_API_KEY`）
- `POST /admin/auth/login|logout|change-password` · `GET /admin/auth/me`
- `GET /admin/ping` — 需登录的示例读接口
- `POST /rpc` — 公开 JSON-RPC 代理（方法黑名单 + 批量上限 + 按 IP 加权令牌桶；上游 key 只在服务端）
- `GET /rpc/__stats` — 本机统计（私网）
- `GET /v1/status` — Bun-native 状态

需要 `DATABASE_SCHEMA`；后台登录需 `ADMIN_PASSWORD_SHA256` 或 `ADMIN_ACCOUNTS`。  
RPC 代理设 `RPC_GATEWAY_UPSTREAM`（本地可指向 Anvil `http://127.0.0.1:8545`）。Solid 默认走同源 `/api/rpc`（`VITE_USE_RPC_PROXY=0` 可直连 Anvil）。

## 配置

1. 在 `ponder.config.ts` 添加合约
2. 在 `ponder.schema.ts` 定义表；`bun indexer:codegen`
3. 在 `src/index.ts` 用 `ponder.on()` 处理事件
4. 在 `src/api/index.ts` 用 Hono 加自定义路由

## 更多信息

- [bponder releases](https://github.com/chy3xyz/bponder/releases)
- [Ponder 概念文档](https://ponder.sh)（共享 API 面）
