# Database Schema & Technical Architecture

## 1. DATABASE SCHEMA (PostgreSQL via Supabase)

### 1.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│    families     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1
         │
         │ N
┌─────────────────┐         ┌─────────────────┐
│      users      │         │      decks      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ email           │    1    │ family_id (FK)  │
│ display_name    │─────────│ title           │
│ family_id (FK)  │         │ description     │
│ role            │         │ cover_image_url │
│ avatar_url      │         │ created_by (FK) │
│ created_at      │         │ created_at      │
│ updated_at      │         │ updated_at      │
└─────────────────┘         └─────────────────┘
         │                           │
         │ 1                         │ 1
         │                           │
         │ N                         │ N
┌─────────────────────┐     ┌─────────────────┐
│   card_progress     │     │      cards      │
├─────────────────────┤     ├─────────────────┤
│ id (PK)             │     │ id (PK)         │
│ user_id (FK)        │     │ deck_id (FK)    │
│ card_id (FK)        │─────│ ru_text         │
│ direction           │  N  │ en_text         │
│ status              │  1  │ transcription...│
│ times_shown         │     │ image_url       │
│ times_correct       │     │ audio_url       │
│ times_incorrect     │     │ position        │
│ last_reviewed_at    │     │ created_at      │
│ created_at          │     │ updated_at      │
│ updated_at          │     └─────────────────┘
└─────────────────────┘
         │
         │ N
         │
         │ 1
┌─────────────────────┐
│   study_sessions    │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ deck_id (FK)        │
│ mode                │
│ direction           │
│ started_at          │
│ completed_at        │
│ total_cards         │
└─────────────────────┘
         │
         │ 1
         │
         │ N
┌─────────────────────┐
│   session_results   │
├─────────────────────┤
│ id (PK)             │
│ session_id (FK)     │
│ card_id (FK)        │
│ correct             │
│ response_time_ms    │
│ user_answer         │
│ attempted_at        │
└─────────────────────┘
```

---

### 1.2 Tables Definition (SQL)

#### Table: families

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_families_created_at ON families(created_at);
```

**Описание:** Семейные аккаунты. Все пользователи, наборы и прогресс привязаны к семье.

---

#### Table: users (расширение Supabase Auth)

```sql
-- Это расширение таблицы auth.users от Supabase
-- Создаём связанную таблицу public.profiles

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_family_id ON profiles(family_id);
CREATE INDEX idx_profiles_role ON profiles(role);
```

**Описание:** 
- И админы (родители) и студенты (дети) имеют полноценные auth.users записи
- Каждый логинится под своим email + password
- Родитель создаёт учётные записи детей во время onboarding
- После логина редирект зависит от роли: admin → `/admin/decks`, student → `/student/decks`
- Все пользователи привязаны к одной семье

---

#### Table: decks

```sql
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_decks_family_id ON decks(family_id);
CREATE INDEX idx_decks_created_by ON decks(created_by);
CREATE INDEX idx_decks_created_at ON decks(created_at DESC);
```

**Описание:** Наборы карточек. Общие для всей семьи (не привязаны к конкретному ребёнку).

---

#### Table: cards

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  ru_text TEXT NOT NULL,
  en_text TEXT NOT NULL,
  transcription_ipa TEXT,
  transcription_ru TEXT,
  image_url TEXT,
  audio_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_position ON cards(deck_id, position);

-- Constraint: position должен быть уникальным внутри deck
CREATE UNIQUE INDEX idx_cards_deck_position ON cards(deck_id, position);
```

**Описание:** Карточки. Каждая карточка принадлежит одному набору.

**Поля:**
- `ru_text`: русский текст (обязательно)
- `en_text`: английский текст (обязательно)
- `transcription_ipa`: транскрипция IPA (опционально)
- `transcription_ru`: транскрипция русскими буквами (опционально)
- `image_url`: URL картинки в Supabase Storage (опционально)
- `audio_url`: URL кэшированного TTS аудио (опционально)
- `position`: порядок в наборе (для сортировки)

---

#### Table: card_progress

```sql
CREATE TYPE card_status AS ENUM ('learning', 'mastered', 'archived');
CREATE TYPE study_direction AS ENUM ('ru_to_en', 'en_to_ru');

