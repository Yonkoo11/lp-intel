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

export async function getDefiPositions(
  walletAddress: string,
  chains: string[]
): Promise<unknown> {
  const result = await runOnchainos([
    'defi',
    'positions',
    '--address',
    walletAddress,
    '--chains',
    chains.join(','),
  ]);
  return result.success ? result.data : null;
}

// Fallback: use CoinGecko free API for prices when onchainos isn't available
const COMMON_TOKENS: Record<string, string> = {
  // Ethereum mainnet
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ethereum', // WETH
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai', // DAI
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin', // WBTC
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

  // Stablecoins default to $1
  const symbol = tokenAddress.toLowerCase();
  if (
    symbol === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' || // USDC
    symbol === '0xdac17f958d2ee523a2206206994597c13d831ec7' || // USDT
    symbol === '0x6b175474e89094c44da98b954eedeac495271d0f'    // DAI
  ) {
    return 1.0;
  }

  return 0;
}
