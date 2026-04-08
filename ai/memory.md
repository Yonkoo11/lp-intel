# Agent Market - AI Memory

## Phase 1 Gate (MUST PASS BEFORE ANY OTHER WORK)
Core Action: Agent A registers an x402-gated service on X Layer. Agent B discovers it via MCP tool. Agent B calls it and pays via x402. Agent B gets a result back.
Success Test: End-to-end: register → discover → pay x402 → receive response. All on X Layer mainnet.
Min Tech: Solidity registry contract on X Layer + MCP server with register/discover/call tools + onchainos x402-payment
NOT Phase 1: Multiple services, fancy UI, complex risk scoring engine, landing page, branding
Status: [ ] NOT STARTED

## Hackathon Details (CORRECTED from official SKILL.md)
- **Name:** Build X Season 2 (OKX X Layer AI Hackathon)
- **Deadline:** April 15, 2026 at 23:59 UTC
- **Track:** X Layer Arena (7,000 USDT pool)
- **Prizes:** 1st 2,000 / 2nd 1,200x2 / 3rd 600x3 / Special: Most Active Agent 400 / Most Popular 400
- **Max with stacking:** 2,400 USDT (1st + Most Active)
- **Submission:** Moltbook m/buildx (NOT DoraHacks)
- **Requirement:** Must vote on 5+ other projects to be prize-eligible
- **URL:** https://web3.okx.com/xlayer/build-x-hackathon
- **Hackathon skill installed:** ~/.claude/skills/okx-buildx-hackathon-agent-track/

## Judging Criteria (OFFICIAL, each 25%)
1. OnchainOS / Uniswap Integration & Innovation (depth, creative combinations)
2. X Layer Ecosystem Fit (real on-chain use cases)
3. AI Interaction Experience (makes on-chain ops smarter/more natural)
4. Product Completeness (actually runs, core flows work end-to-end)

## Chosen Idea
Agent Market - On-chain service registry where AI agents register x402-gated services, other agents discover them, and payments flow automatically. Infrastructure for the agent economy on X Layer.

## Why This Wins (CZ/Jeff test)
- CZ built the exchange (infrastructure), not a trading bot (feature)
- Jeff built the order book on-chain, not a DEX frontend
- We build the agent service marketplace, not another DeFi tool
- X Layer has $25M TVL -- too thin for DeFi optimization, perfect for agent infra
- Aave: $230K. Uniswap V3: $12.7M. The DeFi ecosystem is 1.5 protocols. No point optimizing.
- What X Layer NEEDS: activity, network effects, reasons for agents to transact

## Architecture
1. **Smart contract** (Solidity, X Layer mainnet): Service registry
   - registerService(name, endpoint, price, description, paymentToken)
   - getServices() / getServicesByCategory()
   - getService(serviceId)
   - Simple mapping, no complex logic needed
2. **MCP server** (TypeScript): New tools for agents
   - register_service: register your x402 endpoint in the on-chain registry
   - discover_services: search available services by category
   - use_service: call a discovered service (auto-handles x402 payment via onchainos)
3. **Demo service**: Token risk scorer
   - x402-gated endpoint: takes token address, returns composite risk score
   - Uses onchainos security scan + Uniswap liquidity depth check
   - Registered in the Agent Market registry
4. **SKILL.md**: Teaches agents how to use Agent Market

## Competitive Landscape
- Zero competitors. Nobody has built agent service discovery for x402.
- Plugin Store is the closest but it's for skills (instructions), not live x402 services.
- Autonolas/OLAS has agent registry but it's a different chain and different model (NFT agents).

## Fatal Flaws (must address)
1. OKX API needs VPN -- development and demos require VPN
2. Smart contract is simple -- judges might want more complexity. Counter: simplicity IS the point. Complex infra doesn't get adopted.
3. Bootstrap problem: empty registry isn't useful. Counter: we register our own demo service + the demo shows the full loop.
4. Off-chain services can go down. Counter: true of all APIs; future version could add heartbeat/staking.

## Required Tech Stack
- Solidity: Service registry contract
- Hardhat/Foundry: Deploy to X Layer mainnet (RPC: rpc.xlayer.tech, Chain ID: 196)
- TypeScript: MCP server (uses rmcp or custom)
- OnchainOS: x402-payment (for paying services), security (for demo service), dex-token (for demo service)
- Uniswap: pay-with-any-token (swap then pay x402), swap-integration (liquidity depth check for demo)
- onchainos CLI: v2.2.6 installed at ~/.local/bin/onchainos

## Deliverables Checklist
- [ ] Smart contract deployed on X Layer mainnet
- [ ] MCP server with register/discover/use tools
- [ ] Demo service (token risk scorer) registered and callable
- [ ] SKILL.md teaching agents to use Agent Market
- [ ] Demo video showing full agent economy loop
- [ ] GitHub repo
- [ ] BUIDL submission

## Build Phases
1. Phase 1 (Days 1-2): Smart contract + deploy on X Layer mainnet
2. Phase 2 (Days 3-4): MCP server with register/discover/use_service tools
3. Phase 3 (Days 5-6): Demo service + end-to-end x402 payment flow
4. Phase 4 (Day 7): SKILL.md, demo video, submission
