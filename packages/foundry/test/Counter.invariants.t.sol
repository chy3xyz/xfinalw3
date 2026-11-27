// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { StdInvariant } from "forge-std/StdInvariant.sol";
import { Counter } from "../contracts/Counter.sol";

/**
 * Handler used by the invariant runner — expose only the ops you want fuzzed.
 */
contract CounterHandler is Test {
    Counter public immutable counter;
    uint256 public calls;

    constructor(Counter counter_) {
        counter = counter_;
    }

    function increment() external {
        counter.increment();
        calls++;
    }

    function setCount(uint256 n) external {
        counter.setCount(n);
        calls++;
    }
}

/**
 * @dev Minimal invariant scaffold. Product apps: assert conservation / auth invariants here.
 * Run: `forge test --match-contract CounterInvariant`
 */
contract CounterInvariant is StdInvariant, Test {
    Counter counter;
    CounterHandler handler;

    function setUp() public {
        counter = new Counter();
        handler = new CounterHandler(counter);
        targetContract(address(handler));
    }

    /// Count is always whatever setCount/increment last wrote — smoke invariant.
    function invariant_getCountDoesNotRevert() public view {
        counter.getCount();
    }
}
