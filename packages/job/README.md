# @w3s/cron · Bun jobs

定时任务与链上 keeper 骨架。调度用 `croner`；与合约交互用 `viem`；与 indexer 通信复用 mmm 抽出的 `lib/gql` / `lib/rpc`。

## 可复用库（来自 mmm job/lib）

| 模块 | 用途 |
|------|------|
| `src/lib/rpc.ts` | `requireEnv` / `envMs` / `makeClients` / `waitTx` / webhook HMAC |
| `src/lib/gql.ts` | `makeGql` / `rowsOf` / `postInternal` + `X-Keeper-Secret` |
| `src/utils/schedule.ts` | croner 包装 + in-flight drain |
| `src/health.ts` | `/health` 探活 |

## 快速开始

```bash
# 根目录
bun install
cp packages/job/.env.example packages/job/.env
bun cron
```

## 环境变量

见 `.env.example`。常用：

- `PRIVATE_KEY` / `RPC_URL` / `CHAIN_ID` / `CONTRACT_ADDRESS`
- `INDEXER_URL` — bponder API（默认 `http://127.0.0.1:42069`）
- `KEEPER_SECRET` — 与 indexer `KEEPER_SECRET` 对齐，调 `/internal/*`

## 扩写 keeper

```ts
import { makeGql, rowsOf } from "./lib/gql.js"
import { makeClients, waitTx, requireEnv } from "./lib/rpc.js"

const gql = makeGql(process.env.INDEXER_URL || "http://127.0.0.1:42069")
const data = await gql(`{ __typename }`)
```
