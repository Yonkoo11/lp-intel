#!/usr/bin/env node
import { Command } from 'commander';
import { getAddress } from 'viem';
import { CHAINS } from './types.js';
import { getAllPositions, getPoolState, getTokenInfo, getTickData } from './positions.js';
import { analyzePosition } from './calculations.js';
import { resolveTokenPrice } from './onchainos.js';
import type { PositionAnalysis } from './types.js';

const program = new Command();

program
  .name('lp-intel')
  .description('Uniswap V3 LP Position Analyzer')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze Uniswap V3 LP positions for a wallet')
  .argument('<address>', 'Wallet address to analyze')
  .option('-c, --chain <chain>', 'Chain to analyze (ethereum, arbitrum, base, polygon)', 'ethereum')
  .option('--all-chains', 'Analyze across all supported chains')
  .option('--json', 'Output as JSON')
  .action(async (address: string, opts: { chain: string; allChains?: boolean; json?: boolean }) => {
    let addr: `0x${string}`;
    try {
      addr = getAddress(address) as `0x${string}`;
    } catch {
      console.error(`Invalid wallet address: ${address}`);
      process.exit(1);
    }

    const chains = opts.allChains
      ? Object.keys(CHAINS)
      : [opts.chain];

    const log = opts.json ? () => {} : (msg: string) => console.log(msg);
    const logErr = (msg: string) => console.error(msg);

    const allAnalyses: PositionAnalysis[] = [];

    for (const chainName of chains) {
      const chain = CHAINS[chainName];
      if (!chain) {
        logErr(`Unknown chain: ${chainName}`);
        continue;
      }

      log(`\nScanning ${chain.name} for Uniswap V3 positions...`);

      try {
        const positions = await getAllPositions(addr, chain);

        if (positions.length === 0) {
          log(`  No positions found on ${chain.name}`);
          continue;
        }

        // Filter out closed positions (zero liquidity)
        const active = positions.filter((p) => p.liquidity > 0n);
        const closed = positions.length - active.length;
        log(`  Found ${positions.length} positions (${active.length} active, ${closed} closed)`);

        // Cache token info and prices
        const tokenCache = new Map<string, Awaited<ReturnType<typeof getTokenInfo>>>();
        const priceCache = new Map<string, number>();

        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        for (const pos of active) {
          // Get token info
          if (!tokenCache.has(pos.token0)) {
            tokenCache.set(pos.token0, await getTokenInfo(pos.token0, chain));
            await delay(300);
          }
          if (!tokenCache.has(pos.token1)) {
            tokenCache.set(pos.token1, await getTokenInfo(pos.token1, chain));
            await delay(300);
          }
          const token0Info = tokenCache.get(pos.token0)!;
          const token1Info = tokenCache.get(pos.token1)!;

          // Get prices
          if (!priceCache.has(pos.token0)) {
            priceCache.set(pos.token0, await resolveTokenPrice(pos.token0, chainName));
          }
          if (!priceCache.has(pos.token1)) {
            priceCache.set(pos.token1, await resolveTokenPrice(pos.token1, chainName));
          }
          const price0USD = priceCache.get(pos.token0)!;
          const price1USD = priceCache.get(pos.token1)!;

          // Get pool state
          await delay(300);
          const poolState = await getPoolState(pos.token0, pos.token1, pos.fee, chain);

          // Get tick data for fee calculation
          await delay(300);
          let tickLowerData, tickUpperData;
          try {
            [tickLowerData, tickUpperData] = await Promise.all([
              getTickData(poolState.poolAddress, pos.tickLower, chain),
              getTickData(poolState.poolAddress, pos.tickUpper, chain),
            ]);
          } catch {
            // Fall back to tokensOwed only
          }

          // Entry price: use tick range midpoint as rough estimate
          const midTick = (pos.tickLower + pos.tickUpper) / 2;
          const entryPrice = 1.0001 ** midTick * 10 ** (token0Info.decimals - token1Info.decimals);

          const analysis = analyzePosition(
            pos,
            poolState,
            token0Info,
            token1Info,
            price0USD,
            price1USD,
            chain.name,
            entryPrice,
            tickLowerData,
            tickUpperData
          );

          allAnalyses.push(analysis);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  Error scanning ${chain.name}: ${msg}`);
      }
    }

    if (allAnalyses.length === 0) {
      console.log('\nNo active positions found.');
      return;
    }

    if (opts.json) {
      // JSON output for programmatic use
      console.log(JSON.stringify(allAnalyses, (_k, v) =>
        typeof v === 'bigint' ? v.toString() : v, 2));
      return;
    }

    // Pretty print
    console.log('\n' + '='.repeat(60));
    console.log('  LP INTEL - Uniswap V3 Position Analysis');
    console.log('='.repeat(60));

    for (const a of allAnalyses) {
      printPosition(a);
    }

    // Summary
    printSummary(allAnalyses);
  });

function printPosition(a: PositionAnalysis) {
  const feePercent = (a.feeTier / 10000).toFixed(2);
  const status = a.inRange ? 'IN RANGE' : 'OUT OF RANGE';
  const statusColor = a.inRange ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`\nPosition #${a.tokenId} -- ${a.token0.symbol}/${a.token1.symbol} (${feePercent}% fee)`);
  console.log(`Chain: ${a.chain} | Status: ${statusColor}${status}${reset}`);
  console.log('');
  console.log(`  Price Range:    ${fmt(a.priceLower)} -- ${fmt(a.priceUpper)} ${a.token1.symbol}/${a.token0.symbol}`);
  console.log(`  Current Price:  ${fmt(a.currentPrice)} ${a.token1.symbol}/${a.token0.symbol}`);
  console.log('');
  console.log(`  Token Amounts:  ${fmt(a.amount0)} ${a.token0.symbol} + ${fmt(a.amount1)} ${a.token1.symbol}`);
  console.log(`  Position Value: $${fmt(a.positionValueUSD)}`);
  console.log('');
  console.log(`  Uncollected Fees: +$${fmt(a.feeIncomeUSD)} (${a.token0.symbol}: ${fmt(a.tokensOwed0)}, ${a.token1.symbol}: ${fmt(a.tokensOwed1)})`);

  if (a.ilPercent !== undefined) {
    const ilSign = a.ilUSD! >= 0 ? '+' : '';
    console.log(`  Impermanent Loss: ${ilSign}$${fmt(a.ilUSD!)} (${(a.ilPercent * 100).toFixed(2)}%)`);
  }

  if (a.netPnLUSD !== undefined) {
    const pnlSign = a.netPnLUSD >= 0 ? '+' : '';
    console.log(`  Net P&L:          ${pnlSign}$${fmt(a.netPnLUSD)} (${(a.netPnLPercent! * 100).toFixed(2)}%)`);
  }

  console.log('');

  const riskColors: Record<string, string> = { LOW: '\x1b[32m', MEDIUM: '\x1b[33m', HIGH: '\x1b[31m' };
  console.log(`  Risk: ${riskColors[a.risk]}${a.risk}${'\x1b[0m'} -- ${a.riskReason}`);
  console.log(`  Action: ${a.action}`);

  // Rebalance link for out-of-range positions
  if (!a.inRange) {
    const chainUrl = a.chain.toLowerCase();
    // Include fee tier and step=1 as expected by Uniswap interface
    const feeParam = `{%22feeAmount%22:${a.feeTier},%22tickSpacing%22:${getTickSpacing(a.feeTier)},%22isDynamic%22:false}`;
    const link = `https://app.uniswap.org/positions/create?chain=${chainUrl}&currencyA=${a.token0.address}&currencyB=${a.token1.address}&fee=${feeParam}&step=1`;
    console.log(`\n  [Rebalance on Uniswap](${link})`);
  }

  console.log('-'.repeat(60));
}

function printSummary(analyses: PositionAnalysis[]) {
  const totalValue = analyses.reduce((s, a) => s + a.positionValueUSD, 0);
  const totalFees = analyses.reduce((s, a) => s + a.feeIncomeUSD, 0);
  const inRange = analyses.filter((a) => a.inRange).length;
  const outOfRange = analyses.length - inRange;

  console.log('\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total Positions: ${analyses.length} (${inRange} in range, ${outOfRange} out of range)`);
  console.log(`  Total Value:     $${fmt(totalValue)}`);
  console.log(`  Total Fees:      +$${fmt(totalFees)}`);

  if (analyses.some((a) => a.netPnLUSD !== undefined)) {
    const totalPnL = analyses.reduce((s, a) => s + (a.netPnLUSD ?? 0), 0);
    const sign = totalPnL >= 0 ? '+' : '';
    console.log(`  Total Net P&L:   ${sign}$${fmt(totalPnL)}`);
  }

  const highRisk = analyses.filter((a) => a.risk === 'HIGH').length;
  if (highRisk > 0) {
    console.log(`\n  \x1b[31m${highRisk} position(s) need attention!\x1b[0m`);
  }
  console.log('');
}

function getTickSpacing(feeTier: number): number {
  switch (feeTier) {
    case 100: return 1;
    case 500: return 10;
    case 3000: return 60;
    case 10000: return 200;
    default: return 60;
  }
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toFixed(2);
  if (Math.abs(n) >= 0.0001) return n.toFixed(6);
  return n.toExponential(4);
}

program.parse();
