# LP Intel

**Concentrated Liquidity Position Analyzer** - Analyze impermanent loss, fees, P&L, and risk for V3 positions across Uniswap, SushiSwap, and PancakeSwap.

Built for [Build X Season 2](https://buildx.okx.com) Skill Arena track.

## What It Does

Point it at any wallet address and get a full breakdown of their concentrated liquidity positions:

- **Multi-DEX** - Scans Uniswap V3, SushiSwap V3, and PancakeSwap V3 per chain
- **Position Discovery** - Finds all positions via NonfungiblePositionManager
- **Value Calculation** - Token amounts and USD value at current prices
- **Impermanent Loss** - V3 concentrated IL accounting for tick range
- **Fee Income** - Real uncollected fees via on-chain feeGrowthInside math
- **Fee APY** - Annualized fee yield when position age is known
- **Risk Assessment** - In-range, near-edge, or out-of-range status
- **Rebalancing** - Generates Uniswap deep links for out-of-range positions

## Quick Start

```bash
npm install
npx tsx src/index.ts analyze 0xYourWalletAddress --chain ethereum
```

## Usage

```bash
# Single chain (scans all DEXes on that chain)
npx tsx src/index.ts analyze <address> --chain ethereum
npx tsx src/index.ts analyze <address> --chain arbitrum
npx tsx src/index.ts analyze <address> --chain base
npx tsx src/index.ts analyze <address> --chain polygon

# All chains at once
npx tsx src/index.ts analyze <address> --all-chains

# JSON output (clean, no status messages -- for agent/programmatic use)
npx tsx src/index.ts analyze <address> --chain ethereum --json
```

## Example Output

```
Position #378780 -- WETH/USDC (0.05% fee) [Uniswap V3]
Chain: Ethereum | Status: OUT OF RANGE

  Price Range:    1,255.19 -- 1,293.42 USDC/WETH
  Current Price:  2,356.74 USDC/WETH

  Token Amounts:  19.93 USDC + 0.00 WETH
  Position Value: $19.93

  Uncollected Fees: +$2.87 (USDC: 1.01, WETH: 0.000788)
  Impermanent Loss: -$8.36 (-29.55%) (est)
  Net P&L:          -$5.49 (-19.41%)

  Risk: HIGH -- Price is outside position range
  Action: REBALANCE -- not earning fees

  [Rebalance on Uniswap](https://app.uniswap.org/positions/create?...)
```

## How It Works

1. Scans all V3-fork DEXes on each chain via their NonfungiblePositionManager
2. Gets pool state: `slot0` + `feeGrowthGlobal` + tick `feeGrowthOutside`
3. Resolves token prices via onchainos or CoinGecko (batch API)
4. Calculates token amounts using V3 concentrated liquidity math
5. Computes real uncollected fees using feeGrowthInside differential
6. Resolves entry price from NFT mint Transfer event (falls back to tick midpoint)
7. Estimates IL using V3 concentrated formula (accounts for tick range)
8. Calculates fee APY when position age is known
9. Assesses risk based on current price position within the tick range

## Supported Chains and DEXes

| Chain    | DEXes |
|----------|-------|
| Ethereum | Uniswap V3, SushiSwap V3, PancakeSwap V3 |
| Arbitrum | Uniswap V3, SushiSwap V3 |
| Base     | Uniswap V3, SushiSwap V3 |
| Polygon  | Uniswap V3, SushiSwap V3 |

## OnchainOS Integration

- `onchainos market price` (okx-dex-market skill) for real-time token prices
- Falls back to CoinGecko batch API when onchainos is unavailable

## Uniswap AI Skills Integration

- Generates deep links compatible with the `liquidity-planner` skill format (includes fee tier, tick spacing)
- Uses viem for contract reads (same approach as `viem-integration` skill)

## Tech Stack

- **TypeScript** with ESM modules
- **viem** for EVM contract reads and multicall
- **commander** for CLI
- **onchainos** + CoinGecko for price data

## Verified Accuracy

- Price: within 0.008% of direct on-chain sqrtPriceX96 calculation
- Token amounts: mathematically verified against V3 concentrated liquidity formula
- Fees: real feeGrowthInside math, not just tokensOwed

## License

MIT
