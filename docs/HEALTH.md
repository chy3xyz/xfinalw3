# 健康检查约定

| 服务 | 启动命令 | 默认地址 | 探活 | 成功语义 |
|------|----------|----------|------|----------|
| dApp | `bun start:prod` | `http://127.0.0.1:3000/` | `GET /` | `200`（页面可渲染；需正确 `VITE_*` / `ORIGIN`） |
| Cron | `bun cron` | `http://127.0.0.1:3001/health` | `GET /health` | `{ "ok": true, "writesEnabled": boolean }` |
| Indexer API | `bun indexer` | `http://127.0.0.1:42069/health` | `GET /health` | `ready: true` + `status: "ok"` → 200；无合约配置 → `degraded` + **503** |

## 编排建议

- **liveness**：进程监听端口即可（dApp `/`、cron `/health`、indexer `/health` 能连上）。
- **readiness**：
  - Indexer：仅当 `ready === true` 时视为就绪（空 `contracts` 的脚手架会 503）。
  - Cron：`ok === true`；写链是否开启看 `writesEnabled`。
  - dApp：依赖构建期注入的 `VITE_*`；缺密钥时可能 500——用 env 矩阵配置。

## 示例

```bash
curl -sI http://127.0.0.1:3000/ | head -1
curl -s http://127.0.0.1:3001/health
curl -s http://127.0.0.1:42069/health
```
