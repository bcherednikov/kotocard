-- ============================================
-- Этап 11: Миграция существующих семей в группы
-- ============================================
-- Для каждой семьи с >1 участником:
--   1. Создать запись в groups (name = families.name)
--   2. Добавить admin семьи как group_members(role='admin')
--   3. Добавить students семьи как group_members(role='member')
--   4. Все колоды семьи → group_decks
-- Одиночные пользователи: ничего не делаем.
-- ============================================

DO $$
DECLARE
  fam RECORD;
  new_group_id UUID;
  member RECORD;
  deck RECORD;
  admin_id UUID;
BEGIN
  -- Перебираем семьи, у которых >1 участник
  FOR fam IN
    SELECT f.id, f.name
    FROM families f
    WHERE (SELECT COUNT(*) FROM profiles p WHERE p.family_id = f.id) > 1
  LOOP
    -- 1. Создать группу
    -- Найти admin семьи (для created_by)
    SELECT p.id INTO admin_id
    FROM profiles p
    WHERE p.family_id = fam.id AND p.role = 'admin'
    LIMIT 1;

    -- Если нет admin, взять любого участника
    IF admin_id IS NULL THEN
      SELECT p.id INTO admin_id
      FROM profiles p
      WHERE p.family_id = fam.id
      LIMIT 1;
    END IF;

    INSERT INTO groups (name, created_by, deck_add_permission)
    VALUES (fam.name, admin_id, 'admin_only')
    RETURNING id INTO new_group_id;

    RAISE NOTICE 'Created group "%" (%) for family %', fam.name, new_group_id, fam.id;

    -- 2. Добавить участников
    FOR member IN
      SELECT p.id, p.role
      FROM profiles p
      WHERE p.family_id = fam.id
    LOOP
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (
        new_group_id,
        member.id,
        CASE WHEN member.role = 'admin' THEN 'admin' ELSE 'member' END
      )
      ON CONFLICT (group_id, user_id) DO NOTHING;

      RAISE NOTICE '  Added member % (role: %)', member.id, member.role;
    END LOOP;

    -- 3. Привязать колоды семьи к группе
    FOR deck IN
      SELECT d.id, d.owner_id
      FROM decks d
      WHERE d.family_id = fam.id
    LOOP
      INSERT INTO group_decks (group_id, deck_id, added_by)
      VALUES (new_group_id, deck.id, COALESCE(deck.owner_id, admin_id))
      ON CONFLICT (group_id, deck_id) DO NOTHING;

      RAISE NOTICE '  Linked deck %', deck.id;
    END LOOP;

    RAISE NOTICE '---';
  END LOOP;

  RAISE NOTICE 'Migration complete!';
END $$;
