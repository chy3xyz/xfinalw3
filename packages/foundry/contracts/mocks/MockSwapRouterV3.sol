// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "forge-std/console.sol";

// Local interface definition to avoid external dependency
interface IPancakeV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

/**
 * @title Mock PancakeSwap V3 SwapRouter
 * @dev Simplified Mock Router V3 for testing BNB to USDT swaps
 * @notice Updated to match actual depositBNB logic: WBNB is transferred via approve, not ETH
 */
contract MockSwapRouterV3 {
    // 交换率：1 BNB = 300 USDT (可配置，用于测试，更接近实际价格)
    // 注意：使用 18 位精度，所以 300 * 1e18 表示 300 USDT
    uint256 public constant EXCHANGE_RATE = 300 * 1e18; // 1 BNB = 300 USDT (with 18 decimals)
    address public usdtContract;

    // 存储 WBNB 地址（用于兼容性）
    address public wbnb;

    constructor(address _usdtContract, address _wbnb) {
        usdtContract = _usdtContract;
        wbnb = _wbnb;
    }

    /**
     * @dev 模拟 V3 exactInputSingle 交换
     * @notice 更新为与实际 depositBNB 逻辑一致：从调用者 transferFrom WBNB，而不是接收 ETH
     * @param params 交换参数
     * @return amountOut 输出的代币数量
     */
    function exactInputSingle(IPancakeV3Router.ExactInputSingleParams calldata params)
        external
        returns (uint256 amountOut)
    {
        require(params.deadline >= block.timestamp, "MockRouter: EXPIRED");
        require(params.amountIn > 0, "MockRouter: INSUFFICIENT_INPUT_AMOUNT");
        require(params.tokenIn == wbnb, "MockRouter: INVALID_TOKEN_IN");
        require(params.tokenOut == usdtContract, "MockRouter: INVALID_TOKEN_OUT");

        console.log("[MockSwapRouterV3] exactInputSingle called");
        console.log("  EXCHANGE_RATE:", EXCHANGE_RATE);

        // 从调用者 transferFrom WBNB（因为已经通过 approve 授权）
        IERC20(wbnb).transferFrom(msg.sender, address(this), params.amountIn);

        // 计算 USDT 输出量（使用固定汇率）
        // 使用固定汇率：1 BNB = 300 USDT
        amountOut = (params.amountIn * EXCHANGE_RATE) / 1 ether;

        require(amountOut > 0, "MockRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        require(amountOut >= params.amountOutMinimum, "MockRouter: INSUFFICIENT_OUTPUT_AMOUNT");

        // 检查 USDT 余额
        uint256 usdtBalanceBefore = IERC20(usdtContract).balanceOf(address(this));

        // 将 USDT 转给接收者
        require(IERC20(usdtContract).transfer(params.recipient, amountOut), "MockRouter: TRANSFER_FAILED");

        uint256 usdtBalanceAfter = IERC20(usdtContract).balanceOf(address(this));

        uint256 recipientBalance = IERC20(usdtContract).balanceOf(params.recipient);
        console.log("  Recipient USDT balance after transfer:", recipientBalance);

        return amountOut;
    }

    /**
     * @dev 设置 USDT 合约地址（用于测试灵活性）
     */
    function setUSDTContract(address _usdtContract) external {
        usdtContract = _usdtContract;
    }

    /**
     * @dev 设置 WBNB 地址
     */
    function setWBNB(address _wbnb) external {
        wbnb = _wbnb;
    }

    /**
     * @dev 接收 ETH（用于测试，但实际不会使用，因为使用 WBNB transferFrom）
     */
    receive() external payable { }
}

