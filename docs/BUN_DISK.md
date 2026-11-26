# Bun 全栈与 node_modules 磁盘策略

本仓库以 **Bun 为唯一包管理 / JS 运行时**。目标：各 workspace **贡献到根 `node_modules`**，避免嵌套安装与重复版本。

## 机制

| 机制 | 作用 |
|------|------|
| `bunfig.toml` → `install.linker = "hoisted"` | 依赖提升到仓库根 |
| `package.json` → `workspaces.catalog` | `viem` / `hono` / `typescript` / `@types/node` / `bun-types` 单版本 |
| `overrides` | 强制对齐传递依赖（如 `graphql`） |
| `bponder@1.0.8`（npm） | 索引器走根 `node_modules`，默认 **不** vendor 源码树 |
| Foundry 脚本 | 用 `viem` + 轻量 `loadEnv`，去掉 `ethers` / `prettier` / `dotenv` / `qrcode` / `shx` |

各包声明共享依赖时使用：

```json
"viem": "catalog:",
"typescript": "catalog:"
```

## 命令

```bash
bun install                 # 装到根 node_modules
bun run slim:disk           # 清嵌套缓存 / bun cache；可选 prune vendor
bun run slim:disk:full      # 删除 vendor/bponder + sveltekit nests
bun run bponder:install     # Release CLI；默认跳过 vendor
bun run bponder:vendor      # 需要改上游 CLI 时才同步 vendor
```

## 预期体积（约）

- 去掉 foundry `ethers`+`@ethersproject`+`prettier` ≈ **−33MB**
- 去掉默认 `vendor/bponder` ≈ **−10MB+**
- catalog 对齐后避免多份 `viem`/`typescript`

SvelteKit 不在 workspaces 内；需要时再加回 `packages/sveltekit`。
