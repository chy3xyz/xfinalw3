# xfinalw3 → Bun 全栈化设计

**日期:** 2026-11-20  
**状态:** 已确认（2026-11-20）  
**范围:** monorepo 包管理 / 脚本 / indexer / cron / SvelteKit dApp 全面切到 Bun 体系

## 1. 背景与目标

现状：README 推荐 Bun，但根脚本几乎全是 `pnpm --filter`；并存 `bun.lock` 与 `pnpm-lock.yaml`；`engines.node >= 20.18.3`；仅 `@w3s/cron` 用 Bun 跑 TS；indexer 为 Ponder **0.15.x**（硬校验 Node）；SvelteKit 为 **adapter-static** + 全站 `ssr = false`。

**目标：**

- Bun 作为唯一 package manager 与 JS/TS 运行时（install、scripts、dev、build、生产 server）。
- 不依赖 Node / pnpm 完成本地开发闭环。
- Indexer：官方 Ponder Bun 路径（升级，不 fork）。
- Cron：纯 Bun jobs。
- dApp：**官方 `@sveltejs/adapter-bun` 深度兼容**（Bun.serve 生产运行时），非仅「用 bun 跑 vite」。

**成功标准：** 冷机只装 Bun（≥1.4）+ Foundry，即可：

```text
bun install → bun chain → bun deploy:local → bun start | bun indexer | bun cron
```

全程无需 Node/pnpm。`bun start` 在生产模式下为 `bun ./build`（adapter-bun 产物）。

## 2. 决策摘要

| 议题 | 决策 | 理由 |
|------|------|------|
| 包管理 | 仅 Bun；删 pnpm lock / workspace | 消除双轨 |
| Fork Ponder 硬绑 Bun | **否决** | Ponder ≥0.16 官方支持 Bun；fork 成本极高 |
| Indexer | 升 ponder → **≥0.16，建议 0.18.x** + `bun --bun ponder …` | 官方文档路径 |
| Cron | 去 `node-cron` / `dotenv`；Bun 跑 TS + 轻量调度 | 已是 Bun，清理依赖即可 |
| SvelteKit adapter | **`@sveltejs/adapter-bun`**，替换 `adapter-static` | 用户要求深度 Bun 兼容 |
| SvelteKit 大版本 | **升到 Kit 3**（adapter-bun peer 要求） | 官方 adapter-bun@1 需 `@sveltejs/kit ^3` |
| Foundry | 保留 forge/anvil；`scripts-js` 改 `bun` 执行 | 合约工具链不变 |

## 3. 方案对比（已选）

1. **全仓 Bun + 升 Ponder + adapter-bun（选定）** — 官方路径，功能保留。
2. 渐进双轨 — 否决（漂移久）。
3. 自研 Bun indexer / fork Ponder — 否决（本仓索引几乎空脚手架；fork 不划算）。

## 4. 目标架构

```text
bun (≥1.4) — 唯一 PM + runner
├── packages/foundry    forge/anvil + bun scripts-js
├── packages/sveltekit  Kit 3 + @sveltejs/adapter-bun → bun ./build
├── packages/indexer    ponder ≥0.16 via `bun --bun ponder …`
└── packages/cron       bun 直接跑 src/index.ts + Bun-native 调度
```

边界：

- **Foundry** 原生二进制保留；JS 胶水层全部 Bun。
- **Ponder** 不 fork；接受官方 Bun 限制（如 `/metrics` 无 `nodejs_*`）。
- **dApp** 生产入口为 Bun server（`Bun.serve`），可同时服务 SSR、API routes、静态资源。

## 5. Monorepo / 工具链

### 5.1 根配置

- `package.json`：
  - 全部脚本：`pnpm --filter` → `bun --filter`（或 `bun run --cwd packages/<pkg> …`）。
  - 删除失效 `@w3s/nextjs` / `next:*` / 指向 next 的 `vercel`/`ipfs` 脚本，或改挂到 sveltekit 的 Bun 部署流程。
  - `engines`：改为要求 `bun`（例如 `>=1.4.0`），移除强制 `node`。
  - 增加 `packageManager": "bun@<pinned>"`。
