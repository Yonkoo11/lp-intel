# LP Intel

**Uniswap V3 LP Position Analyzer** - Analyze impermanent loss, fees, P&L, and risk for any wallet's Uniswap V3 positions.

Built for [Build X Season 2](https://buildx.okx.com) Skill Arena track.

## What It Does

Point it at any wallet address and get a full breakdown of their Uniswap V3 positions:

- **Position Discovery** - Finds all V3 positions via NonfungiblePositionManager
- **Value Calculation** - Token amounts and USD value at current prices
- **Impermanent Loss** - IL estimate vs holding the original tokens
- **Fee Income** - Uncollected fees in USD
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

# JSON output
npx tsx src/index.ts analyze <address> --chain ethereum --json
```

## Example Output

```
Position #378780 -- USDC/WETH (0.05% fee)
Chain: Ethereum | Status: OUT OF RANGE

  Price Range:    0.000773 -- 0.000797 WETH/USDC
  Current Price:  0.000448 WETH/USDC

  Token Amounts:  19.93 USDC + 0.00 WETH
  Position Value: $19.93

  Uncollected Fees: +$0.00
  Impermanent Loss: -$0.79 (-3.81%)
  Net P&L:          -$0.79 (-3.81%)

  Risk: HIGH -- Price is outside position range
  Action: REBALANCE -- not earning fees

  [Rebalance on Uniswap](https://app.uniswap.org/positions/create?...)
```

## How It Works

1. Reads `balanceOf` and `positions` from Uniswap V3's NonfungiblePositionManager
2. Gets current pool state from `slot0` (sqrtPriceX96, tick)
3. Resolves token prices via onchainos or CoinGecko
4. Calculates token amounts using V3 concentrated liquidity math
5. Estimates IL using price ratio formula
6. Assesses risk based on current price position within the tick range

## OnchainOS Integration

- `onchainos market price` for real-time token prices
- `onchainos defi positions` for DeFi position discovery
- Falls back to CoinGecko when onchainos is unavailable

## Uniswap AI Skills Integration

- Generates deep links compatible with the `liquidity-planner` skill format
- Uses viem for contract reads (same approach as `viem-integration` skill)

## Tech Stack

- **TypeScript** with ESM modules
- **viem** for EVM contract reads and multicall
- **commander** for CLI
- **onchainos** + CoinGecko for price data

## License

MIT
