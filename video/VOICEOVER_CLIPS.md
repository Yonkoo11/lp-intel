# LP Intel Demo — Voiceover Clips

## Clip 01: hook
**Frame:** Terminal showing real position output (WETH/USDC, prices, fees, IL, risk)
**Text:** This tool reads any wallet's LP positions and tells you exactly what they're worth. Fees earned, impermanent loss, risk level. All from on-chain data.

## Clip 02: problem
**Frame:** Terminal showing "No positions found" or empty Uniswap interface
**Text:** AI agents can create Uniswap positions. But they can't analyze existing ones. No tool tells an agent whether an LP is making or losing money.

## Clip 03: multi-dex
**Frame:** Terminal showing multi-DEX scan (Uniswap V3, SushiSwap V3, PancakeSwap V3)
**Text:** LP Intel scans three DEXes per chain. Uniswap, SushiSwap, PancakeSwap. One command, four chains, every V3 position in the wallet.

## Clip 04: fees
**Frame:** Terminal output zoomed on fee calculation line showing real dollar amounts
**Text:** Fees aren't just the tokensOwed field. We read feeGrowthGlobal, feeGrowthOutside for both ticks, and compute the real uncollected amount. That's the actual Uniswap V3 pool math.

## Clip 05: entry-price
**Frame:** Terminal showing Days Active: 1231, Fee APY: 4.3%, entry price data
**Text:** Entry prices come from binary-searching the NFT mint block. Twenty-four RPC calls to find exactly when the position was created. Then we pull the historical pool price at that block.

## Clip 06: json
**Frame:** Terminal showing clean JSON output (--json flag)
**Text:** Agents get clean JSON. No terminal colors, no status messages. Just structured data they can act on.

## Clip 07: close
**Frame:** GitHub repo page or project name on dark background
**Text:** LP Intel. Built with OnchainOS and Uniswap AI Skills.