CREATE TABLE card_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  direction study_direction NOT NULL,
  status card_status NOT NULL DEFAULT 'learning',
  times_shown INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_incorrect INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: один прогресс на пользователя+карточка+направление
  UNIQUE(user_id, card_id, direction)
);

-- Indexes
CREATE INDEX idx_progress_user_id ON card_progress(user_id);
CREATE INDEX idx_progress_card_id ON card_progress(card_id);
CREATE INDEX idx_progress_status ON card_progress(user_id, status);
CREATE INDEX idx_progress_last_reviewed ON card_progress(last_reviewed_at DESC);
```

**Описание:** Прогресс ребёнка по каждой карточке. Индивидуальный для каждого пользователя.

**Статусы:**
- `learning`: ещё изучаю (по умолчанию)
- `mastered`: выучил, но ещё показывается
- `archived`: заархивировано (100+ показов)

**Направления:**
- `ru_to_en`: изучаю RU → EN
- `en_to_ru`: изучаю EN → RU

**Логика обновления:**
```sql
-- При ответе "Знаю"
UPDATE card_progress 
SET times_shown = times_shown + 1,
    times_correct = times_correct + 1,
    last_reviewed_at = NOW()
WHERE id = ?;

-- При ответе "Не знаю"
UPDATE card_progress 
SET times_shown = times_shown + 1,
    times_incorrect = times_incorrect + 1,
    last_reviewed_at = NOW()
WHERE id = ?;

-- Проверка на архивацию
UPDATE card_progress 
SET status = 'archived'
WHERE times_shown >= 100 
  AND times_correct > times_incorrect;
```

---

#### Table: study_sessions

```sql
CREATE TYPE study_mode AS ENUM (
  'flashcards_ru_en', 
  'flashcards_en_ru', 
  'test_multiple', 
  'test_written',
  'match',
  'review'
);

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  mode study_mode NOT NULL,
  direction study_direction,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_cards INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_sessions_deck_id ON study_sessions(deck_id);
CREATE INDEX idx_sessions_started_at ON study_sessions(started_at DESC);
```

**Описание:** Сессии обучения. Одна сессия = один проход карточек/тестов.

**Режимы:**
- `flashcards_ru_en`: карточки RU → EN
- `flashcards_en_ru`: карточки EN → RU
- `test_multiple`: тест множественный выбор
- `test_written`: тест диктант
- `match`: игра на совпадение
- `review`: повторение незнакомых

---

#### Table: session_results

```sql
CREATE TABLE session_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  user_answer TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_results_session_id ON session_results(session_id);
CREATE INDEX idx_results_card_id ON session_results(card_id);
CREATE INDEX idx_results_attempted_at ON session_results(attempted_at DESC);
```

**Описание:** Результаты по каждой карточке внутри сессии.

**Поля:**
- `correct`: правильно или нет (boolean)
- `response_time_ms`: время ответа в миллисекундах (опционально)
- `user_answer`: ответ пользователя для письменных тестов (опционально)

---

### 1.3 Row Level Security (RLS) Policies

#### Политики для `families`

```sql
-- Включаем RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Админы видят свою семью
CREATE POLICY "Admins can view own family"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Админы могут обновлять свою семью
CREATE POLICY "Admins can update own family"
  ON families FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### Политики для `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Все члены семьи видят профили своей семьи
CREATE POLICY "Family members can view profiles"
  ON profiles FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Только админы могут создавать/обновлять профили
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### Политики для `decks`

```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Все члены семьи видят наборы
CREATE POLICY "Family members can view decks"
  ON decks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Только админы могут создавать/редактировать наборы
CREATE POLICY "Admins can manage decks"
  ON decks FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### Политики для `cards`

```sql
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Все члены семьи видят карточки
CREATE POLICY "Family members can view cards"
  ON cards FOR SELECT
  USING (
    deck_id IN (
      SELECT d.id FROM decks d
      INNER JOIN profiles p ON d.family_id = p.family_id
      WHERE p.id = auth.uid()
    )
  );

