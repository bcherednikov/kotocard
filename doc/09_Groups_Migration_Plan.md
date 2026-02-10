# Миграция: От семей к группам. Равные пользователи.

## 1. РЕЗЮМЕ ИЗМЕНЕНИЯ

**Было:** Жёсткая связка "семья → родитель (admin) + дети (student)". Родитель создаёт колоды, дети только учатся. Все ресурсы привязаны к семье.

**Стало:** Все пользователи равны. Каждый может создавать свои колоды и учиться. Дополнительно существуют "группы" (семья, класс, кружок) — с админом и участниками. Кто может добавлять колоды в группу — настраивается (только админ / все участники). Участники видят колоды группы и учатся по ним, админ следит за результатами.

**Целевые сценарии:**
- **Родитель:** создаёт группу-семью, добавляет ребёнка, подкидывает наборы слов, следит за прогрессом
- **Учитель:** собирает учеников в группу-класс, закидывает домашние слова, проверяет результаты
- **Друзья:** создают совместную группу, все добавляют колоды (`deck_add_permission = all_members`), учатся вместе
- **Одиночка:** регистрируется, создаёт свои колоды, учится без групп

---

## 2. ТЕКУЩАЯ АРХИТЕКТУРА (AS-IS)

### 2.1 Модель данных

```
families ──1:N──> profiles (role: admin | student, family_id)
families ──1:N──> decks (family_id)
decks    ──1:N──> cards
profiles ──1:N──> user_cards (SRS-прогресс)
profiles ──1:N──> card_progress (legacy-прогресс)
profiles ──1:N──> test_sessions / test_results
profiles ──1:N──> study_sessions / session_results
```

### 2.2 Ключевые зависимости от `family_id` и `role`

**База данных (Supabase):**
- `profiles.family_id` — привязка к семье
- `profiles.role` — CHECK ('admin', 'student')
- `decks.family_id` — колоды привязаны к семье
- RLS-политики: ~15 политик завязаны на `family_id` и/или `role`
- `user_cards` RLS: админ видит карточки детей через family_id

**API-роуты (Next.js):**
- `/api/register` — создаёт family + profile(admin)
- `/api/create-children` — создаёт profile(student) в семье
- `/api/get-children` — список детей по family_id
- `/api/update-child` — обновление ребёнка
- `/api/admin/child-stats` — статистика ребёнка (проверка family_id + role=admin)

**Frontend:**
- `AuthContext` — тип `Profile` содержит `role` и `family_id`, вычисляет `isAdmin`
- `RequireAuth` — гард по роли ('admin' | 'student')
- `Header` — условная навигация по `profile.role`
- Вся маршрутизация разделена на `/admin/*` и `/student/*`
- Онбординг — создание детей после регистрации
- Страница `/admin/children` — управление детьми
- Страница `/admin/stats` — статистика детей

### 2.3 Полный список затронутых файлов

**Схема БД (SQL):**
1. `supabase/schema.sql` — таблицы families, profiles, decks + все RLS
2. `supabase/add_user_cards_table.sql` — user_cards + RLS для админов
3. `supabase/add_test_tables.sql` — test_sessions, test_results
4. `supabase/fix_families_rls.sql` — фиксы RLS для families
5. `supabase/fix_profiles_rls.sql` — фиксы RLS для profiles
6. `supabase/reapply_rls.sql` — переприменение RLS

**API-роуты:**
7. `src/app/api/register/route.ts` — регистрация (создаёт family)
8. `src/app/api/create-children/route.ts` — создание детей
9. `src/app/api/get-children/route.ts` — список детей
10. `src/app/api/update-child/route.ts` — обновление ребёнка
11. `src/app/api/admin/child-stats/route.ts` — статистика ребёнка

**Frontend — auth/контекст:**
12. `src/contexts/AuthContext.tsx` — Profile type, isAdmin
13. `src/components/auth/RequireAuth.tsx` — гард по роли

**Frontend — layout/навигация:**
14. `src/components/layout/Header.tsx` — меню по роли
15. `src/app/admin/layout.tsx` — RequireAuth(role='admin')
16. `src/app/student/layout.tsx` — RequireAuth(role='student')

**Frontend — страницы admin (будут удалены/переработаны):**
17. `src/app/admin/decks/page.tsx` — список колод
18. `src/app/admin/decks/new/page.tsx` — новая колода
19. `src/app/admin/decks/[id]/page.tsx` — детали колоды
20. `src/app/admin/decks/[id]/edit/page.tsx` — редактирование колоды
21. `src/app/admin/decks/[id]/cards/new/page.tsx` — новая карточка
22. `src/app/admin/decks/[id]/cards/bulk/page.tsx` — массовое создание
23. `src/app/admin/decks/[id]/cards/[cardId]/edit/page.tsx` — редактирование карточки
24. `src/app/admin/children/page.tsx` — список детей
25. `src/app/admin/children/new/page.tsx` — добавление ребёнка
26. `src/app/admin/children/[id]/edit/page.tsx` — редактирование ребёнка
27. `src/app/admin/stats/page.tsx` — статистика

**Frontend — страницы student (будут объединены):**
28. `src/app/student/page.tsx` — дашборд студента
29. `src/app/student/decks/page.tsx` — список колод
30. `src/app/student/decks/[id]/page.tsx` — детали колоды
31. `src/app/student/decks/[id]/study/page.tsx` — изучение
32. `src/app/student/decks/[id]/test/page.tsx` — тесты
33. `src/app/student/decks/[id]/review/page.tsx` — повторение
34. `src/app/student/decks/[id]/dictation/page.tsx` — диктант
35. `src/app/student/decks/[id]/complete/page.tsx` — завершение
36. `src/app/student/review/page.tsx` — глобальное повторение
37. `src/app/student/review/start/page.tsx` — старт повторения
38. `src/app/student/review/complete/page.tsx` — завершение повторения

