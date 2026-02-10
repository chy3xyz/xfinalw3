# Foundry 测试指南

## 测试文件结构

```
test/
├── Counter.t.sol          # Counter 示例合约测试
└── integration/           # 集成测试（可选）
```

## 运行测试

### 运行所有测试

```bash
forge test
# 或
bun foundry:test
```

### 运行特定测试文件

```bash
forge test --match-path test/Counter.t.sol
```

### 运行特定测试用例

```bash
forge test --match-test test_Increment
```

### 查看详细输出

```bash
forge test -vvv
```

### 查看测试覆盖率

```bash
forge coverage
```

## 编写测试

### 基本测试结构

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

### 测试命名规范

- 使用 `test_` 前缀
- 使用描述性名称：`test_Increment_ShouldIncreaseCount`
- 测试错误情况：`test_Increment_ShouldRevertWhenOverflow`

### 常用测试模式

#### 测试状态变化

```solidity
function test_SetCount() public {
    counter.setCount(100);
    assertEq(counter.getCount(), 100);
}
```

#### 测试事件

```solidity
function test_Increment_EmitsEvent() public {
    vm.expectEmit(true, true, false, true);
    emit CountUpdated(1);
    counter.increment();
}
```

#### 测试错误情况

```solidity
function test_SetCount_WithInvalidValue() public {
    // 如果合约有验证，测试会 revert
    // counter.setCount(type(uint256).max + 1);
}
```

#### 使用作弊码

```solidity
function test_TimeBased() public {
    // 推进时间
    vm.warp(block.timestamp + 1 days);
    
    // 改变调用者
    vm.prank(user);
    counter.increment();
    
    // 改变余额
    vm.deal(user, 1 ether);
}
```

## 测试最佳实践

1. **每个测试应该独立**：使用 `setUp()` 初始化状态
2. **测试边界条件**：最小值、最大值、零值
3. **测试错误路径**：确保合约在错误情况下正确 revert
4. **使用描述性断言**：`assertEq(actual, expected, "Description")`
5. **测试事件**：确保重要状态变化发出事件

## 集成测试

对于需要多个合约交互的复杂场景，可以创建集成测试：

```solidity
contract IntegrationTest is Test {
    Counter counter;
    MockUSDT usdt;
    
    function setUp() public {
        counter = new Counter();
        usdt = new MockUSDT();
    }
    
    function test_CompleteFlow() public {
        // 测试完整流程
    }
}
```

## 调试测试

### 使用 console.log

```solidity
import "forge-std/console.sol";

function test_Debug() public {
    console.log("Count:", counter.getCount());
}
```

### 使用 -vvv 标志

```bash
forge test -vvv
```

这会显示：
- `-v`: 显示测试日志
- `-vv`: 显示失败测试的跟踪
- `-vvv`: 显示所有测试的跟踪
- `-vvvv`: 显示所有测试的跟踪和设置跟踪

## 测试覆盖率

运行覆盖率报告：

```bash
forge coverage
```

查看详细报告：

```bash
forge coverage --report lcov
genhtml lcov.info -o coverage
```

## 注意事项

1. 测试文件必须以 `.t.sol` 结尾
2. 测试合约必须继承 `Test`
3. 使用 `setUp()` 进行初始化
4. 测试函数必须以 `test` 开头
5. 使用 `vm` 作弊码模拟不同场景
