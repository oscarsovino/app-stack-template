#!/usr/bin/env bash
# init-app-stack.sh — initialize or update App Stack in a target project
#
# Usage:
#   bash init-app-stack.sh [target-dir] [flags]
#
# Flags:
#   --preset=web|mobile|both   Which apps/ to scaffold (default: none)
#   --install                  Run pnpm install after copy
#   --force                    Overwrite files that already exist
#   -h, --help                 This help
#
# Idempotent. Existing files are skipped unless --force. The CLAUDE.md block
# between APP-STACK-START/END markers is always refreshed.

set -euo pipefail

TARGET=""
PRESET="none"
FORCE=0
INSTALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preset=*) PRESET="${1#*=}"; shift ;;
    --preset) PRESET="$2"; shift 2 ;;
    --install) INSTALL=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    -*) echo "Unknown flag: $1" >&2; exit 2 ;;
    *) if [[ -z "$TARGET" ]]; then TARGET="$1"; fi; shift ;;
  esac
done

TARGET="${TARGET:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$TARGET"
TARGET_ABS="$(cd "$TARGET" && pwd)"

echo "==> App Stack Template"
echo "    source: $SCRIPT_DIR"
echo "    target: $TARGET_ABS"
echo "    preset: $PRESET"
echo ""

copy_file() {
  local src="$1" dst="$2"
  if [[ -e "$dst" && "$FORCE" != "1" ]]; then
    echo "  skip (exists): ${dst#$TARGET_ABS/}"
    return
  fi
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  echo "  copied: ${dst#$TARGET_ABS/}"
}

copy_dir() {
  local src="$1" dst="$2"
  if [[ -d "$dst" && "$FORCE" != "1" ]]; then
    echo "  skip (dir exists): ${dst#$TARGET_ABS/}"
    return
  fi
  mkdir -p "$dst"
  cp -R "$src/." "$dst/"
  echo "  copied dir: ${dst#$TARGET_ABS/}"
}

# --- 1. Root config --------------------------------------------------------

echo "-> root config"
for f in package.json pnpm-workspace.yaml turbo.json .nvmrc .gitignore prettier.config.mjs; do
  if [[ -f "$SCRIPT_DIR/$f" ]]; then
    copy_file "$SCRIPT_DIR/$f" "$TARGET_ABS/$f"
  fi
done

# --- 2. Shared packages ----------------------------------------------------

echo "-> packages/"
for pkg_path in "$SCRIPT_DIR/packages"/*/; do
  pkg_name="$(basename "$pkg_path")"
  copy_dir "$pkg_path" "$TARGET_ABS/packages/$pkg_name"
done

# --- 3. Apps (by preset) ---------------------------------------------------

case "$PRESET" in
  web)    APPS=("web") ;;
  mobile) APPS=("mobile") ;;
  both)   APPS=("web" "mobile") ;;
  none)   APPS=() ;;
  *)      echo "Invalid --preset: $PRESET (use: web|mobile|both|none)" >&2; exit 2 ;;
esac

if [[ ${#APPS[@]} -gt 0 ]]; then
  echo "-> apps/: ${APPS[*]}"
  for app in "${APPS[@]}"; do
    copy_dir "$SCRIPT_DIR/apps/$app" "$TARGET_ABS/apps/$app"
  done
fi

# --- 4. CLAUDE.md block (idempotent, always refreshed) --------------------

echo "-> CLAUDE.md block"
CLAUDE_FILE="$TARGET_ABS/CLAUDE.md"
BLOCK_FILE="$SCRIPT_DIR/app-stack-claude.md"
START_MARKER="<!-- APP-STACK-START -->"
END_MARKER="<!-- APP-STACK-END -->"

if [[ ! -f "$BLOCK_FILE" ]]; then
  echo "ERROR: missing $BLOCK_FILE" >&2
  exit 1
fi

if [[ ! -f "$CLAUDE_FILE" ]]; then
  cp "$BLOCK_FILE" "$CLAUDE_FILE"
  echo "  created: CLAUDE.md"
elif grep -qF "$START_MARKER" "$CLAUDE_FILE" && grep -qF "$END_MARKER" "$CLAUDE_FILE"; then
  TMP="$(mktemp)"
  sed "/$START_MARKER/,/$END_MARKER/d" "$CLAUDE_FILE" > "$TMP"
  awk 'NF {p=1} p' "$TMP" > "$CLAUDE_FILE"
  printf "\n" >> "$CLAUDE_FILE"
  cat "$BLOCK_FILE" >> "$CLAUDE_FILE"
  rm -f "$TMP"
  echo "  updated block"
else
  printf "\n\n" >> "$CLAUDE_FILE"
  cat "$BLOCK_FILE" >> "$CLAUDE_FILE"
  echo "  appended block"
fi

# --- 5. Install (optional) -------------------------------------------------

if [[ "$INSTALL" == "1" ]]; then
  echo "-> pnpm install"
  (cd "$TARGET_ABS" && pnpm install)
fi

echo ""
echo "==> Done."
if [[ ${#APPS[@]} -gt 0 ]]; then
  echo "    Apps scaffolded: ${APPS[*]}"
fi
if [[ "$INSTALL" != "1" ]]; then
  echo "    Next: cd $TARGET_ABS && pnpm install"
fi
