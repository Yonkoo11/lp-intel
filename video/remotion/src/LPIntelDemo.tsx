import React from 'react';
import { Series, Audio, staticFile, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { Terminal } from './Terminal';
import { ClosingCard } from './ClosingCard';
import { Subtitle } from './Subtitle';

const G = '#50c864';
const R = '#dc5050';
const Y = '#dcb64a';
const C = '#64c8dc';
const D = '#78788c';

// Scene wrapper - quick fade in, never fully black
const Scene: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5], [0.3, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#16161e',
      opacity,
    }}>
      {children}
    </div>
  );
};

// Scene 1: Hook
const HookScene: React.FC = () => (
  <Scene>
    <Terminal
      command="npx tsx src/index.ts analyze 0xC364...FE88 --chain ethereum"
      typingSpeed={0.8}
      title="lp-intel -- position analysis"
      lines={[
        { text: '', delay: 3 },
        { text: 'Found 6 positions (3 active, 3 closed)', color: D, delay: 6 },
        { text: '', delay: 8 },
        { text: '==========================================================', color: C, delay: 11 },
        { text: '  LP INTEL - Concentrated Liquidity Position Analysis', color: C, delay: 12 },
        { text: '==========================================================', color: C, delay: 13 },
        { text: '', delay: 15 },
        { text: 'Position #378780 -- WETH/USDC (0.05%) [Uniswap V3]', delay: 17 },
        { text: 'Chain: Ethereum | Status: OUT OF RANGE', color: R, delay: 19 },
        { text: '', delay: 20 },
        { text: '  Price Range:    1,255 -- 1,293 USDC/WETH', delay: 22 },
        { text: '  Current Price:  2,374 USDC/WETH', delay: 24 },
        { text: '', delay: 25 },
        { text: '  Token Amounts:  19.93 USDC + 0.00 WETH', delay: 27 },
        { text: '  Position Value: $19.93', delay: 29 },
        { text: '', delay: 30 },
        { text: '  Uncollected Fees: +$2.88', color: G, delay: 33 },
        { text: '  Fee APY (est):    4.3%', color: G, delay: 35 },
        { text: '  Days Active:      1,231', delay: 37 },
        { text: '  Impermanent Loss: -$8.55 (-30.03%)', color: R, delay: 40 },
        { text: '  Net P&L:          -$5.67 (-19.92%)', color: Y, delay: 44 },
        { text: '', delay: 46 },
        { text: '  Risk: HIGH -- Price is outside position range', color: R, delay: 50 },
        { text: '  Action: REBALANCE -- not earning fees', color: Y, delay: 54 },
      ]}
    />
    <Subtitle text="This tool reads any wallet's LP positions and tells you exactly what they're worth. Fees earned, impermanent loss, risk level. All from on-chain data." />
  </Scene>
);

// Scene 2: Problem (no command prompt)
const ProblemScene: React.FC = () => (
  <Scene>
    <Terminal
      title="the gap in agent tooling"
      lines={[
        { text: '', delay: 0 },
        { text: '  AI agents today:', delay: 8 },
        { text: '', delay: 12 },
        { text: '    [x] Create LP positions    (liquidity-planner)', color: G, delay: 20 },
        { text: '    [x] Swap tokens            (swap-integration)', color: G, delay: 28 },
        { text: '    [x] Check wallet balance   (wallet-portfolio)', color: G, delay: 36 },
        { text: '', delay: 42 },
        { text: '    [ ] Analyze existing LPs   ???', color: R, delay: 50 },
        { text: '    [ ] Check impermanent loss ???', color: R, delay: 58 },
        { text: '    [ ] Know when to rebalance ???', color: R, delay: 66 },
        { text: '', delay: 74 },
        { text: '  Agents can build positions.', delay: 82 },
        { text: '  But they\'re blind to what happens after.', color: Y, delay: 92 },
      ]}
    />
    <Subtitle text="AI agents can create Uniswap positions. But they can't analyze existing ones. No tool tells an agent whether an LP is making or losing money." />
  </Scene>
);

