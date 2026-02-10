---
name: foundry-development
description: Handles Foundry smart contract development workflows including compilation, testing, deployment, and TypeScript ABI generation. Use when deploying contracts, running tests, generating contract types, or working with Solidity contracts in the foundry package.
---

# Foundry 合约开发工作流

## 快速命令参考

### 本地开发流程

```bash
# 1. 启动本地链
bun chain

# 2. 部署合约到本地
bun deploy:local

# 3. 编译合约
bun compile

# 4. 运行测试
bun foundry:test

# 5. 格式化代码
bun foundry:format
```

## 完整开发工作流

### 1. 启动本地开发环境

**启动 Anvil 本地链**：
```bash
bun chain
# 或
cd packages/foundry && bun run chain
```

这会启动一个本地以太坊网络（Chain ID: 31337），默认账户：
- Account 1: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account 2: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Account 3: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

### 2. 编译合约

```bash
bun compile
# 或
cd packages/foundry && forge build
```

编译后的 artifacts 位于 `packages/foundry/out/`

### 3. 部署合约

**本地部署（推荐）**：
```bash
bun deploy:local
```

这会自动：
- 检查并启动本地链（如果未运行）
- 部署所有合约（Counter 等示例合约）
- 生成前端配置文件

**手动部署**：
```bash
cd packages/foundry
forge script script/DeployLocal.s.sol:DeployLocalScript \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --slow
```

### 4. 生成 TypeScript 合约定义

部署后自动生成，或手动运行：
```bash
cd packages/foundry
node scripts-js/generateTsAbis.js
```

生成文件：
- `packages/sveltekit/src/lib/contracts/deployedContracts.ts`

**重要**：只生成 SvelteKit 版本，不生成 Next.js 版本。

### 5. 运行测试

```bash
bun foundry:test
# 或
cd packages/foundry && forge test
```

**运行特定测试**：
```bash
forge test --match-path test/Counter.t.sol
```

**带详细输出**：
```bash
forge test -vvv
```

## 账户管理

### 生成新账户

```bash
bun account:generate
# 或
cd packages/foundry && node scripts-js/generateKeystore.js
```

### 导入账户

```bash
bun account:import
# 或
cd packages/foundry && node scripts-js/importAccount.js
```

### 查看账户私钥

```bash
bun account:reveal-pk
# 或
cd packages/foundry && node scripts-js/revealPK.js
```

## 部署脚本位置

- **本地部署**: `packages/foundry/script/DeployLocal.s.sol`
- **主网部署**: `packages/foundry/script/Deploy.s.sol`
- **部署辅助**: `packages/foundry/script/DeployHelpers.s.sol`

## 合约文件结构

```
packages/foundry/
├── contracts/
│   ├── Counter.sol      # Counter 示例合约
│   ├── mocks/           # Mock 合约（用于测试）
│   ├── interfaces/      # 接口定义
│   └── libraries/       # 库文件
├── script/              # 部署脚本
├── test/                # 测试文件
└── scripts-js/          # JavaScript 辅助脚本
```

## 常见任务

### 修改合约后重新部署

```bash
# 1. 重新编译
bun compile

# 2. 重新部署
bun deploy:local

# 3. TypeScript 定义会自动更新
```

### 验证合约

```bash
bun foundry:verify RPC_URL=sepolia
```

### Fork 主网进行测试

```bash
bun fork mainnet
# 或指定 URL
bun fork https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
```

### 格式化代码

```bash
bun foundry:format
# 或
cd packages/foundry && forge fmt
```

## 部署输出

部署完成后会生成：

- `packages/foundry/deployments/31337.json` - 部署地址映射
- `packages/sveltekit/src/lib/contracts/deployedContracts.ts` - 前端合约定义
- `DEPLOYMENT_SUMMARY.md` - 部署摘要（如果生成了）

## 故障排除

### 本地链无法启动

```bash
# 检查端口占用
lsof -i :8545

# 手动启动
anvil --host 0.0.0.0 --port 8545
```

### 部署失败

1. 确保本地链运行：`curl http://localhost:8545`
2. 检查合约编译：`bun compile`
3. 查看详细错误：添加 `-vvv` 标志

### TypeScript 定义未更新

手动运行生成脚本：
```bash
cd packages/foundry
node scripts-js/generateTsAbis.js
```

## E2E 测试场景

项目提供了完整的 E2E 测试脚本：

```bash
# 运行所有场景
cd packages/foundry && node scripts-js/run_all_e2e.js

# 运行特定场景
bun e2e:1  # 奖励领取场景
bun e2e:2  # LP GFT 场景
bun e2e:3  # 社区场景
bun e2e:4  # GFT 价格场景
bun e2e:5  # GFT 交易场景
```

## 最佳实践

1. **开发流程**：
   - 修改合约 → 编译 → 测试 → 部署 → 前端测试

2. **测试优先**：
   - 编写测试覆盖新功能
   - 运行测试确保通过
   - 再进行部署

3. **版本控制**：
   - 部署脚本会记录到 `broadcast/` 目录
   - 部署地址保存在 `deployments/` 目录

4. **类型安全**：
   - 部署后确保 TypeScript 定义已更新
   - 前端会自动使用新的合约定义

## 更多示例

查看 [examples.md](examples.md) 了解常见开发场景的详细示例。
