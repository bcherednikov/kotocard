#!/bin/bash
# Запуск Next.js на сервере для PM2 (npx находит next в node_modules)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[ -f "$SCRIPT_DIR/package.json" ] && ROOT_DIR="$SCRIPT_DIR" || ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR" || exit 1
export NODE_ENV=production
exec npx next start
