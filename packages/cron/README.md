# Cron Jobs

基于 Bun 的定时任务服务，用于定时执行智能合约的读写操作。

## 功能特性

- ✅ 基于 `node-cron` 的定时任务调度
- ✅ 使用 `viem` 与智能合约交互
- ✅ 支持读取和写入合约操作
- ✅ 环境变量配置
- ✅ 日志记录
- ✅ TypeScript 支持

## 快速开始

### 安装依赖

在项目根目录运行：

```bash
bun install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cd packages/cron
cp .env.example .env
```

编辑 `.env` 文件：

```env
PRIVATE_KEY=0x你的私钥
RPC_URL=http://localhost:8545
CHAIN_ID=31337
CONTRACT_ADDRESS=0x你的合约地址
```

### 运行定时任务

从项目根目录运行：

```bash
bun cron
```

或者直接进入 cron 目录：

```bash
cd packages/cron
bun dev
```

## 项目结构

```
packages/cron/
├── src/
│   ├── index.ts              # 主入口文件，定义定时任务
│   ├── jobs/
│   │   └── contract-job.ts  # 合约交互任务
│   ├── types/
│   │   └── config.ts        # 类型定义
│   └── utils/
│       └── logger.ts         # 日志工具
├── .env.example             # 环境变量示例
└── package.json
```

## 配置定时任务

在 `src/index.ts` 中配置 cron 表达式：

```typescript
// 每分钟执行
cron.schedule("* * * * *", async () => {
  await contractJob.execute();
});

// 每5分钟执行
cron.schedule("*/5 * * * *", async () => {
  await contractJob.readContractData();
});

// 每天凌晨2点执行
cron.schedule("0 2 * * *", async () => {
  await contractJob.dailyTask();
});
```

### Cron 表达式格式

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── 星期几 (0-7, 0 或 7 是星期日)
│ │ │ └───── 月份 (1-12)
│ │ └─────── 日期 (1-31)
│ └───────── 小时 (0-23)
└─────────── 分钟 (0-59)
```

## 自定义合约交互

### 1. 更新合约 ABI

在 `src/jobs/contract-job.ts` 中更新 `EXAMPLE_CONTRACT_ABI`：

```typescript
const YOUR_CONTRACT_ABI = [
  {
    inputs: [],
    name: "yourFunction",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // ... 更多函数
] as const;
```

### 2. 添加自定义方法

在 `ContractJob` 类中添加新方法：

```typescript
async yourCustomMethod() {
  // 读取操作
  const result = await this.publicClient.readContract({
    address: this.contractAddress,
    abi: YOUR_CONTRACT_ABI,
    functionName: "yourFunction",
  });

  // 写入操作
  const hash = await this.writeContractData(/* ... */);
}
```

### 3. 在定时任务中调用

在 `src/index.ts` 中添加新的定时任务：

```typescript
cron.schedule("*/10 * * * *", async () => {
  await contractJob.yourCustomMethod();
});
```

## 安全注意事项

⚠️ **重要**：

1. **永远不要提交私钥到版本控制**
   - 确保 `.env` 在 `.gitignore` 中
   - 使用环境变量或密钥管理服务

2. **使用测试网络进行开发**
   - 在主网使用前充分测试
   - 使用测试账户和测试代币

3. **限制私钥权限**
   - 只给定时任务所需的最小权限
   - 考虑使用多签钱包

4. **监控和告警**
   - 设置交易失败告警
   - 监控账户余额
   - 记录所有交易

## 示例：检查余额

```typescript
// 在定时任务中检查余额
cron.schedule("*/30 * * * *", async () => {
  const balance = await contractJob.getBalance();
  const balanceInEth = Number(balance) / 1e18;
  
  if (balanceInEth < 0.01) {
    logger.warn(`Low balance: ${balanceInEth} ETH`);
  }
});
```

## 调试

启用调试模式：

```bash
DEBUG=true bun cron
```

## 更多信息

- [node-cron 文档](https://github.com/node-cron/node-cron)
- [viem 文档](https://viem.sh)
- [Cron 表达式生成器](https://crontab.guru)

