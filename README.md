# LP Intel

**Uniswap V3 LP Position Analyzer** - Analyze impermanent loss, fees, P&L, and risk for any wallet's Uniswap V3 positions.

Built for [Build X Season 2](https://buildx.okx.com) Skill Arena track.

## What It Does

Point it at any wallet address and get a full breakdown of their Uniswap V3 positions:

- **Position Discovery** - Finds all V3 positions via NonfungiblePositionManager
- **Value Calculation** - Token amounts and USD value at current prices
- **Impermanent Loss** - V3 concentrated IL calculation accounting for tick range
- **Fee Income** - Real uncollected fees via on-chain feeGrowthInside math
- **Risk Assessment** - In-range, near-edge, or out-of-range status
- **Rebalancing** - Generates Uniswap deep links for out-of-range positions

## Quick Start

```bash
npm install
npx tsx src/index.ts analyze 0xYourWalletAddress --chain ethereum
```

## Usage

```bash
# Single chain
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
Position #378780 -- WETH/USDC (0.05% fee)
Chain: Ethereum | Status: OUT OF RANGE

  Price Range:    1,255.19 -- 1,293.42 USDC/WETH
  Current Price:  2,258.26 USDC/WETH

  Token Amounts:  19.93 USDC + 0.00 WETH
  Position Value: $19.93

  Uncollected Fees: +$2.79 (USDC: 1.01, WETH: 0.000788)
  Impermanent Loss: -$7.59 (-27.59%)
  Net P&L:          -$4.80 (-17.45%)

  Risk: HIGH -- Price is outside position range
  Action: REBALANCE -- not earning fees

  [Rebalance on Uniswap](https://app.uniswap.org/positions/create?...)
```

## How It Works

1. Reads `balanceOf` and `positions` from Uniswap V3's NonfungiblePositionManager
2. Gets pool state from `slot0` + `feeGrowthGlobal` + tick `feeGrowthOutside`
3. Resolves token prices via onchainos or CoinGecko
4. Calculates token amounts using V3 concentrated liquidity math
5. Computes real uncollected fees using feeGrowthInside differential
6. Estimates IL using V3 concentrated formula (accounts for tick range)
7. Assesses risk based on current price position within the tick range

## OnchainOS Integration

- `onchainos market price` (okx-dex-market skill) for real-time token prices
- Falls back to CoinGecko when onchainos is unavailable

## Uniswap AI Skills Integration

- Generates deep links compatible with the `liquidity-planner` skill format (includes fee tier, tick spacing)
- Uses viem for contract reads (same approach as `viem-integration` skill)

## Tech Stack

- **TypeScript** with ESM modules
- **viem** for EVM contract reads and multicall
- **commander** for CLI
- **onchainos** + CoinGecko for price data

## License

MIT
