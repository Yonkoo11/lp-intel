import type { PositionData, PoolState, TokenInfo, PositionAnalysis } from './types.js';

const Q96 = 2n ** 96n;
// Convert tick to sqrt price ratio (as a float)
export function tickToSqrtPrice(tick: number): number {
  return Math.sqrt(1.0001 ** tick);
}

// Convert tick to price (token1 per token0)
export function tickToPrice(tick: number, decimals0: number, decimals1: number): number {
  return 1.0001 ** tick * 10 ** (decimals0 - decimals1);
}

// Convert sqrtPriceX96 to price (token1 per token0)
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  decimals0: number,
  decimals1: number
): number {
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
  return sqrtPrice * sqrtPrice * 10 ** (decimals0 - decimals1);
}

// Get token amounts for a V3 position
export function getTokenAmounts(
  liquidity: bigint,
  sqrtPriceX96Current: bigint,
  tickLower: number,
  tickUpper: number,
  decimals0: number,
  decimals1: number
): { amount0: number; amount1: number } {
  const sqrtPriceCurrent = Number(sqrtPriceX96Current) / Number(Q96);
  const sqrtPriceA = tickToSqrtPrice(tickLower);
  const sqrtPriceB = tickToSqrtPrice(tickUpper);
  const L = Number(liquidity);

  let amount0: number;
  let amount1: number;

  if (sqrtPriceCurrent <= sqrtPriceA) {
    // Price below range: all token0
    amount0 = L * (sqrtPriceB - sqrtPriceA) / (sqrtPriceA * sqrtPriceB);
    amount1 = 0;
  } else if (sqrtPriceCurrent >= sqrtPriceB) {
    // Price above range: all token1
    amount0 = 0;
    amount1 = L * (sqrtPriceB - sqrtPriceA);
  } else {
    // In range
    amount0 = L * (sqrtPriceB - sqrtPriceCurrent) / (sqrtPriceCurrent * sqrtPriceB);
    amount1 = L * (sqrtPriceCurrent - sqrtPriceA);
  }

  return {
    amount0: amount0 / 10 ** decimals0,
    amount1: amount1 / 10 ** decimals1,
  };
}

// Calculate impermanent loss percentage using simple V3 formula
// Uses price ratio k = currentPrice / entryPrice
// For V3 concentrated: IL is amplified compared to V2
export function calculateIL(
  entryPrice: number,
  currentPrice: number,
): number {
  if (entryPrice <= 0 || currentPrice <= 0) return 0;

  // Price ratio
  const k = currentPrice / entryPrice;
  if (k <= 0) return 0;

  // Standard V2 IL formula: IL = 2*sqrt(k)/(1+k) - 1
  // This gives the IL as a fraction (negative = loss vs HODL)
  const il = (2 * Math.sqrt(k)) / (1 + k) - 1;

  return il;
}

// Assess risk level
function assessRisk(
  inRange: boolean,
  rangePosition: number,
  liquidity: bigint
): { risk: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string; action: string } {
  if (liquidity === 0n) {
    return { risk: 'HIGH', reason: 'Position has zero liquidity (closed)', action: 'REMOVE -- no active liquidity' };
  }
  if (!inRange) {
    return { risk: 'HIGH', reason: 'Price is outside position range', action: 'REBALANCE -- not earning fees' };
  }
  if (rangePosition < 0.1 || rangePosition > 0.9) {
    return { risk: 'MEDIUM', reason: `Price near edge of range (${(rangePosition * 100).toFixed(0)}%)`, action: 'MONITOR -- may go out of range' };
  }
  return { risk: 'LOW', reason: `Price at ${(rangePosition * 100).toFixed(0)}% through range`, action: 'HOLD -- position healthy' };
}

// Full position analysis
export function analyzePosition(
  position: PositionData,
  poolState: PoolState,
  token0Info: TokenInfo,
  token1Info: TokenInfo,
  price0USD: number,
  price1USD: number,
  chain: string,
  entryPrice?: number
): PositionAnalysis {
  const { tickLower, tickUpper, liquidity, tokensOwed0, tokensOwed1 } = position;

  // Current price (token1 per token0)
  const currentPrice = sqrtPriceX96ToPrice(
    poolState.sqrtPriceX96,
    token0Info.decimals,
    token1Info.decimals
  );

  // Tick range as prices
  const priceLower = tickToPrice(tickLower, token0Info.decimals, token1Info.decimals);
  const priceUpper = tickToPrice(tickUpper, token0Info.decimals, token1Info.decimals);

  // In range check
  const inRange = poolState.tick >= tickLower && poolState.tick < tickUpper;
  const rangePosition = inRange
    ? (poolState.tick - tickLower) / (tickUpper - tickLower)
    : poolState.tick < tickLower
      ? 0
      : 1;

  // Token amounts
  const { amount0, amount1 } = getTokenAmounts(
    liquidity,
    poolState.sqrtPriceX96,
    tickLower,
    tickUpper,
    token0Info.decimals,
    token1Info.decimals
  );

  // Position value in USD
  const positionValueUSD = amount0 * price0USD + amount1 * price1USD;

  // Uncollected fees
  const owed0 = Number(tokensOwed0) / 10 ** token0Info.decimals;
  const owed1 = Number(tokensOwed1) / 10 ** token1Info.decimals;
  const feeIncomeUSD = owed0 * price0USD + owed1 * price1USD;

  // Risk assessment
  const { risk, reason, action } = assessRisk(inRange, rangePosition, liquidity);

  // IL calculation (if entry price available)
  let ilPercent: number | undefined;
  let ilUSD: number | undefined;
  let hodlValueUSD: number | undefined;
  let netPnLUSD: number | undefined;
  let netPnLPercent: number | undefined;

  if (entryPrice !== undefined) {
    ilPercent = calculateIL(entryPrice, currentPrice);
    // Rough HODL value estimate
    hodlValueUSD = positionValueUSD / (1 + ilPercent);
    ilUSD = positionValueUSD - hodlValueUSD;
    netPnLUSD = ilUSD + feeIncomeUSD;
    netPnLPercent = hodlValueUSD > 0 ? netPnLUSD / hodlValueUSD : 0;
  }

  return {
    tokenId: position.tokenId,
    chain,
    token0: token0Info,
    token1: token1Info,
    feeTier: position.fee,
    tickLower,
    tickUpper,
    priceLower,
    priceUpper,
    currentPrice,
    inRange,
    rangePosition,
    amount0,
    amount1,
    positionValueUSD,
    tokensOwed0: owed0,
    tokensOwed1: owed1,
    feeIncomeUSD,
    entryPrice,
    ilPercent,
    ilUSD,
    hodlValueUSD,
    netPnLUSD,
    netPnLPercent,
    risk,
    riskReason: reason,
    action,
  };
}
