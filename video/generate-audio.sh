#!/usr/bin/env zsh
set -e
setopt +o nomatch

SCRIPT_DIR="${0:A:h}"
AUDIO_DIR="$SCRIPT_DIR/audio"
mkdir -p "$AUDIO_DIR"
rm -f "$AUDIO_DIR"/*.mp3 2>/dev/null || true

VOICE_ID="nPczCjzI2devNBz1zQrb"  # Brian
MODEL="eleven_multilingual_v2"

if [[ -z "$ELEVENLABS_API_KEY" ]]; then
  echo "ERROR: ELEVENLABS_API_KEY not set"
  exit 1
fi

declare -A CLIPS
CLIPS[01-hook]="This tool reads any wallet's LP positions and tells you exactly what they're worth. Fees earned, impermanent loss, risk level. All from on-chain data."
CLIPS[02-problem]="AI agents can create Uniswap positions. But they can't analyze existing ones. No tool tells an agent whether an LP is making or losing money."
CLIPS[03-multi-dex]="LP Intel scans three DEXes per chain. Uniswap, SushiSwap, PancakeSwap. One command, four chains, every V3 position in the wallet."
CLIPS[04-fees]="Fees aren't just the tokens owed field. We read fee growth global, fee growth outside for both ticks, and compute the real uncollected amount. That's the actual Uniswap V3 pool math."
CLIPS[05-entry-price]="Entry prices come from binary-searching the NFT mint block. Twenty-four RPC calls to find exactly when the position was created. Then we pull the historical pool price at that block."
CLIPS[06-json]="Agents get clean JSON. No terminal colors, no status messages. Just structured data they can act on."
CLIPS[07-close]="LP Intel. Built with On Chain O S and Uniswap AI Skills."

for clip in 01-hook 02-problem 03-multi-dex 04-fees 05-entry-price 06-json 07-close; do
  OUT="$AUDIO_DIR/$clip.mp3"
  echo "Generating $clip..."
  TEXT="${CLIPS[$clip]}"

  curl -s "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"$TEXT\",
      \"model_id\": \"$MODEL\",
      \"voice_settings\": {
        \"stability\": 0.82,
        \"similarity_boost\": 0.65,
        \"style\": 0.03
      }
    }" \
    -o "$OUT"

  if file "$OUT" | grep -q "JSON\|text\|ASCII"; then
    echo "ERROR: $clip returned error:"
    cat "$OUT"
    rm "$OUT"
    exit 1
  fi

  SIZE=$(wc -c < "$OUT")
  echo "OK $clip ($SIZE bytes)"
done

echo "All audio clips generated"
