# LP Intel - Concentrated Liquidity Position Analyzer

## What This Is
CLI tool + AI skill that analyzes any wallet's V3 LP positions across Uniswap, SushiSwap, and PancakeSwap. Shows impermanent loss, real uncollected fees, fee APY, risk level, and generates rebalancing links.

## Quick Start
```bash
npm install
npx tsx src/index.ts analyze <wallet-address> --chain ethereum
npx tsx src/index.ts analyze <wallet-address> --chain ethereum --json
```

## Hackathon Context
- **Build X Season 2** - OKX X Layer AI Hackathon
- **Track:** Skills Arena
- **Deadline:** April 15, 2026
- **Integrates:** OnchainOS (okx-dex-market for prices) + Uniswap AI Skills (liquidity-planner deep link format, viem patterns)

## Project Structure
```
src/
  types.ts          - Chain configs, ABIs, DEX registry, shared types
  positions.ts      - V3 position reader via viem multicall
  calculations.ts   - V3 concentrated IL, feeGrowthInside fees, token amounts, fee APY, risk
  onchainos.ts      - OnchainOS CLI wrapper + CoinGecko batch fallback
  history.ts        - Entry price resolution from NFT mint Transfer events
  index.ts          - Commander CLI, multi-DEX scanning, human-readable output
SKILL.md            - Skill definition for Plugin Store
```

## Key Technical Decisions
1. **viem for contract reads** - OnchainOS can't do read-only calls
2. **onchainos market price** - with CoinGecko batch fallback
3. **V3 concentrated IL formula** - accounts for tick range concentration
4. **Real fee math** - feeGrowthGlobal + feeGrowthOutside ticks, not just tokensOwed
5. **Entry price from mint events** - Transfer(0x0) log lookup with estimated-block optimization
6. **Multi-DEX** - Same ABI, different NPM addresses per DEX
7. **Price display** - Detects stablecoin pairs and inverts for human-readable output
