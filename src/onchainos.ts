import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ONCHAINOS_PATH = process.env.ONCHAINOS_PATH || 'onchainos';

interface OnchainOSResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function runOnchainos(args: string[]): Promise<OnchainOSResult> {
  try {
    const { stdout } = await execFileAsync(ONCHAINOS_PATH, args, {
      timeout: 30000,
      env: { ...process.env },
    });
    try {
      return { success: true, data: JSON.parse(stdout) };
    } catch {
      return { success: true, data: stdout.trim() };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function getTokenPrice(
  tokenAddress: string,
  chain: string
): Promise<number | null> {
  const result = await runOnchainos([
    'market',
    'price',
    '--address',
    tokenAddress,
    '--chain',
    chain,
  ]);
  if (!result.success || !result.data) return null;

  // Parse price from onchainos output
  if (typeof result.data === 'object' && result.data !== null) {
    const d = result.data as Record<string, unknown>;
    if ('price' in d) return Number(d.price);
    if ('usdPrice' in d) return Number(d.usdPrice);
  }
  if (typeof result.data === 'string') {
    const num = parseFloat(result.data);
    if (!isNaN(num)) return num;
  }
  return null;
}

// Fallback: use CoinGecko free API for prices when onchainos isn't available
const COMMON_TOKENS: Record<string, string> = {
  // Ethereum mainnet
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ethereum', // WETH
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai', // DAI
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin', // WBTC
  // Arbitrum
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'ethereum', // WETH
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'usd-coin', // USDC
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': 'usd-coin', // USDC.e (bridged)
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'tether', // USDT
  '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': 'wrapped-bitcoin', // WBTC
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'dai', // DAI
  // Base
  '0x4200000000000000000000000000000000000006': 'ethereum', // WETH
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usd-coin', // USDC
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': 'usd-coin', // USDbC (bridged)
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'dai', // DAI
  // Polygon
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': 'ethereum', // WETH
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 'usd-coin', // USDC
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'usd-coin', // USDC.e
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'tether', // USDT
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': 'wrapped-bitcoin', // WBTC
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 'dai', // DAI
};

export async function getTokenPriceFallback(
  tokenAddress: string
): Promise<number | null> {
  const addr = tokenAddress.toLowerCase();
  const cgId = COMMON_TOKENS[addr];
  if (!cgId) return null;

  try {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`
    );
    const data = (await resp.json()) as Record<string, { usd: number }>;
    return data[cgId]?.usd ?? null;
  } catch {
    return null;
  }
}

// Try onchainos first, fall back to CoinGecko
export async function resolveTokenPrice(
  tokenAddress: string,
  chain: string
): Promise<number> {
  let price = await getTokenPrice(tokenAddress, chain);
  if (price !== null && price > 0) return price;

  price = await getTokenPriceFallback(tokenAddress);
  if (price !== null && price > 0) return price;

  // Stablecoins default to $1 (check CoinGecko map for stablecoin IDs)
  const cgId = COMMON_TOKENS[tokenAddress.toLowerCase()];
  if (cgId === 'usd-coin' || cgId === 'tether' || cgId === 'dai') {
    return 1.0;
  }

  return 0;
}
