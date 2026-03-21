#!/bin/bash
# Деплой KotoCard на VPS одной командой с Mac
# Использование: ./scripts/deploy.sh   или   npm run deploy
# Пароль спрашивается один раз за счёт общего SSH-соединения (ControlMaster).

set -e
REMOTE="root@45.89.228.209"
APP_DIR="/var/www/kotocard"
SSH_OPTS="-o ControlMaster=auto -o ControlPath=/tmp/ssh-kotocard-%r@%h:%p -o ControlPersist=60 -o ServerAliveInterval=30 -o ServerAliveCountMax=120"

# ── 1. Читаем prod-переменные с сервера ──────────────────────────────────────
echo "🔑 Читаю env с сервера..."
PROD_ENV=$(ssh $SSH_OPTS "$REMOTE" "cat $APP_DIR/.env.production 2>/dev/null || cat $APP_DIR/.env.local 2>/dev/null || true")
if [ -z "$PROD_ENV" ]; then
  echo "Ошибка: на сервере нет $APP_DIR/.env.production и нет $APP_DIR/.env.local."
  exit 1
fi
eval "$(echo "$PROD_ENV" | grep -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)=' | sed 's/^/export /')"
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "Ошибка: в prod env на сервере нет NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY."
  exit 1
fi

# ── 2. Локальная сборка (на Mac — быстро, без OOM) ───────────────────────────
echo "🔨 Локальная сборка с prod-переменными..."
npm run build

# ── 3. Синхронизируем код (без node_modules и .env) ─────────────────────────
echo "📦 Синхронизация кода..."
rsync -avz -e "ssh $SSH_OPTS" \
  --exclude 'node_modules' --exclude '.git' --exclude '.env.local' --exclude 'piper-tts/venv' --exclude 'bmad' \
  ./ "$REMOTE:$APP_DIR/"

# ── 4. На сервере: deps + перезапуск ────────────────────────────────────────
echo "🚀 Перезапуск на сервере..."
ssh $SSH_OPTS "$REMOTE" "cd $APP_DIR && npm ci --omit=dev && (pm2 delete kotocard 2>/dev/null || true) && pm2 start ecosystem.config.cjs && pm2 save"

echo "✅ Готово. Прод: https://kotocard.borische.ru"

