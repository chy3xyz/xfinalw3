# xfinalw3 生产级硬化设计

**日期:** 2026-11-21  
**状态:** 已确认（用户选 D = A+B+C；方案 1 三波并行 epic）  
**前置:** Bun 全栈迁移已合入（`a3720fe`）；审计见 SDD 三路报告（CI / SvelteKit / indexer·cron·foundry）

## 1. 目标

把 scaffold 从「能本地跑」提升到 **可 CI 门禁、可安全运行、可按文档部署** 的生产级框架基线，不做成完整 SaaS。

**范围 D：**

| 字母 | 含义 |
|------|------|
| A | 质量门禁：Biome、CI、死脚本、类型/构建检查 |
| B | 运行时硬化：SSR 错误/安全头、env、cron/indexer/foundry 正确性与安全 |
| C | 部署就绪：adapter-bun 文档、env 矩阵、health/可观测约定 |

## 2. 决策

| 议题 | 决策 |
|------|------|
| 推进方式 | **三波 epic**，每波可 swarm；不搞大一统 PR |
| 读合约路径 | 去掉 React wagmi hooks；统一 `@wagmi/core` + Svelte stores |
| Biome | `biome` → **`@biomejs/biome`**（对齐 `biome.json`） |
| svelte-check | Wave1 **钉进 CI**；不要求本 epic 清零历史 ~127 错误，但 P0 改动引入的错误必须修 |
| `$lib`→`#lib` | **非本 epic**（单开） |
| KMS / 密钥托管 | **非本 epic**；做到无明文默认生产写链、私钥不进 argv/stdout |

## 3. 方案对比（已选）

1. **三波并行 epic（选定）**  
2. 先清全部类型债再改功能 — 否  
3. 单 PR 全改 — 否  

## 4. Wave 1 — 质量门禁 + 合约读路径 P0（A + 致命功能）

### 4.1 CI / 工具链

- 根依赖：删除错误包 `biome`，安装 `@biomejs/biome`；脚本 `biome:*` 指向正确 CLI。
- `.github/workflows/lint.yaml`（可改名 `ci.yaml`）：
  - `actions/checkout` + `submodules: recursive`
  - `oven-sh/setup-bun@1.4.5`
  - `foundry-rs/foundry-toolchain`
  - `bun install --frozen-lockfile`
  - `bun biome:ci`
  - `bun foundry:lint` + `bun foundry:test`
  - `bun --filter @w3s/sveltekit check`（若基线失败：先修 P0 相关，或临时 `continue-on-error` **仅**在文档标明债务并开 issue——优先修到绿）
  - `bun --filter @w3s/sveltekit build`
  - `bun --filter @w3s/cron typecheck`
- 根脚本：删除或实现 `foundry:deploy-verify`（优先删除死别名，保留 `verify`）。
- `packages/sveltekit` `lint`：去掉不可用的 `eslint`，改为 Biome/prettier 一致策略。
- Husky：`postinstall`/`prepare` 对齐 Husky 9（`husky` 而非过时 `husky install`）。
- lint-staged：纳入 `*.svelte`（Biome 或 prettier-plugin-svelte）。

### 4.2 dApp 读路径（P0）

重写（或等价替换）为 `@wagmi/core` + 现有 Svelte store 模式：

- `scaffoldReadContract.ts`
- `scaffoldContract.ts`
- `scaffoldEventHistory.ts`
- `scaffoldWatchContractEvent.ts`

`ProvidersWrapper.svelte`：移除 React `WagmiProvider`；仅保留 AppKit / wagmi config 的 Svelte 上下文。

约束：UI 仍只通过 `createScaffoldReadContractStore` / `createScaffoldWriteContractStore` / `createScaffoldEventHistoryStore` 对外。

### 4.3 Cron / Indexer 最小正确性

- Cron ABI 对齐 `Counter`（`getCount` / `setCount` / 相关事件）；按 `chainId` 选链；缺 `CONTRACT_ADDRESS` / `PRIVATE_KEY` fail-fast。
- 补 `packages/cron/.env.example`、`packages/indexer/.env.example`。
- Indexer：`PONDER_RPC_URL_1` 缺省 fail-fast；最小可用 `ponder.schema` + 可选 Counter 合约配置（本地 foundry 地址由 env 注入）——允许仍为「示例索引」，但不可再是空 stub 却假装健康。

### 4.4 Wave 1 成功标准

- CI 在干净 runner 上绿（含 submodule + forge + biome + build）。
- 无 React wagmi hooks 在 scaffold stores 中。
- 首页 Counter 读/写在 `bun start` 下可用（冒烟）。
- cron/indexer 有 `.env.example`；关键 env 缺失时明确退出。

