-- ============================================
-- Миграция: owner_id на decks + новые RLS
-- Этап 2 из doc/10_Implementation_Steps.md
-- ============================================

-- ============================================
-- 1. Добавить колонку owner_id (nullable сначала)
-- ============================================

ALTER TABLE decks ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================
-- 2. Заполнить owner_id из created_by
-- ============================================

-- Основной случай: created_by заполнен
UPDATE decks SET owner_id = created_by WHERE created_by IS NOT NULL AND owner_id IS NULL;

-- Fallback: если created_by = NULL, найти admin семьи
UPDATE decks SET owner_id = (
  SELECT p.id FROM profiles p
  WHERE p.family_id = decks.family_id AND p.role = 'admin'
  LIMIT 1
) WHERE owner_id IS NULL;

-- Fallback 2: если admin не нашёлся, найти любого участника семьи
UPDATE decks SET owner_id = (
  SELECT p.id FROM profiles p
  WHERE p.family_id = decks.family_id
  LIMIT 1
) WHERE owner_id IS NULL;

-- Удалить осиротевшие колоды (нет ни created_by, ни участников семьи — тестовые данные)
DELETE FROM decks WHERE owner_id IS NULL;

-- ============================================
-- 3. Сделать owner_id NOT NULL
-- ============================================

ALTER TABLE decks ALTER COLUMN owner_id SET NOT NULL;

-- ============================================
-- 4. Индекс на owner_id
-- ============================================

CREATE INDEX IF NOT EXISTS idx_decks_owner_id ON decks(owner_id);

-- ============================================
-- 5. Новые RLS-политики (НЕ удаляя старые по family_id)
-- ============================================

-- decks: владелец может всё
CREATE POLICY "Owner can manage own decks"
  ON decks FOR ALL
  USING (owner_id = auth.uid());

-- decks: участники группы видят колоды группы
CREATE POLICY "Group members can view group decks"
  ON decks FOR SELECT
  USING (
    id IN (
      SELECT gd.deck_id FROM group_decks gd
      WHERE gd.group_id IN (SELECT get_user_group_ids(auth.uid()))
    )
  );

-- decks: пользователь видит колоды, которые изучает (через user_cards)
CREATE POLICY "Users can view decks they study"
  ON decks FOR SELECT
  USING (
    id IN (SELECT DISTINCT deck_id FROM user_cards WHERE user_id = auth.uid())
  );

-- cards: владелец колоды может управлять карточками
CREATE POLICY "Deck owner can manage cards"
  ON cards FOR ALL
  USING (
    deck_id IN (SELECT id FROM decks WHERE owner_id = auth.uid())
  );

-- cards: участники группы видят карточки групповых колод
CREATE POLICY "Group members can view group deck cards"
  ON cards FOR SELECT
  USING (
    deck_id IN (
      SELECT gd.deck_id FROM group_decks gd
      WHERE gd.group_id IN (SELECT get_user_group_ids(auth.uid()))
    )
  );

-- cards: пользователь видит карточки, которые изучает
CREATE POLICY "Users can view cards they study"
  ON cards FOR SELECT
  USING (
    id IN (SELECT card_id FROM user_cards WHERE user_id = auth.uid())
  );

-- user_cards: админ группы видит прогресс участников по колодам группы
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
