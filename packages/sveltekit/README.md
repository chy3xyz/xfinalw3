# SvelteKit Frontend（`@w3s/sveltekit`）

SvelteKit 3 + Svelte 5 + `@sveltejs/adapter-bun` 的 Web3 前端。合约交互请使用脚手架 stores（`createScaffoldReadContractStore` / `createScaffoldWriteContractStore` / `createScaffoldEventHistoryStore`）。

## 快速开始

在**仓库根目录**：

```bash
bun install
cp packages/sveltekit/.env.example packages/sveltekit/.env
# 编辑 VITE_PROJECT_ID / VITE_ALCHEMY_API_KEY

bun start          # 开发 → http://localhost:5173
```

需本地链时另开终端：`bun chain` → `bun deploy:local`。

## 生产

```bash
# 根目录；需已设置生产环境变量（见 docs/ENV_MATRIX.md）
bun run build
bun start:prod     # bun ./build → 默认 :3000
```

完整说明：[docs/DEPLOY_BUN.md](../../docs/DEPLOY_BUN.md)。

## 包内脚本

| 脚本 | 说明 |
|------|------|
| `bun run dev` | Vite 开发服务器 |
| `bun run build` | CSS + `bun --bun vite build`（adapter-bun） |
| `bun run start` | `bun ./build` 生产进程 |
| `bun run check` | `svelte-check` |
| `bun run preview` | vite preview（验收以 `start` / `start:prod` 为准） |

根目录推荐：`bun start` / `bun run build` / `bun start:prod`。

## 环境变量

见 `.env.example` 与 [docs/ENV_MATRIX.md](../../docs/ENV_MATRIX.md)。生产缺少 `VITE_PROJECT_ID` / `VITE_ALCHEMY_API_KEY` 会 fail-fast。

## 配置

编辑 `scaffold.config.ts`（目标网络、polling 等）。

## AppKit

使用 [Reown AppKit](https://docs.reown.com/appkit)（WalletConnect）。模板中可用 `<appkit-button />` 等 Web Components。
