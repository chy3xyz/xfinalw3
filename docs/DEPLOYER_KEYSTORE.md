# Deployer 私钥 / Keystore 安全机制

Foundry 部署账户使用 **加密 keystore**（`~/.foundry/keystores`），由 `packages/foundry/scripts-js/` 下的脚本管理。

## 原则

1. **私钥不进 argv**：`ps` / 审计日志可见命令行；脚本禁止 `cast … --private-key 0x…`（本地 Anvil 一次性导入除外）。
2. **私钥不进 shell 字符串**：一律 `spawn(cast, argv, { shell: false })`，账户名先做格式校验。
3. **生成不回显私钥**：`bun account:generate` → `cast wallet new <dir> <name>`，只写加密 JSON + 打印地址。
4. **导入走 interactive**：`bun account:import` → `cast wallet import <name> --interactive`。
5. **揭示需显式确认**：`bun account:reveal-pk --yes-print`（缺 flag 直接拒绝）。
6. **Anvil 默认钥仅本地**：`scaffold-eth-default` / `scaffold-eth-anvil0` 为公开测试钥，禁止上生产网。

## 命令

| 命令 | 作用 |
|------|------|
| `bun account:generate [name]` | 新建加密 keystore（推荐） |
| `bun account:import [name]` | 导入已有私钥（交互输入） |
| `bun account:list` | 列出 keystore |
| `bun account:address [name]` | 只看地址（不打印私钥） |
| `bun account:reveal-pk --yes-print [name]` | 解密打印私钥（危险） |
| `bun account` | 选账户并查多链余额 |

覆盖目录：`FOUNDRY_KEYSTORE_DIR=/path/to/dir`。

## 部署

- 本地：`bun deploy:local` 使用 `scaffold-eth-anvil0` keystore（`--account` + password），不再把 Anvil 私钥挂在 `forge` argv 上。
- 测试网/主网：`bun deploy --network <name>`，选自己的 keystore；默认会做模拟，仅当 `SKIP_SIMULATION=1` 时跳过。

## 残留风险（已知）

- 本地 Anvil keystore **首次创建创建时，公开测试钥会短暂出现在 `cast wallet import` argv。
- `reveal-pk` 会把私钥打到终端；请清理 scrollback / 剪贴板。
- 生产资金建议硬件钱包或云 KMS，而不是长期明文/软件 keystore。

## 相关文件

- `scripts-js/keystoreUtils.js` — 校验、路径、`cast` 封装
- `scripts-js/generateKeystore.js` / `importAccount.js` / `revealPK.js`
- `Makefile` `setup-anvil-wallet` — 仅本地 `scaffold-eth-default`
