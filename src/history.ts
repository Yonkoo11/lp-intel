import { type PublicClient, parseAbiItem } from 'viem';
import { createPublicClient, http, type Chain } from 'viem';
import { mainnet, arbitrum, base, polygon } from 'viem/chains';
import type { ChainConfig } from './types.js';
import { sqrtPriceX96ToPrice } from './calculations.js';
import { POOL_ABI } from './types.js';

const VIEM_CHAINS: Record<string, Chain> = {
  Ethereum: mainnet,
  Arbitrum: arbitrum,
  Base: base,
  Polygon: polygon,
};

function getArchiveClient(chain: ChainConfig): PublicClient {
  const viemChain = VIEM_CHAINS[chain.name];
  return createPublicClient({
    chain: viemChain,
    transport: http(chain.rpcUrl, { retryCount: 3, retryDelay: 2000 }),
  });
}

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

// NPM deployment blocks (approximate) to avoid scanning from block 0
const NPM_DEPLOY_BLOCKS: Record<string, bigint> = {
  Ethereum: 12369621n,  // Uniswap V3 NPM deploy ~May 2021
  Arbitrum: 165n,        // Very early on Arbitrum
  Base: 2000000n,        // Base launched mid-2023
  Polygon: 22757547n,    // Uniswap V3 on Polygon ~Dec 2021
};

export interface PositionHistory {
  creationBlock: bigint;
  creationTimestamp: number; // unix seconds
  entryPrice: number; // token1 per token0 at creation
  entryPriceSource: 'mint-event' | 'tick-midpoint';
  daysActive: number;
}

// Find when a position NFT was minted by looking for Transfer from address(0)
export async function getPositionCreationBlock(
  tokenId: bigint,
  npmAddress: `0x${string}`,
  chain: ChainConfig
): Promise<bigint | null> {
  const client = getArchiveClient(chain);
  const deployBlock = NPM_DEPLOY_BLOCKS[chain.name] ?? 0n;

  // Strategy: use binary search by block range chunks
  // Free RPCs typically allow ~2000-10000 block ranges
  const latest = await client.getBlockNumber();
  const CHUNK = 50000n;

  // Try scanning in chunks from deploy block
  // For tokenIds, higher = newer, so start from recent blocks first for high tokenIds
  // and from deploy block for low tokenIds
  const isLikelyRecent = tokenId > 500000n;

  if (isLikelyRecent) {
    // Scan backwards from latest in chunks
    for (let end = latest; end > deployBlock; end -= CHUNK) {
      const start = end - CHUNK > deployBlock ? end - CHUNK : deployBlock;
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
        // Chunk too large, try smaller
        continue;
      }
    }
  } else {
    // Scan forwards from deploy block
    for (let start = deployBlock; start < latest; start += CHUNK) {
      const end = start + CHUNK < latest ? start + CHUNK : latest;
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
  poolAddress: `0x${string}`,
  blockNumber: bigint,
  decimals0: number,
  decimals1: number,
  chain: ChainConfig
): Promise<number | null> {
  const client = getArchiveClient(chain);

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

// Full entry price resolution: try mint event first, fall back to tick midpoint
export async function resolveEntryPrice(
  tokenId: bigint,
  npmAddress: `0x${string}`,
  poolAddress: `0x${string}`,
  tickLower: number,
  tickUpper: number,
  decimals0: number,
  decimals1: number,
  chain: ChainConfig
): Promise<PositionHistory> {
  const now = Date.now() / 1000;

  // Try to find mint block
  const creationBlock = await getPositionCreationBlock(tokenId, npmAddress, chain);

  if (creationBlock !== null) {
    const client = getArchiveClient(chain);

    try {
      const block = await client.getBlock({ blockNumber: creationBlock });
      const creationTimestamp = Number(block.timestamp);
      const daysActive = Math.max(1, (now - creationTimestamp) / 86400);

      // Get pool price at that block
      const historicalPrice = await getHistoricalPrice(
        poolAddress, creationBlock, decimals0, decimals1, chain
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
    daysActive: 0, // unknown
  };
}
