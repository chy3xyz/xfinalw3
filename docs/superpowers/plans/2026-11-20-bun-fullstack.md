# Bun 全栈化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 xfinalw3 monorepo 升级为 Bun 唯一包管理与 JS/TS 运行时：Ponder 官方 Bun 路径、纯 Bun cron、SvelteKit 3 + `@sveltejs/adapter-bun`。

**Architecture:** 根 workspaces 只用 Bun；各包脚本经 `bun --filter` / `bun run --cwd` 调用；indexer 用 `bun --bun ponder`；dApp 生产产物由 adapter-bun 生成并由 `bun ./build`（`Bun.serve`）运行。不 fork Ponder。

**Tech Stack:** Bun ≥1.4.5、Ponder ≥0.18、SvelteKit 3、`@sveltejs/adapter-bun` ^1、viem、Foundry（forge/anvil）、croner（cron 调度，纯 JS）

**Spec:** `docs/superpowers/specs/2026-11-20-bun-fullstack-design.md`

## Global Constraints

- Bun ≥1.4.0（本机已验证 1.4.5）；禁止把 Node/pnpm 作为一等公民写回脚本或 README
- 不 fork Ponder；indexer 必须 `bun --bun ponder …`
- dApp 生产主路径 = `@sveltejs/adapter-bun`（非 adapter-static）
- SvelteKit 必须升到 ^3（adapter-bun peer）
- 合约交互 UI 仍只用 `createScaffoldReadContractStore` / `createScaffoldWriteContractStore` / `createScaffoldEventHistoryStore`
- 用户未明确要求时不要 `git commit`；计划中的 Commit 步骤在执行会话里改为「暂存说明 / 跳过」除非用户说可以提交
- 文件写入用编辑工具；长命令输出可压缩，但验证命令要能看清失败原因

## File map（谁改什么）

| 路径 | 职责 |
|------|------|
| `package.json` | 根脚本、engines、packageManager |
| `pnpm-lock.yaml` / `pnpm-workspace.yaml` / `.npmrc` | 删除或去 pnpm 专用项 |
| `packages/foundry/package.json` | scripts-js 改 bun |
| `packages/cron/**` | 去 dotenv/node-cron，加 schedule 工具 |
| `packages/indexer/package.json` + ponder 配置 | 升 ponder + bun --bun |
| `packages/sveltekit/package.json` | 依赖/Kit3/adapter-bun/scripts |
| `packages/sveltekit/vite.config.ts` | Kit3 + adapter-bun |
| `packages/sveltekit/svelte.config.js` | 精简/对齐 Kit3 |
| `packages/sveltekit/src/routes/**/+*layout.ts` / `+page.ts` | 去掉一刀切 `ssr=false` |
| `packages/sveltekit/src/lib/utils/getMetadata.ts` | env 对齐 |
| `packages/sveltekit/scripts/get-local-ip.js` | shebang → bun |
| `README.md` / `dev.md` / `.github/workflows/lint.yaml` / `.cursor/rules/*` | 文档与 CI |

---

### Task 1: 根工作区 Bun-only

