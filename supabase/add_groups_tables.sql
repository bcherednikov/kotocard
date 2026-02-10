-- ============================================
-- Миграция: таблицы групп
-- Этап 1 из doc/10_Implementation_Steps.md
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS groups (
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

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  -- Для отслеживания "новых" колод: обновляется при посещении страницы группы
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_invites (
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

CREATE TABLE IF NOT EXISTS group_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, deck_id)
);

-- ============================================
-- 2. SECURITY DEFINER ФУНКЦИИ
-- Нужны для избежания рекурсии в RLS-политиках на group_members:
-- политика на group_members не может SELECT из group_members (бесконечная рекурсия).
-- SECURITY DEFINER функции выполняются от имени создателя, минуя RLS.
-- ============================================

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

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_role ON group_members(group_id, role);
CREATE INDEX IF NOT EXISTS idx_group_decks_group_id ON group_decks(group_id);
CREATE INDEX IF NOT EXISTS idx_group_decks_deck_id ON group_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_code ON group_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_decks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

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