-- Только админы могут управлять карточками
CREATE POLICY "Admins can manage cards"
  ON cards FOR ALL
  USING (
    deck_id IN (
      SELECT d.id FROM decks d
      INNER JOIN profiles p ON d.family_id = p.family_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
```

---

#### Политики для `card_progress`

```sql
ALTER TABLE card_progress ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свой прогресс
CREATE POLICY "Users can view own progress"
  ON card_progress FOR SELECT
  USING (user_id = auth.uid());

-- Пользователи могут обновлять свой прогресс
CREATE POLICY "Users can update own progress"
  ON card_progress FOR ALL
  USING (user_id = auth.uid());

-- Админы видят прогресс всех детей семьи
CREATE POLICY "Admins can view family progress"
  ON card_progress FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles 
      WHERE family_id IN (
        SELECT family_id FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );
```

---

#### Политики для `study_sessions` и `session_results`

```sql
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;

-- Аналогично card_progress
CREATE POLICY "Users can manage own sessions"
  ON study_sessions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view family sessions"
  ON study_sessions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles 
      WHERE family_id IN (
        SELECT family_id FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can manage own results"
  ON session_results FOR ALL
  USING (
    session_id IN (
      SELECT id FROM study_sessions WHERE user_id = auth.uid()
    )
  );
```

---

### 1.4 Database Functions (Stored Procedures)

#### Function: Get deck progress for user

```sql
CREATE OR REPLACE FUNCTION get_deck_progress(
  p_user_id UUID,
  p_deck_id UUID,
  p_direction study_direction
) RETURNS JSON AS $$
DECLARE
  total_cards INTEGER;
  learning_count INTEGER;
  mastered_count INTEGER;
  archived_count INTEGER;
BEGIN
  -- Подсчёт карточек
  SELECT COUNT(*) INTO total_cards
  FROM cards WHERE deck_id = p_deck_id;
  
  SELECT 
    COUNT(*) FILTER (WHERE status = 'learning') AS learning,
    COUNT(*) FILTER (WHERE status = 'mastered') AS mastered,
    COUNT(*) FILTER (WHERE status = 'archived') AS archived
  INTO learning_count, mastered_count, archived_count
  FROM card_progress
  WHERE user_id = p_user_id 
    AND deck_id = p_deck_id 
    AND direction = p_direction;
  
  RETURN json_build_object(
    'total_cards', total_cards,
    'learning', COALESCE(learning_count, 0),
    'mastered', COALESCE(mastered_count, 0),
    'archived', COALESCE(archived_count, 0),
    'progress_percent', ROUND((COALESCE(archived_count, 0)::NUMERIC / NULLIF(total_cards, 0)) * 100, 2)
  );
END;
$$ LANGUAGE plpgsql;
```

**Использование:**
```sql
SELECT get_deck_progress(
  '123e4567-e89b-12d3-a456-426614174000', -- user_id
  '223e4567-e89b-12d3-a456-426614174000', -- deck_id
  'ru_to_en' -- direction
);

-- Результат:
{
  "total_cards": 31,
  "learning": 11,
  "mastered": 0,
  "archived": 20,
  "progress_percent": 64.52
}
```

---

## 2. BACKEND ARCHITECTURE

### 2.1 Technology Stack

**Backend-as-a-Service:**
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
  - Database: PostgreSQL 15
  - Authentication: email/password
  - Storage: для картинок и аудио
  - Edge Functions: для сложной логики (опционально)

**Why Supabase?**
- Бесплатный tier: 500MB БД, 1GB Storage, 50k requests/месяц
- Auto-generated REST API
- Row Level Security из коробки
- Realtime подписки (для будущих фич)
- Хостинг включён
- SDK для JavaScript/TypeScript

---

### 2.2 API Layer

**Supabase Auto-Generated REST API:**

```javascript
// Пример: Получить все наборы семьи
const { data, error } = await supabase
  .from('decks')
  .select('*')
  .eq('family_id', familyId)
  .order('created_at', { ascending: false });

// Пример: Создать карточку
const { data, error } = await supabase
  .from('cards')
  .insert({
    deck_id: deckId,
    ru_text: 'первый',
    en_text: 'first',
    transcription_ipa: '/fɜːst/',
    transcription_ru: 'фёрст',
    position: 1
  });

// Пример: Обновить прогресс
const { data, error } = await supabase
  .from('card_progress')
  .upsert({
    user_id: userId,
    card_id: cardId,
    direction: 'ru_to_en',
    times_shown: times_shown + 1,
    times_correct: times_correct + 1,
    last_reviewed_at: new Date().toISOString()
  });
```

**Преимущества:**
- Не нужно писать API endpoints
- Автоматическая валидация через PostgreSQL constraints
- RLS обеспечивает безопасность

---

### 2.3 Authentication Flow

**Регистрация (Родитель):**
```javascript
// 1. Создать auth user
const { data: authData, error } = await supabase.auth.signUp({
  email: 'parent@example.com',
  password: 'secure_password'
});

// 2. Создать семью
const { data: family } = await supabase
  .from('families')
  .insert({ name: 'Семья Петровых' })
  .select()
  .single();

// 3. Создать профиль админа
await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,
    family_id: family.id,
    display_name: 'Борис',
    role: 'admin'
  });
```

**Создание профиля ребёнка (с полноценной auth записью):**
```javascript
// Родитель создаёт учётную запись для ребёнка в onboarding
// 1. Создать auth user для ребёнка
const { data: childAuthData, error } = await supabase.auth.admin.createUser({
  email: 'petya@family.local', // или родитель задаёт реальный email
  password: 'child_password', // родитель придумывает пароль
  email_confirm: true // сразу подтверждаем email
});

// 2. Создать профиль студента
const { data: childProfile } = await supabase
  .from('profiles')
  .insert({
    id: childAuthData.user.id,
    family_id: familyId,
    display_name: 'Петя',
    role: 'student',
    avatar_url: 'https://...'
  })
  .select()
  .single();

// Теперь ребёнок может залогиниться под своим email+password
```

**Логин ребёнка:**
```javascript
// Ребёнок логинится напрямую под своей учёткой
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'petya@family.local',
  password: 'child_password'
});

