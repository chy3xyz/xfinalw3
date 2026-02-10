---
name: sveltekit-development
description: Handles SvelteKit frontend development workflows including starting dev server, building, contract interactions, and debugging. Use when developing the frontend, interacting with smart contracts, debugging UI issues, or working with Svelte components.
---

# SvelteKit 前端开发工作流

## 快速命令参考

### 开发流程

```bash
# 1. 启动开发服务器
bun start
# 或
cd packages/sveltekit && bun dev

# 2. 构建生产版本
cd packages/sveltekit && bun run build

# 3. 预览生产构建
cd packages/sveltekit && bun run preview

# 4. 类型检查
cd packages/sveltekit && bun run check
```

## 完整开发工作流

### 1. 启动开发环境

**前置条件**：
- 本地链已启动：`bun chain`
- 合约已部署：`bun deploy:local`

**启动开发服务器**：
```bash
bun start
# 或
cd packages/sveltekit && bun dev
```

访问：`http://localhost:5173`

开发服务器会自动：
- 检测本地 IP 地址
- 启动 Vite 开发服务器
- 启用热重载

### 2. 合约交互开发

#### 读取合约数据

**必须使用** `createScaffoldReadContractStore`：

```typescript
import { createScaffoldReadContractStore } from '$lib/stores/scaffoldReadContract.js';

const countStore = createScaffoldReadContractStore({
  contractName: "Counter",
  functionName: "getCount",
  watch: true, // 自动监听更新
});

// 在模板中使用
{#if $countStore?.data}
  <p>Count: {$countStore.data}</p>
{/if}
```

#### 写入合约数据

**必须使用** `createScaffoldWriteContractStore`：

```typescript
import { createScaffoldWriteContractStore } from '$lib/stores/scaffoldWriteContract.js';
import { parseEther } from 'viem';
import { notification } from '$lib/utils/notification.js';

const writeStore = createScaffoldWriteContractStore({
  contractName: "Counter"
});

// 提取 isMining store 用于响应式订阅
const isMiningStore = writeStore.isMining;

async function handleIncrement() {
  try {
    await writeStore.writeContractAsync({
      functionName: "increment",
    });
    notification.success("Success!");
  } catch (error) {
    notification.error("Failed");
  }
}

// 在模板中使用
{#if $isMiningStore}
  <p>处理中...</p>
{/if}
```

#### 监听合约事件

```typescript
import { createScaffoldEventHistoryStore } from '$lib/stores/scaffoldEventHistory.js';

const eventStore = createScaffoldEventHistoryStore({
  contractName: "Counter",
  eventName: "CountUpdated",
  watch: true,
});

// 在模板中显示
{#if $eventStore.data}
  {#each $eventStore.data as event (event.logIndex)}
    <div>New Count: {event.args.newCount}</div>
  {/each}
{/if}
```

### 3. 组件开发

#### 创建新页面

在 `src/routes/` 目录下创建：

```svelte
<!-- src/routes/my-page/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  
  // Svelte 5 语法
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  function increment() {
    count++;
  }
</script>

<svelte:head>
  <title>我的页面</title>
</svelte:head>

<div>
  <h1>计数: {count}</h1>
  <p>双倍: {doubled}</p>
  <Button on:click={increment}>增加</Button>
</div>
```

#### 使用 UI 组件

项目使用 shadcn-svelte，组件位于 `$lib/components/ui/`：

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
</script>

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="输入..." bind:value={inputValue} />
    <Button on:click={handleSubmit}>提交</Button>
  </CardContent>
</Card>
```

### 4. 钱包连接

#### 检查钱包连接

```typescript
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { getAccount } from '@wagmi/core';
import { wagmiContextStore } from '$lib/contexts/wagmi.js';

let account: ReturnType<typeof getAccount> | null = null;
let isConnected = false;

if (browser) {
  try {
    const { config } = get(wagmiContextStore);
    if (config) {
      account = getAccount(config);
      isConnected = account?.isConnected ?? false;
      if (isConnected && account.address) {
        console.log('已连接:', account.address);
      }
    }
  } catch {
    account = null;
    isConnected = false;
  }
}
```

#### 钱包连接按钮

```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import { getAccount } from '@wagmi/core';
  import { wagmiContextStore } from '$lib/contexts/wagmi.js';
  import WalletConnectButton from '$lib/components/WalletConnectButton.svelte';
  
  let account: ReturnType<typeof getAccount> | null = null;
  let isConnected = false;
  
  if (browser) {
    try {
      const { config } = get(wagmiContextStore);
      if (config) {
        account = getAccount(config);
        isConnected = account?.isConnected ?? false;
      }
    } catch {
      account = null;
      isConnected = false;
    }
  }
</script>

