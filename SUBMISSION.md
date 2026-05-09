## Project Name & One-Line Description

LP Intel — reads any wallet's V3 LP positions and tells you if you're making or losing money

## Project Highlights

Agents can create Uniswap positions but can't analyze existing ones. LP Intel fills that gap.

It scans Uniswap V3, SushiSwap V3, and PancakeSwap V3 across Ethereum, Arbitrum, Base, and Polygon. One command, three DEXes, four chains.

The fee calculation uses actual feeGrowthInside math from the pool contract — not just the tokensOwed field, which only updates on collect/increaseLiquidity. We read feeGrowthGlobal, feeGrowthOutside for both boundary ticks, and compute the real uncollected amount.

Entry prices come from binary-searching the NFT mint block using positions(tokenId) at historical blocks. 24 eth_call RPCs to find the exact creation block, then we read the pool's sqrtPriceX96 at that block. No subgraph, no indexer, just the chain.

Output includes position value, concentrated IL (not the V2 approximation), fee APY, risk level, and Uniswap deep links for rebalancing out-of-range positions. JSON mode gives agents clean structured data with no terminal formatting mixed in.

Price accuracy verified within 0.008% of direct on-chain sqrtPriceX96 calculation. Token amounts mathematically verified against the V3 concentrated liquidity formula.

## Your Track

Skills Arena

## Team Members & Contact Information

Alex — solo builder — @yonkoo11

## Agentic Wallet Address

0x1615b19fc44bfa9966b4ef4aaa409d0dfe96ad9a

## GitHub Repository Link

https://github.com/Yonkoo11/lp-intel

## OnchainOS Usage

onchainos market price (okx-dex-market skill) for real-time token pricing. The tool tries onchainos first, falls back to CoinGecko batch API when unavailable. SKILL.md follows the onchainos-skills format so it can be discovered in the Plugin Store.

## Demo Video Link

PASTE YOUR YOUTUBE LINK HERE

## X (Twitter) Post Link

PASTE YOUR X POST LINK HERE
