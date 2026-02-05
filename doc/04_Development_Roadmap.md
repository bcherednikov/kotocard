# Development Roadmap — Testable Increments

> **ВАЖНО:** Каждый этап должен ЗАПУСКАТЬСЯ и ТЕСТИРОВАТЬСЯ перед переходом к следующему.  
> Не накапливать код без проверки — это путь к "пуговицам на рукаве".

---

## ФАЗИРОВКА РАЗРАБОТКИ

```
MVP (4 недели)
├── Phase 0: Foundation (3-4 дня)      ← работающий скелет
├── Phase 1: Auth + Profiles (3-4 дня) ← можно логиниться
├── Phase 2: Content CRUD (5-6 дней)   ← можно создавать наборы
├── Phase 3: Flashcards (5-6 дней)     ← можно учиться
└── Phase 4: Progress & Stats (3-4 дня) ← видно результаты

Post-MVP (опционально)
├── Phase 5: Testing Modes (1 неделя)
└── Phase 6: Polish & PWA (1 неделя)
```

---

## PHASE 0: Foundation (Работающий скелет)

**Цель:** Пустое Next.js приложение с Supabase подключением, которое ЗАПУСКАЕТСЯ локально.

### Milestone 0.1: Project Setup (1 час)

**Задача:** Создать Next.js проект и установить зависимости

**Действия:**
```bash
# 1. Создать проект
npx create-next-app@latest flashcards-app \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd flashcards-app

# 2. Установить зависимости
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install react-hook-form zod @hookform/resolvers
npm install zustand # для state management
```

**Проверка (Acceptance Criteria):**
- [ ] `npm run dev` запускается без ошибок
- [ ] Открывается http://localhost:3000
- [ ] Видна дефолтная Next.js страница

**Результат:** Работающее приложение, пустое, но запускается.

---

### Milestone 0.2: Supabase Connection (1-2 часа)

**Задача:** Создать Supabase проект и подключить к Next.js

**Действия:**

1. Создать проект в Supabase:
   - Зайти на https://supabase.com
   - New Project: "flashcards-app"
   - Region: Frankfurt (EU)
   - Password: сгенерировать

2. Создать `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

3. Создать `/src/lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

4. Создать тестовую страницу `/src/app/test/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestPage() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      const { error } = await supabase.from('_test').select('*').limit(1);
      // Ошибка "relation does not exist" = connection OK
      setConnected(!error || error.message.includes('does not exist'));
    }
    checkConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Supabase Connection Test</h1>
      {connected ? (
        <p className="text-green-600">✅ Connected to Supabase!</p>
      ) : (
        <p className="text-red-600">❌ Not connected</p>
      )}
    </div>
  );
}
```

**Проверка:**
- [ ] Открыть http://localhost:3000/test
- [ ] Увидеть "✅ Connected to Supabase!"

**Результат:** Next.js коннектится к Supabase.

---

### Milestone 0.3: Database Schema (2-3 часа)

**Задача:** Создать все таблицы в Supabase

**Действия:**

1. Открыть Supabase SQL Editor
2. Скопировать SQL из `03_Architecture_Database.md` (секция 1.2)
3. Выполнить по порядку:
   - Создать `families`
   - Создать `profiles`
   - Создать `decks`
   - Создать `cards`
   - Создать `card_progress`
   - Создать `study_sessions`
   - Создать `session_results`
   - Создать indexes
   - Создать RLS policies

4. Вставить тестовые данные:
```sql
-- Test family
INSERT INTO families (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Family');

-- Test deck
INSERT INTO decks (id, family_id, title, description)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Test Deck',
  'For testing'
);

-- Test cards
INSERT INTO cards (deck_id, ru_text, en_text, position)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'первый', 'first', 1),
  ('00000000-0000-0000-0000-000000000002', 'второй', 'second', 2);
```

5. Обновить `/src/app/test/page.tsx`:
```typescript
export default function TestPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: decks } = await supabase
        .from('decks')
        .select('*, cards(*)')
        .limit(1);
      setData(decks);
    }
    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Database Test</h1>
      {data ? (
        <pre className="bg-gray-100 p-4 rounded mt-4">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
```

**Проверка:**
- [ ] Открыть http://localhost:3000/test
- [ ] Увидеть JSON с тестовым набором и 2 карточками

**Результат:** База данных создана, тестовые данные читаются.

---

### Milestone 0.4: Basic Layout (2 часа)

**Задача:** Создать базовый layout с header

**Действия:**

1. Создать `/src/components/layout/Header.tsx`:
```typescript
export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold">FlashCards App</h1>
      </div>
    </header>
  );
}
```

