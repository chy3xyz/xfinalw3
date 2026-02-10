//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/Counter.sol";

/**
 * @notice Local development deployment script
 * @dev Used for frontend testing and local development
 *
 * Usage:
 * forge script script/DeployLocal.s.sol:DeployLocalScript --rpc-url http://localhost:8545 --broadcast --slow
 *
 * Or use the npm script:
 * bun deploy:local
 */
contract DeployLocalScript is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy Counter contract as example
        Counter counter = new Counter();
        addDeployment("Counter", address(counter));
    }
}