**Files:**
- Modify: `package.json`
- Delete: `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- Modify or Delete: `.npmrc`
- Test: shell smoke（见步骤）

**Interfaces:**
- Consumes: 现有 `workspaces.packages = ["packages/*"]`
- Produces: 根脚本全部 `bun --filter @w3s/<pkg> <script>`；`engines.bun`；`packageManager: bun@1.4.5`；无 nextjs 死脚本

- [ ] **Step 1: 重写根 `package.json` scripts / engines**

将 `package.json` 替换为（保留 biome/husky/lint-staged 版本可按现有）：

```json
{
  "name": "xfinalw3",
  "version": "0.0.1",
  "description": "A modern Web3 development framework for building dApps on Ethereum",
  "private": true,
  "packageManager": "bun@1.4.5",
  "workspaces": ["packages/*"],
  "scripts": {
    "account": "bun run foundry:account",
    "account:generate": "bun run foundry:generate",
    "account:import": "bun run foundry:account-import",
    "account:reveal-pk": "bun --filter @w3s/foundry account:reveal-pk",
    "chain": "bun run foundry:chain",
    "compile": "bun run foundry:compile",
    "deploy": "bun run foundry:deploy",
    "deploy:local": "bun --filter @w3s/foundry deploy:local",
    "flatten": "bun run foundry:flatten",
    "fork": "bun run foundry:fork",
    "format": "bun run foundry:format",
    "foundry:account": "bun --filter @w3s/foundry account",
    "foundry:account-import": "bun --filter @w3s/foundry account:import",
    "foundry:chain": "bun --filter @w3s/foundry chain",
    "foundry:clean": "bun --filter @w3s/foundry clean",
    "foundry:compile": "bun --filter @w3s/foundry compile",
    "foundry:deploy": "bun --filter @w3s/foundry deploy",
    "foundry:deploy-verify": "bun --filter @w3s/foundry deploy:verify",
    "foundry:flatten": "bun --filter @w3s/foundry flatten",
    "foundry:fork": "bun --filter @w3s/foundry fork",
    "foundry:format": "bun --filter @w3s/foundry format",
    "foundry:generate": "bun --filter @w3s/foundry account:generate",
    "foundry:lint": "bun --filter @w3s/foundry lint",
    "foundry:test": "bun --filter @w3s/foundry test",
    "foundry:verify": "bun --filter @w3s/foundry verify",
    "generate": "bun run foundry:generate",
    "postinstall": "husky install",
    "indexer": "bun --filter @w3s/indexer dev",
    "indexer:build": "bun --filter @w3s/indexer build",
    "indexer:codegen": "bun --filter @w3s/indexer codegen",
    "indexer:db": "bun --filter @w3s/indexer db",
    "indexer:serve": "bun --filter @w3s/indexer serve",
    "cron": "bun --filter @w3s/cron dev",
    "start": "bun --filter @w3s/sveltekit dev",
    "start:prod": "bun --filter @w3s/sveltekit start",
    "build": "bun --filter @w3s/sveltekit build",
    "lint": "bun run foundry:lint",
    "precommit": "lint-staged",
    "test": "bun run foundry:test",
    "verify": "bun run foundry:verify",
    "biome:check": "biome check .",
    "biome:format": "biome format --write .",
    "biome:lint": "biome lint .",
    "biome:ci": "biome ci ."
  },
  "devDependencies": {
    "biome": "^0.3.3",
    "husky": "~9.1.6",
    "lint-staged": "~13.2.2"
  },
  "engines": {
    "bun": ">=1.4.0"
  }
}
```

注意：删除全部 `next:*` / `ipfs` / `vercel*` / `@w3s/nextjs` 引用。若 `workspaces` 对象形式与 bun 不兼容，使用上方字符串数组形式。

- [ ] **Step 2: 删除 pnpm 锁与 workspace 文件**

```bash
rm -f pnpm-lock.yaml pnpm-workspace.yaml
```

- [ ] **Step 3: 重写 `.npmrc`（去掉 pnpm 专用项）或删除**

若保留，内容改为空文件或仅：

```
# reserved for registry overrides if needed
```

- [ ] **Step 4: 重新安装并验证 filter**

```bash
bun install
bun run --filter @w3s/cron typecheck
```

Expected: install 成功；cron typecheck 能被解析（即使后续任务才修类型）。若 `bun --filter` 语法在本机 bun 1.4.5 报错，改用等价：

```bash
bun run --cwd packages/cron typecheck
```

并同步改根脚本为 `bun run --cwd packages/<name> <script>`。

- [ ] **Step 5: 记录变更（不自动 commit，除非用户要求）**

---

### Task 2: Foundry scripts-js → Bun

**Files:**
- Modify: `packages/foundry/package.json`

**Interfaces:**
- Consumes: Task 1 根 `bun --filter @w3s/foundry …`
- Produces: 所有原 `node scripts-js/*` 改为 `bun scripts-js/*`

- [ ] **Step 1: 改 foundry package scripts**

在 `packages/foundry/package.json` 中把：

```json
"account:generate": "node scripts-js/generateKeystore.js",
"account:import": "node scripts-js/importAccount.js",
"account:reveal-pk": "node scripts-js/revealPK.js",
"deploy": "node scripts-js/parseArgs.js",
"deploy:local": "node scripts-js/deployLocal.js",
```

改为：

```json
"account:generate": "bun scripts-js/generateKeystore.js",
"account:import": "bun scripts-js/importAccount.js",
"account:reveal-pk": "bun scripts-js/revealPK.js",
"deploy": "bun scripts-js/parseArgs.js",
"deploy:local": "bun scripts-js/deployLocal.js",
```

- [ ] **Step 2: 快速语法检查（不要求真部署）**

```bash
bun --cwd packages/foundry -e "await import('./scripts-js/parseArgs.js')" 2>&1 | head -20
```

Expected: 不因 `node` shebang/缺失而失败；若脚本因缺参数退出，exit non-zero 可接受，但 stderr 不得是 `node: command not found`。

更稳妥：

```bash
rg -n "node scripts-js|#!/usr/bin/env node" packages/foundry/package.json packages/foundry/scripts-js
```

Expected: package.json 无 `node scripts-js`；scripts-js 内若有 shebang，改为 `#!/usr/bin/env bun` 或删除。

---

### Task 3: Cron 纯化（去 node-cron / dotenv）

**Files:**
- Create: `packages/cron/src/utils/schedule.ts`
- Modify: `packages/cron/src/index.ts`
- Modify: `packages/cron/package.json`

**Interfaces:**
- Consumes: 现有 `ContractJob`、`logger`
- Produces: `schedule(cronExpr: string, fn: () => void | Promise<void>): { stop(): void }`

- [ ] **Step 1: 添加 croner 依赖并清理 package.json**

`packages/cron/package.json`：

```json
{
  "name": "@w3s/cron",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run src/index.ts",
    "start": "bun run src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "croner": "^9.0.0",
    "viem": "^2.34.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

在仓库根执行：

```bash
bun install
```

- [ ] **Step 2: 新增 schedule 封装**

创建 `packages/cron/src/utils/schedule.ts`：

```typescript
import { Cron } from "croner";

export function schedule(
  expression: string,
  fn: () => void | Promise<void>,
): { stop: () => void } {
  const job = new Cron(expression, { protect: true }, () => {
    void Promise.resolve(fn()).catch((error) => {
      console.error("scheduled job failed:", error);
    });
  });
  return {
    stop: () => job.stop(),
  };
}
```

- [ ] **Step 3: 重写 `packages/cron/src/index.ts`**

```typescript
import { ContractJob } from "./jobs/contract-job.js";
import { logger } from "./utils/logger.js";
import { schedule } from "./utils/schedule.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337", 10);

if (!PRIVATE_KEY) {
  logger.error("PRIVATE_KEY environment variable is required");
  process.exit(1);
}

logger.info("Starting cron jobs...");
logger.info(`RPC URL: ${RPC_URL}`);
logger.info(`Chain ID: ${CHAIN_ID}`);

const contractJob = new ContractJob({
  privateKey: PRIVATE_KEY as `0x${string}`,
  rpcUrl: RPC_URL,
  chainId: CHAIN_ID,
});

const jobs = [
  schedule("* * * * *", async () => {
    logger.info("Running contract job...");
    await contractJob.execute();
  }),
  schedule("*/5 * * * *", async () => {
    logger.info("Running periodic read job...");
    await contractJob.periodicRead();
  }),
  schedule("0 2 * * *", async () => {
    logger.info("Running daily job...");
    await contractJob.dailyTask();
  }),
];