- 删除：`pnpm-lock.yaml`、`pnpm-workspace.yaml`（改用根 `workspaces` + bun）。
- 保留并刷新：`bun.lock`。
- `.npmrc`：按 bun 需要精简或删除仅 pnpm 有效的项。
- Husky / lint-staged：确保 hook 调用 `bun` 而非 `pnpm`/`npx`（必要时 `bunx`）。

### 5.2 CI / 文档

- README、`dev.md`、`.cursor/rules`：统一 Bun；去掉 Node/pnpm 前置。
- GitHub Actions（若有）：`oven-sh/setup-bun`，去掉 setup-node（除非第三方 action 硬要）。

## 6. Indexer（Ponder）

- 依赖：`ponder` 升到 **0.18.x**（或当时最新稳定且文档标明 Bun 的版本）。
- `packages/indexer/package.json` scripts 示例：

```json
{
  "dev": "bun --bun ponder dev",
  "start": "bun --bun ponder start",
  "build": "bun --bun ponder build",
  "codegen": "bun --bun ponder codegen",
  "db": "bun --bun ponder db",
  "serve": "bun --bun ponder serve"
}
```

- 必须带 `--bun`：否则 bun script runner 会因 shebang `#!/usr/bin/env node` 落到 Node。
- 按 [Ponder migration guide](https://ponder.sh/docs/migration-guide) 处理 0.15 → 0.18 API/配置变更。
- 本仓应用层几乎为空；迁移以能 `bun indexer` 启动为准。

## 7. Cron / Jobs

- 入口保持 `bun run src/index.ts`。
- 移除 `dotenv`（Bun 自动加载 `.env`）。
- 移除 `node-cron`：改用 Bun 可用的调度（优先简单 interval + cron 表达式库，或 Bun 1.x 定时能力；避免 `child_process.fork` 路径）。
- 修正依赖分类：运行时依赖不得放在 `devDependencies`。
- 根 `bun cron` 走 bun filter，不再经 pnpm。

## 8. SvelteKit + adapter-bun（深度兼容）

### 8.1 大版本与配置迁移

当前：`@sveltejs/kit ^2.48.5` + `svelte.config.js` 内 `adapter-static`。

目标：

- `@sveltejs/kit` **^3**
- `@sveltejs/adapter-bun` **^1**（官方）
- Bun **≥1.4**（与本机已装 1.4.5 对齐）
- 按 Kit 3 约定：adapter 配置迁到 **`vite.config` 的 `sveltekit({ adapter })`**（Kit 3 不再以 `svelte.config.js` 为配置中心；实施时以官方迁移指南为准）。

### 8.2 Adapter 行为

- 构建：`bun run --bun build`（生产 build 必须在 Bun runtime 下跑，因 adapter 调用 Bun build API）。
- 产物默认 `build/`；启动：`bun ./build`。
- 生产需：`build/` + `package.json` + production `node_modules`（或按文档选用 `buildOptions.compile` 打单文件可执行）。
- 根脚本：
  - `start` / `dev`：开发仍 `vite`（`bun --bun`）。
  - 新增或改写 `start:prod` / `preview`：`bun ./build`。
  - 部署：优先文档化 Bun 主机；原 `vercel`/`ipfs` 静态流改为可选次要路径或后续任务（**本设计主路径 = Bun server**）。

### 8.3 SSR / 路由策略（从静态 SPA 迁出）

当前全站 `ssr = false` + `adapter-static` fallback SPA。迁到 adapter-bun 后：

1. **默认开启 SSR 能力**（去掉 layout/page 上一刀切的 `ssr = false`，按路由精细控制）。
2. **钱包 / wagmi / AppKit / 浏览器 API**：继续 `browser` 守卫；服务端不初始化钱包。
3. **服务端可读 Foundry artifacts**（现有 `+page.server.ts` 的 `fs`）：在 Bun 下合法；修正 cwd 假设（相对 monorepo / package 根的路径要稳）。
4. **动态路由**（blockexplorer address/tx）：用 server load 或客户端 load，不再依赖 SPA fallback。
5. **环境变量**：`process.env` / `PUBLIC_*` 统一为 SvelteKit `$env` / `import.meta.env`；生产用 Bun 环境变量（`ORIGIN`、`PORT` 等按 adapter-bun 文档）。

### 8.4 Bun 平台 API（深度兼容清单）

在可行处采用 Bun 特性（不盲目替换一切）：

| 能力 | 用法 |
|------|------|
| `Bun.serve` | 由 adapter 生成；不手写第二套 server |
| `Bun.file` | 静态与 `read` 资源由 adapter 服务 |
| 可选 `buildOptions.compile` | 单二进制部署（后续增强，默认先非 compile） |
| Bun `.env` | 开发/生产加载 |
| `bun --bun` | 所有 vite/ponder CLI |

### 8.5 脚本层清理

- `node scripts/get-local-ip.js` → `bun scripts/get-local-ip.js`；shebang 改 bun 或删除。
- 所有 `pnpm run` → `bun run`。
- 移除未使用的 `@sveltejs/adapter-auto`、`@sveltejs/adapter-static`（完成迁移后）。

### 8.6 Kit 3 升级风险（明确接受）

- Svelte / vite-plugin-svelte / 相关 peer 联动升级。
- 配置文件布局变更（svelte.config → vite plugin options）。
- 第三方：`@scaffold-ui/*`、`shadcn-svelte`、`bits-ui`、wagmi 相关需验证 Kit 3 兼容；不兼容则 pin 或替换最小表面。
- 这是本迁移中 **风险最高** 的子系统；实施时单独冒烟（首页、debug、blockexplorer、钱包连接、合约读写）。

## 9. Foundry JS 胶水

- `account:*` / `deploy*`：`node scripts-js/…` → `bun scripts-js/…`。
- 脚本内 `dotenv` 可逐步改为 Bun 环境加载（非阻塞）。
- `make` / `forge` / `anvil` 不变。

## 10. 非目标

- Fork 或重写 Ponder。
- 用 JS 替换 Foundry。
- 强制所有路由 SSR 出 HTML（钱包页可仍偏 CSR）。
- 保留 pnpm 作为一等公民。
- 第一期必须交付 `bun build --compile` 单二进制（可选后续）。

## 11. 风险与缓解

| 风险 | 缓解 |
|------|------|
| Kit 2→3 + adapter-bun 破坏 UI/依赖 | 独立任务；先升 Kit 再换 adapter；按路由回归 |
| Ponder 0.15→0.18 breaking | 跟官方 migration；本仓逻辑少 |
| `bun --bun` + Vite 偶发兼容 | 钉 Bun 1.4.x；问题 upstream issue |
| 静态托管（IPFS）用户流失 | 文档说明主路径改 Bun server；IPFS 作后续可选 static export |
| Wagmi React 痕迹混入 Svelte | 既有问题；迁移时不扩大，能删则删 |

## 12. 实施顺序（可 swarm 并行）

1. **根工作区**：bun-only lock、脚本、engines、删 pnpm、修 stale next 脚本。  
2. **foundry scripts-js → bun**（低风险并行）。  
3. **cron 纯化**（去 node-cron/dotenv）。  
4. **indexer**：升 ponder + `bun --bun` scripts。  
5. **sveltekit**：Kit 3 升级 → `@sveltejs/adapter-bun` → SSR/env/路径修正 → `bun run --bun build` + `bun ./build`。  
6. **文档 / CI / cursor rules** 对齐。  
7. **冒烟**：install、chain、deploy:local、start(dev)、build+prod、indexer、cron。

依赖关系：5 依赖 1；2/3/4 可在 1 后并行；6 在功能合入后。

## 13. 验证清单

- [ ] 无 Node 的 PATH 下（或故意不用 node）完成 `bun install` 与上述命令。
- [ ] `which pnpm` 失败也不影响脚本。
- [ ] `bun indexer` 以 Bun runtime 跑 ponder（进程非 node）。
- [ ] `bun cron` 无 node-cron。
- [ ] `bun run --bun build` 产出 adapter-bun 的 `build/`，`bun ./build` 可访问首页与 debug。
- [ ] 钱包连接 + Counter 读写仍可用。

## 14. 修订记录

- 2026-11-20：初稿；选定全仓 Bun + Ponder 升级；否决 fork。  
- 2026-11-20：按用户要求，dApp 主路径改为官方 `@sveltejs/adapter-bun`，并纳入 Kit 3 升级。