// Получаем роль из profiles
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single();

// Редирект в зависимости от роли
if (profile.role === 'admin') {
  router.push('/admin/decks');
} else {
  router.push('/student/decks');
}

// Все запросы используют auth.uid() напрямую - это ID текущего пользователя
```

---

### 2.4 File Storage

**Supabase Storage Buckets:**

```
flashcards-app/
├── images/
│   ├── decks/
│   │   └── {deck_id}/cover.jpg
│   └── cards/
│       └── {card_id}/image.jpg
└── audio/
    └── {card_id}/{en_text}.mp3
```

**Upload Image:**
```javascript
const file = event.target.files[0];
const fileExt = file.name.split('.').pop();
const fileName = `${cardId}.${fileExt}`;

const { data, error } = await supabase.storage
  .from('images')
  .upload(`cards/${fileName}`, file);

// Получить public URL
const { data: publicURL } = supabase.storage
  .from('images')
  .getPublicUrl(`cards/${fileName}`);

// Сохранить URL в card
await supabase
  .from('cards')
  .update({ image_url: publicURL.publicUrl })
  .eq('id', cardId);
```

---

### 2.5 Text-to-Speech Integration

**MVP: Web Speech API (бесплатно)**

```javascript
// Client-side TTS
function speakText(text, lang = 'en-US') {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.8; // медленнее для детей
  utterance.pitch = 1.0;
  
  speechSynthesis.speak(utterance);
}

// Использование
<button onClick={() => speakText('first', 'en-US')}>
  🔊 Прослушать
