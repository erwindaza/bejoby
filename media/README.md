# BeJoby Media Generation (Sora)

This folder contains prompts and output locations for BeJoby hero media.

## Prereqs
- OPENAI_API_KEY set in your shell
- Sora CLI path: $HOME/.codex/skills/sora/scripts/sora.py
- Network access enabled in Codex

## Generate v1 video + thumbnail

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export SORA_CLI="$CODEX_HOME/skills/sora/scripts/sora.py"

uv run --with openai python "$SORA_CLI" create-and-poll \
  --model sora-2 \
  --prompt-file "/Users/macbookpro/Documents/New project/bejoby/media/prompts/bejoby-hero-v1.txt" \
  --no-augment \
  --size 1280x720 \
  --seconds 4 \
  --download \
  --variant video \
  --out "/Users/macbookpro/Documents/New project/bejoby/media/videos/bejoby-hero-v1.mp4" \
  --json-out "/Users/macbookpro/Documents/New project/bejoby/media/bejoby-hero-v1.json"

# Thumbnail (image)
uv run --with openai python "$SORA_CLI" download \
  --id "<VIDEO_ID_FROM_JSON>" \
  --variant thumbnail \
  --out "/Users/macbookpro/Documents/New project/bejoby/media/img/bejoby-hero-v1-thumb.webp"
```

## Remix v2 (single change)
Prompt change:
- Make the glowing path 15% brighter and add subtle bloom.

```bash
uv run --with openai python "$SORA_CLI" remix \
  --id "<VIDEO_ID_FROM_JSON>" \
  --prompt "Same shot and camera move. Make the glowing path about 15% brighter and add subtle bloom." \
  --json-out "/Users/macbookpro/Documents/New project/bejoby/media/bejoby-hero-v2.json"

uv run --with openai python "$SORA_CLI" poll \
  --id "<VIDEO_ID_FROM_JSON>" \
  --download \
  --variant video \
  --out "/Users/macbookpro/Documents/New project/bejoby/media/videos/bejoby-hero-v2.mp4"

uv run --with openai python "$SORA_CLI" download \
  --id "<VIDEO_ID_FROM_JSON>" \
  --variant thumbnail \
  --out "/Users/macbookpro/Documents/New project/bejoby/media/img/bejoby-hero-v2-thumb.webp"
```