{#if isConnected && account?.address}
  <p>已连接钱包: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>
{:else}
  <WalletConnectButton />
{/if}
```

### 5. 错误处理

#### 合约错误处理

```typescript
import { notification } from '$lib/utils/notification.js';

try {
  await writeStore.writeContractAsync({
    functionName: "increment",
  });
  notification.success("Success!");
} catch (error: any) {
  notification.error(error?.message || "Failed");
}
```

### 6. 类型安全

#### 使用合约类型

```typescript
import { contracts } from '$lib/utils/contract.js';
import type { ContractName, ContractAbi } from '$lib/utils/contract.js';
import type { Address } from 'viem';

function processContract(
  contractName: ContractName,
  address: Address
) {
  const contract = contracts?.[chainId]?.[contractName];
  // 类型安全
}
```

## 项目结构

```
packages/sveltekit/
├── src/
│   ├── lib/
│   │   ├── components/      # 组件
│   │   │   ├── ui/          # shadcn-svelte UI 组件
│   │   │   ├── Header.svelte          # 顶部导航
│   │   │   ├── BottomNav.svelte       # 底部导航
│   │   │   ├── EarthAnimation.svelte   # 地球动画
│   │   │   ├── AnnouncementBanner.svelte # 通告横幅
│   │   │   ├── InviteFriend.svelte     # 邀请好友示例
│   │   │   └── ...          # 其他组件
│   │   ├── stores/          # Svelte stores
│   │   ├── utils/           # 工具函数
│   │   └── contracts/       # 合约定义（自动生成）
│   ├── routes/              # 页面路由
│   │   ├── +layout.svelte   # 布局（包含 Header、BottomNav、Toast）
│   │   ├── +page.svelte     # 首页（地球动画、Counter示例、邀请好友）
│   │   ├── debug/           # Debug 页面
│   │   └── blockexplorer/   # 区块浏览器页面
│   └── app.css              # 全局样式（暗色主题）
├── scaffold.config.ts       # 项目配置
└── components.json          # shadcn-svelte 配置
```

## 配置

### scaffold.config.ts

编辑 `packages/sveltekit/scaffold.config.ts` 配置目标网络：

```typescript
const scaffoldConfig = {
  targetNetworks: [chains.foundry], // 本地链
  pollingInterval: 30000, // 轮询间隔（毫秒）
  alchemyApiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
  walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;
```

### 环境变量

创建 `packages/sveltekit/.env`：

```env
VITE_ALCHEMY_API_KEY=your-api-key
VITE_WALLET_CONNECT_PROJECT_ID=your-project-id
```

## 常用 Stores

项目提供的专用 stores：

- `createScaffoldReadContractStore` - 读取合约
- `createScaffoldWriteContractStore` - 写入合约
- `createScaffoldEventHistoryStore` - 事件历史
- `createDeployedContractStore` - 部署的合约信息
- `createScaffoldContractStore` - 合约配置

## 首页组件

首页 (`+page.svelte`) 包含以下示例组件：

- **AnnouncementBanner**: 滚动通告横幅，可关闭
- **EarthAnimation**: SVG 动画地球组件，展示框架品牌
- **Counter 合约示例**: 完整的合约交互示例（读取、写入）
- **InviteFriend**: 邀请好友功能示例组件
- **Quick Start**: 快速开始指南

这些组件可作为开发参考，展示如何：
- 使用合约 stores
- 处理钱包连接状态
- 使用 shadcn-svelte UI 组件
- 实现响应式交互

## 调试

### Debug 页面

访问 `http://localhost:5173/debug` 可以：
- 查看所有已部署合约
- 调用合约函数
- 查看合约状态

### 浏览器控制台

开发时检查：
- 钱包连接状态
- 合约调用结果
- 错误信息

### 类型检查

```bash
cd packages/sveltekit
bun run check
# 或
bun run check:watch  # 监视模式
```

## 构建和部署

### 构建生产版本

```bash
cd packages/sveltekit
bun run build
```

构建输出在 `build/` 目录。

### 预览构建

```bash
cd packages/sveltekit
bun run preview
```

### 静态部署

项目支持静态部署（IPFS/Vercel），参考 `DEPLOY_STATIC.md`。

## 常见任务

### 添加新页面

1. 在 `src/routes/` 创建新目录
2. 添加 `+page.svelte` 文件
3. 如需布局，添加 `+layout.svelte`

### 添加新组件

1. 业务组件放在 `src/lib/components/`
2. UI 组件使用 shadcn-svelte：`bunx shadcn-svelte@latest add button`

### 更新合约定义

合约部署后，TypeScript 定义会自动更新。如果未更新：

```bash
cd packages/foundry
node scripts-js/generateTsAbis.js
```

### 样式开发

项目使用 Tailwind CSS：

```svelte
<div class="flex items-center gap-4 p-4 bg-card rounded-lg">
  <!-- 内容 -->
</div>
```

主题变量在 `src/app.css` 中定义。

## 故障排除

### 开发服务器无法启动

1. 检查端口 5173 是否被占用
2. 确保在项目根目录或 sveltekit 目录运行
3. 检查 Node.js 版本：`node --version`（需要 >= 20.18.3）

### 合约交互失败

1. 确保本地链运行：`curl http://localhost:8545`
2. 确保合约已部署：检查 `packages/foundry/deployments/31337.json`
3. 检查钱包是否连接到本地网络（Chain ID: 31337）

### 类型错误

1. 运行类型检查：`bun run check`
2. 确保合约定义已更新：`bun deploy:local`
3. 重启 TypeScript 服务器

### 样式不生效

1. 确保 Tailwind 配置正确：`tailwind.config.js`
2. 检查 `src/app.css` 是否正确导入
3. 重启开发服务器

## 最佳实践

1. **合约交互**：
   - 始终使用项目提供的 stores
   - 不要直接使用 wagmi hooks
   - 正确处理错误和加载状态

2. **组件开发**：
   - 使用 Svelte 5 语法（`$state`, `$derived`, `$effect`）
   - 组件化，保持单一职责
   - 使用 TypeScript 类型

3. **性能优化**：
   - 使用 `$derived` 避免不必要的计算
   - 条件渲染优化（`{#if}`）
   - 避免在 SSR 中访问浏览器 API

4. **代码质量**：
   - 运行类型检查：`bun run check`
   - 格式化代码：`bun run format`
   - 遵循项目代码规范

## 更多示例

查看 [examples.md](examples.md) 了解常见开发场景的详细代码示例。
