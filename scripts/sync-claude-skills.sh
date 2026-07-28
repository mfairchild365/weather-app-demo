#!/usr/bin/env bash
# Link every skill under .github/skills/ into .claude/skills/ so Claude Code discovers it.
# .github/skills stays canonical (GitHub Copilot reads it); .claude/skills holds symlinks.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$repo/.github/skills"
dest="$repo/.claude/skills"

mkdir -p "$dest"

for skill in "$src"/*/; do
  name="$(basename "$skill")"
  [ -f "$skill/SKILL.md" ] || { echo "skip $name (no SKILL.md)"; continue; }
  ln -sfn "../../.github/skills/$name" "$dest/$name"
  echo "linked $name"
done

# Drop links whose source skill is gone.
for link in "$dest"/*; do
  [ -e "$link" ] || { echo "removing stale $(basename "$link")"; rm -f "$link"; }
done
