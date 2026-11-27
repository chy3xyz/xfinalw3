# Xfinalw3 · Solid dApp

SolidStart + **`@wagmi/solid`**。应用壳与后台模式抽取自生产 MMM Solid 工程（用户端 + `/mng` 管理端），不以 Svelte 脚手架为准。

## 布局

| 路径 | 角色 |
|------|------|
| `/` | 首页：海报、公告 ticker、功能入口、会话摘要、Counter 冒烟 |
| `/trade` · `/swap` | 交易所大厅 / 闪兑壳 |
| `/me` · `/assets` · `/team` · `/faq` | 个人中心与资产、团队、FAQ |
| `/debug` | 合约调试列表 |
| `/mng/*` | 管理端：`AdminGuard` + Sidebar + AdminHeader |

用户端入口配置：`src/lib/config/appContent.ts`（公告、功能格、FAQ）。

## 可复用轮子

| Area | Path |
|------|------|
| UI | `src/components/ui/*` |
| 用户壳 | `site/*` · `shared/ConnectGate` |
| 管理端 | `admin/{AdminGuard,Sidebar,AdminHeader,Pager,AdminCard,…}` |
| Admin REST | `src/lib/api.ts` → 同源 `/api/*`（代理到 indexer） |
| Indexer GQL | `src/lib/indexer/client.ts` |
| Wallet | `src/lib/web3/*` |
| Scaffold | `useScaffoldReadContract` / `Write` / `Contract` / `EventHistory` |
| i18n | `en` + `zh-CN` |

## 命令

```bash
bun install
bun chain && bun deploy:local
bun indexer          # 另开终端；后台登录依赖 /admin/auth/*
bun start            # :5173 — 用户端 / 后台 /mng
```

## Env

- `VITE_WALLET_CONNECT_PROJECT_ID`
- `VITE_TARGET_CHAINS` — 如 `foundry,sepolia`（默认 `foundry`）
- `VITE_RPC_URL_<chainId>` / `VITE_RPC_URL` — 非本地链必需
- `VITE_PONDER_PROXY` — 默认 `http://127.0.0.1:42069`（`/api`、`/rpc`、`/ponder` 代理）
- `VITE_USE_RPC_PROXY=0` — 本地直连 Anvil `http://127.0.0.1:8545`
- `VITE_GRAPHQL_API_KEY` — 与 indexer `GRAPHQL_API_KEY` 对齐时使用

Indexer：`ADMIN_PASSWORD_SHA256`（登录 `/mng`）+ `RPC_GATEWAY_UPSTREAM`（`/rpc` 上游）。

## 合约交互

```tsx
import {
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useScaffoldEventHistory,
  useScaffoldContract,
} from "~/lib/scaffold"

const count = useScaffoldReadContract<bigint>({
  contractName: "Counter",
  functionName: "getCount",
  watch: true,
})
const logs = useScaffoldEventHistory({
  contractName: "Counter",
  eventName: "CountUpdated",
  watch: true,
})
```

管理端样板：`/mng/counts`（GraphQL `countUpdates`）。
