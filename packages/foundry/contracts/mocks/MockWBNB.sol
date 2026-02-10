// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title MockWBNB
 * @dev Mock WBNB (Wrapped BNB) contract for testing
 * @notice Implements IWBNB interface for depositBNB functionality
 */
contract MockWBNB is ERC20 {
    uint8 private constant DECIMALS = 18;

    constructor() ERC20("Mock WBNB", "WBNB") {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10 ** DECIMALS); // 1M WBNB
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Wrap BNB to WBNB (deposit)
     * @notice Receives BNB and mints equivalent WBNB to caller
     */
    function deposit() external payable {
        require(msg.value > 0, "MockWBNB: deposit amount must be greater than 0");
        _mint(msg.sender, msg.value);
    }

    /**
     * @dev Unwrap WBNB to BNB (withdraw)
     * @param amount Amount of WBNB to unwrap
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "MockWBNB: withdraw amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "MockWBNB: insufficient balance");

        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Mint tokens to a specific address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Receive BNB (for testing)
     * @notice Automatically wraps received BNB to WBNB
     */
    receive() external payable {
        require(msg.value > 0, "MockWBNB: deposit amount must be greater than 0");
        _mint(msg.sender, msg.value);
    }
}