</button>
```

**Ограничения:**
- Качество зависит от браузера/ОС
- Работает только онлайн
- Нет кэширования

**Future: Server-side TTS с кэшированием**

```javascript
// Supabase Edge Function
export async function generateTTS(text: string) {
  // 1. Проверить есть ли уже в storage
  const { data } = await supabase.storage
    .from('audio')
    .list(`${cardId}/`);
  
  if (data?.length > 0) {
    return getPublicUrl(data[0].name);
  }
  
  // 2. Генерировать через Google Cloud TTS
  const audioBuffer = await googleTTS.synthesize({
    text,
    languageCode: 'en-US',
    voiceName: 'en-US-Wavenet-D'
  });
  
  // 3. Сохранить в storage
  await supabase.storage
    .from('audio')
    .upload(`${cardId}/${text}.mp3`, audioBuffer);
  
  return publicUrl;
}
```

---

## 3. FRONTEND ARCHITECTURE

### 3.1 Technology Stack

**Framework:**
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**

**Styling:**
- **Tailwind CSS**
- **shadcn/ui** (компоненты)

**State Management:**
- React Context API (для простоты, без Redux)
- Zustand (опционально для сложной логики)

**Forms:**
- **React Hook Form**
- **Zod** (валидация)

**Icons:**
- **Lucide React**

---

### 3.2 Project Structure

```
flashcards-app/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected routes
│   │   ├── admin/
│   │   │   ├── decks/
│   │   │   ├── stats/
│   │   │   └── settings/
│   │   ├── student/
│   │   │   ├── decks/
│   │   │   ├── study/
│   │   │   └── stats/
│   │   └── layout.tsx
│   ├── api/                      # API routes (если нужно)
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── flashcard/
│   │   ├── FlashcardViewer.tsx
│   │   ├── FlashcardControls.tsx
│   │   └── ProgressBar.tsx
│   ├── deck/
│   │   ├── DeckList.tsx
│   │   ├── DeckCard.tsx
│   │   └── DeckForm.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── ProfileSelector.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   ├── server.ts             # Server-side Supabase
│   │   └── types.ts              # Generated types
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useDecks.ts
│   │   └── useStudySession.ts
│   ├── utils/
│   │   ├── tts.ts
│   │   ├── csv-parser.ts
│   │   └── progress-calculator.ts
│   └── types/
│       └── database.types.ts
├── public/
│   └── avatars/
└── package.json
```

---

### 3.3 Data Flow

**State Management с React Context:**

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Получить текущего пользователя из Supabase Auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      if (user) {
        // Загрузить профиль текущего пользователя
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
    
    // Подписка на изменения auth состояния
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const isAdmin = profile?.role === 'admin';
  
  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Использование:
// const { profile, isAdmin } = useAuth();
// profile.id === auth.uid() - всегда текущий залогиненный пользователь
```

**Custom Hooks:**

```typescript
// hooks/useStudySession.ts
export function useStudySession(deckId: string, direction: StudyDirection) {
  const { profile } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState<StudySession | null>(null);
  
  // Загрузить карточки
  useEffect(() => {
    async function loadCards() {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('position');
      setCards(data);
    }
    loadCards();
  }, [deckId]);
  
  // Создать сессию
  async function startSession() {
    const { data } = await supabase
      .from('study_sessions')
      .insert({
        user_id: profile.id,
        deck_id: deckId,
        mode: `flashcards_${direction}`,
        direction,
        total_cards: cards.length
      })
      .select()
      .single();
    setSession(data);
  }
  
  // Ответить на карточку
  async function answerCard(cardId: string, correct: boolean) {
    // 1. Сохранить результат
    await supabase
      .from('session_results')
      .insert({
        session_id: session.id,
        card_id: cardId,
        correct
      });
    
    // 2. Обновить прогресс
    await supabase.rpc('update_card_progress', {
      p_user_id: currentProfile.id,
      p_card_id: cardId,
      p_direction: direction,
      p_correct: correct
    });
    
    // 3. Следующая карточка
    setCurrentIndex(prev => prev + 1);
  }
  
  return {
    cards,
    currentCard: cards[currentIndex],
    currentIndex,
    totalCards: cards.length,
    progress: (currentIndex / cards.length) * 100,
    startSession,
    answerCard
  };
}
```

---

### 3.4 Routing

**App Router Structure:**

```
/                          → Landing page (если не залогинен)
/login                     → Login page (после логина редирект по роли)
/register                  → Registration (только для родителя)
/onboarding                → Создание семьи + учётных записей детей

/admin/decks               → Список наборов (админ, редирект после логина)
/admin/decks/new           → Создать набор
/admin/decks/[id]          → Карточки набора
/admin/decks/[id]/edit     → Редактировать набор
/admin/stats               → Статистика детей
/admin/settings            → Настройки семьи

/student/decks             → Список наборов (студент)
/student/study/[deckId]    → Выбор режима
/student/flashcards/[deckId]?dir=ru_en  → Режим карточек
/student/review            → Повторение
/student/stats             → Моя статистика

/test/[deckId]?type=multiple  → Тестирование
/match/[deckId]               → Игра Match
```

---

