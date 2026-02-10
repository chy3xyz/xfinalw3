// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { Counter } from "../contracts/Counter.sol";

contract CounterTest is Test {
    Counter counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_InitialCountIsZero() public {
        assertEq(counter.getCount(), 0);
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.getCount(), 1);
    }

    function test_Decrement() public {
        counter.increment();
        counter.decrement();
        assertEq(counter.getCount(), 0);
    }

    function test_SetCount() public {
        counter.setCount(100);
        assertEq(counter.getCount(), 100);
    }

    function test_MultipleIncrements() public {
        counter.increment();
        counter.increment();
        counter.increment();
        assertEq(counter.getCount(), 3);
    }
}
