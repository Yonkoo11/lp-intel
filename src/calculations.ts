import type { PositionData, PoolState, TokenInfo, TickData, PositionAnalysis } from './types.js';

const Q96 = 2n ** 96n;
const Q128 = 2n ** 128n;
const MAX_UINT256 = 2n ** 256n;
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

// Compute feeGrowthInside for a position's tick range
// This is the core V3 fee math from UniswapV3Pool._updatePosition
function subMod256(a: bigint, b: bigint): bigint {
  return ((a - b) % MAX_UINT256 + MAX_UINT256) % MAX_UINT256;
}

export function computeFeeGrowthInside(
  tickLower: number,
  tickUpper: number,
  currentTick: number,
  feeGrowthGlobal: bigint,
  feeGrowthOutsideLower: bigint,
  feeGrowthOutsideUpper: bigint
): bigint {
  // Fee growth below the lower tick
  const feeGrowthBelow = currentTick >= tickLower
    ? feeGrowthOutsideLower
    : subMod256(feeGrowthGlobal, feeGrowthOutsideLower);

  // Fee growth above the upper tick
  const feeGrowthAbove = currentTick < tickUpper
    ? feeGrowthOutsideUpper
    : subMod256(feeGrowthGlobal, feeGrowthOutsideUpper);

  return subMod256(subMod256(feeGrowthGlobal, feeGrowthBelow), feeGrowthAbove);
}

// Calculate actual uncollected fees for a position
export function computeUncollectedFees(
  liquidity: bigint,
  feeGrowthInside0: bigint,
  feeGrowthInside1: bigint,
  feeGrowthInside0Last: bigint,
  feeGrowthInside1Last: bigint,
  decimals0: number,
  decimals1: number
): { fees0: number; fees1: number } {
  const fees0Raw = subMod256(feeGrowthInside0, feeGrowthInside0Last) * liquidity / Q128;
  const fees1Raw = subMod256(feeGrowthInside1, feeGrowthInside1Last) * liquidity / Q128;

  return {
    fees0: Number(fees0Raw) / 10 ** decimals0,
    fees1: Number(fees1Raw) / 10 ** decimals1,
  };
}

// Calculate impermanent loss for V3 concentrated liquidity
// Uses the actual tick range to compute position value vs HODL
export function calculateIL(
  entryPrice: number,
  currentPrice: number,
  tickLower: number,
  tickUpper: number,
  decimals0: number,
  decimals1: number
): number {
  if (entryPrice <= 0 || currentPrice <= 0) return 0;

  // Convert to raw sqrt prices (without decimal adjustment)
  const sqrtPa = tickToSqrtPrice(tickLower);
  const sqrtPb = tickToSqrtPrice(tickUpper);

  // Entry sqrt price (in raw tick space, not decimal-adjusted)
  const decAdj = 10 ** (decimals0 - decimals1);
  const sqrtEntry = Math.sqrt(entryPrice / decAdj);
  const sqrtCurrent = Math.sqrt(currentPrice / decAdj);

  // Clamp to range
  const sqrtEntryC = Math.max(sqrtPa, Math.min(sqrtPb, sqrtEntry));
  const sqrtCurrentC = Math.max(sqrtPa, Math.min(sqrtPb, sqrtCurrent));

  // Token amounts at entry (L=1, in raw tick-space units)
  const x0 = (sqrtPb - sqrtEntryC) / (sqrtEntryC * sqrtPb); // token0
  const y0 = sqrtEntryC - sqrtPa; // token1

  // LP value now
  const x1 = (sqrtPb - sqrtCurrentC) / (sqrtCurrentC * sqrtPb);
  const y1 = sqrtCurrentC - sqrtPa;
  const valueNow = x1 * currentPrice / decAdj + y1;

  // HODL value: same initial token amounts at current price
  const hodlValue = x0 * currentPrice / decAdj + y0;

  if (hodlValue === 0) return 0;
  return (valueNow - hodlValue) / hodlValue;
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
  dex: string,
  entryPrice?: number,
  entryPriceSource: 'mint-event' | 'tick-midpoint' = 'tick-midpoint',
  daysActive?: number,
  tickLowerData?: TickData,
  tickUpperData?: TickData
): PositionAnalysis {
  const { tickLower, tickUpper, liquidity } = position;

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

  // Compute real uncollected fees if tick data available
  let fees0 = Number(position.tokensOwed0) / 10 ** token0Info.decimals;
  let fees1 = Number(position.tokensOwed1) / 10 ** token1Info.decimals;

  if (tickLowerData && tickUpperData && liquidity > 0n) {
    // Compute feeGrowthInside for each token
    const fgi0 = computeFeeGrowthInside(
      tickLower, tickUpper, poolState.tick,
      poolState.feeGrowthGlobal0X128,
      tickLowerData.feeGrowthOutside0X128,
      tickUpperData.feeGrowthOutside0X128
    );
    const fgi1 = computeFeeGrowthInside(
      tickLower, tickUpper, poolState.tick,
      poolState.feeGrowthGlobal1X128,
      tickLowerData.feeGrowthOutside1X128,
      tickUpperData.feeGrowthOutside1X128
    );

    const computed = computeUncollectedFees(
      liquidity, fgi0, fgi1,
      position.feeGrowthInside0LastX128,
      position.feeGrowthInside1LastX128,
      token0Info.decimals, token1Info.decimals
    );

    // Real uncollected = computed accrued + tokensOwed (already collected but not withdrawn)
    fees0 += computed.fees0;
    fees1 += computed.fees1;
  }

  const feeIncomeUSD = fees0 * price0USD + fees1 * price1USD;

  // Fee APY (if we know how long the position has been active)
  let feeAPY: number | undefined;
  if (daysActive && daysActive > 0 && positionValueUSD > 0) {
    feeAPY = (feeIncomeUSD / positionValueUSD) * (365 / daysActive);
  }

  // Risk assessment
  const { risk, reason, action } = assessRisk(inRange, rangePosition, liquidity);

  // IL calculation (if entry price available)
  let ilPercent: number | undefined;
  let ilUSD: number | undefined;
  let hodlValueUSD: number | undefined;
  let netPnLUSD: number | undefined;
  let netPnLPercent: number | undefined;

  if (entryPrice !== undefined) {
    ilPercent = calculateIL(
      entryPrice, currentPrice,
      tickLower, tickUpper,
      token0Info.decimals, token1Info.decimals
    );
    // HODL value estimate from IL percentage
    // Guard: if IL approaches -100% or worse, clamp to avoid division by zero
    const ilClamped = Math.max(ilPercent, -0.9999);
    hodlValueUSD = positionValueUSD / (1 + ilClamped);
    ilUSD = positionValueUSD - hodlValueUSD;
    netPnLUSD = ilUSD + feeIncomeUSD;
    netPnLPercent = hodlValueUSD > 0 ? netPnLUSD / hodlValueUSD : 0;
  }

  return {
    tokenId: position.tokenId,
    chain,
    dex,
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
    tokensOwed0: fees0,
    tokensOwed1: fees1,
    feeIncomeUSD,
    feeAPY,
    daysActive,
    entryPrice,
    entryPriceSource,
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
