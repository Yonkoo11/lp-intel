# Fix Plan - LP Intel

## Tasks

- [ ] Task 1: Set up project skeleton with OnchainOS + Uniswap skill dependencies
  - Acceptance: `npx skills add okx/onchainos-skills` and `npx skills add uniswap/uniswap-ai` install successfully, project structure matches OnchainOS skill format
  - Files: package.json, src/index.ts, skill manifest

- [ ] Task 2: Implement Uniswap V3 IL calculation engine
  - Acceptance: Given token0Price at entry, token0Price now, tickLower, tickUpper -> returns IL% that matches manual calculation within 5%
  - Files: src/il-calculator.ts

- [ ] Task 3: Wire skill to OnchainOS dex-market for live price/tick data
  - Acceptance: Skill queries a real Uniswap V3 pool and gets current tick, liquidity, token prices
  - Files: src/data-fetcher.ts

- [ ] Task 4: Build core skill tool: `analyze_lp_position(wallet, pool_address)`
  - Acceptance: Agent calls tool, gets back { il_percent, current_tick, position_range, risk_level, rebalance_suggestion }
  - Files: src/tools/analyze-position.ts

- [ ] Task 5: Expose skill via MCP server interface
  - Acceptance: MCP-compatible client can discover and call the analyze_lp_position tool
  - Files: src/mcp-server.ts

- [ ] Task 6: Add x402 premium tier (historical IL, optimized range suggestions)
  - Acceptance: Free tier returns basic IL. x402-gated tier returns historical analysis + range optimization
  - Files: src/tools/premium-analysis.ts, src/x402-gate.ts

- [ ] Task 7: Deploy skill infrastructure on X Layer mainnet
  - Acceptance: Skill is accessible and functional when pointed at X Layer RPC
  - Files: deploy config, .env.example

- [ ] Task 8: Create demo showing agent economy loop
  - Acceptance: Video/demo shows: agent pays x402 -> gets LP intelligence -> decides to rebalance -> cycle visible
  - Files: demo/

## Completed
(builder fills this in)
