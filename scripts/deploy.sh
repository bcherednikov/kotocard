#!/bin/bash
# Деплой KotoCard на VPS одной командой с Mac
# Использование: ./scripts/deploy.sh   или   npm run deploy
# Пароль спрашивается один раз за счёт общего SSH-соединения (ControlMaster).

set -e
REMOTE="root@45.89.228.209"
APP_DIR="/var/www/kotocard"
# Один сокет для rsync и ssh — пароль один раз
SSH_OPTS="-o ControlMaster=auto -o ControlPath=/tmp/ssh-kotocard-%r@%h:%p -o ControlPersist=60"

echo "📦 Синхронизация файлов..."
rsync -avz -e "ssh $SSH_OPTS" \
  --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env.local' \
  ./ "$REMOTE:$APP_DIR/"

echo "🔨 Сборка и перезапуск на сервере..."
ssh $SSH_OPTS "$REMOTE" "cd $APP_DIR && npm ci && npm run build && pm2 restart kotocard"

echo "Готово. Сайт: http://45.89.228.209"