// Scene 3: Multi-DEX
const MultiDexScene: React.FC = () => (
  <Scene>
    <Terminal
      command="npx tsx src/index.ts analyze 0x0193...7d68 --chain ethereum"
      typingSpeed={0.8}
      title="multi-DEX scanning"
      lines={[
        { text: '', delay: 3 },
        { text: 'Scanning Ethereum Uniswap V3 positions...', delay: 6 },
        { text: '  Found 8 positions (0 active, 8 closed)', color: D, delay: 10 },
        { text: '', delay: 14 },
        { text: 'Scanning Ethereum SushiSwap V3 positions...', delay: 18 },
        { text: '  Found 6 positions (2 active, 4 closed)', color: G, delay: 22 },
        { text: '  Analyzing 2 positions...', color: G, delay: 26 },
        { text: '', delay: 30 },
        { text: 'Scanning Ethereum PancakeSwap V3 positions...', delay: 34 },
        { text: '  Found 2 positions (0 active, 2 closed)', color: D, delay: 38 },
        { text: '', delay: 44 },
        { text: 'Position #2825 -- WETH/USDT (0.30%) [SushiSwap V3]', delay: 50 },
        { text: 'Chain: Ethereum | Status: OUT OF RANGE', color: R, delay: 54 },
        { text: '  Current Price:  2,377 USDT/WETH', delay: 58 },
        { text: '  Position Value: $2.15', delay: 62 },
        { text: '  Uncollected Fees: +$0.019', color: G, delay: 66 },
        { text: '  IL: -$0.08 (-3.60%)', color: R, delay: 70 },
        { text: '  Risk: HIGH -- Price is outside position range', color: R, delay: 76 },
      ]}
    />
    <Subtitle text="LP Intel scans three DEXes per chain. Uniswap, SushiSwap, PancakeSwap. One command, four chains, every V3 position in the wallet." />
  </Scene>
);

// Scene 4: Fee math
const FeesScene: React.FC = () => (
  <Scene>
    <Terminal
      title="feeGrowthInside math"
      lines={[
        { text: '  How LP Intel computes uncollected fees:', color: C, delay: 5 },
        { text: '', delay: 10 },
        { text: '  Step 1: Read pool.feeGrowthGlobal0X128', delay: 16 },
        { text: '          Read pool.feeGrowthGlobal1X128', delay: 20 },
        { text: '', delay: 24 },
        { text: '  Step 2: Read ticks(lower).feeGrowthOutside0X128', delay: 30 },
        { text: '          Read ticks(upper).feeGrowthOutside0X128', delay: 34 },
        { text: '', delay: 38 },
        { text: '  Step 3: Compute feeGrowthInside (mod 2^256)', delay: 44 },
        { text: '          feeBelow = tick >= lower ? outside : global - outside', color: Y, delay: 50 },
        { text: '          feeAbove = tick <  upper ? outside : global - outside', color: Y, delay: 56 },
        { text: '          feeInside = global - feeBelow - feeAbove', color: G, delay: 62 },
        { text: '', delay: 66 },
        { text: '  Step 4: fees = (feeInside - lastFee) * liquidity / 2^128', delay: 72 },
        { text: '', delay: 76 },
        { text: '  Result: USDC: 1.01  WETH: 0.000788  Total: $2.88', color: G, delay: 84 },
        { text: '', delay: 88 },
        { text: '  Not just tokensOwed. The real on-chain math.', color: Y, delay: 96 },
      ]}
    />
    <Subtitle text="Fees aren't just the tokens owed field. We read fee growth global, fee growth outside for both ticks, and compute the real uncollected amount. That's the actual Uniswap V3 pool math." />
  </Scene>
);