## 5. Wave 2 — 运行时硬化（B）

### 5.1 SvelteKit

- 新增 `src/routes/+error.svelte`。
- `hooks.server.ts`：增加 `handle` 设置安全头（至少 `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`；CSP 采用可落地的严格基线，避免一次性打断 WalletConnect）。
- `handleError`：客户端只返回通用 message；详情仅服务端日志。
- 扩展 `src/env.ts`：声明 `PUBLIC_*` / 必要私有变量；`FOUNDRY_BUILD_INFO_DIR` 走声明；生产缺 `VITE_PROJECT_ID`（或后继 PUBLIC 名）时 fail-fast 或仅 `development` 允许兜底。
- `scaffold.config.ts`：去掉「共享生产密钥」静默兜底；dev 可用占位并打警告。

### 5.2 Cron

- SIGINT/SIGTERM：等待 in-flight job 结束后再 exit（超时上限可配置）。
- 调度错误走 `logger`；可选轻量 `/health`（Bun.serve 同进程或独立端口）。
- 示例「自动写链」默认关闭（`CRON_WRITE_ENABLED=false`），生产需显式打开。

### 5.3 Indexer

- `/health` 反映同步/DB 就绪（至少：配置已加载 + ponder 未处于 fatal）；禁止恒 `ok` 空壳若未同步。
- GraphQL 开发可用；生产文档注明需网关鉴权（本 epic 可不实现完整 auth）。

### 5.4 Foundry

- 修复 `generateKeystore.js`（与 `account:generate` 语义一致）或重定向到正确脚本并删假文件。
- Live deploy：默认 **不** `--skip-simulation`；若保留作 escape hatch，需显式 flag。
- 避免私钥进入进程 argv / `revealPK` 默认 stdout（改为文件描述符或明确 `--yes-print` 危险旗标）。
- `.gitignore`：忽略非本地 `broadcast`（或全部 `broadcast/`）。
- 净化 `.env.example`（无易被误用的「真形态」key 文案；命令与 Bun 一致）。

### 5.5 Wave 2 成功标准

- `bun start:prod` 响应含安全头；故意抛错不向客户端泄漏堆栈路径。
- cron 关停不截断 in-flight（在超时内）；写链默认关。
- foundry `account:generate` 行为正确；live 默认有 simulation。

## 6. Wave 3 — 部署就绪（C）

- 归档或重写 `docs/DEPLOY_STATIC.md` → adapter-bun 部署指南（`bun run build` + `bun start:prod`、`ORIGIN`/`PORT`、生产 `bun install --production`）。
- 根 README / `packages/sveltekit/README.md` 命令与脚本对齐。
- Env 矩阵表：Foundry / SvelteKit / Indexer / Cron。
- 约定 health：sveltekit（可选）、cron、indexer 端口与路径。
- 可选：各服务 Dockerfile 草图（非必须可构建通过 CI）。
- CI：保持 Wave1 门禁；可选增加 `start:prod` 短冒烟（curl `/`）。

### 6.1 Wave 3 成功标准

- 新人只读文档可用 Bun+Foundry 完成「构建并启动生产 server」。
- 无 adapter-static 作为主路径的文档误导。

## 7. 非目标

- 全仓 `$lib` → `#lib`
- 清零全部历史 svelte-check
- 生产 KMS、完整 indexer GraphQL 鉴权、多链生产 indexer 运营
- 替换 Counter 为带 access control 的正式合约（保持示例，但文档标明）

## 8. 风险

| 风险 | 缓解 |
|------|------|
| svelte-check 基线导致 CI 红 | Wave1 优先修 P0 相关；必要时分步收紧 |
| CSP 打断钱包 | 先宽松可连 WC，再收紧 |
| Ponder health API 能力有限 | 文档化「尽力」语义，避免假绿 |
| generateKeystore 重写范围 | 以「脚本名=行为」最小修复为准 |

## 9. 实施顺序与并行

```text
Wave1: [CI/Biome] || [wagmi read stores] || [cron ABI + env examples]
       → merge gate: CI green + Counter read/write smoke
Wave2: [hooks/error/env] || [cron shutdown/health] || [indexer health/schema] || [foundry keystore/deploy]
Wave3: [docs/deploy] || [env matrix] || [optional Docker/CI smoke]
```

## 10. 修订记录

- 2026-11-21：初稿；用户确认 D + 三波方案。
- 2026-11-23：Wave 3 落地 — `DEPLOY_BUN.md`、`ENV_MATRIX.md`、`HEALTH.md`、归档 `DEPLOY_STATIC`、Docker 草图、CI prod smoke。
