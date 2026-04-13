# LP Intel - Progress

## What Changed (Plain English)
- Built the full LP analyzer tool from scratch
- It scans any wallet for Uniswap V3 positions on Ethereum/Arbitrum/Base/Polygon
- Shows position value, impermanent loss, uncollected fees, risk level
- Generates Uniswap links to rebalance out-of-range positions
- Tested against real on-chain data and it works

## Current State
- **Phase:** Phase 1 COMPLETE. Core action works end-to-end.
- **Track:** Skill Arena
- **Idea:** LP Risk Intelligence - analyze Uniswap V3 positions for IL, fees, P&L

## What Works
- Position discovery via NonfungiblePositionManager
- Token info resolution (symbol, decimals)
- Pool state reading (sqrtPriceX96, current tick)
- IL calculation (V2 formula as proxy)
- Position value in USD (via CoinGecko fallback)
- Risk assessment (in-range, near-edge, out-of-range)
- Rebalancing deep links to Uniswap
- Multi-chain support (Ethereum, Arbitrum, Base, Polygon)
- JSON output mode for programmatic use

## What's Next
1. Write SKILL.md for hackathon submission
2. Add onchainos price integration (currently using CoinGecko fallback)
3. Improve entry price estimation (currently tick midpoint)
4. Add rebalancing deep link with pre-filled price range
5. Write README
6. Record demo
7. Submit to Moltbook

## Known Limitations (honest)
- Entry price uses tick range midpoint (approximate)
- IL formula is V2 standard, not V3-concentrated (gives directional signal but not exact)
- Full-range positions (meme tokens) show misleading IL
- Uncollected fees show tokensOwed only (not accrued but uncollected)
- onchainos not tested (using CoinGecko fallback)
- Free RPC endpoints are rate-limited, may need retries

## Files
- `src/types.ts` - Chain configs, ABIs, types
- `src/positions.ts` - V3 position reader via viem
- `src/calculations.ts` - IL, token amounts, risk assessment
- `src/onchainos.ts` - OnchainOS + CoinGecko price resolution
- `src/index.ts` - CLI entry point

## Deadline
April 15, 2026 at 23:59 UTC (2 days)
