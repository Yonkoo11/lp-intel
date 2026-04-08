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

# Agent Market - On-chain Service Registry for AI Agent Economy

## Phase 1 Gate (MUST PASS BEFORE ANY OTHER WORK)
**Core Action:** Agent A registers an x402-gated service on X Layer. Agent B discovers it via MCP. Agent B calls it, pays x402, gets result back.
**Success Test:** End-to-end loop works: register → discover → pay x402 → receive response. All on X Layer mainnet.
**NOT Phase 1:** Multiple services, UI, complex scoring, landing page, branding

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
- Solidity: Service registry contract (deploy via Hardhat/Foundry)
- X Layer mainnet: RPC rpc.xlayer.tech, Chain ID 196, OKB gas, <$0.01 fees
- OnchainOS CLI: v2.2.6 at ~/.local/bin/onchainos (needs VPN for API calls)
- OnchainOS skills: x402-payment, security, dex-token
- Uniswap AI: pay-with-any-token, swap-integration (liquidity depth)
- TypeScript MCP server for new tools (register/discover/use_service)
- SKILL.md for Plugin Store submission

## Key Reference Files
- onchainos-skills repo cloned at: _onchainos-skills/
- uniswap-ai repo cloned at: _uniswap-ai/
- x402 payment skill: _onchainos-skills/skills/okx-x402-payment/SKILL.md
- MCP server source: _onchainos-skills/cli/src/mcp/mod.rs (1846 lines, Rust)
- Uniswap pay-with-any-token: _uniswap-ai/packages/plugins/uniswap-trading/skills/pay-with-any-token/SKILL.md

## X Layer DeFi Reality (verified April 8 via DeFiLlama)
- Total TVL: $25.4M
- Uniswap V3: $12.69M (half the chain)
- Aave V3: $0.23M (launched March 30)
- Everything else: dust
- This is why we build INFRASTRUCTURE, not DeFi optimization