logger.info("Cron jobs scheduled. Press Ctrl+C to stop.");

function shutdown() {
  logger.info("Shutting down...");
  for (const job of jobs) job.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

（Bun 自动加载 `.env`；勿再 `import "dotenv/config"`。）

- [ ] **Step 4: 验证**

```bash
bun --filter @w3s/cron typecheck
rg -n "node-cron|dotenv" packages/cron
```

Expected: typecheck 通过（或仅既有无关告警）；rg 无匹配。

临时启动（缺 PRIVATE_KEY 应立即退出 1）：

```bash
bun --filter @w3s/cron dev
```

Expected: 打印 `PRIVATE_KEY environment variable is required` 后退出。

---

### Task 4: Indexer 升 Ponder + `bun --bun`

**Files:**
- Modify: `packages/indexer/package.json`
- Modify: `packages/indexer/ponder.config.ts`（仅当 0.18 migration 要求）
- Modify: `packages/indexer/src/**`（仅当 API breaking）

**Interfaces:**
- Consumes: Task 1 根 `bun indexer`
- Produces: ponder ^0.18；scripts 全部 `bun --bun ponder …`

- [ ] **Step 1: 升级依赖并改 scripts**

`packages/indexer/package.json`：

```json
{
  "name": "@w3s/indexer",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --bun ponder dev",
    "start": "bun --bun ponder start",
    "build": "bun --bun ponder build",
    "codegen": "bun --bun ponder codegen",
    "db": "bun --bun ponder db",
    "serve": "bun --bun ponder serve"
  },
  "dependencies": {
    "hono": "^4.7.12",
    "ponder": "^0.18.9",
    "viem": "^2.34.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

```bash
bun install
```

- [ ] **Step 2: 按 migration 修复配置/源码**

打开 https://ponder.sh/docs/migration-guide ，针对 0.15→0.18 修改本包文件。当前配置极简：

```typescript
import { createConfig } from "ponder";

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
    },
  },
  contracts: {},
});
```

若 `createConfig` / chains 形状变更，按新版类型与文档改到能通过 `ponder codegen`。

- [ ] **Step 3: 验证 Bun runtime（短跑）**

```bash
cd packages/indexer && PONDER_RPC_URL_1=https://cloudflare-eth.com bun --bun ponder codegen
```

Expected: 无 `Node.js version` 硬失败；codegen 成功或仅因空 contracts 的可接受警告。

再用根脚本：

```bash
# 启动数秒后 Ctrl+C；确认进程为 bun 而非 node
bun indexer
```

Expected: 不以 `Please use Node.js` 退出。

---

### Task 5: SvelteKit 脚本层 Bun 化（升 Kit 前）

**Files:**
- Modify: `packages/sveltekit/package.json`
- Modify: `packages/sveltekit/scripts/get-local-ip.js`

**Interfaces:**
- Consumes: Task 1
- Produces: 无 `node`/`pnpm` 脚本调用；为 Task 6 铺路

- [ ] **Step 1: 改 shebang**

`packages/sveltekit/scripts/get-local-ip.js` 第一行：

```javascript
#!/usr/bin/env bun
```

- [ ] **Step 2: 改 scripts（先保持 adapter-static，下一步再换）**

将 `packages/sveltekit/package.json` 的 scripts 改为：

```json
"scripts": {
  "dev": "bun scripts/get-local-ip.js && bunx --bun vite dev",
  "build:app:css": "postcss src/app.css -o static/app.css",
  "build:css": "bun run build:app:css",
  "build": "bun run build:css && bunx --bun vite build",
  "preview": "bunx --bun vite preview",
  "start": "bun ./build",
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
  "lint": "prettier --check . && eslint .",
  "format": "prettier --write ."
}
```

（`start` 在 Task 6 换 adapter-bun 后才真正可用；可先保留。）

- [ ] **Step 3: 确认无 pnpm/node 脚本残留**

```bash
rg -n "\bpnpm\b|\bnode scripts" packages/sveltekit/package.json
```

Expected: 无匹配。

---

### Task 6: SvelteKit 3 + `@sveltejs/adapter-bun`

**Files:**
- Modify: `packages/sveltekit/package.json`
- Modify: `packages/sveltekit/vite.config.ts`
- Modify: `packages/sveltekit/svelte.config.js`
- Possibly Modify: 其它因 peer 被迫升级的锁定版本

**Interfaces:**
- Consumes: Task 5 scripts
- Produces: Kit ^3；adapter-bun；`bun run --bun build` → `bun ./build`

- [ ] **Step 1: 安装官方 adapter 与 Kit 3**

在仓库根：

```bash
bun add -D @sveltejs/adapter-bun@^1 -d --cwd packages/sveltekit
bun add @sveltejs/kit@^3 -d --cwd packages/sveltekit
```

（若 bun workspace 语法不同，进入 `packages/sveltekit` 执行 `bun add -d @sveltejs/adapter-bun@^1 @sveltejs/kit@^3` 并解析 peer：同步升 `@sveltejs/vite-plugin-svelte`、`svelte`、`vite` 到 Kit3 要求的范围。）

移除：

```bash
bun remove @sveltejs/adapter-static @sveltejs/adapter-auto --cwd packages/sveltekit
```

- [ ] **Step 2: 配置 vite + adapter-bun**

按 [adapter-bun 文档](https://svelte.dev/docs/kit/adapter-bun)，将 adapter 挂到 Vite 插件（Kit 3）：

`packages/sveltekit/vite.config.ts`：

```typescript
import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				out: 'build',
			}),
		}),
	],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			'scaffold.config': fileURLToPath(new URL('./scaffold.config.ts', import.meta.url)),
		},
	},
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: false,
		fs: {
			allow: ['..'],
		},
	},
});
```

若目标 Kit 3 小版本仍要求 `svelte.config.js` 内 kit.adapter，则双写期间以官方 migration 为准：**最终不得保留 adapter-static**。

精简 `svelte.config.js`（示例；若 Kit3 已弃用该文件的 kit 段，按官方改为仅 preprocess 或删除）：

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
};

export default config;
```

