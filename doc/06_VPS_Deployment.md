# Деплой KotoCard на свой VPS

Пошаговый план переноса приложения на собственный сервер.

---

## Что куда деплоим

| Компонент | Где будет работать | Примечание |
|-----------|--------------------|------------|
| **Next.js приложение** | Твой VPS | Node.js, порт 3000 |
| **База данных, Auth, Storage** | Supabase Cloud | Оставляем как есть, только меняем хостинг фронта |

Supabase остаётся в облаке — переносить PostgreSQL и Auth на VPS не обязательно и сложнее. Сначала выносим только фронт.

---

## Что нужно до начала

- [ ] **VPS** с Ubuntu 22.04 (или 24.04). Минимум 1 GB RAM, 1 CPU.
- [ ] **Доступ по SSH** (логин/пароль или ключ).
- [ ] **Домен** (опционально): например `kotocard.example.com` — для нормального SSL. Без домена можно по IP и без HTTPS на первом этапе.
- [ ] **Supabase проект** уже создан и в нём настроены URL и anon key (как в `.env.local`).

---

## План по шагам (обзор)

| Шаг | Что делаем | Где |
|-----|------------|-----|
| **0** | Подготовка проекта (env, build) | Локально |
| **1** | Подключение к VPS, обновление системы | VPS |
| **2** | Установка Node.js | VPS |
| **3** | Установка PM2 (менеджер процессов) | VPS |
| **4** | Загрузка кода на сервер (git clone или rsync) | Локально → VPS |
| **5** | Установка зависимостей и сборка | VPS |
| **6** | Настройка переменных окружения | VPS |
| **7** | Запуск приложения через PM2 | VPS |
| **8** | Настройка Nginx (обратный прокси) | VPS |
| **9** | SSL (Let's Encrypt) — если есть домен | VPS |
| **10** | Финальная проверка и автозапуск | VPS |

Дальше идём по одному шагу и после каждого проверяем результат.

---

## Шаг 0: Подготовка проекта (локально)

**Цель:** убедиться, что приложение собирается и есть шаблон переменных окружения.

**Действия:**
1. В корне проекта есть `.env.local` с:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Выполнить: `npm ci && npm run build`
3. Если сборка прошла — проект готов к деплою на VPS.

**Проверка:** в папке появилась `.next/` и команда `npm run start` запускает приложение на http://localhost:3000.

---

## Шаг 1: Подключение к VPS и обновление системы

**Цель:** зайти на сервер и обновить пакеты.

**Действия на своём компьютере:**
```bash
ssh root@ТВОЙ_IP_АДРЕС
# или
ssh ubuntu@ТВОЙ_IP_АДРЕС
```

**На сервере:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Проверка:** команды выполнились без ошибок, ты в shell сервера.

---

## Шаг 2: Установка Node.js

**Цель:** поставить Node.js 20 LTS (подходит для Next.js 16).

**На VPS:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # должно быть v20.x.x
npm -v
```

**Проверка:** `node -v` и `npm -v` выводят версии.

---

## Шаг 3: Установка PM2

**Цель:** запускать приложение как сервис и перезапускать при падении.

**На VPS:**
```bash
sudo npm install -g pm2
pm2 --version
```

**Проверка:** `pm2 --version` выводит номер версии.

---

## Шаг 4: Загрузка кода на сервер

**Вариант A: через Git (если проект в репозитории)**

На VPS:
```bash
sudo apt install -y git
cd /var/www   # или другая папка, при необходимости создать: sudo mkdir -p /var/www
sudo git clone https://github.com/ТВОЙ_ЮЗЕР/ТВОЙ_РЕПО.git kotocard
sudo chown -R $USER:$USER kotocard
cd kotocard
```

**Вариант B: через rsync с локального компьютера**

На своём компьютере (из папки проекта):
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  ./ user@ТВОЙ_IP:/var/www/kotocard/
```

На VPS создать папку при необходимости:
```bash
mkdir -p /var/www/kotocard
```

**Проверка:** на VPS в `/var/www/kotocard` (или выбранной папке) есть `package.json`, `src/`, `next.config.ts`.

---

## Шаг 5: Установка зависимостей и сборка на VPS

**На VPS (в папке проекта):**
```bash
cd /var/www/kotocard   # или твой путь
npm ci
npm run build
```

**Проверка:** сборка завершилась без ошибок, есть папка `.next`.

---

## Шаг 6: Переменные окружения на сервере

**На VPS** создать файл с секретами (не коммитить в git):

```bash
nano /var/www/kotocard/.env.production
```

Содержимое (подставь свои значения из Supabase):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Сохранить (Ctrl+O, Enter, Ctrl+X).

Права:
```bash
chmod 600 /var/www/kotocard/.env.production
```

**Проверка:** файл существует и не доступен «всем» (не в git).

---

## Шаг 7: Запуск приложения через PM2

**На VPS:**
```bash
cd /var/www/kotocard
NODE_ENV=production pm2 start npm --name "kotocard" -- start
pm2 save
pm2 startup   # выполнить команду, которую выведет pm2 (для автозапуска после перезагрузки)
```

**Проверка:**
- `pm2 status` — процесс `kotocard` в статусе `online`
- На сервере: `curl http://localhost:3000` — возвращается HTML главной страницы

---

## Шаг 8: Nginx как обратный прокси

**Цель:** чтобы приложение открывалось по 80 порту (и позже по HTTPS).

**На VPS:**
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/kotocard
```

Вставить (замени `ТВОЙ_ДОМЕН` на домен или пока оставь `_` и используй IP):

```nginx
server {
    listen 80;
    server_name ТВОЙ_ДОМЕН _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Включить сайт и перезагрузить Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/kotocard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Проверка:** в браузере открыть http://ТВОЙ_IP или http://ТВОЙ_ДОМЕН — должна открыться приложение.

---

## Шаг 9: SSL (Let's Encrypt) — если есть домен

**На VPS:**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ТВОЙ_ДОМЕН
```

Следовать подсказкам (email, согласие). Certbot сам настроит HTTPS в Nginx.

**Проверка:** https://ТВОЙ_ДОМЕН открывается по HTTPS.

---

## Шаг 10: Финальные проверки

- [ ] Сайт открывается по HTTP или HTTPS.
- [ ] Логин/регистрация работают (Supabase Auth).
- [ ] `pm2 status` — приложение `online`.
- [ ] После перезагрузки VPS приложение поднимается само (`pm2 startup` был выполнен).

---

## Полезные команды после деплоя

```bash
pm2 status
pm2 logs kotocard
pm2 restart kotocard
pm2 stop kotocard
```

---

## Как обновить приложение на сервере

Когда что-то изменил в коде локально и хочешь выкатить на VPS.

### Вариант A: через rsync (как при первом деплое)

**1. На своём Mac** (в папке проекта):
```bash
cd /Users/borische/KotoCard
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' ./ root@45.89.228.209:/var/www/kotocard/
```

**2. На сервере** (по SSH):
```bash
cd /var/www/kotocard
npm ci
npm run build
pm2 restart kotocard
```

Готово — сайт уже с новым кодом.

---

### Вариант B: через Git (если проект в репозитории)

**На сервере:**
```bash
cd /var/www/kotocard
git pull
npm ci
npm run build
pm2 restart kotocard
```

(На Mac перед этим делаешь `git push` из папки проекта.)

---

### Важно

- **Не перезаписывай** `.env.local` на сервере при rsync, если там уже правильные ключи. При необходимости добавь в rsync: `--exclude '.env.local'`.
- После `npm run build` всегда делай `pm2 restart kotocard`, иначе будет крутиться старая сборка.

---

## Удобный деплой одной командой (скрипт)

Вместо ручного rsync + SSH можно с Mac запускать один раз:

```bash
npm run deploy
```

Скрипт `scripts/deploy.sh` сам синхронизирует файлы и на сервере выполняет `npm ci && npm run build && pm2 restart kotocard`. Требуется вход по SSH без пароля (ключ) или ввод пароля при rsync/ssh.

---

## Варианты «ещё удобнее»

| Способ | Идея | Плюсы |
|--------|------|--------|
| **Скрипт `npm run deploy`** | Одна команда с Mac | Уже есть в проекте, минимум настроек |
| **Docker** | Образ приложения, на сервере только `docker pull` и перезапуск контейнера | Одинаковое окружение везде, откат на старый образ, не трогаешь node на сервере |
| **GitHub Actions (CI/CD)** | Push в `main` → автоматически деплой на VPS по SSH | «Запушил — и выкатилось», не нужен доступ с Mac к серверу после настройки |

При желании можно добавить Dockerfile + docker-compose или workflow для GitHub Actions — напиши, что интереснее.

---

## Что дальше

- Бэкапы БД делаются в Supabase (настрой в панели Supabase).
- Логи приложения: `pm2 logs kotocard`.
- Мониторинг: при желании добавить мониторинг uptime (UptimeRobot, etc.) по твоему URL.

Когда будешь готов, начинаем с **Шага 0** и идём по одному шагу с проверкой после каждого.
