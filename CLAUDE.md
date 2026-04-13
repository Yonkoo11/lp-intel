# LP Intel - Uniswap V3 Position Analyzer

## What This Is
A CLI tool + AI skill that analyzes any wallet's Uniswap V3 LP positions. Shows impermanent loss, fee income, risk level, and generates rebalancing links.

## Quick Start
```bash
npm install
npx tsx src/index.ts analyze <wallet-address> --chain ethereum
npx tsx src/index.ts analyze <wallet-address> --chain ethereum --json  # clean JSON for agents
```

## Hackathon Context
- **Build X Season 2** - OKX X Layer AI Hackathon
- **Track:** Skills Arena
- **Deadline:** April 15, 2026
- **Integrates:** OnchainOS (okx-dex-market for prices) + Uniswap AI Skills (liquidity-planner deep link format, viem patterns)

## Project Structure
```
src/
  types.ts          - Chain configs, ABIs, shared types
  positions.ts      - V3 position reader via viem multicall
  calculations.ts   - V3 concentrated IL, feeGrowthInside fees, token amounts, risk
  onchainos.ts      - OnchainOS CLI wrapper + CoinGecko fallback
  index.ts          - Commander CLI entry point
SKILL.md            - Skill definition for Plugin Store
```

## Key Technical Decisions
1. **viem for contract reads** - OnchainOS can't do read-only calls
2. **onchainos market price for pricing** - with CoinGecko fallback when VPN not available
3. **V3 concentrated IL formula** - accounts for tick range, not the simplified V2 formula
4. **Real fee math** - feeGrowthGlobal + feeGrowthOutside ticks, not just tokensOwed
5. **Tick midpoint for entry price** - approximate since contracts don't store creation price
6. **Free RPCs** - 1rpc.io for Ethereum, public endpoints for other chains