- [ ] **Step 3: 构建并启动生产 server**

```bash
bun --filter @w3s/sveltekit build
bun --filter @w3s/sveltekit start
```

Expected: build 成功；`bun ./build` 监听（默认 PORT 或文档端口）；`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/` 返回 200（端口以实际日志为准）。

- [ ] **Step 4: 修复构建错误直到绿灯**

逐个解决 Kit3 / 类型 / 依赖 peer 报错；禁止回退到 adapter-static 来“先过构建”。

---

### Task 7: SSR / env / server load 对齐 adapter-bun

**Files:**
- Modify: `packages/sveltekit/src/routes/+layout.ts`
- Modify: `packages/sveltekit/src/routes/+page.ts`
- Modify: `packages/sveltekit/src/routes/debug/+page.ts`
- Modify: `packages/sveltekit/src/routes/blockexplorer/+page.ts`
- Modify: `packages/sveltekit/src/lib/utils/getMetadata.ts`
- Modify: `packages/sveltekit/src/routes/+page.server.ts`（路径稳健性）

**Interfaces:**
- Consumes: Task 6 Bun server
- Produces: 非一刀切禁用 SSR；浏览器-only 逻辑仍 `browser` 守卫；env 走 SvelteKit

- [ ] **Step 1: 放宽 SSR 开关**

