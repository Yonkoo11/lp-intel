---
name: lp-intel
description: "Use this skill when the user asks to analyze LP positions, check impermanent loss, review Uniswap V3 position health, calculate LP P&L, or assess LP risk. Typical triggers: 'analyze my LP positions', 'check impermanent loss', 'how are my LP positions doing', 'Uniswap position health', 'LP risk analysis', 'show my V3 positions', 'am I losing money on my LP', 'should I rebalance my position'. Supports Ethereum, Arbitrum, Base, and Polygon. Reads on-chain Uniswap V3 position data, calculates token amounts, IL, fees, and risk. Generates Uniswap deep links for rebalancing out-of-range positions."
allowed-tools: Read, Glob, Grep, Bash(npx:*), Bash(node:*), WebFetch
model: sonnet
license: MIT
metadata:
  author: yonkoo11
  version: "1.0.0"
  homepage: "https://github.com/yonkoo11/lp-intel"
---

# LP Intel - Uniswap V3 Position Analyzer

Analyze any wallet's Uniswap V3 LP positions for impermanent loss, fee income, net P&L, and risk.

## What It Does

Given a wallet address and chain, LP Intel:
1. Discovers all Uniswap V3 positions owned by the wallet
2. Reads on-chain position data (tick range, liquidity, uncollected fees via feeGrowthInside math)
3. Gets current pool prices and token metadata
4. Calculates position value, concentrated-liquidity IL, fee income, and net P&L
5. Assesses risk (in-range, near-edge, out-of-range)
6. Generates Uniswap deep links for rebalancing (compatible with liquidity-planner skill format)

## Prerequisites

The `lp-intel` CLI must be installed in the project:

```bash
cd /path/to/lp-intel
npm install
npm run build
```

For price data, the tool uses:
- **onchainos** (preferred): `onchainos market price` for real-time prices via okx-dex-market skill
- **CoinGecko** (fallback): Free API for major tokens across all supported chains
- **Stablecoin defaults**: USDC/USDT/DAI default to $1.00

## Commands

### Analyze Positions

```bash
# Analyze positions on a specific chain
npx tsx src/index.ts analyze <wallet-address> --chain ethereum

# Analyze across all supported chains
npx tsx src/index.ts analyze <wallet-address> --all-chains

# JSON output for programmatic/agent use (no status messages, clean JSON only)
npx tsx src/index.ts analyze <wallet-address> --chain ethereum --json
```

### Supported Chains

| Chain    | Chain ID | NPM Address |
|----------|----------|-------------|
| Ethereum | 1        | 0xC36442b4a4522E871399CD717aBDD847Ab11FE88 |
| Arbitrum | 42161    | 0xC36442b4a4522E871399CD717aBDD847Ab11FE88 |
| Base     | 8453     | 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1 |
| Polygon  | 137      | 0xC36442b4a4522E871399CD717aBDD847Ab11FE88 |

## Output Format

For each position:

```
Position #378780 -- USDC/WETH (0.05% fee)
Chain: Ethereum | Status: OUT OF RANGE

  Price Range:    0.000773 -- 0.000797 WETH/USDC
  Current Price:  0.000448 WETH/USDC

  Token Amounts:  19.93 USDC + 0.00 WETH
  Position Value: $19.93

  Uncollected Fees: +$2.77 (USDC: 1.01, WETH: 0.000788)
  Impermanent Loss: -$7.39 (-27.04%)
  Net P&L:          -$4.62 (-16.91%)

  Risk: HIGH -- Price is outside position range
  Action: REBALANCE -- not earning fees

  [Rebalance on Uniswap](https://app.uniswap.org/positions/create?...)
```

JSON output (`--json`) returns a clean array of position objects with all fields, suitable for agent consumption. BigInt values are serialized as strings.

## Integration with OnchainOS

LP Intel uses the `onchainos market price` command (from the `okx-dex-market` skill) for real-time token pricing. When onchainos is unavailable, it falls back to CoinGecko.

## Integration with Uniswap AI Skills

- Generates rebalancing deep links in the same URL format as the `liquidity-planner` skill (including fee tier, tick spacing, and step params)
- Uses viem for on-chain contract reads, following the same patterns as the `viem-integration` foundation

## Execution Flow

```
User: "analyze LP positions for 0xABC on Ethereum"
                    |
                    v
    1. Read NonfungiblePositionManager.balanceOf(0xABC)
    2. For each position: read tick range, liquidity, feeGrowthInsideLastX128
    3. Get pool sqrtPriceX96 from V3 Pool.slot0()
    4. Get pool feeGrowthGlobal + tick feeGrowthOutside for fee math
    5. Get token prices (onchainos -> CoinGecko -> stablecoin default)
    6. Calculate: amounts, value, concentrated IL, real uncollected fees, risk
    7. Display formatted report (or JSON for agents)
    8. For out-of-range: generate Uniswap rebalance deep link
```

## Technical Details

### Fee Calculation
Uncollected fees are computed using the actual on-chain feeGrowthInside math from UniswapV3Pool, not just the `tokensOwed` field (which only reflects fees from before the last collect/increaseLiquidity call). The formula reads `feeGrowthGlobal`, `feeGrowthOutside` for both boundary ticks, and the position's `feeGrowthInsideLastX128` to compute the real accrued fees.

### IL Calculation
Impermanent loss uses the V3 concentrated liquidity formula, accounting for the position's specific tick range. This properly amplifies IL relative to the concentration ratio, unlike the V2 infinite-range approximation.

## Limitations

- Entry price estimation uses tick range midpoint (approximate, not historical). Positions with very wide ranges (full-range meme tokens) will show misleading IL.
- Uncollected fees use on-chain feeGrowthInside math (accurate). tokensOwed (previously collected but not withdrawn) is added on top.
- Free RPC endpoints may rate-limit; retries are built in (5 retries, 2s delay).
- onchainos requires VPN for API calls; CoinGecko fallback covers major tokens on all supported chains.
- X Layer is not supported (Uniswap V3 NonfungiblePositionManager not deployed on X Layer as of April 2026).
- For very large positions (liquidity > 9e15), token amounts may have reduced precision due to JavaScript number limitations.
