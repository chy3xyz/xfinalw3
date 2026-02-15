# xfinalw3

A modern Web3 development framework for building decentralized applications (dApps) on Ethereum.

## Overview

xfinalw3 is a comprehensive toolkit that provides everything you need to build, test, and deploy smart contracts with a modern frontend. It combines the power of Foundry for Solidity development with SvelteKit for the frontend, offering a seamless development experience.

## Tech Stack

- **Frontend**: SvelteKit + Svelte 5, TypeScript, TailwindCSS
- **Smart Contracts**: Foundry (Solidity)
- **Web3**: Wagmi, Viem, Reown AppKit
- **Indexer**: Ponder.sh
- **Cron**: bun cron
- **Package Manager**: Bun (recommended) or pnpm

## Features

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it
- 🪝 **Type-Safe Stores**: Collection of Svelte stores wrapper around Wagmi to simplify contract interactions
- 🧱 **Pre-built Components**: Common Web3 components for quick frontend development
- 🔥 **Local Development**: Built-in local blockchain with Anvil
- 🔐 **Wallet Integration**: Connect to different wallet providers
- 🐛 **Debug Tools**: Built-in debug page and block explorer
- 📦 **Mock Contracts**: Pre-built mock contracts for testing

## Quick Start

### Prerequisites

- Node.js >= 20.18.3
- Package Manager: [Bun](https://bun.sh) (recommended) or [pnpm](https://pnpm.io/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, anvil)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd xfinalw3

# Install dependencies (choose one)
bun install
# or
pnpm install
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
│   ├── sveltekit/        # Frontend application
│   │   ├── src/
│   │   │   ├── routes/   # SvelteKit routes
│   │   │   └── lib/      # Shared libraries
│   │   └── scaffold.config.ts
│   ├── indexer/          # Ponder indexer
│   └── cron/            # Cron jobs
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

- `bun start` - Start development server
- `bun sveltekit:build` - Build for production
- `bun sveltekit:preview` - Preview production build

### Other

- `bun indexer` - Start Ponder indexer
- `bun cron` - Start cron jobs

## Documentation

- **[dev.md](./dev.md)** - Detailed development guide
- **[docs/DEPLOY_LOCAL.md](./docs/DEPLOY_LOCAL.md)** - Local deployment guide
- **[docs/ANVIL_SETUP.md](./docs/ANVIL_SETUP.md)** - Anvil setup guide

## Example Contract

The framework includes a simple `Counter` contract as an example. You can find it at:
- Contract: `packages/foundry/contracts/Counter.sol`
- Test: `packages/foundry/test/Counter.t.sol`

## Contributing

Contributions are welcome! Please see our contributing guidelines for more information.

## License

MIT
