# FlashCards App — Complete Project Documentation

> **Персональное семейное приложение для изучения английского языка**  
> Документация подготовлена для передачи в Cursor IDE / Claude Code

---

## 📋 СОДЕРЖАНИЕ ДОКУМЕНТАЦИИ

### 🚀 НАЧНИ ЗДЕСЬ:

0. **[00_Development_Context.md](./00_Development_Context.md)** — Контекст и Правила Разработки ⭐ **ОБЯЗАТЕЛЬНО К ПРОЧТЕНИЮ**
   - Методология пошаговой разработки
   - Правило "СТОП-НАСТРОЙКА-ПРОВЕРКА"
   - Процедура работы с конфигурациями
   - Чеклисты и acceptance criteria
   - Примеры правильного подхода

### Основные документы:

1. **[01_PRD_Requirements.md](./01_PRD_Requirements.md)** — Product Requirements Document
   - Обзор продукта
   - Функциональные требования (MUST/SHOULD/COULD)
   - Пользовательские роли и права
   - Критерии приёмки MVP

2. **[02_Users_JTBD.md](./02_Users_JTBD.md)** — Пользователи и Jobs To Be Done
   - Персоны (Родитель, Дети)
   - User Stories
   - Пользовательские сценарии (Use Cases)
   - Метрики успеха

3. **[03_Architecture_Database.md](./03_Architecture_Database.md)** — Архитектура и База Данных
   - Database Schema (PostgreSQL)
   - ERD диаграмма
   - Row Level Security (RLS) политики
   - Backend архитектура (Supabase)
   - Frontend архитектура (Next.js)

4. **[04_Development_Roadmap.md](./04_Development_Roadmap.md)** — Roadmap Разработки ⭐ **САМЫЙ ВАЖНЫЙ**
   - Разбивка на фазы (Phase 0-4)
   - Testable milestones (проверяемые шаги)
   - Acceptance criteria для каждого шага
   - Чеклисты проверки

5. **[05_Project_Structure.md](./05_Project_Structure.md)** — Структура Проекта
   - Полная структура папок и файлов
   - Naming conventions
   - Примеры ключевых файлов
   - Best practices

---

## 🎯 БЫСТРЫЙ СТАРТ

### Что делать с этой документацией:

1. **Прочитай ОБЯЗАТЕЛЬНО (перед началом работы):**
   - `00_Development_Context.md` — ⚠️ **КРИТИЧНО!** Правила и методология разработки
   - `04_Development_Roadmap.md` — понять фазы разработки
   - `03_Architecture_Database.md` (секция Database Schema) — понять структуру БД

2. **Держи под рукой во время разработки:**
   - `00_Development_Context.md` — правила "СТОП-НАСТРОЙКА-ПРОВЕРКА"
   - `01_PRD_Requirements.md` — для уточнения требований
   - `04_Development_Roadmap.md` — для пошаговой разработки

3. **Используй как reference:**
   - `02_Users_JTBD.md` — когда нужно понять логику пользователя
   - `05_Project_Structure.md` — когда нужно понять где что лежит

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────┐
│         User (Browser/iPhone)               │
└───────────────────┬─────────────────────────┘
                    │
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────┐
│   Frontend (Next.js 14 + React + TypeScript)│
│   - App Router                              │
│   - Tailwind CSS                            │
│   - shadcn/ui                               │
│   Deployment: Vercel                        │
└───────────────────┬─────────────────────────┘
                    │
                    │ REST API
                    ▼
┌─────────────────────────────────────────────┐
│   Backend (Supabase)                        │
│   - PostgreSQL Database                     │
│   - Authentication                          │
│   - Storage (images/audio)                  │
│   - Row Level Security (RLS)                │
└─────────────────────────────────────────────┘
```

---

## 🗂️ DATABASE SCHEMA (High-Level)

```
families
└── profiles (admin/student)
    └── decks
        └── cards
            └── card_progress (индивидуальный для каждого студента)

