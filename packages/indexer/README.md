# Indexer

使用 Ponder 构建的区块链索引器，支持自定义 API 端点（参考 [feature-api-functions 示例](https://github.com/ponder-sh/ponder/tree/main/examples/feature-api-functions)）。

## 快速开始

### 安装依赖

在项目根目录运行：

```bash
bun install
```

### 配置环境变量

创建 `.env` 文件并配置：

```bash
cd packages/indexer
cp .env.example .env  # 如果存在的话
```

编辑 `.env` 文件，设置你的 RPC URL：

```env
PONDER_RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### 生成类型定义

在添加合约到 `ponder.config.ts` 后，运行：

```bash
bun indexer:codegen
```

这将生成 Ponder 的类型定义（`ponder:registry`, `ponder:api`, `ponder:schema` 等）。

### 运行索引器

从项目根目录运行：

```bash
bun indexer
```

或者直接进入 indexer 目录：

```bash
cd packages/indexer
bun dev
```

## 可用命令

- `bun indexer` - 启动开发服务器（包含索引器和 API 服务器）
- `bun indexer:build` - 构建索引器
- `bun indexer:codegen` - 生成类型定义（在添加合约后运行）
- `bun indexer:db` - 数据库管理命令
- `bun indexer:serve` - 仅启动 API 服务器（不运行索引器）

## 项目结构

```
packages/indexer/
├── src/
│   ├── api/
│   │   └── index.ts      # Hono API 服务器（自定义端点）
│   └── index.ts          # 索引逻辑（事件处理）
├── abis/                 # 合约 ABI 文件
├── ponder.config.ts      # Ponder 配置（链、合约等）
└── package.json
```

## API 端点

API 服务器默认运行在 `http://localhost:42069`。

- `GET /graphql` - GraphQL 端点（自动生成）
- `GET /health` - 健康检查
- `GET /count` - 示例端点（需要根据你的 schema 更新）

## 配置

1. **添加合约**：编辑 `ponder.config.ts`，在 `contracts` 中添加要索引的合约
2. **定义 Schema**：运行 `bun indexer:codegen` 后，在 `src/index.ts` 中使用 `ponder:schema` 定义数据库表
3. **编写索引逻辑**：在 `src/index.ts` 中使用 `ponder.on()` 处理合约事件
4. **添加 API 端点**：在 `src/api/index.ts` 中使用 Hono 添加自定义 API 端点

## 更多信息

查看 [Ponder 文档](https://ponder.sh) 和 [API Functions 示例](https://github.com/ponder-sh/ponder/tree/main/examples/feature-api-functions) 了解更多信息。