## 4. DEPLOYMENT ARCHITECTURE

### 4.1 Infrastructure

```
┌─────────────────────────────────────────────┐
│         Vercel (Frontend Hosting)           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   Next.js App (SSR + Static)        │   │
│  │   - React Components                │   │
│  │   - API Routes (optional)           │   │
│  │   - Edge Functions (optional)       │   │
│  └─────────────────────────────────────┘   │
│                                             │
└───────────────────┬─────────────────────────┘
                    │
                    │ HTTPS
                    │
                    ▼
┌─────────────────────────────────────────────┐
│        Supabase (Backend Service)           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   PostgreSQL Database               │   │
│  │   - Tables + RLS                    │   │
│  │   - Functions                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   Authentication                    │   │
│  │   - Email/Password                  │   │
│  │   - JWT Tokens                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   Storage                           │   │
│  │   - Images (cards, decks)           │   │
│  │   - Audio (TTS cache)               │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4.2 Environment Variables

```bash
# .env.local (local development)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Production (Vercel Environment Variables)
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

### 4.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 5. SECURITY CONSIDERATIONS

### 5.1 Authentication Security
- ✅ Supabase JWT tokens (auto-refresh)
- ✅ HttpOnly cookies for session
- ✅ CSRF protection (Next.js built-in)
- ✅ Rate limiting на login (Supabase built-in)

### 5.2 Data Security
- ✅ Row Level Security (RLS) на всех таблицах
- ✅ Encrypted at rest (PostgreSQL)
- ✅ HTTPS only (Vercel/Supabase automatic)
- ✅ Prepared statements (SQL injection protection)

### 5.3 File Upload Security
- ✅ Ограничение типов файлов (images only)
- ✅ Ограничение размера (max 5MB)
- ✅ Вирусная проверка (Supabase Storage)

### 5.4 Privacy
- ✅ GDPR compliance (Supabase EU region)
- ✅ Data deletion (CASCADE on user delete)
- ✅ No third-party analytics (privacy-first)

---

## 6. PERFORMANCE OPTIMIZATION

### 6.1 Database
- ✅ Indexes на часто запрашиваемых полях
- ✅ Connection pooling (Supabase Supavisor)
- ✅ Query optimization (use EXPLAIN ANALYZE)

### 6.2 Frontend
- ✅ Code splitting (Next.js automatic)
- ✅ Image optimization (Next.js Image)
- ✅ Lazy loading компонентов
- ✅ Memoization (React.memo, useMemo)

### 6.3 Caching
- ✅ Static generation где возможно
- ✅ SWR для data fetching (stale-while-revalidate)
- ✅ Service Worker для PWA (future)

---

## 7. MONITORING & LOGGING

### 7.1 Error Tracking
- **Sentry** (опционально)
- Browser console errors
- Supabase logs

### 7.2 Analytics
- **Plausible Analytics** (privacy-friendly)
- Не Google Analytics (privacy concerns)

### 7.3 Performance Monitoring
- Vercel Analytics (built-in)
- Web Vitals (LCP, FID, CLS)

---

## 8. BACKUP & DISASTER RECOVERY

### 8.1 Database Backup
- Supabase automatic daily backups (free tier: 7 days retention)
- Manual backups перед мажорными миграциями

### 8.2 Storage Backup
- Periodically export images/audio to local
- Version control for code (Git)

### 8.3 Disaster Recovery Plan
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours
- Restore from Supabase backup + redeploy Vercel

---

## 9. SCALABILITY CONSIDERATIONS

**Current scale:**
- 1 семья
- 2 ребёнка
- ~10 наборов
- ~300 карточек
- ~50 сессий/месяц

**Free tier limits:**
- Supabase: 500MB DB, 1GB Storage, 50k requests/month
- Vercel: 100GB bandwidth/month

**Projected usage:**
- DB size: < 10MB (текст + metadata)
- Storage: < 100MB (images + audio cache)
- Requests: ~5000/month (100 sessions × 50 requests)

**Conclusion:** Бесплатных лимитов хватит на несколько лет использования одной семьёй.

**Future scaling (если нужно):**
- Supabase Pro: $25/месяц (8GB DB, 100GB Storage)
- Vercel Pro: $20/месяц (1TB bandwidth)
