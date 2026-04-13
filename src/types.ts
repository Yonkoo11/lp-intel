export interface DexConfig {
  name: string; // e.g. "Uniswap V3", "SushiSwap V3"
  nonfungiblePositionManager: `0x${string}`;
  uniswapV3Factory: `0x${string}`;
}

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  archiveRpcUrl: string; // archive node for historical queries
  nonfungiblePositionManager: `0x${string}`; // primary DEX (Uniswap)
  uniswapV3Factory: `0x${string}`;
  dexes: DexConfig[]; // all V3-fork DEXes on this chain
}

export interface PositionData {
  tokenId: bigint;
  nonce: bigint;
  operator: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

export interface PoolState {
  sqrtPriceX96: bigint;
  tick: number;
  poolAddress: `0x${string}`;
  feeGrowthGlobal0X128: bigint;
  feeGrowthGlobal1X128: bigint;
}

export interface TickData {
  feeGrowthOutside0X128: bigint;
  feeGrowthOutside1X128: bigint;
}

export interface PositionAnalysis {
  tokenId: bigint;
  chain: string;
  dex: string; // which DEX (Uniswap V3, SushiSwap V3, etc.)
  token0: TokenInfo;
  token1: TokenInfo;
  feeTier: number;
  tickLower: number;
  tickUpper: number;
  priceLower: number;
  priceUpper: number;
  currentPrice: number;
  inRange: boolean;
  rangePosition: number; // 0-1, where in the range the current price sits
  amount0: number;
  amount1: number;
  positionValueUSD: number;
  tokensOwed0: number;
  tokensOwed1: number;
  feeIncomeUSD: number;
  feeAPY?: number; // annualized fee yield
  daysActive?: number;
  // IL fields
  entryPrice?: number;
  entryPriceSource: 'mint-event' | 'tick-midpoint'; // how we got the entry price
  ilPercent?: number;
  ilUSD?: number;
  hodlValueUSD?: number;
  netPnLUSD?: number;
  netPnLPercent?: number;
  // Risk
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason: string;
  action: string;
}

export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://1rpc.io/eth',
    archiveRpcUrl: 'https://ethereum-rpc.publicnode.com',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    dexes: [
      { name: 'Uniswap V3', nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
      { name: 'SushiSwap V3', nonfungiblePositionManager: '0x2214A42d8e2A1d20635c2cb0664422c528B6A432', uniswapV3Factory: '0xbACEB8eC6b9355Dfc0269C18bac9d6E2Bdc29C4F' },
      { name: 'PancakeSwap V3', nonfungiblePositionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364', uniswapV3Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865' },
    ],
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    archiveRpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    dexes: [
      { name: 'Uniswap V3', nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
      { name: 'SushiSwap V3', nonfungiblePositionManager: '0xF0cBce1942A68BEB3d1b73F0dd86C8DCc363eF49', uniswapV3Factory: '0x1af415a1EbA07a4986a52B6f2e7dE7003D82231e' },
    ],
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    archiveRpcUrl: 'https://base-rpc.publicnode.com',
    nonfungiblePositionManager: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    uniswapV3Factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    dexes: [
      { name: 'Uniswap V3', nonfungiblePositionManager: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1', uniswapV3Factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD' },
      { name: 'SushiSwap V3', nonfungiblePositionManager: '0x80C7DD17B01855a6D2347444a0FCC36136a314de', uniswapV3Factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4' },
    ],
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    archiveRpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    dexes: [
      { name: 'Uniswap V3', nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
      { name: 'SushiSwap V3', nonfungiblePositionManager: '0xb7402ee99F0A008e461098AC3A27F4957Df89a40', uniswapV3Factory: '0x917933899c6a5F8E37F31E050010466b816c1F20' },
    ],
  },
};

// NonfungiblePositionManager ABI (minimal)
export const NPM_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'positions',
    outputs: [
      { name: 'nonce', type: 'uint96' },
      { name: 'operator', type: 'address' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { name: 'tokensOwed0', type: 'uint128' },
      { name: 'tokensOwed1', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// V3 Pool ABI (minimal)
export const POOL_ABI = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeGrowthGlobal0X128',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeGrowthGlobal1X128',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tick', type: 'int24' }],
    name: 'ticks',
    outputs: [
      { name: 'liquidityGross', type: 'uint128' },
      { name: 'liquidityNet', type: 'int128' },
      { name: 'feeGrowthOutside0X128', type: 'uint256' },
      { name: 'feeGrowthOutside1X128', type: 'uint256' },
      { name: 'tickCumulativeOutside', type: 'int56' },
      { name: 'secondsPerLiquidityOutsideX128', type: 'uint160' },
      { name: 'secondsOutside', type: 'uint32' },
      { name: 'initialized', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// V3 Factory ABI (minimal)
export const FACTORY_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
    ],
    name: 'getPool',
    outputs: [{ name: 'pool', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI (minimal)
export const ERC20_ABI = [
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
