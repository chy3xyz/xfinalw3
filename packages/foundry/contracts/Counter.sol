// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title Counter
 * @dev A simple counter contract for demonstration purposes
 */
contract Counter {
    uint256 private _count;

    event CountUpdated(uint256 newCount);

    /**
     * @dev Increment the counter by 1
     */
    function increment() external {
        _count++;
        emit CountUpdated(_count);
    }

    /**
     * @dev Decrement the counter by 1
     */
    function decrement() external {
        _count--;
        emit CountUpdated(_count);
    }

    /**
     * @dev Get the current count
     * @return The current count value
     */
    function getCount() external view returns (uint256) {
        return _count;
    }

    /**
     * @dev Set the count to a specific value
     * @param newCount The new count value
     */
    function setCount(uint256 newCount) external {
        _count = newCount;
        emit CountUpdated(_count);
    }
}
