# LP Intel - Uniswap V3 Position Analyzer

## What This Is
A CLI tool + AI skill that analyzes any wallet's Uniswap V3 LP positions. Shows impermanent loss, fee income, risk level, and generates rebalancing links.

## Quick Start
```bash
npm install
npx tsx src/index.ts analyze <wallet-address> --chain ethereum
```

## Hackathon Context
- **Build X Season 2** - OKX X Layer AI Hackathon
- **Track:** Skills Arena
- **Deadline:** April 15, 2026
- **Integrates:** OnchainOS (prices, wallet, DeFi portfolio) + Uniswap AI Skills (liquidity-planner, viem)

## Project Structure
```
src/
  types.ts          - Chain configs, ABIs, shared types
  positions.ts      - V3 position reader via viem multicall
  calculations.ts   - IL, token amounts, risk assessment
  onchainos.ts      - OnchainOS CLI wrapper + CoinGecko fallback
  index.ts          - Commander CLI entry point
SKILL.md            - Skill definition for Plugin Store
```

## Key Technical Decisions
1. **viem for contract reads** - OnchainOS can't do read-only calls
2. **onchainos for prices** - with CoinGecko fallback when VPN not available
3. **V2 IL formula** - simpler, gives directional signal (not exact V3 concentrated IL)
4. **Tick midpoint for entry price** - approximate since contracts don't store creation price
5. **Free RPCs** - 1rpc.io for Ethereum, public endpoints for other chains