2. Обновить `/src/app/layout.tsx`:
```typescript
import { Header } from '@/components/layout/Header';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

3. Создать главную страницу `/src/app/page.tsx`:
```typescript
export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">
        Добро пожаловать в FlashCards
      </h1>
      <p className="text-gray-600 mb-8">
        Учите английский вместе с семьёй
      </p>
      <div className="space-x-4">
        <a 
          href="/login" 
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Войти
        </a>
        <a 
          href="/register" 
          className="inline-block px-6 py-3 border border-blue-600 text-blue-600 rounded-lg"
        >
          Создать аккаунт
        </a>
      </div>
    </div>
  );
}
```

**Проверка:**
- [ ] Открыть http://localhost:3000
- [ ] Увидеть landing page с кнопками
- [ ] Header отображается

**Результат:** Базовая структура приложения готова.

---

**✅ CHECKPOINT PHASE 0:**
- [x] Приложение запускается
- [x] Supabase подключён
- [x] База данных создана
- [x] Тестовые данные читаются
- [x] Базовый UI работает

**→ Можно переходить к Phase 1**

---

## PHASE 1: Auth + Profiles (Система пользователей)

**Цель:** Родитель может зарегистрироваться, создать семью, добавить детей, выбрать профиль.

### Milestone 1.1: Auth UI (2-3 часа)

**Задача:** Страницы регистрации и логина

**Действия:**

1. Создать `/src/app/(auth)/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-6">Вход</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
```

2. Создать `/src/app/(auth)/register/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      // 2. Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName })
        .select()
        .single();

      if (familyError) throw familyError;

      // 3. Create admin profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user!.id,
          family_id: family.id,
          display_name: email.split('@')[0],
          role: 'admin'
        });

      if (profileError) throw profileError;

      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-6">Регистрация</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Название семьи
          </label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Семья Ивановых"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
            minLength={6}
          />
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Создаём...' : 'Создать аккаунт'}
        </button>
      </form>
    </div>
  );
}
```

**Проверка:**
- [ ] Открыть http://localhost:3000/register
- [ ] Заполнить форму: "Тестовая Семья", test@example.com, password123
- [ ] Нажать "Создать аккаунт"
- [ ] В Supabase → Authentication → Users появился пользователь
- [ ] В Table Editor → families появилась семья
- [ ] В Table Editor → profiles появился профиль admin

**Результат:** Регистрация работает, пользователь создаётся.

---

### Milestone 1.2: Profile Management (3-4 часа)

**Задача:** Создание полноценных учётных записей для детей в onboarding

**Действия:**

1. Создать `/src/app/onboarding/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type ChildInput = {
  name: string;
  email: string;
  password: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildInput[]>([
    { name: '', email: '', password: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addChild() {
    setChildren([...children, { name: '', email: '', password: '' }]);
  }

  function updateChild(index: number, field: keyof ChildInput, value: string) {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get current user's family_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user!.id)
        .single();

      // Create auth users and profiles for each child
      for (const child of children) {
        if (!child.name.trim()) continue;

        // 1. Create auth user via admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: child.email,
          password: child.password,
          email_confirm: true, // Skip email confirmation
          user_metadata: {
            display_name: child.name
          }
        });

        if (authError) throw authError;

        // 2. Create profile for student
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            family_id: profile!.family_id,
            display_name: child.name,
            role: 'student'
          });

        if (profileError) throw profileError;
      }

      // Redirect to admin dashboard
      router.push('/admin/decks');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-16">
      <h1 className="text-3xl font-bold mb-2">Добавьте детей</h1>
      <p className="text-gray-600 mb-8">
        Создайте учётные записи для ваших детей
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {children.map((child, index) => (
          <div key={index} className="p-6 border rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Ребёнок {index + 1}</h3>
            
            <input
              type="text"
              value={child.name}
              onChange={(e) => updateChild(index, 'name', e.target.value)}
              placeholder="Имя (например: Петя)"
              className="w-full px-4 py-3 border rounded-lg"
              required
            />
            
            <input
              type="email"
              value={child.email}
              onChange={(e) => updateChild(index, 'email', e.target.value)}
              placeholder="Email для входа (например: petya@family.local)"
              className="w-full px-4 py-3 border rounded-lg"
              required
            />
            
            <input
              type="password"
              value={child.password}
              onChange={(e) => updateChild(index, 'password', e.target.value)}
              placeholder="Пароль (минимум 6 символов)"
              className="w-full px-4 py-3 border rounded-lg"
              required
              minLength={6}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addChild}
          className="text-blue-600 font-medium"
        >
          + Добавить ещё ребёнка
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-lg disabled:opacity-50"
        >
          {loading ? 'Сохраняем...' : 'Продолжить'}
        </button>
      </form>
    </div>
  );
}
```

**Проверка:**
- [ ] После регистрации попадаешь на /onboarding
- [ ] Заполнить для "Петя": имя, email (petya@family.local), пароль
- [ ] Заполнить для "Маша": имя, email (masha@family.local), пароль
- [ ] Нажать "Продолжить"
- [ ] В Supabase → Authentication → Users появились 3 пользователя (родитель + 2 детей)
- [ ] В Table Editor → profiles появились 2 профиля со role='student'
- [ ] Можно разлогиниться и залогиниться под petya@family.local

**Результат:** Дети имеют полноценные учётные записи для входа.

---

### Milestone 1.3: Login with Role-Based Redirect (1-2 часа)

**Задача:** Настроить редирект после логина в зависимости от роли

**Действия:**

1. Обновить `/src/app/(auth)/login/page.tsx` — добавить редирект после логина:
```typescript
async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setError('');

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setError(error.message);
  } else {
    // Получить профиль пользователя
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single();
    
    // Редирект в зависимости от роли
    if (profile?.role === 'admin') {
      router.push('/admin/decks');
    } else {
      router.push('/student/decks');
    }
  }
}
```

2. Создать простой `/src/contexts/AuthContext.tsx` (без переключения профилей):
```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  display_name: string;
  role: 'admin' | 'student';
  family_id: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получить текущего пользователя
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
    <AuthContext.Provider value={{ user, profile, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

3. Обновить `/src/app/layout.tsx`:
```typescript
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Проверка:**
- [ ] Залогиниться как родитель (test@example.com)
- [ ] Автоматически редирект на /admin/decks
- [ ] Разлогиниться
- [ ] Залогиниться как ребенок (petya@family.local)
- [ ] Автоматически редирект на /student/decks
- [ ] `useAuth()` hook возвращает правильный profile и isAdmin

**Результат:** Каждый пользователь автоматически попадает на свой интерфейс после логина.

---

**✅ CHECKPOINT PHASE 1:**
- [x] Регистрация родителя работает
- [x] Создание учётных записей детей работает (с email + password)
- [x] Дети могут логиниться под своими учётками
- [x] Редирект после логина работает (admin → /admin/decks, student → /student/decks)
- [x] AuthContext возвращает текущего пользователя и его роль

**→ Можно переходить к Phase 2**

---

## PHASE 2: Content CRUD (Управление контентом)

**Цель:** Админ может создавать наборы, добавлять карточки, импортировать CSV.

### Milestone 2.1: Deck List & Create (3-4 часа)

**Задача:** Страница со списком наборов + форма создания

**Действия:**

1. Создать `/src/app/admin/decks/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import Link from 'next/link';

type Deck = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export default function AdminDecksPage() {
  const { currentProfile } = useProfile();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    if (!currentProfile) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', currentProfile.id)
      .single();

    const { data } = await supabase
      .from('decks')
      .select('*')
      .eq('family_id', profile!.family_id)
      .order('created_at', { ascending: false });

    setDecks(data || []);
    setLoading(false);
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Наборы карточек</h1>
        <Link
          href="/admin/decks/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
        >
          + Создать набор
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Пока нет наборов</p>
          <Link
            href="/admin/decks/new"
            className="text-blue-600 font-medium"
          >
            Создать первый набор
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {decks.map(deck => (
            <Link
              key={deck.id}
              href={`/admin/decks/${deck.id}`}
              className="p-6 border rounded-lg hover:border-blue-600 transition"
            >
              <h3 className="text-xl font-semibold mb-2">{deck.title}</h3>
              <p className="text-gray-600">{deck.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

2. Создать `/src/app/admin/decks/new/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'next/navigation';

export default function NewDeckPage() {
  const router = useRouter();
  const { currentProfile } = useProfile();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', currentProfile!.id)
        .single();

      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({
          family_id: profile!.family_id,
          title,
          description,
          created_by: currentProfile!.id
        })
        .select()
        .single();

      if (deckError) throw deckError;

      router.push(`/admin/decks/${deck.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Создать набор</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Название набора
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Ordinal Numbers"
            className="w-full px-4 py-3 border rounded-lg text-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Порядковые числительные 1-31"
            className="w-full px-4 py-3 border rounded-lg"
            rows={3}
          />
        </div>

        {error && (
          <p className="text-red-600">{error}</p>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Создаём...' : 'Создать набор'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Проверка:**
- [ ] Зайти под админом → /admin/decks
- [ ] Видеть кнопку "Создать набор"
- [ ] Клик → попадаешь на /admin/decks/new
- [ ] Заполнить: "Test Deck", "Description"
- [ ] Нажать "Создать набор"
- [ ] Редирект на /admin/decks/{id}
- [ ] В Table Editor → decks появился набор

**Результат:** Можно создавать наборы.

---

### Milestone 2.2: Cards CRUD (4-5 часов)

**Задача:** Страница набора с карточками, добавление карточек

**Действия:**

1. Создать `/src/app/admin/decks/[id]/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Card = {
  id: string;
  ru_text: string;
  en_text: string;
  transcription_ipa?: string;
  transcription_ru?: string;
  position: number;
};

export default function DeckDetailPage() {
  const params = useParams();
  const deckId = params.id as string;
  
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [ruText, setRuText] = useState('');
  const [enText, setEnText] = useState('');
  const [transIPA, setTransIPA] = useState('');
  const [transRu, setTransRu] = useState('');

  useEffect(() => {
    loadDeck();
    loadCards();
  }, [deckId]);

  async function loadDeck() {
    const { data } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .single();
    setDeck(data);
  }

  async function loadCards() {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('position');
    setCards(data || []);
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    
    const maxPosition = cards.length > 0 
      ? Math.max(...cards.map(c => c.position))
      : 0;

    const { error } = await supabase
      .from('cards')
      .insert({
        deck_id: deckId,
        ru_text: ruText,
        en_text: enText,
        transcription_ipa: transIPA || null,
        transcription_ru: transRu || null,
        position: maxPosition + 1
      });

    if (!error) {
      setRuText('');
      setEnText('');
      setTransIPA('');
      setTransRu('');
      loadCards();
      setShowAddForm(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('Удалить карточку?')) return;
    
    await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);
    
    loadCards();
  }

  if (!deck) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/decks" className="text-blue-600 mb-4 inline-block">
          ← Назад к наборам
        </Link>
        <h1 className="text-3xl font-bold">{deck.title}</h1>
        <p className="text-gray-600">{deck.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Карточки ({cards.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {showAddForm ? 'Отмена' : '+ Добавить карточку'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddCard} className="p-6 bg-gray-50 rounded-lg mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Русский текст
                </label>
                <input
                  type="text"
                  value={ruText}
                  onChange={(e) => setRuText(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Английский текст
                </label>
                <input
                  type="text"
                  value={enText}
                  onChange={(e) => setEnText(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Транскрипция IPA (опционально)
                </label>
                <input
                  type="text"
                  value={transIPA}
                  onChange={(e) => setTransIPA(e.target.value)}
                  placeholder="/fɜːst/"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Транскрипция русскими (опционально)
                </label>
                <input
                  type="text"
                  value={transRu}
                  onChange={(e) => setTransRu(e.target.value)}
                  placeholder="фёрст"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              Добавить
            </button>
          </form>
        )}

        {cards.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Пока нет карточек. Добавьте первую!
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <span className="text-gray-400 font-mono">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{card.ru_text}</div>
                  <div className="text-sm text-gray-600">
                    {card.en_text}
                    {card.transcription_ipa && (
                      <span className="ml-2 italic">
                        {card.transcription_ipa}
                      </span>
                    )}
                    {card.transcription_ru && (
                      <span className="ml-2 text-gray-500">
                        {card.transcription_ru}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link
          href={`/admin/decks/${deckId}/import`}
          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg inline-block"
        >
          Импортировать из CSV
        </Link>
      </div>
    </div>
  );
}
```

**Проверка:**
- [ ] Открыть набор → видеть список карточек (пусто)
- [ ] Клик "Добавить карточку"
- [ ] Заполнить: "первый", "first", "/fɜːst/", "фёрст"
- [ ] Нажать "Добавить"
- [ ] Карточка появилась в списке
- [ ] Добавить ещё 2-3 карточки
- [ ] Попробовать удалить одну

**Результат:** Можно добавлять и удалять карточки вручную.

---

### Milestone 2.3: CSV Import (3-4 часа)

**Задача:** Импорт карточек из CSV файла

**Действия:**

1. Создать `/src/lib/utils/csv-parser.ts`:
```typescript
export type CSVCard = {
  ru_text: string;
  en_text: string;
  transcription_ipa?: string;
  transcription_ru?: string;
  image_url?: string;
};

export function parseCSV(csvText: string): CSVCard[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const cards: CSVCard[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    const card: CSVCard = {
      ru_text: values[0] || '',
      en_text: values[1] || '',
      transcription_ipa: values[2] || undefined,
      transcription_ru: values[3] || undefined,
      image_url: values[4] || undefined
    };
    
    // Validate required fields
    if (card.ru_text && card.en_text) {
      cards.push(card);
    }
  }
  
  return cards;
}

export function validateCSV(cards: CSVCard[]): string[] {
  const errors: string[] = [];
  
  cards.forEach((card, index) => {
    if (!card.ru_text) {
      errors.push(`Строка ${index + 2}: отсутствует русский текст`);
    }
    if (!card.en_text) {
      errors.push(`Строка ${index + 2}: отсутствует английский текст`);
    }
  });
  
  return errors;
}
```

2. Создать `/src/app/admin/decks/[id]/import/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { parseCSV, validateCSV, type CSVCard } from '@/lib/utils/csv-parser';

export default function ImportCSVPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVCard[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    
    const text = await uploadedFile.text();
    const parsed = parseCSV(text);
    const validationErrors = validateCSV(parsed);
    
    setPreview(parsed);
    setErrors(validationErrors);
  }

  async function handleImport() {
    if (errors.length > 0) return;
    
    setLoading(true);
    
    try {
      // Get max position
      const { data: existingCards } = await supabase
        .from('cards')
        .select('position')
        .eq('deck_id', deckId)
        .order('position', { ascending: false })
        .limit(1);
      
      const startPosition = existingCards?.[0]?.position || 0;
      
      // Insert cards
      const cardsToInsert = preview.map((card, index) => ({
        deck_id: deckId,
        ...card,
        position: startPosition + index + 1
      }));
      
      const { error } = await supabase
        .from('cards')
        .insert(cardsToInsert);
      
      if (error) throw error;
      
      router.push(`/admin/decks/${deckId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Импорт карточек из CSV</h1>
      
      <div className="mb-8">
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Формат CSV:</h3>
          <pre className="text-sm text-gray-700">
            ru_text,en_text,transcription_ipa,transcription_ru,image_url
          </pre>
          <p className="text-sm text-gray-600 mt-2">
            Первые два поля обязательны, остальные опциональны.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block">
          <span className="text-sm font-medium mb-2 block">
            Выберите CSV файл
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Ошибки:</h3>
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">
            Превью ({preview.length} карточек)
          </h3>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Русский</th>
                  <th className="px-4 py-2 text-left">Английский</th>
                  <th className="px-4 py-2 text-left">IPA</th>
                  <th className="px-4 py-2 text-left">Транскр.</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((card, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{card.ru_text}</td>
                    <td className="px-4 py-2">{card.en_text}</td>
                    <td className="px-4 py-2 text-sm italic">
                      {card.transcription_ipa}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {card.transcription_ru}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border rounded-lg"
            >
              Отмена
            </button>
            <button
              onClick={handleImport}
              disabled={errors.length > 0 || loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Импортируем...' : `Импортировать ${preview.length} карточек`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

3. Создать тестовый CSV файл `test_cards.csv`:
```csv
ru_text,en_text,transcription_ipa,transcription_ru
первый,first,/fɜːst/,фёрст
второй,second,/ˈsekənd/,сэ́конд
третий,third,/θɜːd/,сёрд
```

**Проверка:**
- [ ] Зайти в набор → клик "Импортировать из CSV"
- [ ] Выбрать `test_cards.csv`
- [ ] Видеть превью с 3 карточками
- [ ] Нажать "Импортировать"
- [ ] Редирект на страницу набора
- [ ] Все 3 карточки добавились в список

**Результат:** CSV импорт работает.

---

**✅ CHECKPOINT PHASE 2:**
- [x] Можно создавать наборы
- [x] Можно добавлять карточки вручную
- [x] Можно импортировать карточки из CSV
- [x] Можно удалять карточки

**→ Можно переходить к Phase 3**

---

## PHASE 3: Flashcards Mode (Режим обучения)

**Цель:** Ребёнок может учить карточки, отмечать "Знаю/Не знаю", слышать произношение.

### Milestone 3.1: Study Session Hook (2-3 часа)

**Задача:** Создать хук для управления сессией

**Действия:**

1. Создать `/src/lib/hooks/useStudySession.ts`:
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

type Card = {
  id: string;
  ru_text: string;
  en_text: string;
  transcription_ipa?: string;
  transcription_ru?: string;
  position: number;
};

type Direction = 'ru_to_en' | 'en_to_ru';

export function useStudySession(deckId: string, userId: string, direction: Direction) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  useEffect(() => {
    loadCards();
  }, [deckId]);

  async function loadCards() {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('position');
    
    // Shuffle cards
    const shuffled = data ? [...data].sort(() => Math.random() - 0.5) : [];
    setCards(shuffled);
    setLoading(false);
  }

  async function startSession() {
    const { data: session } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        deck_id: deckId,
        mode: `flashcards_${direction}`,
        direction,
        total_cards: cards.length
      })
      .select()
      .single();
    
    setSessionId(session!.id);
  }

  async function answerCard(correct: boolean) {
    const card = cards[currentIndex];
    
    // 1. Save result
    await supabase
      .from('session_results')
      .insert({
        session_id: sessionId,
        card_id: card.id,
        correct
      });
    
    // 2. Update progress
    const { data: existingProgress } = await supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', card.id)
      .eq('direction', direction)
      .single();
    
    if (existingProgress) {
      await supabase
        .from('card_progress')
        .update({
          times_shown: existingProgress.times_shown + 1,
          times_correct: correct 
            ? existingProgress.times_correct + 1 
            : existingProgress.times_correct,
          times_incorrect: !correct 
            ? existingProgress.times_incorrect + 1 
            : existingProgress.times_incorrect,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id);
    } else {
      await supabase
        .from('card_progress')
        .insert({
          user_id: userId,
          card_id: card.id,
          direction,
          times_shown: 1,
          times_correct: correct ? 1 : 0,
          times_incorrect: !correct ? 1 : 0,
          last_reviewed_at: new Date().toISOString()
        });
    }
    
    // 3. Update local state
    if (correct) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
    
    // 4. Next card
    setCurrentIndex(prev => prev + 1);
  }

  async function completeSession() {
    if (!sessionId) return;
    
    await supabase
      .from('study_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  const currentCard = cards[currentIndex];
  const isComplete = currentIndex >= cards.length;
  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  return {
    cards,
    currentCard,
    currentIndex,
    totalCards: cards.length,
    progress,
    isComplete,
    correctCount,
    incorrectCount,
    loading,
    startSession,
    answerCard,
    completeSession
  };
}
```

**Проверка:**
- [ ] Код компилируется без ошибок
- [ ] Хук экспортируется корректно

**Результат:** Хук готов к использованию.

---

### Milestone 3.2: Flashcard Viewer Component (3-4 часа)

**Задача:** Компонент карточки с переворотом и TTS

**Действия:**

1. Создать `/src/lib/utils/tts.ts`:
```typescript
export function speak(text: string, lang: string = 'en-US') {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported');
    return;
  }
  
  speechSynthesis.cancel(); // Stop any ongoing speech
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.8; // Slower for kids
  utterance.pitch = 1.0;
  
  speechSynthesis.speak(utterance);
}
```

2. Создать `/src/components/flashcard/FlashcardViewer.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { speak } from '@/lib/utils/tts';
import { Volume2 } from 'lucide-react';

type Card = {
  ru_text: string;
  en_text: string;
  transcription_ipa?: string;
  transcription_ru?: string;
};

type Props = {
  card: Card;
  direction: 'ru_to_en' | 'en_to_ru';
  onAnswer: (correct: boolean) => void;
};

export function FlashcardViewer({ card, direction, onAnswer }: Props) {
  const [flipped, setFlipped] = useState(false);

  const frontText = direction === 'ru_to_en' ? card.ru_text : card.en_text;
  const backText = direction === 'ru_to_en' ? card.en_text : card.ru_text;

  function handleFlip() {
    setFlipped(true);
  }

  function handleAnswer(correct: boolean) {
    onAnswer(correct);
    setFlipped(false); // Reset for next card
  }

  function handleSpeak() {
    const textToSpeak = direction === 'ru_to_en' ? card.en_text : card.ru_text;
    const lang = direction === 'ru_to_en' ? 'en-US' : 'ru-RU';
    speak(textToSpeak, lang);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div 
        className="relative bg-white rounded-2xl shadow-xl p-12 min-h-[400px] flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105"
        onClick={!flipped ? handleFlip : undefined}
      >
        {!flipped ? (
          // Front side
          <div className="text-center">
            <p className="text-5xl font-bold mb-4">{frontText}</p>
            <p className="text-gray-500">Нажмите чтобы увидеть ответ</p>
          </div>
        ) : (
          // Back side
          <div className="text-center w-full">
            <p className="text-4xl font-bold mb-4">{backText}</p>
            {card.transcription_ipa && (
              <p className="text-2xl text-gray-600 italic mb-2">
                {card.transcription_ipa}
              </p>
            )}
            {card.transcription_ru && (
              <p className="text-xl text-gray-500 mb-6">
                {card.transcription_ru}
              </p>
            )}
            
            <button
              onClick={handleSpeak}
              className="mb-8 px-6 py-3 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <Volume2 className="inline mr-2" size={20} />
              Прослушать
            </button>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleAnswer(false)}
                className="px-8 py-4 bg-red-500 text-white rounded-xl text-lg font-semibold hover:bg-red-600"
              >
                ❌ Не знаю
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="px-8 py-4 bg-green-500 text-white rounded-xl text-lg font-semibold hover:bg-green-600"
              >
                ✅ Знаю
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Проверка:**
- [ ] Компонент компилируется
- [ ] Можно импортировать и использовать

**Результат:** Компонент карточки готов.

---

### Milestone 3.3: Study Page (3-4 часа)

**Задача:** Собрать всё вместе — страница обучения

**Действия:**

1. Создать `/src/app/student/study/[deckId]/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProfile } from '@/contexts/ProfileContext';
import { useStudySession } from '@/lib/hooks/useStudySession';
import { FlashcardViewer } from '@/components/flashcard/FlashcardViewer';

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const { currentProfile } = useProfile();
  const deckId = params.deckId as string;
  
  const [direction, setDirection] = useState<'ru_to_en' | 'en_to_ru'>('ru_to_en');
  const [directionSelected, setDirectionSelected] = useState(false);

  const {
    currentCard,
    currentIndex,
    totalCards,
    progress,
    isComplete,
    correctCount,
    incorrectCount,
    loading,
    startSession,
    answerCard,
    completeSession
  } = useStudySession(deckId, currentProfile!.id, direction);

  useEffect(() => {
    if (directionSelected && !loading) {
      startSession();
    }
  }, [directionSelected, loading]);

  async function handleAnswer(correct: boolean) {
    await answerCard(correct);
    
    // Check if complete
    if (currentIndex + 1 >= totalCards) {
      await completeSession();
    }
  }

  if (!directionSelected) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-16">
        <h1 className="text-3xl font-bold mb-8">Выберите направление</h1>
        <div className="grid grid-cols-2 gap-6">
          <button
            onClick={() => {
              setDirection('ru_to_en');
              setDirectionSelected(true);
            }}
            className="p-8 border-2 rounded-xl hover:border-blue-600 transition"
          >
            <p className="text-4xl mb-4">🇷🇺 → 🇬🇧</p>
            <p className="text-xl font-semibold">Русский → Английский</p>
          </button>
          <button
            onClick={() => {
              setDirection('en_to_ru');
              setDirectionSelected(true);
            }}
            className="p-8 border-2 rounded-xl hover:border-blue-600 transition"
          >
            <p className="text-4xl mb-4">🇬🇧 → 🇷🇺</p>
            <p className="text-xl font-semibold">Английский → Русский</p>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center mt-16">Загрузка...</div>;
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-16">
        <h1 className="text-4xl font-bold mb-4">Отлично! 🎉</h1>
        <div className="text-6xl mb-8">✨</div>
        <p className="text-2xl mb-8">
          Выучил: {correctCount} из {totalCards}
        </p>
        <p className="text-xl text-gray-600 mb-8">
          ({Math.round((correctCount / totalCards) * 100)}% успешность)
        </p>
        <div className="space-x-4">
          <button
            onClick={() => router.push('/student/decks')}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold"
          >
            Завершить
          </button>
          <button
            onClick={() => {
              setDirectionSelected(false);
              window.location.reload();
            }}
            className="px-8 py-4 border border-blue-600 text-blue-600 rounded-xl text-lg font-semibold"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Карточка {currentIndex + 1} из {totalCards}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <FlashcardViewer
          card={currentCard}
          direction={direction}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  );
}
```

2. Создать `/src/app/student/decks/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import Link from 'next/link';

type Deck = {
  id: string;
  title: string;
  description: string;
};

export default function StudentDecksPage() {
  const { currentProfile } = useProfile();
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    if (!currentProfile) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', currentProfile.id)
      .single();

    const { data } = await supabase
      .from('decks')
      .select('*')
      .eq('family_id', profile!.family_id);

    setDecks(data || []);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Мои наборы</h1>
      <div className="grid gap-4">
        {decks.map(deck => (
          <Link
            key={deck.id}
            href={`/student/study/${deck.id}`}
            className="p-6 border-2 rounded-xl hover:border-blue-600 transition"
          >
            <h3 className="text-2xl font-semibold mb-2">{deck.title}</h3>
            <p className="text-gray-600">{deck.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Проверка:**
- [ ] Зайти под студентом → /student/decks
- [ ] Видеть список наборов
- [ ] Клик на набор → /student/study/{deckId}
- [ ] Выбрать "Русский → Английский"
- [ ] Видеть карточку "первый"
- [ ] Клик → переворот → "first /fɜːst/ фёрст"
- [ ] Клик 🔊 → слышать "first"
- [ ] Клик "Знаю" → следующая карточка
- [ ] Пройти до конца → экран результатов
- [ ] В Supabase → study_sessions появилась сессия
- [ ] В Supabase → card_progress появились записи

**Результат:** Можно учить карточки!

---

**✅ CHECKPOINT PHASE 3:**
- [x] Можно выбрать направление (RU→EN / EN→RU)
- [x] Карточки переворачиваются
- [x] TTS озвучка работает
- [x] Можно отметить "Знаю/Не знаю"
- [x] Прогресс сохраняется в БД
- [x] Экран результатов показывается

**→ Можно переходить к Phase 4**

---

## PHASE 4: Progress & Stats (Статистика)

**Цель:** Видеть прогресс по наборам, режим повторения.

### Milestone 4.1: Progress Calculator (2 часа)

**Задача:** Утилиты для подсчёта прогресса

**Действия:**

1. Создать `/src/lib/utils/progress-calculator.ts`:
```typescript
import { supabase } from '@/lib/supabase/client';

export async function getDeckProgress(
  userId: string,
  deckId: string,
  direction: 'ru_to_en' | 'en_to_ru'
) {
  // Get total cards
  const { count: totalCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId);

  // Get progress
  const { data: progressRecords } = await supabase
    .from('card_progress')
    .select('card_id, status, times_shown, times_correct, times_incorrect')
    .eq('user_id', userId)
    .eq('direction', direction)
    .in('card_id', 
      supabase
        .from('cards')
        .select('id')
        .eq('deck_id', deckId)
    );

  const learningCount = progressRecords?.filter(p => p.status === 'learning').length || 0;
  const masteredCount = progressRecords?.filter(p => p.status === 'mastered').length || 0;
  const archivedCount = progressRecords?.filter(p => p.status === 'archived').length || 0;

  const progressPercent = totalCards ? Math.round((archivedCount / totalCards) * 100) : 0;

  return {
    totalCards: totalCards || 0,
    learning: learningCount,
    mastered: masteredCount,
    archived: archivedCount,
    progressPercent
  };
}

export async function getCardsForReview(
  userId: string,
  direction: 'ru_to_en' | 'en_to_ru'
) {
  const { data } = await supabase
    .from('card_progress')
    .select('card_id, cards(*)')
    .eq('user_id', userId)
    .eq('direction', direction)
    .eq('status', 'learning')
    .gt('times_incorrect', 0)
    .order('times_incorrect', { ascending: false });

  return data?.map(p => p.cards) || [];
}
```

**Проверка:**
- [ ] Код компилируется

**Результат:** Утилиты готовы.

---

### Milestone 4.2: Stats Dashboard (2-3 часа)

**Задача:** Дашборд со статистикой

**Действия:**

1. Обновить `/src/app/student/decks/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { getDeckProgress } from '@/lib/utils/progress-calculator';
import Link from 'next/link';

type DeckWithProgress = {
  id: string;
  title: string;
  description: string;
  progress: {
    totalCards: number;
    archived: number;
    progressPercent: number;
  };
};

export default function StudentDecksPage() {
  const { currentProfile } = useProfile();
  const [decks, setDecks] = useState<DeckWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecksWithProgress();
  }, []);

  async function loadDecksWithProgress() {
    if (!currentProfile) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', currentProfile.id)
      .single();

    const { data: decksData } = await supabase
      .from('decks')
      .select('*')
      .eq('family_id', profile!.family_id);

    if (!decksData) return;

    const decksWithProgress = await Promise.all(
      decksData.map(async (deck) => {
        const progress = await getDeckProgress(
          currentProfile.id,
          deck.id,
          'ru_to_en'
        );
        return {
          ...deck,
          progress
        };
      })
    );

    setDecks(decksWithProgress);
    setLoading(false);
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Привет, {currentProfile?.display_name}!
        </h1>
        <p className="text-gray-600">Продолжай изучать английский</p>
      </div>

      <div className="grid gap-4">
        {decks.map(deck => (
          <Link
            key={deck.id}
            href={`/student/study/${deck.id}`}
            className="p-6 border-2 rounded-xl hover:border-blue-600 transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-semibold mb-1">{deck.title}</h3>
                <p className="text-gray-600">{deck.description}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {deck.progress.progressPercent}%
                </p>
                <p className="text-sm text-gray-500">
                  {deck.progress.archived}/{deck.progress.totalCards}
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600"
                style={{ width: `${deck.progress.progressPercent}%` }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Review button */}
      <div className="mt-8">
        <Link
          href="/student/review"
          className="block p-6 bg-orange-50 border-2 border-orange-300 rounded-xl text-center hover:bg-orange-100 transition"
        >
          <p className="text-xl font-semibold text-orange-700">
            🔁 Повторить незнакомые слова
          </p>
        </Link>
      </div>
    </div>
  );
}
```

**Проверка:**
- [ ] Зайти под студентом
- [ ] Видеть наборы с прогресс-барами
- [ ] Видеть процент выполнения
- [ ] Видеть кнопку "Повторить"

**Результат:** Дашборд с прогрессом работает.

---

### Milestone 4.3: Review Mode (2-3 часа)

**Задача:** Режим повторения незнакомых карточек

**Действия:**

1. Создать `/src/app/student/review/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { getCardsForReview } from '@/lib/utils/progress-calculator';
import { FlashcardViewer } from '@/components/flashcard/FlashcardViewer';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ReviewPage() {
  const router = useRouter();
  const { currentProfile } = useProfile();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction] = useState<'ru_to_en' | 'en_to_ru'>('ru_to_en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewCards();
  }, []);

  async function loadReviewCards() {
    if (!currentProfile) return;
    
    const reviewCards = await getCardsForReview(currentProfile.id, direction);
    setCards(reviewCards);
    setLoading(false);
  }

  async function handleAnswer(correct: boolean) {
    const card = cards[currentIndex];
    
    // Update progress
    const { data: existingProgress } = await supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', currentProfile!.id)
      .eq('card_id', card.id)
      .eq('direction', direction)
      .single();
    
    if (existingProgress) {
      await supabase
        .from('card_progress')
        .update({
          times_shown: existingProgress.times_shown + 1,
          times_correct: correct 
            ? existingProgress.times_correct + 1 
            : existingProgress.times_correct,
          times_incorrect: !correct 
            ? existingProgress.times_incorrect + 1 
            : existingProgress.times_incorrect,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id);
    }
    
    setCurrentIndex(prev => prev + 1);
  }

  if (loading) return <div>Загрузка...</div>;

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-16">
        <h1 className="text-3xl font-bold mb-4">Всё выучено! 🎉</h1>
        <p className="text-gray-600 mb-8">
          У тебя нет незнакомых карточек для повторения
        </p>
        <button
          onClick={() => router.push('/student/decks')}
          className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg"
        >
          Вернуться к наборам
        </button>
      </div>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-16">
        <h1 className="text-3xl font-bold mb-4">Повторение завершено! ✨</h1>
        <p className="text-gray-600 mb-8">
          Ты повторил {cards.length} карточек
        </p>
        <button
          onClick={() => router.push('/student/decks')}
          className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg"
        >
          Завершить
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Повторение</h1>
        <p className="text-gray-600">
          Карточка {currentIndex + 1} из {cards.length}
        </p>
      </div>

      {cards[currentIndex] && (
        <FlashcardViewer
          card={cards[currentIndex]}
          direction={direction}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  );
}
```

**Проверка:**
- [ ] Зайти под студентом
- [ ] Пройти несколько карточек, часть отметить "Не знаю"
- [ ] Клик "Повторить незнакомые слова"
- [ ] Видеть только те карточки, что отметил "Не знаю"
- [ ] Пройти повторение
- [ ] Экран завершения

**Результат:** Режим повторения работает.

---

**✅ CHECKPOINT PHASE 4:**
- [x] Прогресс по наборам отображается
- [x] Можно видеть процент выполнения
- [x] Режим повторения работает
- [x] Показываются только незнакомые карточки

**→ MVP ЗАВЕРШЁН! 🎉**

---

## MVP COMPLETE — FINAL ACCEPTANCE TEST

Перед переходом к Post-MVP фичам, протестировать весь флоу:

### Full Flow Test

1. **Регистрация:**
   - [ ] Зарегистрироваться как родитель
   - [ ] Создать семью
   - [ ] Добавить 2 профиля детей

2. **Создание контента:**
   - [ ] Создать набор "Test Deck"
   - [ ] Импортировать 5 карточек из CSV
   - [ ] Добавить 1 карточку вручную

3. **Обучение:**
   - [ ] Зайти под студентом
   - [ ] Выбрать "Test Deck"
   - [ ] Пройти все 6 карточек
   - [ ] Отметить 4 "Знаю", 2 "Не знаю"
   - [ ] Услышать TTS произношение
   - [ ] Увидеть результаты

4. **Повторение:**
   - [ ] Вернуться на главную
   - [ ] Видеть прогресс: 67% (4/6)
   - [ ] Клик "Повторить"
   - [ ] Видеть только 2 незнакомые карточки
   - [ ] Пройти их

5. **Проверка БД:**
   - [ ] В `study_sessions` есть сессии
   - [ ] В `card_progress` есть записи прогресса
   - [ ] В `session_results` есть результаты

**Если все пункты ✅ — MVP готов к использованию!**

---

## POST-MVP PHASES (Optional)

### Phase 5: Testing Modes
- [ ] Milestone 5.1: Multiple Choice Test
- [ ] Milestone 5.2: Written Test
- [ ] Milestone 5.3: Match Game

### Phase 6: Polish & Deployment
- [ ] Milestone 6.1: Mobile optimization
- [ ] Milestone 6.2: PWA setup
- [ ] Milestone 6.3: Production deployment
- [ ] Milestone 6.4: User testing

---

## CRITICAL RULES FOR DEVELOPMENT

1. **NEVER skip checkpoints** — каждая фаза должна работать перед переходом к следующей
2. **ALWAYS test in browser** — не полагаться только на компиляцию
3. **CHECK database** — после каждой операции проверять что данные сохранились
4. **ONE feature at a time** — не пытаться сделать всё сразу
5. **COMMIT frequently** — после каждого working milestone делать git commit

**Помни про "пуговицы на рукаве" — лучше меньше, но работающее!**
