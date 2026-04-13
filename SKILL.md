---
name: lp-intel
description: "Use this skill when the user asks to analyze LP positions, check impermanent loss, review position health, calculate LP P&L, fee APY, or assess LP risk. Works with Uniswap V3, SushiSwap V3, and PancakeSwap V3 on Ethereum, Arbitrum, Base, and Polygon. Typical triggers: 'analyze my LP positions', 'check impermanent loss', 'how are my LP positions doing', 'position health', 'LP risk analysis', 'show my V3 positions', 'am I losing money on my LP', 'should I rebalance', 'what is my fee APY', 'check my SushiSwap positions'. Reads on-chain position data, calculates token amounts, concentrated IL, real uncollected fees via feeGrowthInside math, fee APY, and risk. Generates Uniswap deep links for rebalancing."
allowed-tools: Read, Glob, Grep, Bash(npx:*), Bash(node:*), WebFetch
model: sonnet
license: MIT
metadata:
  author: yonkoo11
  version: "1.0.0"
  homepage: "https://github.com/yonkoo11/lp-intel"
---

# LP Intel - Concentrated Liquidity Position Analyzer

Analyze any wallet's concentrated liquidity positions across Uniswap V3, SushiSwap V3, and PancakeSwap V3 for impermanent loss, fee income, fee APY, net P&L, and risk.

## What It Does

Given a wallet address and chain, LP Intel:
1. Scans all V3-fork DEXes on the chain (Uniswap, SushiSwap, PancakeSwap)
2. Discovers all positions owned by the wallet on each DEX
3. Reads on-chain position data (tick range, liquidity, feeGrowthInsideLastX128)
4. Reads pool feeGrowthGlobal and tick feeGrowthOutside to compute real uncollected fees
5. Resolves entry price from NFT mint event Transfer logs (falls back to tick midpoint)
6. Calculates position value, concentrated-liquidity IL, fee income, fee APY, and net P&L
7. Assesses risk (in-range, near-edge, out-of-range)
8. Generates Uniswap deep links for rebalancing (with fee tier and tick spacing)

## Prerequisites

```bash
cd /path/to/lp-intel
npm install
```

For price data, the tool uses:
- **onchainos** (preferred): `onchainos market price` via okx-dex-market skill
- **CoinGecko** (fallback): Batch API for major tokens across all supported chains
- **Stablecoin defaults**: USDC/USDT/DAI default to $1.00

## Commands

```bash
# Analyze positions on a specific chain (scans all DEXes on that chain)
npx tsx src/index.ts analyze <wallet-address> --chain ethereum

# Analyze across all supported chains
npx tsx src/index.ts analyze <wallet-address> --all-chains

# JSON output for programmatic/agent use (clean JSON only, no status messages)
npx tsx src/index.ts analyze <wallet-address> --chain ethereum --json
```

### Supported Chains and DEXes

| Chain    | DEXes Scanned |
|----------|---------------|
| Ethereum | Uniswap V3, SushiSwap V3, PancakeSwap V3 |
| Arbitrum | Uniswap V3, SushiSwap V3 |
| Base     | Uniswap V3, SushiSwap V3 |
| Polygon  | Uniswap V3, SushiSwap V3 |

## Output Format

```
Position #378780 -- WETH/USDC (0.05% fee) [Uniswap V3]
Chain: Ethereum | Status: OUT OF RANGE

  Price Range:    1,255.19 -- 1,293.42 USDC/WETH
  Current Price:  2,356.74 USDC/WETH

  Token Amounts:  19.93 USDC + 0.00 WETH
  Position Value: $19.93

  Uncollected Fees: +$2.87 (USDC: 1.01, WETH: 0.000788)
  Fee APY (est):    52.3%
  Days Active:      34
  Impermanent Loss: -$8.36 (-29.55%)
  Net P&L:          -$5.49 (-19.41%)

  Risk: HIGH -- Price is outside position range
  Action: REBALANCE -- not earning fees

  [Rebalance on Uniswap](https://app.uniswap.org/positions/create?...)
```

JSON output (`--json`) returns a clean array of position objects. BigInt values serialized as strings.

## Integration with OnchainOS

Uses `onchainos market price` (okx-dex-market skill) for real-time token pricing. Falls back to CoinGecko batch API when onchainos is unavailable.

## Integration with Uniswap AI Skills

- Generates rebalancing deep links in the `liquidity-planner` URL format (fee tier, tick spacing, step params)
- Uses viem for on-chain contract reads following `viem-integration` patterns

## Technical Details

### Fee Calculation
Uncollected fees use the on-chain feeGrowthInside math from UniswapV3Pool. Reads `feeGrowthGlobal0X128`, `feeGrowthGlobal1X128` from the pool, `feeGrowthOutside0X128`/`feeGrowthOutside1X128` from both boundary ticks, and the position's `feeGrowthInsideLastX128` to compute real accrued fees. `tokensOwed` (previously collected but not withdrawn) is added on top.

### IL Calculation
Uses the V3 concentrated liquidity IL formula accounting for the position's specific tick range. Properly amplifies IL relative to concentration ratio.

### Entry Price Resolution
Attempts to find the position's NFT mint block via Transfer event logs, then reads the pool's historical sqrtPriceX96 at that block. Falls back to tick range midpoint with an `(est)` tag. Archive RPC access improves success rate.

### Fee APY
When position age is known (from mint event), annualizes the fee yield: `(feeIncomeUSD / positionValueUSD) * (365 / daysActive)`.

## Limitations

- Entry price from mint events requires archive RPC access for old positions. Free RPCs may reject large log queries. Falls back to tick midpoint with `(est)` tag.
- Full-range positions (meme tokens with extreme tick ranges) show misleading IL estimates.
- Free RPC endpoints may rate-limit; 5 retries with 2s delay built in.
- onchainos requires VPN; CoinGecko batch fallback covers major tokens on all 4 chains.
- X Layer not supported (V3 NPM not deployed there as of April 2026).
- Positions with liquidity > 9e15 may have reduced precision due to JavaScript number limits.
