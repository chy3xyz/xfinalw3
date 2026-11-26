# xfinalw3

A modern Web3 development framework for building decentralized applications (dApps) on Ethereum.

## Overview

xfinalw3 is a Bun monorepo for shipping Ethereum dApps: Foundry contracts, Solid + `@wagmi/solid` user/admin UI, bponder indexer (with admin cookie auth), and Bun keepers. Application shells and API patterns are extracted from production MMM Solid/job/indexer code.

## Tech Stack

- **Frontend**: SolidStart + `@wagmi/solid` (Xfinalw3 dApp); SvelteKit kept as `bun start:svelte`
- **Smart Contracts**: Foundry (Solidity)
- **Web3**: Wagmi, Viem, Reown AppKit
- **Indexer**: [bponder](https://github.com/chy3xyz/bponder) (Bun-native Ponder fork)
- **Cron**: Bun
- **Package Manager**: Bun
- **Production**: `@sveltejs/adapter-bun`

## Features

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it
- 🪝 **Scaffold hooks**: `useScaffoldReadContract` / `useScaffoldWriteContract` on Solid
- 🖥️ **User + Admin shells**: `/` user app and `/mng` admin (cookie auth → indexer)
- 🧱 **UI wheels**: Button, Modal, Notify, AdminGuard/Sidebar/Pager, …
- 🔥 **Local Development**: Built-in local blockchain with Anvil
- 🔐 **Wallet Integration**: Connect to different wallet providers
- 🐛 **Debug Tools**: Built-in debug page and block explorer
- 📦 **Mock Contracts**: Pre-built mock contracts for testing

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.4.0
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, anvil)
- [bponder](https://github.com/chy3xyz/bponder) `1.0.8`（`bun install`；可选 `bun run bponder:install`）
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd xfinalw3

# Install dependencies + bponder CLI
bun install
bun run bponder:install
```

### Development Workflow

1. **Start local blockchain** (Terminal 1):
   ```bash
   bun chain
   ```

2. **Deploy contracts** (Terminal 2):
   ```bash
   bun deploy:local
   ```

3. **Start frontend** (Terminal 3):
   ```bash
   bun start
   ```

4. Visit `http://localhost:5173` and interact with your contracts!

## Project Structure

```
xfinalw3/
├── packages/
│   ├── foundry/          # Smart contracts (Solidity)
│   │   ├── contracts/    # Contract source files
│   │   ├── script/       # Deployment scripts
│   │   ├── test/         # Contract tests
│   │   └── scripts-js/   # JavaScript utilities
│   ├── solid/            # Xfinalw3 dApp (SolidStart + @wagmi/solid)
│   ├── landing/          # Framework marketing site (static)
│   ├── sveltekit/        # Legacy SvelteKit dApp (optional)
│   ├── indexer/          # bponder indexer
│   └── job/              # Cron / jobs
├── docs/                 # Documentation
└── .cursor/             # Cursor IDE rules and skills
```

## Available Commands

### Foundry (Smart Contracts)

- `bun chain` - Start local Anvil chain
- `bun compile` - Compile contracts
- `bun foundry:test` - Run contract tests
- `bun deploy:local` - Deploy to local chain
- `bun foundry:format` - Format Solidity code

### Frontend

- `bun start` - Start Solid dApp (vinxi :5173)
- `bun run build` - Build Solid dApp
- `bun start:prod` - Run Solid production server
- `bun start:svelte` - Legacy SvelteKit dApp
- `bun landing` - Framework site preview (`packages/landing` → :8931)
- `bun run slim:disk` — 清嵌套缓存 + Bun cache；共享依赖靠根 `node_modules`（catalog + hoisted）
- `bun run slim:disk:full` — 删除 `vendor/bponder` + sveltekit nests（索引器默认用 npm `bponder`）

### Other

- `bun indexer` - Start bponder indexer
- `bun run bponder:install` - Optional Release CLI + vendor sync (v1.0.8)
- `bun cron` - Start cron jobs (Bun)

## Documentation

- **[dev.md](./dev.md)** - Detailed development guide
- **[docs/DEPLOY_BUN.md](./docs/DEPLOY_BUN.md)** - Production deploy (`adapter-bun`)
- **[docs/ENV_MATRIX.md](./docs/ENV_MATRIX.md)** - Environment variables
- **[docs/DEPLOYER_KEYSTORE.md](./docs/DEPLOYER_KEYSTORE.md)** - Deployer keystore / private-key hygiene
- **[docs/BUN_DISK.md](./docs/BUN_DISK.md)** - Bun hoisted node_modules / catalog / slim disk
- **[docs/HEALTH.md](./docs/HEALTH.md)** - Health-check ports / paths
- **[docs/DEPLOY_LOCAL.md](./docs/DEPLOY_LOCAL.md)** - Local Anvil / contracts
- **[docs/ANVIL_SETUP.md](./docs/ANVIL_SETUP.md)** - Anvil setup
- **[docs/DEPLOY_STATIC.md](./docs/DEPLOY_STATIC.md)** - Archived static/Nginx notes

## Example Contract

The framework includes a simple `Counter` contract as an example. You can find it at:
- Contract: `packages/foundry/contracts/Counter.sol`
- Test: `packages/foundry/test/Counter.t.sol`

## Contributing

Contributions are welcome! Please see our contributing guidelines for more information.

## License

MIT
