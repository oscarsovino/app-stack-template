#!/usr/bin/env bash
# init-app-stack.sh — initialize or update App Stack in a target project
#
# Usage:
#   bash init-app-stack.sh [target-dir]
#
# Idempotent. Re-running updates content between APP-STACK-START/END markers
# without touching anything else.

set -euo pipefail

TARGET="${1:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_ABS="$(cd "$TARGET" && pwd)"

echo "==> App Stack Template"
echo "    source: $SCRIPT_DIR"
echo "    target: $TARGET_ABS"
echo ""

# ---------------------------------------------------------------------------
# Phase 1: inject CLAUDE.md block (marker-driven, idempotent)
# Phase 2 (TODO): copy packages/*, apps/web, apps/mobile; configure workspaces
# ---------------------------------------------------------------------------

CLAUDE_FILE="$TARGET_ABS/CLAUDE.md"
BLOCK_FILE="$SCRIPT_DIR/app-stack-claude.md"
START_MARKER="<!-- APP-STACK-START -->"
END_MARKER="<!-- APP-STACK-END -->"

if [[ ! -f "$BLOCK_FILE" ]]; then
  echo "ERROR: missing $BLOCK_FILE"
  exit 1
fi

if [[ ! -f "$CLAUDE_FILE" ]]; then
  echo "-> creating $CLAUDE_FILE with App Stack block"
  cp "$BLOCK_FILE" "$CLAUDE_FILE"
elif grep -qF "$START_MARKER" "$CLAUDE_FILE" && grep -qF "$END_MARKER" "$CLAUDE_FILE"; then
  echo "-> updating existing App Stack block in $CLAUDE_FILE"
  # Remove existing block (between markers, inclusive), then append fresh block.
  TMP="$(mktemp)"
  sed "/$START_MARKER/,/$END_MARKER/d" "$CLAUDE_FILE" > "$TMP"
  # Strip trailing empty lines from the remaining content.
  awk 'NF {p=1} p' "$TMP" > "$CLAUDE_FILE"
  printf "\n" >> "$CLAUDE_FILE"
  cat "$BLOCK_FILE" >> "$CLAUDE_FILE"
  rm -f "$TMP"
else
  echo "-> appending App Stack block to $CLAUDE_FILE"
  printf "\n\n" >> "$CLAUDE_FILE"
  cat "$BLOCK_FILE" >> "$CLAUDE_FILE"
fi

echo ""
echo "==> Phase 1 complete."
echo "    Phase 2 (scaffold packages/ and apps/) is work-in-progress."
echo "    For now, copy packages/* from the template into your monorepo manually"
echo "    and reference SPEC.md for conventions."
