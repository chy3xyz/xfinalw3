// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { Counter } from "../contracts/Counter.sol";

/**
 * @dev Copy this pattern for product contracts: fuzz inputs + bound ranges.
 * Run: `forge test --match-contract CounterFuzz`
 */
contract CounterFuzz is Test {
    Counter counter;

    function setUp() public {
        counter = new Counter();
    }

    function testFuzz_SetCount(uint256 n) public {
        counter.setCount(n);
        assertEq(counter.getCount(), n);
    }

    function testFuzz_IncrementThenMatches(uint8 times) public {
        uint256 timesU = uint256(times);
        for (uint256 i = 0; i < timesU; i++) {
            counter.increment();
        }
        assertEq(counter.getCount(), timesU);
    }
}
