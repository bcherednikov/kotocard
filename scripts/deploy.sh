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
  --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env.local' --exclude 'piper-tts/venv' \
  ./ "$REMOTE:$APP_DIR/"

echo "🔨 Сборка и перезапуск на сервере..."
ssh $SSH_OPTS "$REMOTE" "cd $APP_DIR && rm -rf piper-tts/venv && npm ci && npm run build && cd piper-tts && python3 -m venv venv && source venv/bin/activate && pip install -q --upgrade pip && pip install -q -r requirements.txt && deactivate && cd .. && pm2 restart kotocard"

echo "Готово. Сайт: http://45.89.228.209"