删除（或改为按需）这些文件中的全局：

```typescript
export const ssr = false;
```

保留钱包/wagmi 初始化的 `browser` 守卫。动态 blockexplorer 路由可继续 `prerender = false`。

`+layout.ts` 建议变为：

```typescript
export const prerender = false;
```

（允许 SSR；不强制预渲染整个 dApp。）

- [ ] **Step 2: 修 `getMetadata.ts` env**

将非浏览器分支的 `process.env.PUBLIC_APP_URL` 改为：

```typescript
import { env } from '$env/dynamic/public';

const appUrl = env.PUBLIC_APP_URL || 'http://localhost:5173';
```

（若该模块也被纯客户端打包且不允许 `$env`，改用 `import.meta.env.PUBLIC_APP_URL`，与现有 Vite 约定一致。）

- [ ] **Step 3: 加固 `+page.server.ts` 路径**

用 `import.meta.url` / `fileURLToPath` 定位 monorepo `packages/foundry/out/build-info`，避免依赖含糊的 `process.cwd()`。若 server load 在迁移后无引用方，可删除该文件——但须确认无 import。

- [ ] **Step 4: 回归**

```bash
bun --filter @w3s/sveltekit build
bun --filter @w3s/sveltekit start
```

手动或 curl：`/`、`/debug`、`/blockexplorer` 返回非 5xx。

