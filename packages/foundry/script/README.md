# Deployment Scripts

This directory contains Foundry deployment scripts for deploying contracts to various networks.

## Scripts Overview

- `Deploy.s.sol` - Main deployment script (used by `bun deploy`)
- `DeployLocal.s.sol` - Local development deployment (used by `bun deploy:local`)
- `DeployHelpers.s.sol` - Base class with deployment utilities
- `VerifyAll.s.sol` - Contract verification script

## Quick Start

### Deploy to Local Chain

```bash
bun deploy:local
```

This will:
1. Start Anvil if not running
2. Deploy contracts using `DeployLocal.s.sol`
3. Generate TypeScript definitions
4. Save deployment addresses

### Deploy to Testnet/Mainnet

```bash
bun deploy --network sepolia
```

## Writing Deployment Scripts

### Basic Structure

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/YourContract.sol";

contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy your contract
        YourContract contract = new YourContract();
        addDeployment("YourContract", address(contract));
    }
}
```

### Deploying Multiple Contracts

```solidity
contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy first contract
        Token token = new Token();
        addDeployment("Token", address(token));
        
        // Deploy contract that depends on Token
        Vault vault = new Vault(address(token));
        addDeployment("Vault", address(vault));
        
        // Configure contracts
        token.setVault(address(vault));
    }
}
```

### Using Constructor Parameters

```solidity
contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        address owner = deployer; // deployer is set by ScaffoldEthDeployerRunner
        
        MyContract contract = new MyContract(
            owner,
            1000, // some parameter
            "Name" // string parameter
        );
        addDeployment("MyContract", address(contract));
    }
}
```

### Deploying Upgradeable Contracts (UUPS)

```solidity
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy implementation
        MyUpgradeableContract impl = new MyUpgradeableContract();
        
        // Deploy proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            MyUpgradeableContract.initialize.selector,
            param1,
            param2
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        
        addDeployment("MyContract", address(proxy));
        addDeployment("MyContractImplementation", address(impl));
    }
}
```

## DeployHelpers Features

The `ScaffoldETHDeploy` base class provides:

- `deployer` - The deployer address (automatically set)
- `addDeployment(string name, address addr)` - Register a deployment
- Automatic deployment export to `deployments/{chainId}.json`
- Automatic balance setup for Anvil (local chain)

## Running Scripts

### Using Forge Directly

```bash
# Local deployment
forge script script/DeployLocal.s.sol:DeployLocalScript \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --slow

# Testnet deployment
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --slow
```

### Using NPM Scripts

```bash
# Local
bun deploy:local

# Production (requires network configuration)
bun deploy --network sepolia
```

## After Deployment

After deploying, run:

```bash
cd packages/foundry
node scripts-js/generateTsAbis.js
```

This generates TypeScript contract definitions for the frontend at:
`packages/sveltekit/src/lib/contracts/deployedContracts.ts`

## Example: Counter Contract Deployment

The framework includes a simple Counter contract deployment:

```solidity
// Deploy.s.sol
contract DeployScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        Counter counter = new Counter();
        addDeployment("Counter", address(counter));
    }
}
```

This deploys the Counter contract and makes it available in the frontend.
