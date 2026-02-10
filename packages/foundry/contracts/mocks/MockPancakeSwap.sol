// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ICommon.sol";
import "forge-std/console.sol";

/**
 * @title Mock PancakeSwap Factory
 * @dev Simplified Mock Factory for testing
 */
contract MockPancakeSwapFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    address public feeTo;
    address public feeToSetter;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "PancakeSwap: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "PancakeSwap: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "PancakeSwap: PAIR_EXISTS");

        bytes memory bytecode = type(MockPancakeSwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        MockPancakeSwapPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
        console.log("[MockPancakeSwapFactory] createPair called");
        console.log("  create pair pair:", pair);
        return pair;
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "PancakeSwap: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "PancakeSwap: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }
}

/**
 * @title Mock PancakeSwap Pair
 * @dev Simplified Mock Pair for testing
 */
contract MockPancakeSwapPair {
    address public token0;
    address public token1;
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    // LP token balance tracking (for ERC20-like interface)
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    constructor() { }

    function initialize(address _token0, address _token1) external {
        require(token0 == address(0), "PancakeSwap: INITIALIZED");
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev ERC20-like balanceOf function for LP tokens
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Mint LP tokens to an address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }

    /**
     * @dev Transfer LP tokens (for testing)
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient LP balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    /**
     * @dev Approve LP tokens (for testing)
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    /**
     * @dev Transfer LP tokens from one address to another (for testing)
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_balances[from] >= amount, "Insufficient LP balance");
        require(_allowances[from][msg.sender] >= amount, "ERC20: insufficient allowance");
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }

    function kLast() external pure returns (uint256) {
        return 0;
    }

    function sync() external {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp);
    }

    /**
     * @dev Set reserves manually for testing
     */
    function setReserves(uint112 _reserve0, uint112 _reserve1) external {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        blockTimestampLast = uint32(block.timestamp);
    }

    /**
     * @dev Swap tokens - transfer output token to recipient
     * @param tokenOut Token address to transfer out
     * @param amountOut Amount to transfer out
     * @param to Recipient address
     */
    function swapOut(address tokenOut, uint256 amountOut, address to) external {
        // Allow any caller (router will call this) - removed router check for simplicity
        require(tokenOut == token0 || tokenOut == token1, "PancakeSwap: INVALID_TOKEN");
        require(amountOut > 0, "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        require(to != address(0), "PancakeSwap: INVALID_RECIPIENT");

        uint256 balance = IERC20(tokenOut).balanceOf(address(this));
        require(balance >= amountOut, "PancakeSwap: INSUFFICIENT_LIQUIDITY");

        console.log("[MockPancakeSwapPair] swap out called");
        console.log("  swap out amountOut:", amountOut);

        IERC20(tokenOut).transfer(to, amountOut);
    }
}

/**
 * @title Mock PancakeSwap Router
 * @dev Simplified Mock Router for testing
 */
contract MockPancakeSwapRouter {
    address public immutable factory;
    address public immutable WETH;

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "PancakeSwap: EXPIRED");
        require(path.length >= 2, "PancakeSwap: INVALID_PATH");

        address pair = MockPancakeSwapFactory(factory).getPair(path[0], path[path.length - 1]);
        require(pair != address(0), "PancakeSwap: PAIR_NOT_EXISTS");

        MockPancakeSwapPair(pair).sync();

        address tokenA = path[0];
        address tokenB = path[path.length - 1];
        address token0 = tokenA < tokenB ? tokenA : tokenB;
        address token1 = tokenA < tokenB ? tokenB : tokenA;

        uint256 balance0 = IERC20(token0).balanceOf(pair);
        uint256 balance1 = IERC20(token1).balanceOf(pair);

        uint256 reserveIn;
        uint256 reserveOut;
        if (tokenA == token0) {
            reserveIn = balance0;
            reserveOut = balance1;
        } else {
            reserveIn = balance1;
            reserveOut = balance0;
        }

        require(reserveIn > 0 && reserveOut > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");
        require(reserveOut >= amountOut, "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");

        // Calculate amountIn needed: amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * 997)
        // Add 1 to account for rounding, but check if it would exceed amountInMax
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        uint256 amountIn = numerator / denominator;

        // Add 1 for rounding, but only if it doesn't exceed amountInMax
        if (amountIn * denominator < numerator) {
            amountIn += 1;
        }

        // If still exceeds, use amountInMax (but this might fail later)
        if (amountIn > amountInMax) {
            // Try to calculate a more accurate amountIn
            // Use a more conservative calculation
            amountIn = (numerator + denominator - 1) / denominator; // Ceiling division
            if (amountIn > amountInMax) {
                revert("PancakeSwap: EXCESSIVE_INPUT_AMOUNT");
            }
        }

        // Transfer input token from user to pair (may have fee-on-transfer)
        uint256 balanceBefore = IERC20(path[0]).balanceOf(pair);
        IERC20(path[0]).transferFrom(msg.sender, pair, amountIn);
        uint256 balanceAfter = IERC20(path[0]).balanceOf(pair);
        uint256 actualAmountIn = balanceAfter - balanceBefore;

        // Recalculate amountOut based on actual amount received
        if (actualAmountIn != amountIn) {
            // Fee-on-transfer token: recalculate amountOut
            uint256 amountInWithFee = actualAmountIn * 997;
            uint256 numerator = amountInWithFee * reserveOut;
            uint256 denominator = reserveIn * 1000 + amountInWithFee;
            amountOut = numerator / denominator;
            // Ensure we don't exceed requested amountOut
            if (amountOut > reserveOut) amountOut = reserveOut;
        }

        // Transfer output token from pair to recipient
        uint256 outputBalanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        MockPancakeSwapPair(pair).swapOut(path[path.length - 1], amountOut, to);
        uint256 outputBalanceAfter = IERC20(path[path.length - 1]).balanceOf(to);
        uint256 actualAmountOut = outputBalanceAfter - outputBalanceBefore;

        // Use actual amounts
        MockPancakeSwapPair(pair).sync();

        amounts = new uint256[](path.length);
        amounts[0] = actualAmountIn;
        amounts[amounts.length - 1] = actualAmountOut;
        return amounts;
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external {
        require(deadline >= block.timestamp, "PancakeSwap: EXPIRED");
        require(path.length >= 2, "PancakeSwap: INVALID_PATH");

        // Get pair address
        address pair = MockPancakeSwapFactory(factory).getPair(path[0], path[path.length - 1]);
        require(pair != address(0), "PancakeSwap: PAIR_NOT_EXISTS");

        // Sync reserves to ensure they are up-to-date before swap
        MockPancakeSwapPair(pair).sync();

        // Determine which token is token0/token1 (sorted by address)
        address tokenA = path[0];
        address tokenB = path[path.length - 1];
        address token0 = tokenA < tokenB ? tokenA : tokenB;
        address token1 = tokenA < tokenB ? tokenB : tokenA;

        // Get actual balances for accurate calculation (before transferring input token)
        uint256 balance0Before = IERC20(token0).balanceOf(pair);
        uint256 balance1Before = IERC20(token1).balanceOf(pair);

        // Determine reserves for input and output tokens (use actual balances)
        uint256 reserveIn;
        uint256 reserveOut;
        if (tokenA == token0) {
            reserveIn = balance0Before;
            reserveOut = balance1Before;
        } else {
            reserveIn = balance1Before;
            reserveOut = balance0Before;
        }

        require(reserveIn > 0 && reserveOut > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");

        // Transfer input token from user to pair (may have fee-on-transfer)
        uint256 balanceBefore = IERC20(path[0]).balanceOf(pair);
        IERC20(path[0]).transferFrom(msg.sender, pair, amountIn);

        // Calculate actual amount received by pair (after potential fee-on-transfer)
        uint256 balanceAfter = IERC20(path[0]).balanceOf(pair);
        uint256 actualAmountIn = balanceAfter - balanceBefore;

        require(actualAmountIn > 0, "PancakeSwap: NO_TOKENS_RECEIVED");

        // Calculate output using AMM formula
        uint256 amountInWithFee = actualAmountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(reserveOut >= amountOut, "PancakeSwap: INSUFFICIENT_LIQUIDITY");

        // Transfer output token from pair to user via swapOut
        address outputToken = path[path.length - 1];
        require(to != address(0), "PancakeSwap: INVALID_RECIPIENT");
        uint256 outputBalanceBefore = IERC20(outputToken).balanceOf(to);
        MockPancakeSwapPair(pair).swapOut(outputToken, amountOut, to);

        // Calculate actual amount received by user (after potential fee-on-transfer)
        uint256 outputBalanceAfter = IERC20(outputToken).balanceOf(to);
        uint256 actualAmountOut = outputBalanceAfter - outputBalanceBefore;

        require(actualAmountOut >= amountOutMin, "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");

        // Update pair reserves
        MockPancakeSwapPair(pair).sync();
    }

    function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        payable
        returns (uint256[] memory amounts)
    {
        require(deadline >= block.timestamp, "PancakeSwap: EXPIRED");
        require(path.length >= 2, "PancakeSwap: INVALID_PATH");
        require(path[0] == WETH, "PancakeSwap: INVALID_PATH");

        // Simplified: just transfer ETH equivalent
        uint256 amountOut = (msg.value * 997) / 1000; // Simple 0.3% fee simulation
        require(amountOut >= amountOutMin, "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");

        // Transfer output token to recipient
        // Note: Router must hold the output token (BUSD/USDT)
        // We assume liquidity was added or router has balance
        // But in addLiquidity, tokens go to Pair.
        // So we should swap via Pair.

        // Get pair
        address pair = MockPancakeSwapFactory(factory).getPair(path[0], path[path.length - 1]);
        require(pair != address(0), "PancakeSwap: PAIR_NOT_EXISTS");

        // Wrap ETH to WETH and send to Pair
        // MockUSDT(WETH).mint(pair, msg.value); // If WETH is MockUSDT
        // But we can't mint if we are not owner.
        // We should just assume WETH is transferred.
        // For mock, let's just transfer output from Pair to 'to'.

        // We need to tell Pair to swap.
        // Pair needs input tokens.
        // Since we can't easily wrap ETH in this mock without a real WETH,
        // we will cheat: Mint WETH to Pair? No.
        // We will just call swapOut on Pair, assuming Pair has enough liquidity.
        // And we ignore the input ETH (it stays in Router).

        MockPancakeSwapPair(pair).swapOut(path[path.length - 1], amountOut, to);

        amounts = new uint256[](path.length);
        amounts[0] = msg.value;
        amounts[amounts.length - 1] = amountOut;
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable {
        require(deadline >= block.timestamp, "PancakeSwap: EXPIRED");
        require(path.length >= 2, "PancakeSwap: INVALID_PATH");
        require(path[0] == WETH, "PancakeSwap: INVALID_PATH");

        // Simplified: just transfer ETH equivalent
        uint256 amountOut = (msg.value * 997) / 1000;
        require(amountOut >= amountOutMin, "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");

        console.log("  swap exact ETH for tokens amountOut:", amountOut);

        IERC20(path[path.length - 1]).transfer(to, amountOut);
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external {
        require(deadline >= block.timestamp, "PancakeSwap: EXPIRED");
        require(path.length >= 2, "PancakeSwap: INVALID_PATH");
        require(path[path.length - 1] == WETH, "PancakeSwap: INVALID_PATH");

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut = (amountIn * 997) / 1000;
        require(amountOut >= amountOutMin, "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");

        console.log("  swap exact tokens for ETH amountOut:", amountOut);
        // Convert to ETH (simplified mock)
        payable(to).transfer(amountOut);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(deadline >= block.timestamp, "PancakeSwap: EXPIRED");

        address pair = MockPancakeSwapFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = MockPancakeSwapFactory(factory).createPair(tokenA, tokenB);
        }

        IERC20(tokenA).transferFrom(msg.sender, pair, amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountBDesired);

        MockPancakeSwapPair(pair).sync();

        // Mint LP tokens to the recipient
        // Calculate LP amount based on existing supply and balances
        uint256 existingLP = MockPancakeSwapPair(pair).totalSupply();
        // 防止下溢：检查余额是否足够
        uint256 balanceA = IERC20(tokenA).balanceOf(pair);
        uint256 balanceB = IERC20(tokenB).balanceOf(pair);
        uint256 existingBalanceA = balanceA >= amountADesired ? balanceA - amountADesired : 0;
        uint256 existingBalanceB = balanceB >= amountBDesired ? balanceB - amountBDesired : 0;

        uint256 lpAmount;
        if (existingLP == 0 || existingBalanceA == 0 || existingBalanceB == 0) {
            // First liquidity or no existing liquidity: use sum as fallback
            lpAmount = amountADesired + amountBDesired;
        } else {
            // Proportional to existing LP based on token amounts
            // 防止溢出：检查乘法是否会溢出
            uint256 lpFromA = 0;
            uint256 lpFromB = 0;
            if (existingBalanceA > 0 && existingLP > 0 && amountADesired > 0) {
                if (existingLP <= type(uint256).max / amountADesired) {
                    lpFromA = (existingLP * amountADesired) / existingBalanceA;
                } else {
                    lpFromA = type(uint256).max / existingBalanceA;
                }
            }
            if (existingBalanceB > 0 && existingLP > 0 && amountBDesired > 0) {
                if (existingLP <= type(uint256).max / amountBDesired) {
                    lpFromB = (existingLP * amountBDesired) / existingBalanceB;
                } else {
                    lpFromB = type(uint256).max / existingBalanceB;
                }
            }
            lpAmount = lpFromA < lpFromB ? lpFromA : lpFromB;
            // Ensure minimum
            if (lpAmount == 0) {
                // 防止溢出：检查加法是否会溢出
                if (amountADesired <= type(uint256).max - amountBDesired) {
                    lpAmount = amountADesired + amountBDesired;
                } else {
                    lpAmount = type(uint256).max;
                }
            }
        }

        MockPancakeSwapPair(pair).mint(to, lpAmount);

        console.log("[MockPancakeSwapRouter] add liquidity called");
        console.log("  add liquidity amountADesired:", amountADesired / 1e15, "USDT(scaled)1e15");
        console.log("  add liquidity amountBDesired:", amountBDesired / 1e15, "USDT(scaled)1e15");

        return (amountADesired, amountBDesired, lpAmount);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        require(deadline >= block.timestamp, "PancakeSwap: EXPIRED");
        require(to != address(0), "PancakeSwap: INVALID_RECIPIENT");

        address pair = MockPancakeSwapFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "PancakeSwap: PAIR_NOT_EXISTS");

        // Transfer LP tokens from the recipient (to) to pair
        // In dailyBurn, to is address(this) (burner), which is the LP token owner
        // In real PancakeSwap, removeLiquidity transfers from the caller, but in our mock,
        // we use 'to' as the LP owner since that's where the LP tokens are
        MockPancakeSwapPair(pair).transferFrom(to, pair, liquidity);

        // Calculate amounts based on reserves (simplified: proportional to liquidity)
        uint256 totalLP = MockPancakeSwapPair(pair).totalSupply();
        require(totalLP > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");
        require(liquidity <= totalLP, "PancakeSwap: INSUFFICIENT_LIQUIDITY_BURNED");

        // Get current balances (these may have changed due to swaps)
        uint256 balanceA = IERC20(tokenA).balanceOf(pair);
        uint256 balanceB = IERC20(tokenB).balanceOf(pair);

        // Calculate proportional amounts based on liquidity ratio
        // Use the actual balances, not reserves, to account for swaps
        amountA = (balanceA * liquidity) / totalLP;
        amountB = (balanceB * liquidity) / totalLP;

        // Ensure we don't exceed available balances (critical safety check)
        // This can happen if LP tokens were minted without corresponding token deposits
        if (amountA > balanceA) {
            // Adjust proportionally if balance is insufficient
            amountA = balanceA;
            // Recalculate amountB to maintain ratio if possible
            if (balanceA > 0) {
                amountB = (balanceB * amountA) / balanceA;
            } else {
                amountB = 0;
            }
        }
        if (amountB > balanceB) {
            amountB = balanceB;
            // Recalculate amountA to maintain ratio if possible
            if (balanceB > 0 && amountA > balanceA) {
                amountA = (balanceA * amountB) / balanceB;
            }
        }

        // Final safety check
        require(amountA <= balanceA && amountB <= balanceB, "PancakeSwap: INSUFFICIENT_LIQUIDITY");
        require(amountA >= amountAMin, "PancakeSwap: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "PancakeSwap: INSUFFICIENT_B_AMOUNT");

        // Transfer tokens from pair to recipient using swapOut
        // Double-check balances before transferring to avoid "transfer amount exceeds balance" errors
        uint256 finalBalanceA = IERC20(tokenA).balanceOf(pair);
        uint256 finalBalanceB = IERC20(tokenB).balanceOf(pair);

        // Adjust amounts if balances changed
        if (amountA > finalBalanceA) amountA = finalBalanceA;
        if (amountB > finalBalanceB) amountB = finalBalanceB;

        require(amountA >= amountAMin, "PancakeSwap: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "PancakeSwap: INSUFFICIENT_B_AMOUNT");

        if (amountA > 0 && finalBalanceA >= amountA) {
            MockPancakeSwapPair(pair).swapOut(tokenA, amountA, to);
        }
        if (amountB > 0 && finalBalanceB >= amountB) {
            MockPancakeSwapPair(pair).swapOut(tokenB, amountB, to);
        }

        // Update pair reserves
        MockPancakeSwapPair(pair).sync();

        return (amountA, amountB);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts) {
        require(path.length >= 2, "PancakeSwap: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            // Get pair address
            address pair = MockPancakeSwapFactory(factory).getPair(path[i], path[i + 1]);
            require(pair != address(0), "PancakeSwap: PAIR_NOT_EXISTS");

            // Determine which token is token0/token1 (sorted by address)
            address tokenA = path[i];
            address tokenB = path[i + 1];
            address token0 = tokenA < tokenB ? tokenA : tokenB;
            address token1 = tokenA < tokenB ? tokenB : tokenA;

            // Get actual balances (for accurate calculation, as reserves may be outdated)
            // This ensures getAmountsOut matches the actual swap calculation
            uint256 balance0 = IERC20(token0).balanceOf(pair);
            uint256 balance1 = IERC20(token1).balanceOf(pair);

            // Determine reserves for input and output tokens
            // Use actual balances instead of stored reserves for accuracy
            uint256 reserveIn;
            uint256 reserveOut;
            if (tokenA == token0) {
                // Input token (path[i]) is token0, output token (path[i+1]) is token1
                reserveIn = balance0;
                reserveOut = balance1;
            } else {
                // Input token (path[i]) is token1, output token (path[i+1]) is token0
                reserveIn = balance1;
                reserveOut = balance0;
            }

            require(reserveIn > 0 && reserveOut > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");

            // Calculate output using AMM formula: (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
            uint256 amountInWithFee = amounts[i] * 997;
            uint256 numerator = amountInWithFee * reserveOut;
            uint256 denominator = reserveIn * 1000 + amountInWithFee;
            uint256 rawAmountOut = numerator / denominator;

            // For tokens with fee-on-transfer (like WDA), we need to account for the fee
            // Try to detect if the output token has fees by checking if it implements a fee mechanism
            // For now, we'll estimate a 3% fee if it's likely WDA (this is a heuristic)
            // In production, you might want to query the token contract for its fee rate
            // For mock purposes, we'll apply a conservative estimate if the output is small
            // Actually, let's use the raw amount - the actual swap will handle the fee checking
            amounts[i + 1] = rawAmountOut;
        }
    }

    function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts) {
        require(path.length >= 2, "PancakeSwap: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;

        for (uint256 i = path.length - 1; i > 0; i--) {
            // Get pair address
            address pair = MockPancakeSwapFactory(factory).getPair(path[i - 1], path[i]);
            require(pair != address(0), "PancakeSwap: PAIR_NOT_EXISTS");

            // Get actual balances
            address tokenA = path[i - 1];
            address tokenB = path[i];
            address token0 = tokenA < tokenB ? tokenA : tokenB;
            address token1 = tokenA < tokenB ? tokenB : tokenA;

            uint256 balance0 = IERC20(token0).balanceOf(pair);
            uint256 balance1 = IERC20(token1).balanceOf(pair);

            uint256 reserveIn;
            uint256 reserveOut;
            if (tokenA == token0) {
                reserveIn = balance0;
                reserveOut = balance1;
            } else {
                reserveIn = balance1;
                reserveOut = balance0;
            }

            require(reserveIn > 0 && reserveOut > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");
            require(reserveOut >= amounts[i], "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");

            // Calculate amountIn: amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * 997)
            uint256 numerator = reserveIn * amounts[i] * 1000;
            uint256 denominator = (reserveOut - amounts[i]) * 997;
            amounts[i - 1] = (numerator / denominator) + 1; // Add 1 for rounding
        }
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB) {
        require(amountA > 0, "PancakeSwap: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        external
        pure
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "PancakeSwap: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        external
        pure
        returns (uint256 amountIn)
    {
        require(amountOut > 0, "PancakeSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "PancakeSwap: INSUFFICIENT_LIQUIDITY");
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    receive() external payable { }
}
