# Fix Plan - Agent Market

## Tasks

- [ ] Task 1: Write ServiceRegistry.sol smart contract
  - Acceptance: Contract compiles. Has registerService, getServices, getService functions. Stores name, endpoint URL, price, description, payment token, owner.
  - Files: contracts/ServiceRegistry.sol

- [ ] Task 2: Deploy ServiceRegistry to X Layer mainnet
  - Acceptance: Contract deployed and verified on X Layer explorer. Address saved to .env.example and README.
  - Files: hardhat.config.ts or foundry.toml, scripts/deploy.ts
  - Note: X Layer RPC: rpc.xlayer.tech, Chain ID: 196, gas token: OKB

- [ ] Task 3: Build MCP server with register_service tool
  - Acceptance: MCP client can call register_service(name, endpoint, price, description) and it writes to the on-chain registry
  - Files: src/mcp-server.ts, src/tools/register.ts

- [ ] Task 4: Build MCP server discover_services tool
  - Acceptance: MCP client calls discover_services() or discover_services(category) and gets back list of registered services with names, endpoints, prices
  - Files: src/tools/discover.ts

- [ ] Task 5: Build MCP server use_service tool with x402 auto-payment
  - Acceptance: MCP client calls use_service(serviceId, params). Tool discovers endpoint from registry, makes HTTP request, handles x402 payment challenge via onchainos x402-pay, returns service response.
  - Files: src/tools/use-service.ts

- [ ] Task 6: Build demo x402-gated token risk scoring service
  - Acceptance: HTTP endpoint at /score?token=0x... Returns 402 if no payment. Returns {riskScore, factors[]} after x402 payment. Uses onchainos security scan + Uniswap liquidity check internally.
  - Files: services/token-risk/server.ts

- [ ] Task 7: Register demo service in Agent Market and test full loop
  - Acceptance: Demo service registered on-chain. Agent discovers it via MCP. Agent calls use_service, pays x402, gets risk score back. Full loop works end-to-end.
  - Files: scripts/register-demo.ts, test/e2e.test.ts

- [ ] Task 8: Write SKILL.md for Plugin Store
  - Acceptance: SKILL.md with proper YAML frontmatter, teaches agents how to register services, discover services, and use services via Agent Market
  - Files: skills/agent-market/SKILL.md

## Completed
(builder fills this in)