**Frontend — онбординг (будет удалён):**
39. `src/app/onboarding/page.tsx` — создание детей
40. `src/app/onboarding/complete/page.tsx` — завершение онбординга
41. `src/app/onboarding/layout.tsx` — layout онбординга

**Frontend — auth pages:**
42. `src/app/(auth)/login/page.tsx` — редирект по роли
43. `src/app/(auth)/register/page.tsx` — создание семьи

**SRS/бизнес-логика:**
44. `src/lib/srs/queries.ts` — запросы (не зависят от family/role напрямую)
45. `src/lib/srs/engine.ts` — SRS-движок (не зависит)
46. `src/lib/srs/types.ts` — типы (не зависят)

**Документация:**
47. `doc/01_PRD_Requirements.md`
48. `doc/03_Architecture_Database.md`

---

## 3. ЦЕЛЕВАЯ АРХИТЕКТУРА (TO-BE)

### 3.1 Новая модель данных

```
profiles ──────────── (равные пользователи, без role, без family_id)
    │
    ├──1:N──> decks (owner_id вместо family_id — личные колоды)
    │           └──1:N──> cards
    │
    ├──1:N──> user_cards (SRS-прогресс, без изменений)
    │
    └──N:M──> groups (через group_members)
                │
                ├──1:N──> group_members (user_id, role: admin|member)
                │
                └──N:M──> decks (через group_decks — колоды добавленные в группу)
```

### 3.2 Новые/изменённые таблицы

#### Таблица `profiles` (ИЗМЕНЕНИЕ)

```sql
-- Убираем family_id и role
ALTER TABLE profiles DROP COLUMN family_id;
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check; -- если есть
ALTER TABLE profiles DROP COLUMN role;

-- Итоговая структура:
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  show_russian_transcription BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Таблица `decks` (ИЗМЕНЕНИЕ)

```sql
-- Заменяем family_id на owner_id
ALTER TABLE decks DROP COLUMN family_id;
ALTER TABLE decks ADD COLUMN owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE;
-- created_by можно убрать (дублирует owner_id) или оставить для истории

-- Итоговая структура:
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Таблица `groups` (НОВАЯ)

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Кто может добавлять колоды в группу:
  --   'admin_only'  — только админ (дефолт для семьи/класса)
  --   'all_members' — любой участник (для совместного обучения)
  deck_add_permission TEXT NOT NULL DEFAULT 'admin_only'
    CHECK (deck_add_permission IN ('admin_only', 'all_members')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Таблица `group_members` (НОВАЯ)

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  -- Для отслеживания "новых" колод: обновляется при посещении страницы группы
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

#### Таблица `group_invites` (НОВАЯ)

> Идея из анализа Codex: вместо простого `invite_code` на группе — отдельная таблица инвайтов с expiry и статусами. Это гибче: несколько инвайтов, отзыв, отслеживание.

```sql
CREATE TABLE group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,               -- NULL = бессрочно
  max_uses INTEGER,                     -- NULL = без лимита
  use_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Таблица `group_decks` (НОВАЯ)

> Колода всегда принадлежит пользователю (`decks.owner_id`). В группу добавляется через junction table. Одна колода может быть в нескольких группах.

```sql
CREATE TABLE group_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, deck_id)
);
```

> **Альтернативный подход (Composer):** `group_id` прямо на `decks` с CHECK `(owner_id IS NOT NULL AND group_id IS NULL) OR (owner_id IS NULL AND group_id IS NOT NULL)`. Проще, но колода не может одновременно быть личной и расшаренной в группу. Выбран junction table как более гибкий вариант.

#### Таблица `families` (УДАЛЕНИЕ)

```sql
-- Удаляется после миграции данных
DROP TABLE families;
```

### 3.3 Новые RLS-политики

```sql
-- === Вспомогательные функции (SECURITY DEFINER) ===
-- Нужны для избежания рекурсии в RLS-политиках на group_members:
-- политика на group_members не может SELECT из group_members (бесконечная рекурсия).
-- SECURITY DEFINER функции выполняются от имени создателя, минуя RLS.

CREATE OR REPLACE FUNCTION get_user_group_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT group_id FROM group_members WHERE user_id = uid;
$$;

CREATE OR REPLACE FUNCTION get_user_admin_group_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT group_id FROM group_members WHERE user_id = uid AND role = 'admin';
$$;

-- === profiles ===
-- Любой авторизованный пользователь может видеть профили
-- (нужно для отображения участников группы, имён и т.д.)
-- Осознанное решение v1: открыто для всех авторизованных, ограничим при необходимости
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- === decks ===
-- Владелец может всё
CREATE POLICY "Owner can manage own decks"
  ON decks FOR ALL
  USING (owner_id = auth.uid());

-- Участники группы видят колоды группы
CREATE POLICY "Group members can view group decks"
  ON decks FOR SELECT
  USING (
    id IN (
      SELECT gd.deck_id FROM group_decks gd
      WHERE gd.group_id IN (SELECT get_user_group_ids(auth.uid()))
    )
  );

-- Пользователь видит колоды, которые изучает (через user_cards)
-- Нужно для сохранения доступа к карточкам после выхода из группы
CREATE POLICY "Users can view decks they study"
  ON decks FOR SELECT
  USING (
    id IN (SELECT DISTINCT deck_id FROM user_cards WHERE user_id = auth.uid())
  );

