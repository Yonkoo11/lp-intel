#!/usr/bin/env python3
"""Generate terminal-style frames for demo video using Pillow."""

from PIL import Image, ImageDraw, ImageFont
import os

WIDTH, HEIGHT = 1920, 1080
BG_COLOR = (22, 22, 30)       # Dark terminal
TEXT_COLOR = (220, 220, 220)   # Light gray
GREEN = (80, 200, 100)
RED = (220, 80, 80)
YELLOW = (220, 200, 80)
CYAN = (100, 200, 220)
DIM = (120, 120, 140)

FRAMES_DIR = os.path.join(os.path.dirname(__file__), "frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

def get_font(size=23):
    for name in ["Menlo.ttc", "SFMono-Regular.otf", "Monaco.dfont", "Courier New.ttf"]:
        try:
            return ImageFont.truetype(f"/System/Library/Fonts/{name}", size)
        except (OSError, IOError):
            continue
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Courier New.ttf", size)
    except:
        return ImageFont.load_default()

def draw_terminal(lines, filename, title="lp-intel"):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Terminal window chrome
    draw.rectangle([(40, 30), (WIDTH-40, 70)], fill=(45, 45, 55))
    draw.ellipse([(60, 42), (76, 58)], fill=(255, 95, 86))
    draw.ellipse([(88, 42), (104, 58)], fill=(255, 189, 46))
    draw.ellipse([(116, 42), (132, 58)], fill=(39, 201, 63))

    title_font = get_font(15)
    draw.text((WIDTH//2, 50), title, fill=(160, 160, 170), font=title_font, anchor="mm")

    # Terminal body
    draw.rectangle([(40, 70), (WIDTH-40, HEIGHT-30)], fill=(18, 18, 26))

    font = get_font(23)
    y = 90
    line_height = 30

    for line in lines:
        if isinstance(line, tuple):
            text, color = line
        else:
            text = line
            color = TEXT_COLOR

        draw.text((70, y), text, fill=color, font=font)
        y += line_height

    img.save(os.path.join(FRAMES_DIR, filename))
    print(f"  Generated {filename}")

# Frame 01: Hook - Real position output (trimmed for larger font)
draw_terminal([
    ("$ npx tsx src/index.ts analyze 0xC364...FE88 --chain ethereum", DIM),
    "",
    ("  Found 6 positions (3 active, 3 closed)", DIM),
    "",
    ("==========================================================", CYAN),
    ("  LP INTEL - Concentrated Liquidity Position Analysis", CYAN),
    ("==========================================================", CYAN),
    "",
    ("Position #378780 -- WETH/USDC (0.05%) [Uniswap V3]", TEXT_COLOR),
    ("Chain: Ethereum | Status: OUT OF RANGE", RED),
    "",
    ("  Price Range:    1,255 -- 1,293 USDC/WETH", TEXT_COLOR),
    ("  Current Price:  2,374 USDC/WETH", TEXT_COLOR),
    "",
    ("  Token Amounts:  19.93 USDC + 0.00 WETH", TEXT_COLOR),
    ("  Position Value: $19.93", TEXT_COLOR),
    "",
    ("  Uncollected Fees: +$2.88", GREEN),
    ("  Fee APY (est):    4.3%", GREEN),
    ("  Days Active:      1,231", TEXT_COLOR),
    ("  Impermanent Loss: -$8.55 (-30.03%)", RED),
    ("  Net P&L:          -$5.67 (-19.92%)", YELLOW),
    "",
    ("  Risk: HIGH -- Price is outside position range", RED),
    ("  Action: REBALANCE -- not earning fees", YELLOW),
    "",
    ("  [Rebalance on Uniswap](...)", CYAN),
    ("----------------------------------------------------------", DIM),
], "01-hook.png", "lp-intel -- position analysis")

# Frame 02: Problem - agents can't analyze
draw_terminal([
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  AI agents today:", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("    [x] Create LP positions    (liquidity-planner skill)", GREEN),
    ("    [x] Swap tokens            (swap-integration skill)", GREEN),
    ("    [x] Check wallet balance   (wallet-portfolio skill)", GREEN),
    ("", TEXT_COLOR),
    ("    [ ] Analyze existing LPs   ???", RED),
    ("    [ ] Check impermanent loss ???", RED),
    ("    [ ] Know when to rebalance ???", RED),
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  Agents can build positions.", TEXT_COLOR),
    ("  But they're blind to what happens after.", YELLOW),
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  LP Intel fills this gap.", CYAN),
], "02-problem.png", "the gap in agent tooling")

# Frame 03: Multi-DEX scan
draw_terminal([
    ("$ npx tsx src/index.ts analyze 0x0193...7d68 --chain ethereum", DIM),
    "",
    ("Scanning Ethereum Uniswap V3 positions...", TEXT_COLOR),
    ("  Found 8 positions (0 active, 8 closed)", DIM),
    ("  Analyzing 0 positions...", DIM),
    "",
    ("Scanning Ethereum SushiSwap V3 positions...", TEXT_COLOR),
    ("  Found 6 positions (2 active, 4 closed)", GREEN),
    ("  Analyzing 2 positions...", GREEN),
    "",
    ("Scanning Ethereum PancakeSwap V3 positions...", TEXT_COLOR),
    ("  Found 2 positions (0 active, 2 closed)", DIM),
    ("  Analyzing 0 positions...", DIM),
    "",
    ("============================================================", CYAN),
    ("  LP INTEL - Concentrated Liquidity Position Analysis", CYAN),
    ("============================================================", CYAN),
    "",
    ("Position #2824 -- LAWAS/XAUt (0.05% fee) [SushiSwap V3]", TEXT_COLOR),
    ("Chain: Ethereum | Status: IN RANGE", GREEN),
    ("  Price Range:    3.67e-9 -- 6.82e-9 XAUt/LAWAS", TEXT_COLOR),
    ("  Position Value: $0.00", TEXT_COLOR),
    ("  Risk: LOW -- Price at 64% through range", GREEN),
    ("------------------------------------------------------------", DIM),
    "",
    ("Position #2825 -- WETH/USDT (0.30% fee) [SushiSwap V3]", TEXT_COLOR),
    ("Chain: Ethereum | Status: OUT OF RANGE", RED),
    ("  Price Range:    1,889.42 -- 2,316.97 USDT/WETH", TEXT_COLOR),
    ("  Current Price:  2,377.37 USDT/WETH", TEXT_COLOR),
    ("  Position Value: $2.15", TEXT_COLOR),
    ("  Uncollected Fees: +$0.019", GREEN),
    ("  Impermanent Loss: -$0.08 (-3.60%)", RED),
    ("  Risk: HIGH -- Price is outside position range", RED),
    "",
    ("============================================================", CYAN),
    ("  SUMMARY", CYAN),
    ("============================================================", CYAN),
    ("  Total Positions: 2 (1 in range, 1 out of range)", TEXT_COLOR),
    ("  DEXes Scanned:   SushiSwap V3", TEXT_COLOR),
], "03-multi-dex.png", "multi-DEX scanning")

# Frame 04: Fee math detail
draw_terminal([
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  How LP Intel computes uncollected fees:", CYAN),
    ("", TEXT_COLOR),
    ("  Step 1: Read pool.feeGrowthGlobal0X128", TEXT_COLOR),
    ("          Read pool.feeGrowthGlobal1X128", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  Step 2: Read ticks(tickLower).feeGrowthOutside0X128", TEXT_COLOR),
    ("          Read ticks(tickLower).feeGrowthOutside1X128", TEXT_COLOR),
    ("          Read ticks(tickUpper).feeGrowthOutside0X128", TEXT_COLOR),
    ("          Read ticks(tickUpper).feeGrowthOutside1X128", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  Step 3: Compute feeGrowthInside (mod 2^256 arithmetic)", TEXT_COLOR),
    ("          feeBelow = tick >= lower ? outside : global - outside", YELLOW),
    ("          feeAbove = tick <  upper ? outside : global - outside", YELLOW),
    ("          feeInside = global - feeBelow - feeAbove", GREEN),
    ("", TEXT_COLOR),
    ("  Step 4: fees = (feeInside - lastFeeInside) * liquidity / 2^128", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  Result: Position #378780", CYAN),
    ("          USDC fees: 1.01   ($1.01)", GREEN),
    ("          WETH fees: 0.000788 ($1.87)", GREEN),
    ("          Total:     $2.88", GREEN),
    ("", TEXT_COLOR),
    ("  Not just tokensOwed. The real on-chain math.", YELLOW),
], "04-fees.png", "feeGrowthInside math")

# Frame 05: Entry price binary search
draw_terminal([
    ("", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  Finding when position #378780 was created:", CYAN),
    ("", TEXT_COLOR),
    ("  Binary search via positions(tokenId) at historical blocks:", TEXT_COLOR),
    ("", TEXT_COLOR),
    ("    Block 12,369,621 (deploy)  -> not found", DIM),
    ("    Block 17,184,810          -> exists", DIM),
    ("    Block 14,777,215          -> not found", DIM),
    ("    Block 15,981,012          -> not found", DIM),
    ("    Block 16,582,911          -> exists", DIM),
    ("    Block 16,281,961          -> exists", DIM),
    ("    Block 16,131,486          -> exists", DIM),
    ("    Block 16,056,249          -> not found", DIM),
    ("    Block 16,093,867          -> exists", DIM),
    ("    Block 16,081,539          -> exists", GREEN),
    ("    Block 16,081,538          -> not found", DIM),
    ("", TEXT_COLOR),
    ("  Minted at block 16,081,539", GREEN),
    ("  Timestamp: November 29, 2022", GREEN),
    ("  Days active: 1,231", GREEN),
    ("", TEXT_COLOR),
    ("  Historical pool price at that block: 1,214.83 USDC/WETH", CYAN),
    ("  Current price: 2,373.75 USDC/WETH", CYAN),
    ("  Fee APY: 4.3%", GREEN),
    ("", TEXT_COLOR),
    ("  24 RPC calls. Works on any archive node.", YELLOW),
], "05-entry-price.png", "entry price resolution")

# Frame 06: JSON output
draw_terminal([
    ("$ npx tsx src/index.ts analyze 0xC364...FE88 --chain ethereum --json", DIM),
    ("", TEXT_COLOR),
    ("[", TEXT_COLOR),
    ('  {', TEXT_COLOR),
    ('    "tokenId": "378780",', TEXT_COLOR),
    ('    "chain": "Ethereum",', TEXT_COLOR),
    ('    "dex": "Uniswap V3",', TEXT_COLOR),
    ('    "token0": { "symbol": "USDC", "decimals": 6 },', TEXT_COLOR),
    ('    "token1": { "symbol": "WETH", "decimals": 18 },', TEXT_COLOR),
    ('    "feeTier": 500,', TEXT_COLOR),
    ('    "currentPrice": 0.000421,', TEXT_COLOR),
    ('    "inRange": false,', RED),
    ('    "positionValueUSD": 19.93,', TEXT_COLOR),
    ('    "feeIncomeUSD": 2.88,', GREEN),
    ('    "feeAPY": 0.043,', GREEN),
    ('    "daysActive": 1231,', TEXT_COLOR),
    ('    "entryPriceSource": "mint-event",', CYAN),
    ('    "ilPercent": -0.3003,', RED),
    ('    "netPnLUSD": -5.67,', YELLOW),
    ('    "risk": "HIGH",', RED),
    ('    "riskReason": "Price is outside position range",', TEXT_COLOR),
    ('    "action": "REBALANCE -- not earning fees"', TEXT_COLOR),
    ('  },', TEXT_COLOR),
    ('  ...', DIM),
    (']', TEXT_COLOR),
    ("", TEXT_COLOR),
    ("  Clean JSON. No terminal colors. Ready for agents.", CYAN),
], "06-json.png", "agent-ready JSON output")

# Frame 07: Close (sans-serif, no GitHub link)
img = Image.new("RGB", (WIDTH, HEIGHT), (12, 12, 20))
draw = ImageDraw.Draw(img)

# Use sans-serif for closing card
def get_sans(size):
    for name in ["/System/Library/Fonts/HelveticaNeue.ttc", "/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except:
            continue
    return get_font(size)

title_font = get_sans(64)
sub_font = get_sans(28)
small_font = get_sans(22)

draw.text((WIDTH//2, HEIGHT//2 - 80), "LP Intel", fill=CYAN, font=title_font, anchor="mm")
draw.text((WIDTH//2, HEIGHT//2), "Concentrated Liquidity Position Analyzer", fill=TEXT_COLOR, font=sub_font, anchor="mm")
draw.text((WIDTH//2, HEIGHT//2 + 60), "Uniswap V3  |  SushiSwap V3  |  PancakeSwap V3", fill=DIM, font=small_font, anchor="mm")
draw.text((WIDTH//2, HEIGHT//2 + 100), "Ethereum  |  Arbitrum  |  Base  |  Polygon", fill=DIM, font=small_font, anchor="mm")
draw.text((WIDTH//2, HEIGHT//2 + 170), "Built with OnchainOS + Uniswap AI Skills", fill=YELLOW, font=sub_font, anchor="mm")

img.save(os.path.join(FRAMES_DIR, "07-close.png"))
print("  Generated 07-close.png")

print("\nAll frames generated.")
