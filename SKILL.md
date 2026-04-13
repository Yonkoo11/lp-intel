---
name: lp-intel
description: "Use this skill when the user asks to analyze LP positions, check impermanent loss, review Uniswap V3 position health, calculate LP P&L, or assess LP risk. Typical triggers: 'analyze my LP positions', 'check impermanent loss', 'how are my LP positions doing', 'Uniswap position health', 'LP risk analysis', 'show my V3 positions', 'am I losing money on my LP', 'should I rebalance my position'. Supports Ethereum, Arbitrum, Base, and Polygon. Reads on-chain Uniswap V3 position data, calculates token amounts, IL, fees, and risk. Generates Uniswap deep links for rebalancing out-of-range positions."
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
2. Reads on-chain position data (tick range, liquidity, uncollected fees)
3. Gets current pool prices and token metadata
4. Calculates position value, impermanent loss, fee income, and net P&L
5. Assesses risk (in-range, near-edge, out-of-range)
6. Generates Uniswap deep links for rebalancing

## Prerequisites

The `lp-intel` CLI must be installed in the project:

```bash
cd /path/to/lp-intel
npm install
npm run build
```

For price data, the tool uses:
- **onchainos** (preferred): `onchainos market price` for real-time prices
- **CoinGecko** (fallback): Free API for common tokens (ETH, USDC, USDT, DAI, WBTC)
- **Stablecoin defaults**: USDC/USDT/DAI default to $1.00

## Commands

### Analyze Positions

```bash
# Analyze positions on a specific chain
npx tsx src/index.ts analyze <wallet-address> --chain ethereum

# Analyze across all supported chains
npx tsx src/index.ts analyze <wallet-address> --all-chains

# JSON output for programmatic use
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
Position #12345 -- ETH/USDC (0.30% fee)
Chain: Ethereum | Status: IN RANGE

  Price Range:    3,100 -- 3,500 USDC/ETH
  Current Price:  3,285 USDC/ETH

  Token Amounts:  0.42 ETH + 820 USDC
  Position Value: $2,201

  Uncollected Fees: +$124
  Impermanent Loss: -$48 (-2.1%)
  Net P&L:          +$76 (+3.5%)

  Risk: LOW -- price is 53% through range
  Action: HOLD -- position healthy
```

For out-of-range positions, a rebalancing link is generated:
```
  [Rebalance on Uniswap](https://app.uniswap.org/positions/create?chain=ethereum&currencyA=0x...&currencyB=0x...)
```

## Integration with OnchainOS

LP Intel integrates with the following onchainos skills:

| Skill | Usage |
|-------|-------|
| `okx-dex-market` | Token prices via `onchainos market price` |
| `okx-wallet-portfolio` | Wallet context and multi-chain balance |
| `okx-defi-portfolio` | DeFi position discovery across chains |

## Integration with Uniswap AI Skills

| Skill | Usage |
|-------|-------|
| `liquidity-planner` | Generates deep links for rebalancing out-of-range positions |
| `viem-integration` | Foundation for on-chain contract reads |

## Execution Flow

```
User: "analyze LP positions for 0xABC on Ethereum"
                    |
                    v
    1. Read NonfungiblePositionManager.balanceOf(0xABC)
    2. For each position: read tick range, liquidity, fees
    3. Get pool sqrtPriceX96 from V3 Pool.slot0()
    4. Get token prices (onchainos -> CoinGecko -> stablecoin default)
    5. Calculate: amounts, value, IL, fees, risk
    6. Display formatted report
    7. For out-of-range: generate Uniswap rebalance link
```

## Limitations

- Entry price estimation uses tick range midpoint (approximate, not historical)
- IL formula is standard V2 (directional signal, not exact V3 concentrated)
- Full-range positions (e.g., meme tokens with extreme tick ranges) may show misleading IL
- tokensOwed reflects accrued-but-uncollected fees only
- Free RPC endpoints may rate-limit; retries are built in
- onchainos requires VPN for API calls (CoinGecko fallback available)
