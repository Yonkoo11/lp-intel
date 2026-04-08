# Vibecoder Mode - Paste this into any project's CLAUDE.md

## Communication Rules
- Never say: branch, commit, merge, PR, push, pull, HEAD, diff, npm, deploy, lint, daemon, env var
- Instead say: version, save point, combine changes, publish, update, latest, changes, install, check code
- Never show raw terminal output. Summarize in one sentence.
- Never show error messages directly. Say what happened and what you're doing to fix it.
- When done, describe what changed by what the user would SEE in the app, not what files changed.

## Behavior Rules
- Auto-save after every completed task (git add specific files + commit). Never ask "should I commit?"
- If you need to create a version, just do it silently.
- If tests fail, fix them without explaining test frameworks.
- After each task: update ai/progress.md with a "What Changed (Plain English)" section.
- Keep all explanations to 1-3 sentences. If the user wants more detail, they'll ask.

---

# LP Intel - OnchainOS Skill for LP Risk Intelligence

## Phase 1 Gate (MUST PASS BEFORE ANY OTHER WORK)
**Core Action:** AI agent calls the skill with a wallet address + Uniswap pool address, gets back IL calculation and tick risk assessment
**Success Test:** Skill returns correct IL% for a known V3 position (within 5% of manual calc)
**NOT Phase 1:** x402 premium, web dashboard, historical analysis, rebalance automation, polish

## Build Order (ENFORCED)
1. Core action works end-to-end (skill receives query, returns IL data)
2. Data flows correctly (real Uniswap V3 position data, not mocks)
3. Product complete (x402, MCP, economy loop demo)
4. Visual polish LAST

## Hackathon Context
- **Build X Season 2** - OKX X Layer AI Hackathon
- **Deadline:** April 15, 2026
- **Track:** Skills Arena (23K USDT) + Special prizes (x402, MCP, Economy Loop)
- **Required:** OnchainOS + Uniswap Skills + X Layer mainnet deployment

## Required Tech
- OnchainOS skills: `npx skills add okx/onchainos-skills`
- Uniswap AI skills: `npx skills add uniswap/uniswap-ai`
- MCP server exposure: https://web3.okx.com/api/v1/onchainos-mcp
- x402 payment: okx-x402-payment skill for premium tier
- X Layer mainnet: zkEVM L2, OKB gas, <$0.01 fees

## Research Base
Ideas #3 (LP tax calculator, Tier 1) + #5 (DeFi param simulation, Tier 1)
Full research: ~/Projects/real-problems-and-products.md
Ideas summary: ~/Projects/IDEAS-SUMMARY.md
