# Docker sketches

示例 Dockerfile，**未**接入 CI 强制构建。按需调整 workspace 拷贝与 production install。

| 文件 | 用途 |
|------|------|
| `Dockerfile.sveltekit` | adapter-bun dApp |
| `Dockerfile.cron` | cron + `/health` |

Indexer 建议直接使用官方 Ponder 部署方式或自建镜像；注意 `/graphql` 鉴权。

更多：`docs/DEPLOY_BUN.md`、`docs/HEALTH.md`。
