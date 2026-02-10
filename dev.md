# xfinalw3 Development Guide

This document provides a comprehensive guide for developing with xfinalw3 framework.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Common Commands](#common-commands)
- [Deployment Workflow](#deployment-workflow)
- [Testing Guide](#testing-guide)
- [Frontend Development](#frontend-development)
- [Scripts Reference](#scripts-reference)
- [Development Rules](#development-rules)

## Development Environment Setup

### Prerequisites

Ensure you have the following installed:

```bash
# Check Node.js version (>= 20.18.3)
node --version

# Check Bun version
bun --version

# Check Foundry
forge --version
anvil --version
```

### Initial Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Configure environment variables** (if needed):
   ```bash
   cd packages/sveltekit
   cp .env.example .env
   # Edit .env with your API keys
   ```

## Common Commands

### Foundry Commands

```bash
# Start local blockchain
bun chain

# Compile contracts
bun compile

# Run tests
bun foundry:test

# Deploy to local chain
bun deploy:local

# Format Solidity code
bun foundry:format

# Clean build artifacts
bun foundry:clean
```

### Frontend Commands

```bash
# Start development server
bun start

# Build for production
cd packages/sveltekit && bun run build

# Preview production build
cd packages/sveltekit && bun run preview

# Type check
cd packages/sveltekit && bun run check
```

### Account Management

```bash
# Generate new account
bun account:generate

# Import account
bun account:import

# Reveal private key
bun account:reveal-pk
```

## Deployment Workflow

### Local Development

1. **Start local chain**:
   ```bash
   bun chain
   ```
   This starts Anvil on `http://localhost:8545` (Chain ID: 31337)

2. **Deploy contracts**:
   ```bash
   bun deploy:local
   ```
   This will:
   - Check if local chain is running (start if not)
   - Deploy all contracts
   - Generate TypeScript contract definitions
   - Save deployment addresses

3. **Verify deployment**:
   Check `packages/foundry/deployments/31337.json` for deployed addresses

### Production Deployment

1. **Configure network** in `packages/foundry/foundry.toml`

2. **Deploy**:
   ```bash
   bun deploy --network <network-name>
   ```

3. **Verify contracts** (optional):
   ```bash
   bun foundry:verify <network-name>
   ```

## Testing Guide

### Writing Tests

Tests are located in `packages/foundry/test/`. Use Forge's testing framework:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../contracts/Counter.sol";

contract CounterTest is Test {
    Counter counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.getCount(), 1);
    }
}
```

### Running Tests

```bash
# Run all tests
bun foundry:test

# Run specific test file
forge test --match-path test/Counter.t.sol

# Run with verbose output
forge test -vvv

# Run with gas reporting
forge test --gas-report
```

## Frontend Development

### Contract Interactions

xfinalw3 provides type-safe stores for contract interactions:

#### Reading from Contracts

```typescript
import { createScaffoldReadContractStore } from '$lib/stores/scaffoldReadContract.js';

const countStore = createScaffoldReadContractStore({
  contractName: "Counter",
  functionName: "getCount",
  watch: true, // Auto-refresh on block updates
});

// In template
{#if $countStore?.data}
  <p>Count: {$countStore.data}</p>
{/if}
```

#### Writing to Contracts

```typescript
import { createScaffoldWriteContractStore } from '$lib/stores/scaffoldWriteContract.js';

const writeStore = createScaffoldWriteContractStore({
  contractName: "Counter"
});

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
```

#### Listening to Events

```typescript
import { createScaffoldEventHistoryStore } from '$lib/stores/scaffoldEventHistory.js';

const eventStore = createScaffoldEventHistoryStore({
  contractName: "Counter",
  eventName: "CountUpdated",
  watch: true,
});
```

### Available Stores

- `createScaffoldReadContractStore` - Read contract data
- `createScaffoldWriteContractStore` - Write to contracts
- `createScaffoldEventHistoryStore` - Listen to events
- `createDeployedContractStore` - Get deployed contract info
- `createScaffoldContractStore` - Contract configuration

### UI Components

The framework uses shadcn-svelte for UI components:

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
</script>

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Click me</Button>
  </CardContent>
</Card>
```

## Scripts Reference

### Foundry Scripts

Located in `packages/foundry/scripts-js/`:

- `generateTsAbis.js` - Generate TypeScript contract definitions
- `generateKeystore.js` - Generate keystore files
- `deployLocal.js` - Local deployment helper
- `importAccount.js` - Import account from private key
- `revealPK.js` - Reveal private key from keystore

### Usage

```bash
# Generate TypeScript definitions
cd packages/foundry
node scripts-js/generateTsAbis.js

# Generate keystore
node scripts-js/generateKeystore.js
```

### Deployment Scripts

Deployment scripts are located in `packages/foundry/script/`:

#### Example: Deploy.s.sol

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/Counter.sol";

contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy Counter contract as example
        Counter counter = new Counter();
        addDeployment("Counter", address(counter));
    }
}
```

#### Example: DeployLocal.s.sol

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/Counter.sol";

contract DeployLocalScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy Counter contract as example
        Counter counter = new Counter();
        addDeployment("Counter", address(counter));
    }
}
```

#### Adding Your Own Contracts

To deploy your own contracts, modify the deployment scripts:

```solidity
contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy your contracts
        YourContract yourContract = new YourContract();
        addDeployment("YourContract", address(yourContract));
        
        // Deploy contracts that depend on others
        DependentContract dependent = new DependentContract(address(yourContract));
        addDeployment("DependentContract", address(dependent));
    }
}
```

After deployment, run `node scripts-js/generateTsAbis.js` to generate TypeScript definitions for the frontend.

## Development Rules

### Solidity Best Practices

1. **Use SPDX License Identifier**:
   ```solidity
   // SPDX-License-Identifier: MIT
   ```

2. **Follow Naming Conventions**:
   - Interfaces: `I` prefix (e.g., `ICounter`)
   - Private/internal: `_` prefix (e.g., `_count`)
   - Constants: `UPPER_SNAKE_CASE`

3. **Security**:
   - Use `ReentrancyGuard` for external calls
   - Use `SafeERC20` for token transfers
   - Validate inputs with `require`
   - Use `AccessControl` for permissions

4. **Events**:
   - Emit events after state changes
   - Use past tense for event names

### Frontend Best Practices

1. **Always use framework stores** for contract interactions
2. **Handle loading and error states**:
   ```svelte
   {#if $store.isLoading}
     <Skeleton />
   {:else if $store.error}
     <ErrorDisplay />
   {:else}
     <Content />
   {/if}
   ```

3. **Use TypeScript types** from `$lib/utils/contract.js`

4. **Check browser environment**:
   ```typescript
   import { browser } from '$app/environment';
   if (browser) {
     // Browser-only code
   }
   ```

### Code Style

- **Solidity**: Use `forge fmt` (configured in `foundry.toml`)
- **TypeScript/Svelte**: Use Prettier (configured in project)
- **Line length**: 120 characters for Solidity, 100 for TypeScript

## Troubleshooting

### Contracts not compiling

```bash
# Clean and rebuild
bun foundry:clean
bun compile
```

### Frontend not updating

```bash
# Regenerate contract types
cd packages/foundry
node scripts-js/generateTsAbis.js

# Restart dev server
bun start
```

### Local chain issues

```bash
# Check if Anvil is running
curl http://localhost:8545

# Kill existing Anvil process
pkill -f anvil

# Restart
bun chain
```

### Type errors

```bash
# Regenerate types
cd packages/foundry
node scripts-js/generateTsAbis.js

# Check TypeScript
cd packages/sveltekit
bun run check
```

## Additional Resources

- [Foundry Book](https://book.getfoundry.sh)
- [SvelteKit Docs](https://kit.svelte.dev)
- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)

## Getting Help

- Check existing documentation in `docs/` directory
- Review example contract (`Counter.sol`) and tests
- Check `.cursor/rules/` for development guidelines
