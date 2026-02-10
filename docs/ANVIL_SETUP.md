# 本地 Anvil 链配置指南

本文档说明如何配置前端连接本地 Anvil 链进行测试。

## 配置说明

### 1. RPC 配置

已在 `scaffold.config.ts` 中配置了本地 Anvil 链的 RPC URL：

```typescript
rpcOverrides: {
  [chains.foundry.id]: "http://127.0.0.1:8545", // Anvil 默认端口
}
```

### 2. 网络配置

- **链 ID**: 31337 (Foundry/Anvil 默认)
- **RPC URL**: `http://127.0.0.1:8545`
- **默认网络**: Foundry (已在 `scaffold.config.ts` 中设置为 `targetNetworks`)

## 使用步骤

### 1. 启动本地 Anvil 链

在项目根目录运行：

```bash
bun chain
```

或者直接使用 foundry 命令：

```bash
anvil
```

Anvil 默认会在 `http://127.0.0.1:8545` 启动。

### 2. 部署合约到本地链

```bash
bun deploy:local
```

这会：
- 自动检测并启动 Anvil（如果未运行）
- 部署所有 LUKE 协议合约
- 配置合约间的引用关系
- 生成 `localContracts.ts` 供前端使用

### 3. 启动前端

```bash
bun start
```

或者：

```bash
cd packages/sveltekit
bun dev
```

前端会在 `http://localhost:5173` 启动。

### 4. 连接钱包

1. 打开浏览器访问 `http://localhost:5173`
2. 点击 "Connect Wallet" 按钮
3. 选择钱包（MetaMask 等）
4. 如果钱包未添加本地网络，需要手动添加：
   - **网络名称**: Foundry
   - **RPC URL**: `http://127.0.0.1:8545`
   - **链 ID**: `31337`
   - **货币符号**: `ETH`

### 5. 导入测试账户

Anvil 启动时会显示测试账户和私钥，例如：

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

可以将这些账户导入到 MetaMask 进行测试。

## 配置选项

### 自定义 Anvil 端口

如果 Anvil 运行在不同端口，修改 `scaffold.config.ts`：

```typescript
rpcOverrides: {
  [chains.foundry.id]: "http://127.0.0.1:YOUR_PORT",
}
```

### 环境变量

可以通过环境变量覆盖配置（在 `.env` 文件中）：

```env
VITE_ANVIL_RPC_URL=http://127.0.0.1:8545
```

## 故障排除

### 问题：无法连接到 Anvil

1. **检查 Anvil 是否运行**：
   ```bash
   curl http://127.0.0.1:8545
   ```

2. **检查端口是否被占用**：
   ```bash
   lsof -i :8545
   ```

3. **检查浏览器控制台**：查看是否有 RPC 连接错误

### 问题：钱包无法切换到本地网络

1. 手动在钱包中添加网络（见步骤 4）
2. 确保链 ID 是 `31337`
3. 确保 RPC URL 正确

### 问题：交易失败

1. 确保账户有足够的 ETH（Anvil 默认每个账户有 10000 ETH）
2. 检查合约是否已正确部署
3. 查看浏览器控制台的错误信息

## 测试账户

Anvil 默认创建 10 个测试账户，每个账户有 10000 ETH。这些账户的私钥在 Anvil 启动时显示。

## 注意事项

- Anvil 是临时链，重启后所有数据会丢失
- 本地链的区块时间非常快（几乎即时）
- 不需要 Gas 费用（可以设置为 0）
- 适合快速开发和测试

