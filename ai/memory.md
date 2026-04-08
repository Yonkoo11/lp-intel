# LP Intel - AI Memory

## Phase 1 Gate (MUST PASS BEFORE ANY OTHER WORK)
Core Action: AI agent calls the skill with a wallet address + Uniswap pool address, gets back impermanent loss calculation and current tick risk assessment
Success Test: Skill returns correct IL% for a known Uniswap V3 position (within 5% of manual calculation)
Min Tech: OnchainOS skills (dex-market, wallet-portfolio) + Uniswap AI skills (liquidity-planner) + basic MCP exposure
NOT Phase 1: x402 premium tier, web dashboard, historical analysis, rebalance automation, landing page, demo video
Status: [ ] NOT STARTED

## Hackathon Details
- **Name:** Build X Season 2 (OKX X Layer AI Hackathon)
- **Deadline:** April 15, 2026
- **Track:** Skills Arena (23,000 USDT prize pool)
- **Special prizes targeting:** Best x402 (500), Best MCP (500), Best Agent Economy Loop (500)
- **Total potential:** 24,500 USDT
- **URL:** https://web3.okx.com/xlayer/build-x-hackathon

## Judging Criteria (from past OKX hackathons)
- Problem scope
- Design/UX
- Smart contract engineering
- Frontend/backend engineering
- Composability (KEY: skills must be reusable by other agents)

## Chosen Idea
LP Risk Intelligence Skill - OnchainOS skill giving AI agents per-tick LP position analysis (IL risk, optimal rebalance ranges, cost basis). Combines research ideas #3 (LP tax, Tier 1) and #5 (DeFi param sim, Tier 1).

## Competitive Landscape
- Awaken Tax: 25K users, basic IL but NO per-tick V3 analysis (roadmap only)
- APY.vision + Amberdata: basic IL dashboards
- Zero competitors in agent skill format
- Window: 6-12 months before Awaken ships V3

## Fatal Flaws (must address)
1. X Layer Uniswap liquidity is thin - may need to demo with mainnet Ethereum data
2. Uniswap V3 tick math is complex - concentrated liquidity IL calculation is non-trivial
3. OnchainOS skill format is new - limited docs/examples for custom skills

## Required Tech Stack
- OnchainOS: dex-market, wallet-portfolio, x402-payment, MCP server
- Uniswap AI: liquidity-planner, swap-planner skills
- Deploy on X Layer mainnet
- Install: `npx skills add okx/onchainos-skills` + `npx skills add uniswap/uniswap-ai`

## Deliverables Checklist
- [ ] GitHub repo with working skill
- [ ] Demo video showing agent using the skill
- [ ] Deployed on X Layer mainnet
- [ ] BUIDL submission (likely DoraHacks)
- [ ] Must include OKX DEX API integration

## Build Phases
1. Phase 1: Core skill - agent queries, gets IL risk (Days 1-3)
2. Phase 2: x402 premium tier + MCP exposure (Days 3-4)
3. Phase 3: Agent economy loop demo + full submission features (Days 5-6)
4. Phase 4: Demo video + polish (Day 7)