// Scene 5: Entry price
const EntryPriceScene: React.FC = () => (
  <Scene>
    <Terminal
      title="entry price resolution"
      lines={[
        { text: '  Finding when position #378780 was created:', color: C, delay: 5 },
        { text: '', delay: 10 },
        { text: '  Binary search via positions(tokenId):', delay: 14 },
        { text: '', delay: 18 },
        { text: '    Block 12,369,621 (deploy)  -> not found', color: D, delay: 22 },
        { text: '    Block 17,184,810          -> exists', color: D, delay: 27 },
        { text: '    Block 14,777,215          -> not found', color: D, delay: 32 },
        { text: '    Block 15,981,012          -> not found', color: D, delay: 37 },
        { text: '    Block 16,582,911          -> exists', color: D, delay: 42 },
        { text: '    Block 16,131,486          -> exists', color: D, delay: 47 },
        { text: '    Block 16,081,539          -> exists', color: G, delay: 52 },
        { text: '    Block 16,081,538          -> not found', color: D, delay: 57 },
        { text: '', delay: 62 },
        { text: '  Minted at block 16,081,539', color: G, delay: 66 },
        { text: '  November 29, 2022 -- Days active: 1,231', color: G, delay: 72 },
        { text: '', delay: 76 },
        { text: '  Historical pool price: 1,215 USDC/WETH', color: C, delay: 82 },
        { text: '  Current price:         2,374 USDC/WETH', color: C, delay: 88 },
        { text: '  Fee APY: 4.3%', color: G, delay: 94 },
        { text: '', delay: 98 },
        { text: '  24 RPC calls. Works on any archive node.', color: Y, delay: 104 },
      ]}
    />
    <Subtitle text="Entry prices come from binary-searching the NFT mint block. Twenty-four RPC calls to find exactly when the position was created. Then we pull the historical pool price at that block." />
  </Scene>
);

// Scene 6: JSON
const JsonScene: React.FC = () => (
  <Scene>
    <Terminal
      command="npx tsx src/index.ts analyze 0xC364...FE88 --json"
      typingSpeed={0.8}
      title="agent-ready JSON output"
      lines={[
        { text: '', delay: 3 },
        { text: '[', delay: 6 },
        { text: '  {', delay: 8 },
        { text: '    "tokenId": "378780",', delay: 10 },
        { text: '    "chain": "Ethereum",', delay: 12 },
        { text: '    "dex": "Uniswap V3",', delay: 14 },
        { text: '    "token0": { "symbol": "USDC" },', delay: 16 },
        { text: '    "currentPrice": 0.000421,', delay: 18 },
        { text: '    "inRange": false,', color: R, delay: 20 },
        { text: '    "positionValueUSD": 19.93,', delay: 22 },
        { text: '    "feeIncomeUSD": 2.88,', color: G, delay: 24 },
        { text: '    "feeAPY": 0.043,', color: G, delay: 26 },
        { text: '    "entryPriceSource": "mint-event",', color: C, delay: 28 },
        { text: '    "ilPercent": -0.3003,', color: R, delay: 30 },
        { text: '    "risk": "HIGH",', color: R, delay: 32 },
        { text: '    "action": "REBALANCE"', delay: 34 },
        { text: '  }', delay: 36 },
        { text: ']', delay: 38 },
      ]}
    />
    <Subtitle text="Agents get clean JSON. No terminal colors, no status messages. Just structured data they can act on." />
  </Scene>
);

// Duration in frames (30fps) matched to audio lengths + padding
const SCENES = [
  { id: 'hook', duration: 330, Component: HookScene, audio: '01-hook.mp3' },
  { id: 'problem', duration: 270, Component: ProblemScene, audio: '02-problem.mp3' },
  { id: 'multi-dex', duration: 345, Component: MultiDexScene, audio: '03-multi-dex.mp3' },
  { id: 'fees', duration: 396, Component: FeesScene, audio: '04-fees.mp3' },
  { id: 'entry-price', duration: 348, Component: EntryPriceScene, audio: '05-entry-price.mp3' },
  { id: 'json', duration: 222, Component: JsonScene, audio: '06-json.mp3' },
  { id: 'close', duration: 180, Component: () => <Scene><ClosingCard /></Scene>, audio: '07-close.mp3' },
];

export const LPIntelDemo: React.FC = () => {
  return (
    <Series>
      {SCENES.map(({ id, duration, Component, audio }) => (
        <Series.Sequence key={id} durationInFrames={duration}>
          <Component />
          <Sequence from={15}>
            <Audio src={staticFile(audio)} />
          </Sequence>
        </Series.Sequence>
      ))}
    </Series>
  );
};