---

### Task 8: 文档 / CI / Cursor rules

**Files:**
- Modify: `README.md`
- Modify: `dev.md`（若存在 Node/pnpm 描述）
- Modify: `.github/workflows/lint.yaml`
- Modify: `.cursor/rules/w3final-scaffold.mdc`（及 sveltekit/foundry skills 中过时 pnpm 示例）

**Interfaces:**
- Consumes: Tasks 1–7 最终命令名
- Produces: 文档只描述 Bun + adapter-bun 生产路径

- [ ] **Step 1: CI 去 Node matrix**

`.github/workflows/lint.yaml`：

```yaml
name: Lint

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.4.5

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Biome lint & format check
        run: bun biome:ci

      - name: Foundry lint
        run: bun foundry:lint

      - name: Foundry tests
        run: bun foundry:test
```

（若本机 bun 不支持 `--frozen-lockfile`，用文档等价：`bun install --frozen-lockfile` / `--immutable` 与现有 CI 对齐。）

删除 `setup-node` 与 `matrix.node`。

- [ ] **Step 2: README Prerequisites**

改为仅：

```markdown
### Prerequisites

- [Bun](https://bun.sh) >= 1.4.0
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, anvil)
- Git
```

安装只保留 `bun install`。补充生产：

```markdown
bun run build
bun start:prod
```

- [ ] **Step 3: 更新 scaffold 规则里的 pnpm / adapter-static / Node 表述**

与 spec 一致：indexer 用 bun、cron 用 bun、dApp adapter-bun。

---

### Task 9: 端到端冒烟

**Files:** 无新文件；验证 Tasks 1–8

- [ ] **Step 1: 干净依赖**

```bash
bun install
```

- [ ] **Step 2: 脚本无 pnpm/node 回归**

```bash
rg -n "pnpm --filter|\"node scripts|engines\".*node" package.json packages/*/package.json
```

Expected: 无 `pnpm --filter`；无 `"node scripts`；根 engines 无强制 node（允许 @types 无关匹配时人工确认）。

- [ ] **Step 3: 功能冒烟（需本机 anvil）**

```bash
bun chain          # 另开终端
bun deploy:local
bun start          # dev
# 另开：
bun indexer        # 短跑
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 bun cron
bun run build && bun start:prod
```

Expected: 各命令不以缺少 node/pnpm 失败；prod server 可访问。

- [ ] **Step 4: 对照 spec 成功标准勾选**

打开 `docs/superpowers/specs/2026-11-20-bun-fullstack-design.md` §13，逐项勾选并在 PR/汇报中列出未通过项。

---

## Spec coverage self-check

| Spec 要求 | Task |
|-----------|------|
| Bun-only PM / 删 pnpm lock | T1 |
| engines.bun / packageManager | T1 |
| 删 stale next/vercel/ipfs | T1 |
| foundry scripts-js → bun | T2 |
| cron 去 node-cron/dotenv | T3 |
| ponder ≥0.16 + bun --bun | T4 |
| sveltekit 脚本 bun 化 | T5 |
| Kit3 + adapter-bun | T6 |
| SSR/env/server load | T7 |
| README/CI/rules | T8 |
| 冒烟成功标准 | T9 |
| 不 fork Ponder | T4（约束） |
| 非目标 compile 单二进制 | 未做（符合非目标） |

## Placeholder scan

无 TBD/TODO 步骤；命令与代码均为可执行草稿。Kit3 精确 peer 以安装时解析为准，Task 6 Step 4 负责收口。
