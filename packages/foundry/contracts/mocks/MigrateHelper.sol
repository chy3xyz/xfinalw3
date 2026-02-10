// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICommon.sol";

/**
 * @title MigrateHelper
 * @notice Helper contract to migrate ARF tokens from old MPool to new MPool
 * @dev This contract helps transfer ARF tokens when old MPool cannot directly transfer
 *
 * Usage:
 * 1. Deploy this contract
 * 2. Have old MPool approve this contract to spend ARF tokens
 * 3. Call migrate() to transfer tokens to new MPool
 */
contract MigrateHelper {
    address public owner;

    event MigrationCompleted(address indexed from, address indexed to, address indexed token, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Migrate tokens from one address to another
     * @param token Token contract address (ARF)
     * @param from Source address (old MPool)
     * @param to Destination address (new MPool)
     * @param amount Amount to transfer
     */
    function migrate(address token, address from, address to, uint256 amount) external {
        require(msg.sender == owner, "MigrateHelper: only owner");
        require(token != address(0), "MigrateHelper: invalid token");
        require(from != address(0), "MigrateHelper: invalid from");
        require(to != address(0), "MigrateHelper: invalid to");
        require(amount > 0, "MigrateHelper: invalid amount");

        // Transfer tokens using transferFrom
        require(IERC20(token).transferFrom(from, to, amount), "MigrateHelper: transfer failed");

        emit MigrationCompleted(from, to, token, amount);
    }

    /**
     * @notice Migrate all tokens from source address
     * @param token Token contract address (ARF)
     * @param from Source address (old MPool)
     * @param to Destination address (new MPool)
     */
    function migrateAll(address token, address from, address to) external {
        require(msg.sender == owner, "MigrateHelper: only owner");
        uint256 balance = IERC20(token).balanceOf(from);
        require(balance > 0, "MigrateHelper: no balance");

        // Transfer tokens using transferFrom
        require(IERC20(token).transferFrom(from, to, balance), "MigrateHelper: transfer failed");

        emit MigrationCompleted(from, to, token, balance);
    }
}

