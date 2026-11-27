# 健康检查约定

| 服务 | 启动命令 | 默认地址 | 探活 | 成功语义 |
|------|----------|----------|------|----------|
| dApp (Solid / Vinxi) | `bun start` / `bun start:prod` | dev `:5173`；prod 见启动日志 | `GET /` | `200`（需正确 `VITE_*`） |
| Cron (`packages/job` → `@w3s/cron`) | `bun cron` | `http://127.0.0.1:3001/health` | `GET /health` | `{ "ok": true, "writesEnabled": boolean }` |
| Indexer (bponder) | `bun indexer` | `http://127.0.0.1:42069/health` | `GET /health` | 内置 liveness → `200` |
| Indexer app ready | `bun indexer` | `http://127.0.0.1:42069/app/ready` | `GET /app/ready` | `ready: true` → 200；否则 **503** |
| Indexer RPC proxy | `bun indexer` | `http://127.0.0.1:42069/rpc` | `POST /rpc` | 需上游；本机 `GET /rpc/__stats` |

> Bun-native bponder 保留 `/health` `/ready` `/status` `/metrics` `/v1/*`。应用级就绪请用 `/app/ready`。

## 编排建议

- **liveness**：进程监听端口即可（dApp `/`、cron `/health`、indexer `/health`）。
- **readiness**：
  - Indexer：优先 `GET /app/ready`（`ready === true`）；或 `GET /ready`（bponder 内置）。
  - Cron：`ok === true`；写链是否开启看 `writesEnabled`。
  - dApp：依赖构建期注入的 `VITE_*`；缺密钥时可能 500——用 env 矩阵配置。

## 示例

```bash
curl -sI http://127.0.0.1:3000/ | head -1
curl -s http://127.0.0.1:3001/health
curl -s http://127.0.0.1:42069/health
curl -s http://127.0.0.1:42069/app/ready
```
