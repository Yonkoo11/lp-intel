import { parseAbiItem, type PublicClient } from 'viem';
import { sqrtPriceX96ToPrice } from './calculations.js';
import { POOL_ABI } from './types.js';

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

// NPM deployment blocks (approximate) to avoid scanning from block 0
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

// Find when a position NFT was minted
async function getPositionCreationBlock(
  client: PublicClient,
  tokenId: bigint,
  npmAddress: `0x${string}`,
  chainName: string
): Promise<bigint | null> {
  const deployBlock = NPM_DEPLOY_BLOCKS[chainName] ?? 0n;
  const latest = await client.getBlockNumber();

  // Strategy 1: Try full range first (works on RPCs that support indexed topic filtering)
  try {
    const logs = await client.getLogs({
      address: npmAddress,
      event: TRANSFER_EVENT,
      args: { from: '0x0000000000000000000000000000000000000000', tokenId },
      fromBlock: deployBlock,
      toBlock: latest,
    });
    if (logs.length > 0) return logs[0].blockNumber;
  } catch {
    // Full range rejected -- fall through to chunked search
  }

  // Strategy 2: Estimate block from tokenId ratio, search a narrow window
  // Higher tokenId = created later. Use linear interpolation.
  const totalBlocks = latest - deployBlock;
  // Rough estimate: ~800K positions minted over ~10M blocks on Ethereum
  const estimatedBlock = deployBlock + (totalBlocks * tokenId) / 900000n;
  const searchRadius = 200000n; // +/- 200K blocks around estimate

  const searchStart = estimatedBlock > searchRadius + deployBlock
    ? estimatedBlock - searchRadius
    : deployBlock;
  const searchEnd = estimatedBlock + searchRadius < latest
    ? estimatedBlock + searchRadius
    : latest;

  // Try the estimated window
  try {
    const logs = await client.getLogs({
      address: npmAddress,
      event: TRANSFER_EVENT,
      args: { from: '0x0000000000000000000000000000000000000000', tokenId },
      fromBlock: searchStart,
      toBlock: searchEnd,
    });
    if (logs.length > 0) return logs[0].blockNumber;
  } catch {
    // Window too large, try smaller chunks
    const CHUNK = 50000n;
    for (let start = searchStart; start < searchEnd; start += CHUNK) {
      const end = start + CHUNK < searchEnd ? start + CHUNK : searchEnd;
      try {
        const logs = await client.getLogs({
          address: npmAddress,
          event: TRANSFER_EVENT,
          args: { from: '0x0000000000000000000000000000000000000000', tokenId },
          fromBlock: start,
          toBlock: end,
        });
        if (logs.length > 0) return logs[0].blockNumber;
      } catch {
        continue;
      }
    }
  }

  return null;
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

  const creationBlock = await getPositionCreationBlock(client, tokenId, npmAddress, chainName);

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
