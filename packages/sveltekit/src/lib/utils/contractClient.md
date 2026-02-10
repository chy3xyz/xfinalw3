使用方法
1. 使用单例实例
import { contractClient } from '$lib/utils/contractClient';
// 读取合约
const userData = await contractClient.read({
  contractName: 'LukeMain',
  functionName: 'usersLite',
  args: [userAddress],
});
// 写入合约
const txHash = await contractClient.write({
  contractName: 'LukeMain',
  functionName: 'stake',
  args: [amount, period],
});
// 读取并格式化为 Ether
const balance = await contractClient.readEther({
  contractName: 'MockUSDT',
  functionName: 'balanceOf',
  args: [userAddress],
});
2. 使用便捷函数
import { contractRead, contractWrite, contractReadEther } from '$lib/utils/contractClient';
// 读取
const userInfo = await contractRead({
  contractName: 'LukeMain',
  functionName: 'usersLite',
  args: [address],
});
// 写入
const txHash = await contractWrite({
  contractName: 'LukeMain',
  functionName: 'register',
  args: [referrer],
});
// 读取并格式化为 Ether
const balance = await contractReadEther({
  contractName: 'MockUSDT',
  functionName: 'balanceOf',
  args: [address],
});
3. 指定特定链
const result = await contractClient.read({
  contractName: 'LukeMain',
  functionName: 'getConfig',
  chainId: 1, // 指定以太坊主网
});
优势
1. 无需手动导入 wagmiConfig
2. 无需手动查找合约地址和 ABI
3. 自动处理链 ID
4. 自动检查钱包连接状态（写入时）
5. 简洁的 API，只需合约名称、函数名和参数
6. 可在回调/异步函数中安全使用（不会触发 lifecycle_outside_component 错误）
▣  Sisyphus · kimi-k2.5-free · 2m 21s