import { createPublicClient, http, type PublicClient, type Chain } from 'viem';
import { mainnet, arbitrum, base, polygon } from 'viem/chains';
import {
  type ChainConfig,
  type PositionData,
  type PoolState,
  type TokenInfo,
  type TickData,
  NPM_ABI,
  POOL_ABI,
  FACTORY_ABI,
  ERC20_ABI,
} from './types.js';

const VIEM_CHAINS: Record<string, Chain> = {
  Ethereum: mainnet,
  Arbitrum: arbitrum,
  Base: base,
  Polygon: polygon,
};

const clients = new Map<string, PublicClient>();

function getClient(chain: ChainConfig): PublicClient {
  if (!clients.has(chain.name)) {
    const viemChain = VIEM_CHAINS[chain.name];
    clients.set(
      chain.name,
      createPublicClient({
        chain: viemChain,
        transport: http(chain.rpcUrl, {
          retryCount: 5,
          retryDelay: 2000,
        }),
        batch: { multicall: { wait: 200 } },
      })
    );
  }
  return clients.get(chain.name)!;
}

export async function getPositionCount(
  owner: `0x${string}`,
  chain: ChainConfig
): Promise<number> {
  const client = getClient(chain);
  const count = await client.readContract({
    address: chain.nonfungiblePositionManager,
    abi: NPM_ABI,
    functionName: 'balanceOf',
    args: [owner],
  });
  return Number(count);
}

export async function getPositionTokenIds(
  owner: `0x${string}`,
  chain: ChainConfig
): Promise<bigint[]> {
  const client = getClient(chain);
  const count = await getPositionCount(owner, chain);
  if (count === 0) return [];

  const calls = Array.from({ length: count }, (_, i) => ({
    address: chain.nonfungiblePositionManager,
    abi: NPM_ABI,
    functionName: 'tokenOfOwnerByIndex' as const,
    args: [owner, BigInt(i)] as const,
  }));

  const results = await client.multicall({ contracts: calls });
  return results
    .filter((r) => r.status === 'success')
    .map((r) => r.result as bigint);
}

export async function getPositionData(
  tokenId: bigint,
  chain: ChainConfig
): Promise<PositionData> {
  const client = getClient(chain);
  const result = await client.readContract({
    address: chain.nonfungiblePositionManager,
    abi: NPM_ABI,
    functionName: 'positions',
    args: [tokenId],
  });

  const [
    nonce,
    operator,
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    liquidity,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    tokensOwed0,
    tokensOwed1,
  ] = result;

  return {
    tokenId,
    nonce: BigInt(nonce),
    operator: operator as `0x${string}`,
    token0: token0 as `0x${string}`,
    token1: token1 as `0x${string}`,
    fee: Number(fee),
    tickLower: Number(tickLower),
    tickUpper: Number(tickUpper),
    liquidity: BigInt(liquidity),
    feeGrowthInside0LastX128: BigInt(feeGrowthInside0LastX128),
    feeGrowthInside1LastX128: BigInt(feeGrowthInside1LastX128),
    tokensOwed0: BigInt(tokensOwed0),
    tokensOwed1: BigInt(tokensOwed1),
  };
}

export async function getAllPositions(
  owner: `0x${string}`,
  chain: ChainConfig
): Promise<PositionData[]> {
  const client = getClient(chain);
  const tokenIds = await getPositionTokenIds(owner, chain);
  if (tokenIds.length === 0) return [];

  const calls = tokenIds.map((tokenId) => ({
    address: chain.nonfungiblePositionManager,
    abi: NPM_ABI,
    functionName: 'positions' as const,
    args: [tokenId] as const,
  }));

  const results = await client.multicall({ contracts: calls });

  return results
    .filter((r) => r.status === 'success')
    .map((r, i) => {
      const data = r.result as readonly [
        bigint, string, string, string,
        number, number, number, bigint,
        bigint, bigint, bigint, bigint,
      ];
      return {
        tokenId: tokenIds[i],
        nonce: BigInt(data[0]),
        operator: data[1] as `0x${string}`,
        token0: data[2] as `0x${string}`,
        token1: data[3] as `0x${string}`,
        fee: Number(data[4]),
        tickLower: Number(data[5]),
        tickUpper: Number(data[6]),
        liquidity: BigInt(data[7]),
        feeGrowthInside0LastX128: BigInt(data[8]),
        feeGrowthInside1LastX128: BigInt(data[9]),
        tokensOwed0: BigInt(data[10]),
        tokensOwed1: BigInt(data[11]),
      };
    });
}

export async function getPoolState(
  token0: `0x${string}`,
  token1: `0x${string}`,
  fee: number,
  chain: ChainConfig
): Promise<PoolState> {
  const client = getClient(chain);

  // Get pool address from factory
  const poolAddress = (await client.readContract({
    address: chain.uniswapV3Factory,
    abi: FACTORY_ABI,
    functionName: 'getPool',
    args: [token0, token1, fee],
  })) as `0x${string}`;

  // Validate pool exists
  if (poolAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No pool found for ${token0}/${token1} fee=${fee}`);
  }

  // Batch read slot0 + feeGrowthGlobals
  const [slot0Result, fg0Result, fg1Result] = await client.multicall({
    contracts: [
      { address: poolAddress, abi: POOL_ABI, functionName: 'slot0' },
      { address: poolAddress, abi: POOL_ABI, functionName: 'feeGrowthGlobal0X128' },
      { address: poolAddress, abi: POOL_ABI, functionName: 'feeGrowthGlobal1X128' },
    ],
  });

  if (slot0Result.status !== 'success') throw new Error('Failed to read pool slot0');

  const slot0 = slot0Result.result as readonly [bigint, number, number, number, number, number, boolean];

  return {
    sqrtPriceX96: BigInt(slot0[0]),
    tick: Number(slot0[1]),
    poolAddress,
    feeGrowthGlobal0X128: fg0Result.status === 'success' ? BigInt(fg0Result.result as bigint) : 0n,
    feeGrowthGlobal1X128: fg1Result.status === 'success' ? BigInt(fg1Result.result as bigint) : 0n,
  };
}

export async function getTickData(
  poolAddress: `0x${string}`,
  tick: number,
  chain: ChainConfig
): Promise<TickData> {
  const client = getClient(chain);
  const result = await client.readContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: 'ticks',
    args: [tick],
  });

  const data = result as readonly [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
  return {
    feeGrowthOutside0X128: BigInt(data[2]),
    feeGrowthOutside1X128: BigInt(data[3]),
  };
}

export async function getTokenInfo(
  address: `0x${string}`,
  chain: ChainConfig
): Promise<TokenInfo> {
  const client = getClient(chain);

  const [symbolResult, decimalsResult] = await client.multicall({
    contracts: [
      { address, abi: ERC20_ABI, functionName: 'symbol' },
      { address, abi: ERC20_ABI, functionName: 'decimals' },
    ],
  });

  return {
    address,
    symbol:
      symbolResult.status === 'success'
        ? (symbolResult.result as string)
        : 'UNKNOWN',
    decimals:
      decimalsResult.status === 'success'
        ? Number(decimalsResult.result)
        : 18,
  };
}