-- === cards ===
-- Владелец колоды может управлять карточками
CREATE POLICY "Deck owner can manage cards"
  ON cards FOR ALL
  USING (
    deck_id IN (SELECT id FROM decks WHERE owner_id = auth.uid())
  );

-- Участники группы видят карточки групповых колод
CREATE POLICY "Group members can view group deck cards"
  ON cards FOR SELECT
  USING (
    deck_id IN (
      SELECT gd.deck_id FROM group_decks gd
      WHERE gd.group_id IN (SELECT get_user_group_ids(auth.uid()))
    )
  );

-- Пользователь видит карточки, которые изучает (через user_cards)
-- Нужно для глобального повторения после выхода из группы
CREATE POLICY "Users can view cards they study"
  ON cards FOR SELECT
  USING (
    id IN (SELECT card_id FROM user_cards WHERE user_id = auth.uid())
  );

-- === user_cards ===
-- Пользователь управляет своим прогрессом (без изменений)
CREATE POLICY "Users manage own user_cards"
  ON user_cards FOR ALL
  USING (user_id = auth.uid());

-- Админ группы видит прогресс участников по колодам группы
CREATE POLICY "Group admin can view member progress"
  ON user_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_decks gd
      WHERE gd.deck_id = user_cards.deck_id
        AND gd.group_id IN (SELECT get_user_admin_group_ids(auth.uid()))
        AND EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = gd.group_id
            AND gm.user_id = user_cards.user_id
        )
    )
  );

-- === groups ===
CREATE POLICY "Members can view own groups"
  ON groups FOR SELECT
  USING (
    id IN (SELECT get_user_group_ids(auth.uid()))
  );

CREATE POLICY "Authenticated can create groups"
  ON groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admin can update group"
  ON groups FOR UPDATE
  USING (
    id IN (SELECT get_user_admin_group_ids(auth.uid()))
  );

CREATE POLICY "Group admin can delete group"
  ON groups FOR DELETE
  USING (
    id IN (SELECT get_user_admin_group_ids(auth.uid()))
  );

-- === group_members ===
-- ВАЖНО: все политики используют SECURITY DEFINER функции,
-- т.к. прямой SELECT из group_members внутри RLS на group_members
-- вызывает бесконечную рекурсию в PostgreSQL.

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (SELECT get_user_group_ids(auth.uid()))
  );

-- Админ может обновлять участников (например, promote до admin)
CREATE POLICY "Group admin can update members"
  ON group_members FOR UPDATE
  USING (
    group_id IN (SELECT get_user_admin_group_ids(auth.uid()))
  );

-- Админ может удалять участников из группы
CREATE POLICY "Group admin can remove members"
  ON group_members FOR DELETE
  USING (
    group_id IN (SELECT get_user_admin_group_ids(auth.uid()))
  );

-- Вступление в группу — только через API (валидация инвайт-кода на сервере).
-- INSERT политика не нужна: API использует service role.

-- Пользователь может выйти из группы сам
CREATE POLICY "User can leave group"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- === group_decks ===
CREATE POLICY "Members can view group decks links"
  ON group_decks FOR SELECT
  USING (
    group_id IN (SELECT get_user_group_ids(auth.uid()))
  );

-- Админ группы всегда может управлять колодами группы
CREATE POLICY "Group admin can manage group decks"
  ON group_decks FOR ALL
  USING (
    group_id IN (SELECT get_user_admin_group_ids(auth.uid()))
  );

-- Участник может добавлять колоды, если группа разрешает (deck_add_permission = 'all_members')
CREATE POLICY "Members can add decks if permitted"
  ON group_decks FOR INSERT
  WITH CHECK (
    added_by = auth.uid()
    AND group_id IN (
      SELECT g.id FROM groups g
      WHERE g.id IN (SELECT get_user_group_ids(auth.uid()))
        AND g.deck_add_permission = 'all_members'
    )
  );

-- Участник может убрать колоду, которую сам добавил
CREATE POLICY "Members can remove own added decks if permitted"
  ON group_decks FOR DELETE
  USING (
    added_by = auth.uid()
    AND group_id IN (
      SELECT g.id FROM groups g
      WHERE g.id IN (SELECT get_user_group_ids(auth.uid()))
        AND g.deck_add_permission = 'all_members'
    )
  );

-- === group_invites ===
-- Только админ группы управляет инвайтами (CRUD)
CREATE POLICY "Group admin can manage invites"
  ON group_invites FOR ALL
  USING (
    group_id IN (SELECT get_user_admin_group_ids(auth.uid()))
  );

-- Lookup инвайта по коду для вступления — через API (service role).
-- Клиентский SELECT по group_invites НЕ разрешён для обычных пользователей,
-- чтобы исключить перебор/утечку инвайт-кодов.
```

### 3.4 Новая структура маршрутов (Frontend)

```
/                              → Landing page
/login                         → Логин (редирект → /dashboard)
/register                      → Регистрация (редирект → /dashboard)

/dashboard                     → Главная (см. UX-структуру ниже)
/decks                         → Мои колоды (список)
/decks/new                     → Создать колоду
/decks/[id]                    → Колода: карточки + режимы обучения
/decks/[id]/edit               → Редактировать колоду
/decks/[id]/cards/new          → Добавить карточку
/decks/[id]/cards/bulk         → Массовое создание
/decks/[id]/cards/[cardId]/edit → Редактировать карточку
/decks/[id]/study              → Изучение
/decks/[id]/test               → Тест
/decks/[id]/review             → Повторение колоды
/decks/[id]/dictation          → Диктант
/decks/[id]/complete           → Завершение

