# Foundry 开发示例

## 典型开发场景

### 场景 1: 添加新合约函数

1. 在合约中添加函数：
```solidity
// contracts/Counter.sol
function reset() external {
    _count = 0;
    emit CountUpdated(0);
}
```

2. 编译：
```bash
bun compile
```

3. 编写测试：
```solidity
// test/Counter.t.sol
function test_Reset() public {
    counter.increment();
    counter.reset();
    assertEq(counter.getCount(), 0);
}
```

4. 运行测试：
```bash
bun foundry:test --match-test test_NewFunction
```

5. 部署：
```bash
bun deploy:local
```

6. 前端自动获得新的函数定义

### 场景 2: 修改部署配置

编辑 `script/DeployLocal.s.sol`：

```solidity
function run() external {
    // 修改部署参数
    uint256 initialSupply = 1000000;
    // ...
}
```

然后重新部署：
```bash
bun deploy:local
```

### 场景 3: 调试合约

1. 使用 `console.log`：
```solidity
import "forge-std/console.sol";

function test() public {
    console.log("Value:", value);
}
```

2. 运行测试查看输出：
```bash
forge test -vvv
```

### 场景 4: Fork 主网测试

```bash
bun fork mainnet
```

然后在测试中使用 fork 的网络：
```solidity
function test_ForkMainnet() public {
    // 使用主网状态进行测试
}
```
