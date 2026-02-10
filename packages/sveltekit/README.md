# SvelteKit Frontend

使用 SvelteKit 构建的 Web3 前端应用，功能与 NextJS 版本相同。

## 功能特性

- ✅ SvelteKit + TypeScript
- ✅ Wagmi + Reown AppKit 集成（原生 Svelte 支持）
- ✅ TailwindCSS 样式
- ✅ 合约交互（读取和写入）
- ✅ Debug Contracts 页面
- ✅ Block Explorer 页面
- ✅ 响应式设计

## 快速开始

### 安装依赖

在项目根目录运行：

```bash
bun install
```

### 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
cd packages/sveltekit
cp .env.example .env
```

编辑 `.env` 文件，设置你的 Reown AppKit Project ID：

```env
VITE_PROJECT_ID=your-project-id-here
```

**获取 Project ID**：访问 [Reown Dashboard](https://dashboard.reown.com) 创建新项目并获取 Project ID。

### 运行开发服务器

从项目根目录运行：

```bash
bun sveltekit
```

或者直接进入 sveltekit 目录：

```bash
cd packages/sveltekit
bun dev
```

访问 `http://localhost:5173` 查看应用。

## 项目结构

```
packages/sveltekit/
├── src/
│   ├── lib/
│   │   ├── components/      # 可复用组件
│   │   ├── config/         # Wagmi 配置
│   │   ├── stores/         # Svelte stores
│   │   └── utils/          # 工具函数
│   ├── routes/             # 页面路由
│   │   ├── +layout.svelte  # 布局组件
│   │   ├── +page.svelte    # 首页
│   │   ├── debug/          # Debug 页面
│   │   └── blockexplorer/  # Block Explorer 页面
│   └── app.css             # 全局样式
├── scaffold.config.ts      # 项目配置
└── package.json
```

## 可用命令

- `bun sveltekit` - 启动开发服务器
- `bun sveltekit:build` - 构建生产版本
- `bun sveltekit:preview` - 预览生产构建

## 配置

编辑 `scaffold.config.ts` 来配置目标网络和其他设置。

## AppKit 集成

本项目使用 [Reown AppKit](https://docs.reown.com/appkit)（原 WalletConnect AppKit）来替代 RainbowKit，因为 AppKit 原生支持 Svelte。

### 使用 AppKit Web Components

AppKit 提供了 Web Components，可以直接在 Svelte 模板中使用：

```svelte
<!-- 连接钱包按钮 -->
<appkit-button />

<!-- 其他可用的组件 -->
<appkit-connect-button />
<appkit-account-button />
<appkit-network-button />
```

### 程序化调用

你也可以通过 AppKit 实例程序化地打开模态框：

```svelte
<script lang="ts">
  import { appKit } from '$lib/appkit';

  function openModal() {
    appKit?.open();
  }

  function openConnectModal() {
    appKit?.open({ view: 'Connect' });
  }
</script>

<button on:click={openModal}>打开钱包</button>
```

## 与 NextJS 版本的差异

- 使用 SvelteKit 的路由系统（基于文件系统）
- 使用 Svelte stores 而不是 React hooks
- 使用 `@tanstack/svelte-query` 而不是 `@tanstack/react-query`
- 使用 Reown AppKit 而不是 RainbowKit（原生 Svelte 支持）
- 使用 Vite 而不是 Next.js 的构建系统

## 更多信息

查看 [SvelteKit 文档](https://kit.svelte.dev) 了解更多信息。