/review                        → Глобальное повторение (все колоды)
/review/start                  → Старт повторения
/review/complete               → Завершение повторения

/groups                        → Мои группы (список)
/groups/new                    → Создать группу
/groups/join/[inviteCode]      → Вступить в группу по ссылке
/groups/[id]                   → Группа: колоды, участники
/groups/[id]/settings          → Настройки группы (для админа)
/groups/[id]/members           → Участники группы
/groups/[id]/stats             → Статистика группы (для админа)
/groups/[id]/stats/[userId]    → Статистика участника (для админа)

/profile                       → Профиль пользователя
/profile/edit                  → Редактирование профиля
```

### 3.5 UX-структура дашборда

Дашборд `/dashboard` — это главная точка входа для любого пользователя. Структура:

```
┌─────────────────────────────────────────────┐
│ Мои наборы                     [+ Создать]  │
│ [Колода 1]  [Колода 2]  [Колода 3]         │
├─────────────────────────────────────────────┤
│ 🔄 Повторение: 12 карточек готовы   [Начать]│
├─────────────────────────────────────────────┤
│ Группа "3-Б класс"         🆕 📊           │
│ [Домашка неделя 5] [Домашка неделя 6]      │
├─────────────────────────────────────────────┤
│ Группа "Семья"                 📊           │
│ [Животные] [Цвета] [Числа]                 │
├─────────────────────────────────────────────┤
│ [+ Создать группу]  [Вступить по ссылке]    │
└─────────────────────────────────────────────┘
```

**Ключевые принципы:**
- Личные колоды и групповые — отдельные блоки, не смешиваются
- Каждая группа — отдельный визуальный блок с её колодами
- Бейдж "New" (🆕) на группе, если появились новые колоды с момента `last_seen_at`
- Кнопка 📊 (статистика) видна только админу группы
- Повторение включает карточки из ВСЕХ источников (личные + групповые)
- Для ребёнка: простой интерфейс — видит что надо учить, видит прогресс

### 3.6 Правила сохранения прогресса

> Прогресс пользователя (`user_cards`) привязан к `user_id + card_id`, а не к группе. Это даёт:

| Событие | Что происходит с прогрессом |
|---------|---------------------------|
| Колоду убрали из группы | Прогресс **сохраняется**. Карточки остаются в `user_cards`, доступны в глобальном повторении |
| Пользователь вышел из группы | Прогресс **сохраняется**. Групповые колоды пропадают из дашборда, но `user_cards` не удаляются. Карточки продолжают появляться в глобальном повторении. Доступ к карточкам и колодам обеспечивается RLS-политиками "Users can view decks/cards they study" (через user_cards) |
| Группу удалили | Прогресс **сохраняется**. Колоды остаются у владельца. `user_cards` не затрагиваются |
| Владелец удалил колоду | Прогресс **удаляется** (CASCADE через `cards → user_cards`) |

### 3.7 Глобальное повторение

Повторение `/review` включает карточки из **всех** `user_cards` пользователя:
- Из личных колод
- Из групповых колод (даже если пользователь вышел из группы, пока `user_cards` существуют)
- Фильтр: `status IN ('young', 'mature', 'relearning') AND next_review_at <= NOW()`

Технически это уже работает так (`getReviewCards` фильтрует только по `user_id`), но фиксируем как осознанное решение.

### 3.8 Новый AuthContext

```typescript
type Profile = {
  id: string;
  display_name: string;
  avatar_url?: string;
  show_russian_transcription?: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isInitialized: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Убрано: isAdmin, role, family_id
};
```

### 3.9 Новые API-роуты и клиентские запросы

**Через API-роуты (service role, сложная логика, транзакции):**

```
POST   /api/register              → Создаёт auth user + profile (без family)
POST   /api/groups                → Создать группу + добавить создателя как admin (транзакция)
POST   /api/groups/join           → Вступить по инвайт-коду (валидация кода, increment use_count, insert member)
POST   /api/groups/[id]/leave     → Выход из группы (с проверкой "последний админ" — промоут всех до admin)
```

**Через Supabase client (RLS обеспечивает авторизацию):**

```
Группы:     SELECT/UPDATE/DELETE groups          → список, настройки, удаление
Участники:  SELECT/UPDATE/DELETE group_members    → список, promote, удаление
Инвайты:    SELECT/INSERT/DELETE group_invites    → управление (только для админа по RLS)
Колоды:     SELECT/INSERT/DELETE group_decks      → привязка колод к группе
Статистика: SELECT user_cards + profiles          → сводка прогресса участников
```

**Удалить старые API-роуты:**

```
DELETE /api/create-children
DELETE /api/get-children
DELETE /api/update-child
DELETE /api/admin/child-stats
```

---

## 4. ПЛАН МИГРАЦИИ: ПОШАГОВЫЙ

Каждый шаг — проверяемый на фронте. После каждого шага приложение должно работать.

---

### ШАГ 1: Новая схема БД (группы) — без удаления старого

**Цель:** Добавить таблицы `groups`, `group_members`, `group_decks` параллельно с существующей схемой. Ничего не ломаем.

**Изменения:**
- Создать миграцию `supabase/add_groups_tables.sql`:
  - CREATE TABLE `groups`
  - CREATE TABLE `group_members`
  - CREATE TABLE `group_invites`
  - CREATE TABLE `group_decks`
  - SECURITY DEFINER функции: `get_user_group_ids()`, `get_user_admin_group_ids()`
  - Индексы:
    - `idx_group_members_user_id ON group_members(user_id)`
    - `idx_group_members_group_id ON group_members(group_id)`
    - `idx_group_members_group_role ON group_members(group_id, role)`
    - `idx_group_decks_group_id ON group_decks(group_id)`
    - `idx_group_decks_deck_id ON group_decks(deck_id)`
    - `idx_group_invites_code ON group_invites(invite_code)`
    - `idx_group_invites_group_id ON group_invites(group_id)`
  - RLS-политики для новых таблиц (см. раздел 3.3)

**Проверка на фронте:** Ничего не сломалось, приложение работает как раньше.

---

### ШАГ 2: Изменение `decks` — добавить `owner_id`

**Цель:** Добавить колонку `owner_id` к `decks`, не убирая `family_id`. Заполнить `owner_id` для существующих записей.

**Изменения:**
- Миграция: `ALTER TABLE decks ADD COLUMN owner_id UUID REFERENCES profiles(id)`
- Миграция данных: `UPDATE decks SET owner_id = created_by WHERE created_by IS NOT NULL`
- Для записей без `created_by`: найти admin в соответствующей family и использовать его ID
- Сделать `owner_id` NOT NULL после заполнения

**Проверка на фронте:** Ничего не сломалось, `family_id` всё ещё используется.

---

### ШАГ 3: Новая регистрация (все пользователи равны)

**Цель:** Переделать регистрацию: убрать создание family. Не ломать старый UI.

**Изменения:**
- Миграция БД:
  - `ALTER TABLE profiles ALTER COLUMN family_id DROP NOT NULL` (nullable для новых пользователей)
  - `role` НЕ трогаем — оставляем NOT NULL, старый UI зависит от него
- `src/app/api/register/route.ts` — создаёт auth user + profile:
  - `family_id = NULL` (без семьи)
  - `role = 'admin'` (временно — чтобы старый UI работал до шага 4)
- `src/app/(auth)/register/page.tsx` — убрать поле "Имя семьи", упростить
- Редирект после регистрации: `/dashboard` вместо `/onboarding`

**Важно:** Новые пользователи получают `role = 'admin'` как временную меру. На шаге 4 вся зависимость от `role` будет удалена из фронтенда, а на шаге 8 колонка `role` будет удалена из БД.

**Проверка на фронте:**
- Новый пользователь регистрируется и попадает на dashboard
- Старые пользователи продолжают работать (семьи ещё существуют)
- Новый пользователь может пользоваться старым admin-интерфейсом (role='admin')

---

### ШАГ 4: Единый Dashboard и управление колодами

**Цель:** Создать единый интерфейс вместо разделения admin/student. Каждый пользователь видит свои колоды, может создавать и учиться.

**Изменения:**
- Новые страницы (единые):
  - `src/app/dashboard/page.tsx` — главная (структура: блок "Мои наборы", блок "Повторение", блоки по группам — см. раздел 3.5)
  - `src/app/decks/page.tsx` — список моих колод
  - `src/app/decks/new/page.tsx` — создать колоду
  - `src/app/decks/[id]/page.tsx` — детали колоды (карточки + режимы обучения)
  - `src/app/decks/[id]/edit/page.tsx` — редактировать колоду
  - `src/app/decks/[id]/cards/new/page.tsx` — добавить карточку
  - `src/app/decks/[id]/cards/bulk/page.tsx` — массовое создание
  - `src/app/decks/[id]/cards/[cardId]/edit/page.tsx` — редактировать карточку
- Перенести режимы обучения:
  - `src/app/decks/[id]/study/page.tsx`
  - `src/app/decks/[id]/test/page.tsx`
  - `src/app/decks/[id]/review/page.tsx`
  - `src/app/decks/[id]/dictation/page.tsx`
  - `src/app/decks/[id]/complete/page.tsx`
- Перенести глобальное повторение (включает ВСЕ user_cards — личные + групповые, см. раздел 3.7):
  - `src/app/review/page.tsx`
  - `src/app/review/start/page.tsx`
  - `src/app/review/complete/page.tsx`
- Обновить `AuthContext`:
  - Убрать `isAdmin`, `family_id` из типа Profile
  - Убрать `role` из запроса
- Обновить `RequireAuth`:
  - Убрать параметр `role`
  - Оставить только проверку на авторизацию
- Обновить `Header`:
  - Единая навигация: Наборы, Группы, Повторение, Профиль
- Обновить RLS для `decks`:
  - Добавить политику: владелец видит свои колоды (`owner_id = auth.uid()`)
  - Владелец может управлять своими колодами
  - Добавить политику для карточек владельца
- Обновить запросы для колод:
  - `SELECT * FROM decks WHERE owner_id = auth.uid()` вместо `family_id`
- Обновить логин:
  - Редирект на `/dashboard` для всех
- **Миграция TTS-путей:**
  - Текущая структура: `/tts/{familyId}/{deckId}/{cardId}_{lang}.wav`
  - Новая структура: `/tts/{deckId}/{cardId}_{lang}.wav` (deck_id глобально уникален, уровень family не нужен)
  - Обновить `src/lib/tts/tts-server.ts`:
    - Убрать `familyId` из `TtsGenerateOptions`
    - Путь: `path.join(TTS_DIR, deckId, fileName)` вместо `path.join(TTS_DIR, familyId, deckId, fileName)`
    - Обновить `deleteTtsFiles()`, `ttsFileExists()` — убрать параметр `familyId`
  - Обновить все вызовы TTS-функций (убрать передачу familyId)
  - Скрипт миграции файлов: переместить `/tts/{familyId}/{deckId}/` → `/tts/{deckId}/`

**Проверка на фронте:**
- Пользователь видит свои колоды
- Пользователь может создать колоду
- Пользователь может добавить карточки
- Пользователь может изучать свои карточки (study, test, review, dictation)
- Навигация единая для всех

---

### ШАГ 5: Группы — создание и вступление

**Цель:** Реализовать базовый CRUD групп и механизм инвайтов.

**Изменения:**
- Новые страницы:
  - `src/app/groups/page.tsx` — список моих групп
  - `src/app/groups/new/page.tsx` — создать группу (поля: имя, описание, настройка `deck_add_permission`)
  - `src/app/groups/join/[inviteCode]/page.tsx` — вступить по ссылке
  - `src/app/groups/[id]/page.tsx` — страница группы (колоды группы, участники)
  - `src/app/groups/[id]/settings/page.tsx` — настройки группы (админ): имя, описание, `deck_add_permission`, управление участниками
- Новые API:
  - `src/app/api/groups/route.ts` — POST: создать группу (+ авто-добавить создателя как admin, service role)
  - `src/app/api/groups/join/route.ts` — POST: вступить по invite_code (service role: валидация кода, проверка expiry/max_uses, increment use_count, insert member)
  - `src/app/api/groups/[id]/leave/route.ts` — POST: выход из группы (если последний админ — промоут всех оставшихся до admin, затем удаление)
- Страница настроек `src/app/groups/[id]/settings/page.tsx`:
  - Имя, описание, `deck_add_permission`
  - Список участников с возможностью: promote до admin, удалить из группы
  - Управление инвайтами: создать, деактивировать
- Обновить `Header` — добавить пункт "Группы"
- Обновить `Dashboard` — секция "Мои группы" (отдельные блоки по группам, см. 3.5)

**Проверка на фронте:**
- Пользователь может создать группу с выбором прав на добавление колод
- Пользователь получает инвайт-ссылку
- Другой пользователь может вступить по ссылке
- Оба видят группу в списке
- Админ может изменить настройку `deck_add_permission` в настройках группы
- Админ может назначить участника админом (promote)
- При выходе последнего админа — все участники становятся админами (с предупреждением)

---

### ШАГ 6: Группы — добавление колод в группу

**Цель:** Колоды добавляются в группу теми, кому разрешено (`deck_add_permission`). Участники видят колоды группы и учатся по ним.

**Изменения:**
- Обновить `src/app/groups/[id]/page.tsx`:
  - Список колод группы
  - Кнопка "Добавить колоду" — видна если: пользователь = админ ИЛИ `deck_add_permission = 'all_members'`
  - Кнопка "Убрать колоду из группы" — видна если: пользователь = админ ИЛИ (пользователь сам добавил и `deck_add_permission = 'all_members'`)
  - Бейдж 🆕 на колодах, добавленных после `group_members.last_seen_at`
- На странице `/dashboard`:
  - Групповые колоды показаны в блоке соответствующей группы (не вперемешку с личными)
- На странице колоды (`/decks/[id]`):
  - Если пользователь — владелец: показать к каким группам привязана
  - Кнопка "Добавить в группу" — только для владельца колоды, в группы где ему разрешено добавлять
- Участники видят групповые колоды и могут учиться (study, test, review, dictation)
- Участники НЕ могут редактировать карточки чужих колод (только владелец)
- Обновить RLS для `cards` — участники группы видят карточки групповых колод
- `ensureUserCardsExist` — работает уже (по deck_id + user_id), не требует изменений
- Обновить `group_members.last_seen_at` при посещении страницы группы

**Проверка на фронте:**
- Админ группы добавляет свою колоду в группу
- Участник группы видит эту колоду в блоке группы на дашборде
- Участник может открыть и учить карточки групповой колоды
- Прогресс сохраняется для участника
- В группе с `deck_add_permission = 'all_members'`: любой участник может добавить колоду
- В группе с `deck_add_permission = 'admin_only'`: участник не видит кнопку "Добавить колоду"
- Участник НЕ может редактировать карточки в чужой колоде

---

### ШАГ 7: Группы — статистика участников

**Цель:** Админ группы видит прогресс участников по колодам группы.

**Изменения:**
- Новые страницы:
  - `src/app/groups/[id]/stats/page.tsx` — сводная статистика группы (все участники)
  - `src/app/groups/[id]/stats/[userId]/page.tsx` — детальная статистика участника
- Новый API:
  - `src/app/api/groups/[id]/stats/route.ts` — сводная статистика
  - `src/app/api/groups/[id]/stats/[userId]/route.ts` — статистика участника
- Обновить RLS для `user_cards` — админ группы видит прогресс участников по колодам группы
- Навигация в группе: вкладка "Статистика" (для админа)

**Проверка на фронте:**
- Админ группы видит список участников с общим прогрессом
- Админ может кликнуть на участника и увидеть детальную статистику
- Участники НЕ видят статистику друг друга

---

### ШАГ 8: Удаление старого кода и миграция данных

**Цель:** Убрать всё legacy: families, role, admin/student маршруты, онбординг.

**Изменения:**

*Миграция существующих данных:*
- Для каждого существующего пользователя: убрать family_id и role из profiles
- Колоды: убрать family_id (owner_id уже заполнен на шаге 2)
- Прогресс user_cards: не трогаем (привязан к user_id + card_id)
- test_sessions / card_progress: не трогаем (привязан к user_id)

*Удаление старых таблиц:*
- DROP TABLE families (после очистки FK)

*Удаление старых столбцов:*
- ALTER TABLE profiles DROP COLUMN family_id
- ALTER TABLE profiles DROP COLUMN role
- ALTER TABLE decks DROP COLUMN family_id
- ALTER TABLE decks DROP COLUMN created_by (дублирует owner_id)

*Миграция TTS-файлов:*
- Скрипт: для каждой директории `/tts/{familyId}/{deckId}/` → переместить в `/tts/{deckId}/`
- После переноса удалить пустые директории `{familyId}`
- Проверить: все TTS-ссылки работают по новым путям

*Удаление старых RLS-политик:*
- Все политики на families, family_id, role
- На `user_cards`: удалить "Admins can view family children user_cards" (заменена на "Group admin can view member progress")
- На `profiles`: удалить "Family members can view profiles" (заменена на "Authenticated users can view profiles")
- На `decks`: удалить "Family members can view decks", "Admins can manage decks"
- На `cards`: удалить "Family members can view cards", "Admins can manage cards"
- Примечание: `card_progress`, `study_sessions`, `session_results` — RLS только по `user_id`, не зависят от family_id, **изменений не требуют**

*Удаление старых API-роутов:*
- `/api/create-children`
- `/api/get-children`
- `/api/update-child`
- `/api/admin/child-stats`

*Удаление старых страниц:*
- Весь `/admin/*`
- Весь `/student/*`
- Весь `/onboarding/*`
- `src/app/register/success/page.tsx`

*Удаление старых компонентов:*
- `src/app/admin/layout.tsx`
- `src/app/student/layout.tsx`

**Проверка на фронте:**
- Всё старое удалено, нет ошибок 404
- Старые URL редиректят на новые (если нужно)
- Прогресс существующих пользователей сохранён

---

### ШАГ 9: Обновление документации

**Цель:** Актуализировать всю документацию.

**Изменения:**
- `doc/01_PRD_Requirements.md` — обновить роли и сущности
- `doc/03_Architecture_Database.md` — новая ERD, таблицы, RLS
- `doc/05_Project_Structure.md` — новая структура
- Обновить этот документ (`09_Groups_Migration_Plan.md`) — отметить выполненные шаги

---

### ШАГ 10: Hardening и регрессионное тестирование (из Codex)

**Цель:** Финальная проверка безопасности и стабильности.

**Изменения:**
- Проверка RLS: тесты из-под разных пользователей (владелец, участник группы, не-участник, админ группы)
- Проверка: нет cross-user data leaks
- End-to-end проверка: регистрация → создание колоды → создание группы → инвайт → вступление → обучение → статистика

**Проверка на фронте:**
- Пользователь А не видит личные колоды пользователя Б
- Участник группы не видит личные колоды админа группы (только расшаренные в группу)
- Не-участник группы не видит колоды группы
- В группе `admin_only`: участник не может добавить колоду (ни через UI, ни через API)
- В группе `all_members`: участник может добавить и убрать свою колоду
- Прогресс сохраняется после выхода из группы
- Глобальное повторение включает карточки из групповых колод
- Все core flow работают без ошибок

---

## 5. ЗАВИСИМОСТИ МЕЖДУ ШАГАМИ

```
ШАГ 1 (группы в БД)
  └──> ШАГ 5 (группы UI) ──> ШАГ 6 (колоды в группах) ──> ШАГ 7 (статистика)

ШАГ 2 (owner_id)
  └──> ШАГ 4 (единый UI) ──> ШАГ 6 (колоды в группах)

ШАГ 3 (регистрация)
  └──> ШАГ 4 (единый UI)

ШАГ 4 + ШАГ 7
  └──> ШАГ 8 (удаление старого)

ШАГ 8
  └──> ШАГ 9 (документация) ──> ШАГ 10 (hardening)
```

**Рекомендуемый порядок выполнения:**
1. ШАГ 1 → ШАГ 2 → ШАГ 3 (подготовка БД и регистрации)
2. ШАГ 4 (единый интерфейс — самый большой)
3. ШАГ 5 → ШАГ 6 → ШАГ 7 (группы)
4. ШАГ 8 → ШАГ 9 → ШАГ 10 (очистка, документация, hardening)

---

## 6. ОЦЕНКА ОБЪЁМА РАБОТ

| Шаг | Описание | Сложность | Примерное кол-во файлов |
|-----|----------|-----------|------------------------|
| 1 | Группы в БД (groups, group_members, group_invites, group_decks) | Низкая | 1 SQL-файл |
| 2 | owner_id в decks | Низкая | 1 SQL-файл |
| 3 | Новая регистрация | Средняя | 3-4 файла |
| 4 | Единый интерфейс | **Высокая** | 20-25 файлов |
| 5 | Группы UI (CRUD + инвайты) | Средняя | 8-10 файлов |
| 6 | Колоды в группах | Средняя | 5-7 файлов |
| 7 | Статистика групп | Средняя | 5-6 файлов |
| 8 | Удаление старого | Средняя | 20+ файлов (удаление) |
| 9 | Документация | Низкая | 3-4 файла |
| 10 | Hardening + regression | Средняя | 0 (тестирование) |

**Самый объёмный шаг — ШАГ 4** (единый интерфейс). Его можно дополнительно разбить:
- 4a: AuthContext + RequireAuth + Header + Login/Register
- 4b: Dashboard + список колод
- 4c: Детали колоды + CRUD карточек
- 4d: Режимы обучения (перенос из student)
- 4e: Глобальное повторение (перенос из student)

---

## 7. РИСКИ И ОГРАНИЧЕНИЯ

1. **Миграция данных:** Нужно аккуратно перенести owner_id для существующих колод. Если created_by = NULL, нужна ручная обработка.

2. **RLS-политики:** Самая сложная часть — правильно настроить RLS для группового доступа. Рекурсивные подзапросы могут быть медленными при большом количестве групп.

3. **Обратная совместимость:** Шаги 1-7 сохраняют обратную совместимость. Только на шаге 8 удаляется старый код. Если что-то пойдёт не так — можно откатиться.

4. **Перформанс RLS:** Политика "Group admin can view member progress" содержит вложенные подзапросы. Для больших групп может потребоваться оптимизация (материализованные представления или кэширование).

5. **Инвайт-ссылки:** `invite_code` из 12 hex-символов (~281 триллионов комбинаций) — достаточно для безопасности. Но стоит добавить rate limiting на эндпоинт вступления.

6. **Auth/RLS регрессии** (из Codex): Неправильная перезапись RLS может привести к утечке личных или групповых данных. Нужны тесты RLS из-под разных пользователей.

7. **TTS пути** (решено): TTS-файлы хранятся как `/tts/{familyId}/{deckId}/{cardId}_{lang}.wav`. Миграция путей включена в шаг 4 (изменение кода) и шаг 8 (перенос файлов). Новая структура: `/tts/{deckId}/{cardId}_{lang}.wav`.

---

## 8. РЕШЁННЫЕ И ОТКРЫТЫЕ ВОПРОСЫ

### Решённые вопросы

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | Кто может добавлять колоды в группу? | Настройка `deck_add_permission`: `admin_only` (дефолт) или `all_members` |
| 2 | Что включает глобальное повторение? | ВСЕ `user_cards` пользователя — личные + групповые (раздел 3.7) |
| 3 | Сохраняется ли прогресс при выходе из группы? | Да. `user_cards` не удаляются, карточки остаются в повторении (раздел 3.6) |
| 4 | Сохраняется ли прогресс при удалении колоды из группы? | Да. `user_cards` привязаны к `card_id`, а не к группе (раздел 3.6) |
| 5 | Как пользователь узнаёт о новых колодах в группе? | Бейдж 🆕 на основе `group_members.last_seen_at` |
| 6 | Как выглядит дашборд? | Блоки: "Мои наборы", "Повторение", блок на каждую группу (раздел 3.5) |

### Закрытые вопросы (все решены)

| # | Вопрос | Решение |
|---|--------|---------|
| 7 | Выход из группы в v1? | **Да.** Участник может выйти, прогресс сохраняется |
| 8 | Удаление группы? | **Да.** CASCADE удаляет `group_members`, `group_decks`, `group_invites`. Колоды и прогресс остаются у владельцев |
| 9 | Promote участника до админа? | **Да.** Админ может назначить другого участника админом. Demote — не в v1 |
| 10 | Лимиты на группы/участников/колоды? | **Нет в v1.** Добавить при реальной потребности |
| 11 | Последний админ уходит из группы? | **Все оставшиеся участники промоутятся до admin.** API `/groups/[id]/leave` проверяет: если уходящий — последний админ и есть другие участники, все они получают `role = 'admin'`. Показать предупреждение перед выходом. Если участников нет — группа удаляется |
| 12 | Email-инвайты? | **Только ссылка в v1.** Админ копирует ссылку и отправляет сам. Отправка email — future feature |
| 13 | Promote участника до админа — где в UI? | В настройках группы `/groups/[id]/settings`: список участников с кнопкой "Назначить админом". UPDATE через Supabase client (RLS разрешает админам). Реализуется на шаге 5 |
| 14 | API vs Supabase client? | Через API (service role): регистрация, создание группы, вступление по инвайту, выход из группы. Через Supabase client (RLS): всё остальное (CRUD групп, участников, инвайтов, колод, статистика). См. раздел 3.9 |
| 15 | Доступ к карточкам после выхода из группы? | Обеспечивается RLS-политиками "Users can view decks/cards they study" — доступ через наличие `user_cards`. См. раздел 3.3 и 3.6 |

---

## 9. АРХИТЕКТУРНОЕ РЕШЕНИЕ: МОДЕЛЬ КОЛОД В ГРУППАХ

> Сравнение двух подходов, предложенных разными инструментами.

### Подход A: Junction table `group_decks` (выбран)

```
decks.owner_id → profiles.id (колода всегда принадлежит пользователю)
group_decks (group_id, deck_id) → связь N:M
```

**Плюсы:**
- Колода всегда имеет владельца
- Одна колода может быть в нескольких группах
- "Создал колоду → добавил в группу" = просто INSERT в `group_decks`
- Удаление группы не удаляет колоду

**Минусы:**
- Чуть сложнее RLS (join через `group_decks`)
- Дополнительная таблица

### Подход B: `group_id` на `decks` (Composer)

```
decks.owner_id XOR decks.group_id
CHECK ((owner_id IS NOT NULL AND group_id IS NULL) OR (...))
```

**Плюсы:**
- Проще: один FK, нет junction table
- Очевидная принадлежность

**Минусы:**
- Колода ЛИБО личная, ЛИБО групповая — не обе сразу
- "Создал колоду → добавил в группу" = нужно менять owner_id на group_id (теряем владельца)
- Не поддерживает расшаривание в несколько групп
- Удаление группы удаляет колоду (CASCADE)

**Решение:** Выбран подход A (junction table), т.к. он лучше соответствует пользовательскому сценарию: "создаю колоду, потом могу добавить в любую группу".
