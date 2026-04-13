#!/usr/bin/env node
import { Command } from 'commander';
import { getAddress } from 'viem';
import { CHAINS } from './types.js';
import type { ChainConfig, PositionAnalysis } from './types.js';
import { getAllPositions, getPoolState, getTokenInfo, getTickData, getArchiveClient } from './positions.js';
import { analyzePosition } from './calculations.js';
import { resolveTokenPrice, batchFetchPrices } from './onchainos.js';
import { resolveEntryPrice } from './history.js';

const program = new Command();

program
  .name('lp-intel')
  .description('Concentrated Liquidity Position Analyzer')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze V3-fork LP positions for a wallet')
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

    const allAnalyses: PositionAnalysis[] = [];

    for (const chainName of chains) {
      const chain = CHAINS[chainName];
      if (!chain) {
        console.error(`Unknown chain: ${chainName}`);
        continue;
      }

      // Scan all DEXes on this chain
      for (const dex of chain.dexes) {
        log(`\nScanning ${chain.name} ${dex.name} positions...`);

        const dexChain: ChainConfig = { ...chain, nonfungiblePositionManager: dex.nonfungiblePositionManager, uniswapV3Factory: dex.uniswapV3Factory };

        try {
          const positions = await getAllPositions(addr, dexChain);

          if (positions.length === 0) {
            log(`  No positions found on ${dex.name}`);
            continue;
          }

          const active = positions.filter((p) => p.liquidity > 0n);
          const closed = positions.length - active.length;
          log(`  Found ${positions.length} positions (${active.length} active, ${closed} closed)`);

          // Step 1: Resolve all unique tokens in parallel
          const tokenCache = new Map<string, Awaited<ReturnType<typeof getTokenInfo>>>();
          const priceCache = new Map<string, number>();
          const uniqueTokens = new Set<`0x${string}`>();
          for (const pos of active) {
            uniqueTokens.add(pos.token0);
            uniqueTokens.add(pos.token1);
          }

          // Batch CoinGecko prices + resolve token info in parallel
          const tokenArr = [...uniqueTokens];
          await batchFetchPrices(tokenArr);
          const [tokenInfos, prices] = await Promise.all([
            Promise.all(tokenArr.map(addr => getTokenInfo(addr, dexChain))),
            Promise.all(tokenArr.map(addr => resolveTokenPrice(addr, chainName))),
          ]);
          tokenArr.forEach((addr, i) => {
            tokenCache.set(addr, tokenInfos[i]);
            priceCache.set(addr, prices[i]);
          });

          // Step 2: Resolve all pool states in parallel
          const poolKeys = new Map<string, { token0: `0x${string}`; token1: `0x${string}`; fee: number }>();
          for (const pos of active) {
            const key = `${pos.token0}-${pos.token1}-${pos.fee}`;
            if (!poolKeys.has(key)) poolKeys.set(key, { token0: pos.token0, token1: pos.token1, fee: pos.fee });
          }
          const poolStateMap = new Map<string, Awaited<ReturnType<typeof getPoolState>>>();
          const poolEntries = [...poolKeys.entries()];
          const poolStates = await Promise.all(
            poolEntries.map(([, p]) => getPoolState(p.token0, p.token1, p.fee, dexChain).catch(() => null))
          );
          poolEntries.forEach(([key], i) => {
            if (poolStates[i]) poolStateMap.set(key, poolStates[i]!);
          });

          // Step 3: Resolve tick data + entry prices in parallel per position
          log(`  Analyzing ${active.length} positions...`);
          const archiveClient = getArchiveClient(dexChain);

          const analysisResults = await Promise.all(active.map(async (pos) => {
            const poolKey = `${pos.token0}-${pos.token1}-${pos.fee}`;
            const poolState = poolStateMap.get(poolKey);
            if (!poolState) return null;

            const token0Info = tokenCache.get(pos.token0)!;
            const token1Info = tokenCache.get(pos.token1)!;
            const price0USD = priceCache.get(pos.token0)!;
            const price1USD = priceCache.get(pos.token1)!;

            // Tick data + entry price in parallel
            let tickLowerData, tickUpperData;
            try {
              [tickLowerData, tickUpperData] = await Promise.all([
                getTickData(poolState.poolAddress, pos.tickLower, dexChain),
                getTickData(poolState.poolAddress, pos.tickUpper, dexChain),
              ]);
            } catch { /* fall back to tokensOwed */ }

            const history = await resolveEntryPrice(
              archiveClient,
              pos.tokenId,
              dex.nonfungiblePositionManager,
              poolState.poolAddress,
              pos.tickLower, pos.tickUpper,
              token0Info.decimals, token1Info.decimals,
              chain.name
            );

            return analyzePosition(
              pos, poolState, token0Info, token1Info,
              price0USD, price1USD, chain.name, dex.name,
              history.entryPrice, history.entryPriceSource,
              history.daysActive || undefined,
              tickLowerData, tickUpperData
            );
          }));

          for (const result of analysisResults) {
            if (result) allAnalyses.push(result);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  Error scanning ${chain.name} ${dex.name}: ${msg}`);
        }
      }
    }

    if (allAnalyses.length === 0) {
      if (opts.json) {
        console.log('[]');
      } else {
        console.log('\nNo active positions found.');
      }
      return;
    }

    if (opts.json) {
      console.log(JSON.stringify(allAnalyses, (_k, v) =>
        typeof v === 'bigint' ? v.toString() : v, 2));
      return;
    }

    // Pretty print
    console.log('\n' + '='.repeat(60));
    console.log('  LP INTEL - Concentrated Liquidity Position Analysis');
    console.log('='.repeat(60));

    for (const a of allAnalyses) {
      printPosition(a);
    }

    printSummary(allAnalyses);
  });

const STABLECOINS = new Set(['USDC', 'USDT', 'DAI', 'BUSD', 'USDbC', 'USDC.e']);

function shouldInvertDisplay(token0Symbol: string, token1Symbol: string): boolean {
  if (STABLECOINS.has(token1Symbol)) return false;
  if (STABLECOINS.has(token0Symbol)) return true;
  return false;
}

function printPosition(a: PositionAnalysis) {
  const feePercent = (a.feeTier / 10000).toFixed(2);
  const status = a.inRange ? 'IN RANGE' : 'OUT OF RANGE';
  const statusColor = a.inRange ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  const invert = shouldInvertDisplay(a.token0.symbol, a.token1.symbol);
  const baseSymbol = invert ? a.token1.symbol : a.token0.symbol;
  const quoteSymbol = invert ? a.token0.symbol : a.token1.symbol;
  const pairLabel = `${baseSymbol}/${quoteSymbol}`;
  const displayPriceLower = invert ? 1 / a.priceUpper : a.priceLower;
  const displayPriceUpper = invert ? 1 / a.priceLower : a.priceUpper;
  const displayCurrentPrice = invert ? 1 / a.currentPrice : a.currentPrice;

  console.log(`\nPosition #${a.tokenId} -- ${pairLabel} (${feePercent}% fee) [${a.dex}]`);
  console.log(`Chain: ${a.chain} | Status: ${statusColor}${status}${reset}`);
  console.log('');
  console.log(`  Price Range:    ${fmt(displayPriceLower)} -- ${fmt(displayPriceUpper)} ${quoteSymbol}/${baseSymbol}`);
  console.log(`  Current Price:  ${fmt(displayCurrentPrice)} ${quoteSymbol}/${baseSymbol}`);
  console.log('');
  console.log(`  Token Amounts:  ${fmt(a.amount0)} ${a.token0.symbol} + ${fmt(a.amount1)} ${a.token1.symbol}`);
  console.log(`  Position Value: $${fmt(a.positionValueUSD)}`);
  console.log('');
  console.log(`  Uncollected Fees: +$${fmt(a.feeIncomeUSD)} (${a.token0.symbol}: ${fmt(a.tokensOwed0)}, ${a.token1.symbol}: ${fmt(a.tokensOwed1)})`);

  if (a.feeAPY !== undefined) {
    console.log(`  Fee APY (est):    ${(a.feeAPY * 100).toFixed(1)}%`);
  }
  if (a.daysActive !== undefined) {
    console.log(`  Days Active:      ${a.daysActive.toFixed(0)}`);
  }

  if (a.ilPercent !== undefined) {
    const ilSign = a.ilUSD! >= 0 ? '+' : '';
    const sourceTag = a.entryPriceSource === 'mint-event' ? '' : ' (est)';
    console.log(`  Impermanent Loss: ${ilSign}$${fmt(a.ilUSD!)} (${(a.ilPercent * 100).toFixed(2)}%)${sourceTag}`);
  }

  if (a.netPnLUSD !== undefined) {
    const pnlSign = a.netPnLUSD >= 0 ? '+' : '';
    console.log(`  Net P&L:          ${pnlSign}$${fmt(a.netPnLUSD)} (${(a.netPnLPercent! * 100).toFixed(2)}%)`);
  }

  console.log('');

  const riskColors: Record<string, string> = { LOW: '\x1b[32m', MEDIUM: '\x1b[33m', HIGH: '\x1b[31m' };
  console.log(`  Risk: ${riskColors[a.risk]}${a.risk}${reset} -- ${a.riskReason}`);
  console.log(`  Action: ${a.action}`);

  if (!a.inRange) {
    const chainUrl = a.chain.toLowerCase();
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

  // Group by DEX
  const dexes = new Set(analyses.map(a => a.dex));

  console.log('\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total Positions: ${analyses.length} (${inRange} in range, ${outOfRange} out of range)`);
  console.log(`  DEXes Scanned:   ${[...dexes].join(', ')}`);
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
