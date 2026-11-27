# API 稳定性契约

框架对外「别人会 import / curl」的表面划档。破坏性改动必须进根 `CHANGELOG.md`。

## 档位

| 档位 | 含义 | 变更规则 |
|------|------|----------|
| **Stable** | 跨次要版本保持兼容 | 破坏性改动需 major 说明 + 迁移提示 |
| **Draft** | 可用但可改 | 允许小版本不兼容；尽量 changelog |
| **Internal** | 仅本仓 | 随时可改，不保证 |

## Stable surfaces

### Solid (`@w3s/solid`)

- `~/lib/scaffold`：`useScaffoldReadContract` / `useScaffoldWriteContract` / `useScaffoldContract` / `useScaffoldEventHistory`
- `~/lib/contracts`：`getDeployedContract`、`deployedContracts` / `externalContracts` 形状（`address` + `abi`）
- `~/lib/api`：admin REST 客户端路径 `/api/admin/auth/*`（经 Vite 代理）

### Indexer（Hono 边缘，默认 `:42069`）

- `GET /health`（bponder 内置）、`GET /app/ready`
- `POST /rpc`（方法黑名单 + 限流；上游 key 仅服务端）
- `GET|POST /graphql`（生产默认要求 `GRAPHQL_API_KEY`）
- Admin：`POST /admin/auth/login|logout`、角色 viewer ⊂ operator ⊂ owner
- 响应头 `X-Request-Id`（可入站透传）

### Cron (`@w3s/cron`)

- `GET /health` → `{ ok, writesEnabled }`
- 密钥：`PRIVATE_KEY_FILE` 优先；生产拒绝明文 `PRIVATE_KEY`（除非 `ALLOW_PLAINTEXT_PRIVATE_KEY=1`）
- 日志：`LOG_FORMAT=json|text`（生产默认 json）

### Foundry

- `bun deploy:local` → 写入 `packages/solid/src/lib/contracts/deployedContracts.ts`
- Keystore 工作流见 `docs/DEPLOYER_KEYSTORE.md`

## Draft / Internal

- `/mng/*` 管理页布局与 `uiStore.menuGroups`（Draft）
- `packages/landing` 营销站（Draft）
- `packages/indexer/src/api/*` 未列入上表的内部 helper（Internal）
- Cursor skills / `.cursor/rules`（Internal）

## 版本与 changelog

- 根 `package.json` `version` 表示框架脚手架版本（当前 `0.0.x` = 预稳定）。
- 每次破坏 Stable surface：在 `CHANGELOG.md` 写 **Breaking** 段 + 迁移一行。
- 可选后续：引入 Changesets；在 `0.1.0` 前允许更激进的 Draft 迭代。
