import { type PublicClient } from 'viem';
import { sqrtPriceX96ToPrice } from './calculations.js';
import { POOL_ABI, NPM_ABI } from './types.js';

// NPM deployment blocks to set lower bound for binary search
const NPM_DEPLOY_BLOCKS: Record<string, bigint> = {
  Ethereum: 12369621n,
  Arbitrum: 165n,
  Base: 2000000n,
  Polygon: 22757547n,
};

export interface PositionHistory {
  creationBlock: bigint;
  creationTimestamp: number;
  entryPrice: number;
  entryPriceSource: 'mint-event' | 'tick-midpoint';
  daysActive: number;
}

// Binary search for the mint block using ownerOf()
// ownerOf reverts for nonexistent tokens, succeeds after mint.
// This uses eth_call (always works on any RPC, no log range limits).
async function findMintBlock(
  client: PublicClient,
  tokenId: bigint,
  npmAddress: `0x${string}`,
  chainName: string
): Promise<bigint | null> {
  const deployBlock = NPM_DEPLOY_BLOCKS[chainName] ?? 0n;
  const latest = await client.getBlockNumber();

  let low = deployBlock;
  let high = latest;

  // First check: does the token exist at all?
  const existsNow = await tokenExistsAt(client, npmAddress, tokenId, latest);
  if (!existsNow) return null;

  // Check it didn't exist at deploy (sanity)
  const existsAtDeploy = await tokenExistsAt(client, npmAddress, tokenId, deployBlock);
  if (existsAtDeploy) return deployBlock;

  // Binary search: find the first block where ownerOf succeeds
  while (high - low > 1n) {
    const mid = (low + high) / 2n;
    const exists = await tokenExistsAt(client, npmAddress, tokenId, mid);
    if (exists) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

async function tokenExistsAt(
  client: PublicClient,
  npmAddress: `0x${string}`,
  tokenId: bigint,
  blockNumber: bigint
): Promise<boolean> {
  try {
    await client.readContract({
      address: npmAddress,
      abi: NPM_ABI,
      functionName: 'positions',
      args: [tokenId],
      blockNumber,
    });
    return true;
  } catch {
    return false;
  }
}

// Get the pool price at a specific historical block
async function getHistoricalPrice(
  client: PublicClient,
  poolAddress: `0x${string}`,
  blockNumber: bigint,
  decimals0: number,
  decimals1: number
): Promise<number | null> {
  try {
    const slot0 = await client.readContract({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'slot0',
      blockNumber,
    });

    const sqrtPriceX96 = BigInt((slot0 as readonly [bigint, ...unknown[]])[0]);
    return sqrtPriceX96ToPrice(sqrtPriceX96, decimals0, decimals1);
  } catch {
    return null;
  }
}

// Full entry price resolution
export async function resolveEntryPrice(
  client: PublicClient,
  tokenId: bigint,
  npmAddress: `0x${string}`,
  poolAddress: `0x${string}`,
  tickLower: number,
  tickUpper: number,
  decimals0: number,
  decimals1: number,
  chainName: string
): Promise<PositionHistory> {
  const now = Date.now() / 1000;

  // Binary search for mint block using ownerOf (works on any RPC)
  const creationBlock = await findMintBlock(client, tokenId, npmAddress, chainName);

  if (creationBlock !== null) {
    try {
      const block = await client.getBlock({ blockNumber: creationBlock });
      const creationTimestamp = Number(block.timestamp);
      const daysActive = Math.max(1, (now - creationTimestamp) / 86400);

      const historicalPrice = await getHistoricalPrice(
        client, poolAddress, creationBlock, decimals0, decimals1
      );

      if (historicalPrice !== null && historicalPrice > 0) {
        return {
          creationBlock,
          creationTimestamp,
          entryPrice: historicalPrice,
          entryPriceSource: 'mint-event',
          daysActive,
        };
      }
    } catch {
      // Fall through to midpoint
    }
  }

  // Fallback: tick midpoint
  const midTick = (tickLower + tickUpper) / 2;
  const entryPrice = 1.0001 ** midTick * 10 ** (decimals0 - decimals1);

  return {
    creationBlock: 0n,
    creationTimestamp: 0,
    entryPrice,
    entryPriceSource: 'tick-midpoint',
    daysActive: 0,
  };
}
