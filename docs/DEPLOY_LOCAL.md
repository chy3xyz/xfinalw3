# 本地部署指南

本指南介绍如何在本地环境部署LUKE协议合约，用于前端开发和测试。

## 前置要求

1. **已安装的软件**:
   - Node.js >= 20.18.3
   - Bun (包管理器)
   - Foundry (forge, anvil)
   - Git

2. **环境检查**:
   ```bash
   # 检查Node.js版本
   node --version
   
   # 检查Bun版本
   bun --version
   
   # 检查Foundry
   forge --version
   anvil --version
   ```

## 快速开始

### 方法1: 使用一键部署脚本（推荐）

```bash
# 在项目根目录执行
bun run deploy:local
```

这个脚本会自动：
1. 检查并启动本地链（Anvil）
2. 部署所有合约
3. 配置合约间关系
4. 创建初始LP池
5. 初始化测试数据
6. 生成前端配置文件

### 方法2: 手动部署

#### 步骤1: 启动本地链

```bash
# 在packages/foundry目录下
bun run chain

# 或者直接运行anvil
anvil --host 0.0.0.0 --port 8545
```

#### 步骤2: 部署合约

```bash
# 在packages/foundry目录下
forge script script/DeployLocal.s.sol:DeployLocalScript \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --slow
```

#### 步骤3: 查看部署结果

部署结果会保存在 `packages/foundry/deployments/31337.json`

## 部署的合约

部署脚本会部署以下合约：

1. **MockUSDT** - 测试用的USDT代币
2. **MockPancakeSwapFactory** - Mock DEX工厂合约
3. **MockPancakeSwapRouter** - Mock DEX路由合约
4. **LUKE** - LUKE代币合约
5. **LukeMain** - 主业务合约（质押、推荐等）
6. **LukeNode** - 节点管理合约
7. **LukeVault** - 金库合约
8. **LukeBurner** - 燃烧合约
9. **LPPair** - LUKE/USDT流动性池

## 测试账户

Anvil默认提供以下测试账户（每个账户有10000 ETH）：

- **Account 1**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account 2**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account 3**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

每个测试账户会自动获得 **100,000 USDT** 用于测试。

## 生成的配置文件

部署完成后，会生成以下文件：

### 1. `packages/sveltekit/src/lib/contracts/localContracts.ts`

包含所有合约地址的TypeScript配置文件：

```typescript
export const LOCAL_CONTRACT_ADDRESSES = {
  LUKE: "0x...",
  LukeMain: "0x...",
  LukeNode: "0x...",
  // ...
} as const;
```

### 2. `DEPLOYMENT_SUMMARY.md`

部署摘要文件，包含所有合约地址和测试账户信息。

### 3. `packages/foundry/deployments/31337.json`

Foundry部署结果文件。

## 在前端使用

### 1. 导入合约地址

```typescript
import { LOCAL_CONTRACT_ADDRESSES } from '$lib/contracts/localContracts.js';
```

### 2. 配置钱包连接

在钱包中连接到本地网络：
- **Network Name**: Local
- **RPC URL**: http://localhost:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

### 3. 使用合约地址

```typescript
// 在页面中使用
const lukeMainAddress = LOCAL_CONTRACT_ADDRESSES.LukeMain;
const lukeTokenAddress = LOCAL_CONTRACT_ADDRESSES.LUKE;
```

## 初始化数据

部署脚本会自动初始化以下数据：

1. **LP池**: 创建100万LUKE + 100万USDT的初始流动性池
2. **测试用户USDT**: 每个测试账户获得100,000 USDT
3. **代币开放时间**: 设置为当前区块时间

## 常见问题

### Q: 部署失败，提示"insufficient funds"

**A**: 确保本地链正在运行，并且deployer账户有足够的ETH。Anvil默认会给deployer账户10000 ETH。

### Q: 如何重置部署？

**A**: 
```bash
# 停止anvil
pkill anvil

# 删除部署文件
rm -rf packages/foundry/deployments/31337.json

# 重新部署
bun run deploy:local
```

### Q: 合约地址在哪里查看？

**A**: 
- 部署时控制台会输出所有地址
- `DEPLOYMENT_SUMMARY.md` 文件包含所有地址
- `packages/sveltekit/src/lib/contracts/localContracts.ts` 包含前端可用的地址

### Q: 如何添加更多测试数据？

**A**: 修改 `script/DeployLocal.s.sol` 中的 `_initializeTestData()` 函数，添加更多初始化逻辑。

### Q: 前端无法连接到本地链

**A**: 
1. 确保anvil正在运行：`curl http://localhost:8545`
2. 检查钱包网络配置是否正确（Chain ID: 31337）
3. 确保RPC URL是 `http://localhost:8545`

## 开发工作流

### 典型开发流程

1. **启动本地链**
   ```bash
   bun run chain
   ```

2. **部署合约**
   ```bash
   bun run deploy:local
   ```

3. **启动前端**
   ```bash
   bun run sveltekit
   ```

4. **测试功能**
   - 连接钱包到本地网络
   - 使用测试账户进行交互
   - 查看交易和状态变化

5. **修改合约后重新部署**
   ```bash
   # 重新编译
   bun run compile
   
   # 重新部署
   bun run deploy:local
   ```

## 脚本说明

### `script/DeployLocal.s.sol`

Solidity部署脚本，负责：
- 部署所有合约
- 配置合约间引用关系
- 创建初始LP池
- 初始化测试数据

### `scripts-js/deployLocal.js`

Node.js脚本，负责：
- 检查并启动本地链
- 调用Solidity部署脚本
- 生成前端配置文件
- 输出部署摘要

## 下一步

部署完成后，你可以：

1. ✅ 在前端连接钱包并测试质押功能
2. ✅ 测试代币交易功能
3. ✅ 测试节点购买功能
4. ✅ 测试团队推荐功能
5. ✅ 运行集成测试验证功能

查看 [FRONTEND_IMPLEMENTATION.md](./FRONTEND_IMPLEMENTATION.md) 了解前端功能实现详情。