study_sessions
└── session_results
```

**Key relationships:**
- Семья → Профили (1:N)
- Семья → Наборы (1:N)
- Набор → Карточки (1:N)
- Студент → Прогресс (1:N)

---

## 🎨 TECH STACK

### Frontend:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **State:** React Context + Zustand

### Backend:
- **BaaS:** Supabase
- **Database:** PostgreSQL 15
- **Auth:** Supabase Auth (email/password)
- **Storage:** Supabase Storage
- **Security:** Row Level Security (RLS)

### Deployment:
- **Frontend:** Vercel
- **Backend:** Supabase Cloud
- **Domain:** TBD

---

## 📦 MVP SCOPE

### ✅ MUST HAVE (Phase 0-4):

**Phase 0: Foundation**
- Next.js + Supabase setup
- Database schema
- Basic layout

**Phase 1: Auth + Profiles**
- Registration/Login
- Family creation
- Child auth accounts (email + password)
- Role-based redirect

**Phase 2: Content Management**
- CRUD наборов
- CRUD карточек
- CSV импорт

**Phase 3: Flashcards Mode**
- Режим карточек (RU→EN, EN→RU)
- TTS озвучка
- Отметки "Знаю/Не знаю"
- Сохранение прогресса

**Phase 4: Progress & Review**
- Дашборд с прогрессом
- Режим повторения
- Статистика

### 🔶 SHOULD HAVE (Post-MVP):
- Тесты (Multiple Choice, Written, Picture)
- Игра Match
- Расширенная статистика
- Streak система

### 🔷 COULD HAVE (v2.0):
- PWA для iPhone
- Offline mode
- AI-генерация карточек
- Gamification (очки, бейджи)

---

## 🚦 DEVELOPMENT PHASES

### Phase 0: Foundation (3-4 дня)
- Setup проекта
- Supabase подключение
- Database schema
- Basic UI layout
- **Checkpoint:** Приложение запускается, БД создана

### Phase 1: Auth + Profiles (3-4 дня)
- Login/Registration
- Create family & child auth accounts
- Role-based redirect
- **Checkpoint:** Родители и дети могут залогиниться под своими учётками

### Phase 2: Content CRUD (5-6 дней)
- Deck management
- Card management
- CSV import
- **Checkpoint:** Можно создавать наборы и карточки

### Phase 3: Flashcards (5-6 дней)
- Flashcard viewer component
- Study session logic
- TTS integration
- Progress tracking
- **Checkpoint:** Можно учить карточки

### Phase 4: Stats & Review (3-4 дня)
- Progress dashboard
- Review mode
- Statistics
- **Checkpoint:** MVP COMPLETE ✅

**Total MVP time: ~4 weeks**

---

## ⚠️ CRITICAL DEVELOPMENT RULES

### 1. ПРОВЕРЯЙ ПОСЛЕ КАЖДОГО ШАГА
- После каждого milestone — запускать и тестировать
- НЕ накапливать код без проверки
- Принцип: "Лучше меньше, но работающее"

### 2. ИСПОЛЬЗУЙ CHECKPOINTS
- В `04_Development_Roadmap.md` есть чекпоинты после каждой фазы
- Пройти все пункты чекпоинта перед переходом к следующей фазе

### 3. ПРОВЕРЯЙ БД
- После каждой операции создания/обновления — проверить в Supabase Table Editor
- Убедиться что данные сохраняются корректно

### 4. ОДИН FEATURE ЗА РАЗ
- Не пытаться сделать всё сразу
- Закончить feature → протестировать → переходить к следующему

### 5. COMMIT ЧАСТО
- После каждого working milestone делать git commit
- Коммиты как save points в игре

---

## 📊 ACCEPTANCE CRITERIA (MVP)

✅ **Приложение считается готовым к использованию, если:**

**Регистрация:**
- [ ] Родитель может зарегистрироваться
- [ ] Родитель может создать семью
- [ ] Родитель может добавить 2 профиля детей

**Управление контентом:**
- [ ] Родитель может создать набор "Ordinal Numbers"
- [ ] Родитель может импортировать 31 карточку из CSV
- [ ] Карточки отображаются корректно

**Обучение:**
- [ ] Ребёнок может выбрать свой профиль
- [ ] Ребёнок может открыть набор
- [ ] Ребёнок может выбрать направление (RU→EN)
- [ ] Карточки переворачиваются
- [ ] TTS озвучка работает
- [ ] Можно отметить "Знаю/Не знаю"
- [ ] Экран результатов показывается

**Прогресс:**
- [ ] Прогресс сохраняется в БД
- [ ] Дашборд показывает процент выполнения
- [ ] Режим повторения показывает только незнакомые карточки

**Проверка БД:**
- [ ] В `study_sessions` есть сессии
- [ ] В `card_progress` есть прогресс
- [ ] В `session_results` есть результаты

---

## 🔧 SETUP INSTRUCTIONS

### 1. Создать Supabase проект:
```
1. Зайти на https://supabase.com
2. New Project: "flashcards-app"
3. Region: Frankfurt (EU)
4. Скопировать Project URL и anon key
```

### 2. Создать Next.js проект:
```bash
npx create-next-app@latest flashcards-app \
  --typescript \
  --tailwind \
  --app \
  --import-alias "@/*"

cd flashcards-app
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install lucide-react react-hook-form zod zustand
```

### 3. Создать `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 4. Создать Database Schema:
```
1. Открыть Supabase SQL Editor
2. Скопировать SQL из 03_Architecture_Database.md (секция 1.2)
3. Выполнить по порядку все таблицы
4. Создать RLS policies (секция 1.3)
```

### 5. Следовать roadmap:
```
1. Открыть 04_Development_Roadmap.md
2. Начать с Phase 0
3. Выполнять по порядку все milestones
4. Проверять checkpoints
```

---

## 📁 PROJECT STRUCTURE (Overview)

```
flashcards-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages
│   │   ├── onboarding/        # Create family + children
│   │   ├── admin/             # Admin routes
│   │   └── student/           # Student routes
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── flashcard/        # Flashcard components
│   │   ├── deck/             # Deck components
│   │   └── layout/           # Layout components
│   ├── contexts/             # React Context
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── supabase/         # Supabase client
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utilities (TTS, CSV, etc)
│   │   └── types/            # TypeScript types
│   └── middleware.ts         # Auth middleware
└── docs/                      # This documentation
```

Подробнее: см. `05_Project_Structure.md`

---

## 🐛 TROUBLESHOOTING

### Supabase connection fails:
- Проверить `.env.local` существует
- Проверить SUPABASE_URL и ANON_KEY корректны
- Перезапустить dev server

### TypeScript errors:
- Регенерировать types: `npm run supabase:types`
- Проверить импорты

### Build fails:
- Проверить все dependencies в `package.json`
- Тест локально: `npm run build`

### Database permission errors:
- Проверить RLS policies созданы
- Проверить пользователь авторизован

Подробнее: см. `05_Project_Structure.md` (секция 13)

---

## 📞 SUPPORT & QUESTIONS

### Открытые вопросы (нужно решить для MVP):
1. **Защита профилей:** Нужен ли пин-код для профилей детей?
2. **Режим повторения:** Смешивать карточки из разных наборов?
3. **Роль Гость:** Нужна ли read-only роль для бабушки?

### Для уточнения:
- См. `01_PRD_Requirements.md` (секция 9)
- См. `04_Development_Roadmap.md` (комментарии "ВОПРОС:")

---

## 📚 ADDITIONAL RESOURCES

### Supabase Docs:
- Database: https://supabase.com/docs/guides/database
- Auth: https://supabase.com/docs/guides/auth
- Storage: https://supabase.com/docs/guides/storage
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### Next.js Docs:
- App Router: https://nextjs.org/docs/app
- Data Fetching: https://nextjs.org/docs/app/building-your-application/data-fetching

### Tailwind CSS:
- Docs: https://tailwindcss.com/docs

---

## ✅ READY TO CODE

Вся документация готова для передачи в Cursor IDE или Claude Code.

**Рекомендуемый порядок работы:**
1. Читать `04_Development_Roadmap.md`
2. Следовать phase by phase
3. Проверять каждый checkpoint
4. Использовать остальные документы как справочники

**Помни:** Лучше меньше, но работающее. Не "пуговицы на рукаве". 🚀

---

**Good luck with development!** 💪
