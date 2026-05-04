# KotoCard — План исправления производительности и стабильности

**Дата:** 2026-05-04  
**Проблема:** Нестабильная загрузка страниц, 504/ERR_INCOMPLETE_CHUNKED_ENCODING, зависания 20-30 секунд  
**VPS:** 45.89.228.209 (остаётся без изменений)

---

## Корневая причина

```
Браузер (РФ)
    ↓ все запросы к Supabase идут через браузер
VPS nginx
    ↓ проксирует на Next.js
Next.js /api/supabase/* (прокси)
    ↓ нестабильное TCP-соединение VPS→Supabase
fxcmgapwbqebzcmfkkdy.supabase.co (EU)
```

**Проблема не в коде — проблема в топологии.** Браузер делает 4-7 последовательных запросов через ненадёжный канал VPS→Supabase. Каждый запрос — отдельное TCP-соединение с шансом зависнуть или оборваться.

**Фундаментальное решение:** перенести fetch из браузера на сервер. Сервер делает один «умный» запрос к Supabase, возвращает браузеру готовые данные. Количество TCP-соединений VPS→Supabase сокращается в 4-7 раз.

---

## Архитектурный план (3 фазы)

### Фаза 1 — Агрегирующие API-маршруты (быстрый выигрыш, ~1-2 дня)

**Суть:** Вместо того чтобы браузер делал 4-7 запросов к `/api/supabase/*`, браузер делает **один** запрос к новому typed API-роуту, который сам на сервере выполняет все нужные Supabase-запросы параллельно и возвращает агрегированный JSON.

#### Новые API-маршруты

```
GET /api/data/deck/[id]
    → { deck, cards, srsStats, ttsStats }
    Серверная сторона: 3 параллельных запроса к Supabase

GET /api/data/deck/[id]/study
    → { userCards: UserCardWithCard[] }
    Серверная сторона: cards + user_cards в параллели, insert если нужно

GET /api/data/dashboard
    → { ownDecks, groupSections, reviewCount, streak, todayActivity, last7days }
    Серверная сторона: 2 параллельных + 1 батч-запрос

GET /api/data/deck/[id]/test
    → { testCards, allDeckCards }
    Серверная сторона: 2 параллельных запроса
```

**Использование на клиенте** — вместо прямых supabase-запросов:

```ts
// Было (5 запросов через /api/supabase/* прокси):
const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single();
const { data: cards } = await supabase.from('cards').select(...).eq('deck_id', deckId);
await ensureUserCardsExist(supabase, user.id, deckId, cardIds);
const stats = await getDeckSrsStats(supabase, user.id, deckId);
const tts = await fetch(`/api/decks/${deckId}/generate-tts`);

// Стало (1 запрос):
const data = await fetch(`/api/data/deck/${deckId}`).then(r => r.json());
const { deck, cards, srsStats, ttsStats } = data;
```

#### Структура файлов

```
src/app/api/data/
├── deck/
│   └── [id]/
│       ├── route.ts          ← GET /api/data/deck/[id]
│       ├── study/
│       │   └── route.ts      ← GET /api/data/deck/[id]/study
│       └── test/
│           └── route.ts      ← GET /api/data/deck/[id]/test
└── dashboard/
    └── route.ts              ← GET /api/data/dashboard
```

#### Детали реализации каждого маршрута

**`GET /api/data/deck/[id]/route.ts`**

```ts
import { createServerClient } from '@/lib/supabase/server-anon';
import { getDeckSrsStats } from '@/lib/srs/queries';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: deckId } = await params;
  const supabase = createServerClient(req);  // читает cookie, получает user

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [deckResult, cardsResult, ttsResult] = await Promise.all([
    supabase.from('decks').select('*').eq('id', deckId).single(),
    supabase.from('cards')
      .select('id, ru_text, en_text, audio_url, tts_en_url, tts_ru_url, image_url, position')
      .eq('deck_id', deckId)
      .order('position', { ascending: true }),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/decks/${deckId}/generate-tts`, {
      headers: { cookie: req.headers.get('cookie') ?? '' }
    }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  if (deckResult.error) return NextResponse.json({ error: deckResult.error.message }, { status: 404 });

  const cardIds = (cardsResult.data ?? []).map(c => c.id);
  const srsStats = await getDeckSrsStats(supabase, user.id, deckId);

  return NextResponse.json({
    deck: deckResult.data,
    cards: cardsResult.data ?? [],
    cardIds,
    srsStats,
    ttsStats: ttsResult,
  }, {
    headers: { 'Cache-Control': 'private, no-store' }
  });
}
```

**`GET /api/data/deck/[id]/study/route.ts`**

```ts
// Параллельно: cards.select('id') + user_cards.select('*, cards(*)')
// Если missing ids → insert → re-fetch
// Возвращает: { userCards: UserCardWithCard[] }
```

**`GET /api/data/dashboard/route.ts`**

```ts
// Параллельно: ownDecks + myGroups
// После: если есть группы → groupDecks
// После: getDecksSrsStats + getReviewCount + getStreakData + getTodayActivity + getLast7Days (все параллельно)
// Возвращает: { ownDecks, groupSections, reviewCount, streak, todayActivity, last7days }
```

#### Изменения на клиентах

Страницы заменяют прямые supabase-вызовы на `fetch('/api/data/...')`. Логика `ensureUserCardsExist`, `getDeckSrsStats`, и т.д. переезжает внутрь серверных маршрутов.

---

### Фаза 2 — SWR для кэширования и retry (1-2 дня, после Фазы 1)

**Суть:** Подключить `swr` для всех data-fetching вызовов. Даёт:
- **stale-while-revalidate** — мгновенный рендер из кэша, обновление в фоне
- **Автоматический retry** при сетевой ошибке (3 попытки с backoff)
- **Дедупликация** запросов (несколько компонентов не делают одинаковый fetch)
- **Оптимистичные обновления** для действий (знаю/не знаю)

#### Установка

```bash
npm install swr
```

#### Паттерн использования

```ts
// src/hooks/useDeckData.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

export function useDeckData(deckId: string) {
  return useSWR(`/api/data/deck/${deckId}`, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
    dedupingInterval: 10_000,
  });
}

export function useDashboard() {
  return useSWR('/api/data/dashboard', fetcher, {
    revalidateOnFocus: true,
    errorRetryCount: 3,
    dedupingInterval: 30_000,
  });
}
```

#### Применение в компонентах

```tsx
// src/app/decks/[id]/page.tsx
export default function DeckDetailPage() {
  const params = useParams();
  const { data, error, isLoading } = useDeckData(params.id as string);

  if (isLoading) return <DeckSkeleton />;
  if (error) return <ErrorRetry onRetry={() => mutate()} />;

  const { deck, cards, srsStats, ttsStats } = data;
  // ...
}
```

#### Оптимистичные обновления для study/test

При нажатии «Знаю» / «Не знаю» — немедленно обновить локальный state, отправить запрос в фоне. Если запрос падает — откатить обновление.

```ts
// Оптимистичный update user_card
await updateUserCard(supabase, card.user_card_id, updates);   // в фоне
mutate('/api/data/deck/' + deckId);                           // ревалидировать кэш
```

---

### Фаза 3 — Server Components для initial render (2-3 дня, после Фаза 1+2)

**Суть:** Перевести страницы-оболочки в RSC (React Server Components). Данные рендерятся на сервере — браузер получает готовый HTML без ожидания JS + fetch.

**Это большой рефактор** — сейчас все страницы `'use client'` и завязаны на `useAuth()`, `useEffect`, `useState`. RSC несовместим с этими хуками.

#### Стратегия: Hybrid RSC + Client Islands

```
page.tsx (RSC — fetches data server-side)
  └── DeckHeader.tsx (RSC — static info)
  └── DeckCards.tsx (RSC — cards list)
  └── SrsProgressIsland.tsx ('use client' — интерактивные кнопки)
  └── StudyButtonIsland.tsx ('use client' — переход в режим изучения)
```

#### Порядок перевода страниц (от простого к сложному)

1. `/decks/[id]` — показывает данные + ссылки, минимум интерактивности → **хороший кандидат**
2. `/dashboard` — сложнее из-за streak/analytics виджетов → **средняя сложность**  
3. `/decks/[id]/study` — полностью интерактивная, карточки с анимацией → **остаётся client, только loadCards через /api/data/**
4. `/decks/[id]/test`, `/dictation` — аналогично, client-heavy → **остаётся client**

#### Структура RSC-страницы

```tsx
// src/app/decks/[id]/page.tsx (RSC)
import { createServerClientFromCookies } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function DeckDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClientFromCookies(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Всё это выполняется на сервере — нет запросов из браузера
  const [deckResult, cardsResult, srsStats] = await Promise.all([
    supabase.from('decks').select('*').eq('id', params.id).single(),
    supabase.from('cards').select(...).eq('deck_id', params.id),
    getDeckSrsStats(supabase, user.id, params.id),
  ]);

  return (
    <DeckDetailView
      deck={deckResult.data}
      cards={cardsResult.data}
      srsStats={srsStats}
      userId={user.id}
    />
  );
}
```

---

## Порядок внедрения (recommended)

```
Неделя 1:
  ├── Фаза 1: /api/data/deck/[id]       ← сначала самая болезненная страница
  ├── Фаза 1: /api/data/deck/[id]/study ← study тоже падает
  └── Тесты Фазы 1

Неделя 2:
  ├── Фаза 1: /api/data/dashboard
  ├── Фаза 1: /api/data/deck/[id]/test
  ├── Фаза 2: SWR для всех новых эндпоинтов
  └── Тесты Фазы 2

Неделя 3 (если нужна):
  └── Фаза 3: RSC для /decks/[id] и /dashboard
```

---

## Тесты

Все тесты находятся в `src/__tests__/`. Запуск: `npm test`.

### Установка тестовой среды

```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom \
  @testing-library/react @testing-library/jest-dom \
  msw@2                     # Mock Service Worker для мок API
```

**`jest.config.ts`:**

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
export default config;
```

**`src/__tests__/setup.ts`:**

```ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### Тесты Фазы 1 — API-маршруты

#### `src/__tests__/api/data-deck.test.ts`

```ts
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/data/deck/[id]/route';

describe('GET /api/data/deck/[id]', () => {

  it('возвращает 401 если пользователь не авторизован', async () => {
    await testApiHandler({
      appHandler: handler,
      params: { id: 'some-deck-id' },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('возвращает deck + cards + srsStats за один запрос', async () => {
    // Мокаем supabase через MSW
    await testApiHandler({
      appHandler: handler,
      params: { id: TEST_DECK_ID },
      requestPatcher(req) {
        req.headers.set('cookie', VALID_SESSION_COOKIE);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('deck');
        expect(body).toHaveProperty('cards');
        expect(body).toHaveProperty('srsStats');
        expect(body.deck.id).toBe(TEST_DECK_ID);
        expect(Array.isArray(body.cards)).toBe(true);
      },
    });
  });

  it('возвращает 404 для несуществующего deck', async () => {
    await testApiHandler({
      appHandler: handler,
      params: { id: 'nonexistent-deck-id' },
      requestPatcher(req) {
        req.headers.set('cookie', VALID_SESSION_COOKIE);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(404);
      },
    });
  });

  it('отвечает быстрее 3 секунд (integration)', async () => {
    // Этот тест гоняется против staging или prod Supabase
    const start = Date.now();
    const res = await fetch(`/api/data/deck/${TEST_DECK_ID}`, {
      headers: { cookie: VALID_SESSION_COOKIE }
    });
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  }, 10_000);

});
```

#### `src/__tests__/api/data-dashboard.test.ts`

```ts
describe('GET /api/data/dashboard', () => {

  it('возвращает все нужные поля', async () => {
    const res = await fetch('/api/data/dashboard', {
      headers: { cookie: VALID_SESSION_COOKIE }
    });
    const body = await res.json();
    expect(body).toHaveProperty('ownDecks');
    expect(body).toHaveProperty('groupSections');
    expect(body).toHaveProperty('reviewCount');
    expect(body).toHaveProperty('streak');
    expect(body).toHaveProperty('todayActivity');
    expect(body).toHaveProperty('last7days');
    expect(Array.isArray(body.ownDecks)).toBe(true);
  });

  it('ownDecks принадлежат текущему пользователю', async () => {
    const res = await fetch('/api/data/dashboard', {
      headers: { cookie: VALID_SESSION_COOKIE }
    });
    const { ownDecks } = await res.json();
    for (const deck of ownDecks) {
      expect(deck.owner_id).toBe(CURRENT_USER_ID);
    }
  });

  it('отвечает быстрее 4 секунд (integration)', async () => {
    const start = Date.now();
    await fetch('/api/data/dashboard', { headers: { cookie: VALID_SESSION_COOKIE } });
    expect(Date.now() - start).toBeLessThan(4000);
  }, 10_000);

});
```

#### `src/__tests__/api/data-deck-study.test.ts`

```ts
describe('GET /api/data/deck/[id]/study', () => {

  it('возвращает userCards с вложенными cards', async () => {
    const res = await fetch(`/api/data/deck/${TEST_DECK_ID}/study`, {
      headers: { cookie: VALID_SESSION_COOKIE }
    });
    const { userCards } = await res.json();
    expect(Array.isArray(userCards)).toBe(true);
    if (userCards.length > 0) {
      expect(userCards[0]).toHaveProperty('cards');
      expect(userCards[0]).toHaveProperty('user_card_id');
      expect(userCards[0]).toHaveProperty('status');
    }
  });

  it('создаёт user_cards при первом визите (idempotent)', async () => {
    // Первый вызов — создаёт user_cards
    const res1 = await fetch(`/api/data/deck/${TEST_DECK_ID}/study`, {
      headers: { cookie: NEW_USER_COOKIE }
    });
    expect(res1.status).toBe(200);
    const { userCards: first } = await res1.json();

    // Второй вызов — idempotent, возвращает те же данные
    const res2 = await fetch(`/api/data/deck/${TEST_DECK_ID}/study`, {
      headers: { cookie: NEW_USER_COOKIE }
    });
    const { userCards: second } = await res2.json();
    expect(second.length).toBe(first.length);
  });

});
```

---

### Тесты Фазы 2 — SWR хуки

#### `src/__tests__/hooks/useDeckData.test.tsx`

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useDeckData } from '@/hooks/useDeckData';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('useDeckData', () => {

  it('возвращает данные при успешном запросе', async () => {
    server.use(
      http.get('/api/data/deck/:id', () =>
        HttpResponse.json({ deck: { id: '123', name: 'Test' }, cards: [], srsStats: {} })
      )
    );
    const { result } = renderHook(() => useDeckData('123'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.deck.name).toBe('Test');
  });

  it('делает retry при сетевой ошибке', async () => {
    let callCount = 0;
    server.use(
      http.get('/api/data/deck/:id', () => {
        callCount++;
        if (callCount < 3) return HttpResponse.error();
        return HttpResponse.json({ deck: { id: '123', name: 'Test' }, cards: [], srsStats: {} });
      })
    );
    const { result } = renderHook(() => useDeckData('123'));
    await waitFor(() => expect(result.current.data).toBeDefined(), { timeout: 15_000 });
    expect(callCount).toBeGreaterThanOrEqual(3);
  });

  it('показывает error если все retry исчерпаны', async () => {
    server.use(
      http.get('/api/data/deck/:id', () => HttpResponse.error())
    );
    const { result } = renderHook(() => useDeckData('123'));
    await waitFor(() => expect(result.current.error).toBeDefined(), { timeout: 20_000 });
  });

});
```

---

### Тесты SRS-логики (unit, не зависят от сети)

#### `src/__tests__/srs/engine.test.ts`

```ts
import { handleMarkKnow, handleMarkDontKnow } from '@/lib/srs/engine';

describe('SRS engine', () => {

  const baseCard = {
    user_card_id: 'uc1',
    card_id: 'c1',
    deck_id: 'd1',
    user_id: 'u1',
    status: 'new' as const,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    marked_know_at: null,
    test_choice_passed: false,
    test_audio_passed: false,
    test_dictation_passed: false,
    next_review_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cards: { id: 'c1', deck_id: 'd1', ru_text: 'кот', en_text: 'cat',
             ru_transcription: null, audio_url: null },
  };

  it('handleMarkKnow: new → learning, marked_know_at устанавливается', () => {
    const updates = handleMarkKnow(baseCard);
    expect(updates.status).toBe('learning');
    expect(updates.marked_know_at).toBeTruthy();
  });

  it('handleMarkDontKnow: new → new, ease_factor уменьшается', () => {
    const updates = handleMarkDontKnow(baseCard);
    expect(updates.status).toBe('new');
    expect(updates.ease_factor).toBeLessThan(2.5);
  });

  it('handleMarkKnow: young → mature после достаточных повторений', () => {
    const youngCard = { ...baseCard, status: 'young' as const, repetitions: 5, interval_days: 21 };
    const updates = handleMarkKnow(youngCard);
    expect(updates.status).toBe('mature');
  });

  it('handleMarkDontKnow: mature → relearning', () => {
    const matureCard = { ...baseCard, status: 'mature' as const, repetitions: 10, interval_days: 60 };
    const updates = handleMarkDontKnow(matureCard);
    expect(updates.status).toBe('relearning');
  });

});
```

#### `src/__tests__/srs/queries.test.ts`

```ts
import { getDeckSrsStats } from '@/lib/srs/queries';

// Мокаем supabase-клиент
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
};

describe('getDeckSrsStats', () => {

  it('считает new + untracked правильно', async () => {
    // 10 карточек в деке, 4 user_cards (2 new, 2 learning)
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({ eq: () => Promise.resolve({ count: 10, error: null }) })
    }));
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [
        { status: 'new', marked_know_at: null, test_choice_passed: false, test_audio_passed: false, test_dictation_passed: false, next_review_at: null },
        { status: 'new', marked_know_at: null, test_choice_passed: false, test_audio_passed: false, test_dictation_passed: false, next_review_at: null },
        { status: 'learning', marked_know_at: '2026-01-01', test_choice_passed: false, test_audio_passed: false, test_dictation_passed: false, next_review_at: null },
        { status: 'learning', marked_know_at: '2026-01-01', test_choice_passed: true, test_audio_passed: false, test_dictation_passed: false, next_review_at: null },
      ], error: null }) })
    }));

    const stats = await getDeckSrsStats(mockSupabase as any, 'user1', 'deck1');
    expect(stats.total).toBe(10);
    expect(stats.newCount).toBe(8);  // 2 tracked new + 6 untracked
    expect(stats.learningCount).toBe(2);
  });

});
```

---

### Тесты прокси (unit)

#### `src/__tests__/proxy/route.test.ts`

```ts
import { GET } from '@/app/api/supabase/[[...path]]/route';

describe('Supabase proxy', () => {

  it('блокирует пути не из whitelist', async () => {
    const req = new Request('http://localhost/api/supabase/evil/inject');
    const ctx = { params: Promise.resolve({ path: ['evil', 'inject'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });

  it('пропускает /rest путь', async () => {
    // Нужен mock fetch (MSW или jest.spyOn)
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    const req = new Request('http://localhost/api/supabase/rest/v1/cards?deck_id=eq.123', {
      headers: { apikey: 'test-key' }
    });
    const ctx = { params: Promise.resolve({ path: ['rest', 'v1', 'cards'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
  });

  it('таймаут 25s прерывает зависший fetch', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 30_000))  // зависает
    );
    const req = new Request('http://localhost/api/supabase/rest/v1/cards');
    const ctx = { params: Promise.resolve({ path: ['rest', 'v1', 'cards'] }) };

    const promise = GET(req, ctx);
    jest.advanceTimersByTime(26_000);
    const res = await promise;
    // Должен вернуть ошибку, а не висеть вечно
    expect(res.status).toBeGreaterThanOrEqual(400);
    jest.useRealTimers();
  });

  it('буферизует ответ для /rest (не stream)', async () => {
    let bodyConsumed = false;
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('[{"id":"1"}]'));
          controller.close();
          bodyConsumed = true;
        }
      }),
      arrayBuffer: async () => {
        bodyConsumed = true;
        return new TextEncoder().encode('[{"id":"1"}]').buffer;
      }
    });
    const req = new Request('http://localhost/api/supabase/rest/v1/cards');
    const ctx = { params: Promise.resolve({ path: ['rest', 'v1', 'cards'] }) };
    const res = await GET(req, ctx);
    // arrayBuffer() должен быть вызван (буферизация), не stream
    expect(bodyConsumed).toBe(true);
    const text = await res.text();
    expect(text).toContain('"id":"1"');
  });

});
```

---

### Интеграционные тесты (e2e — опционально, Playwright)

#### `src/__tests__/e2e/deck-load.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('Страница набора', () => {

  test.beforeEach(async ({ page }) => {
    // Логинимся
    await page.goto('/login');
    await page.fill('[name=email]', process.env.TEST_EMAIL!);
    await page.fill('[name=password]', process.env.TEST_PASSWORD!);
    await page.click('[type=submit]');
    await page.waitForURL('/dashboard');
  });

  test('открывается за менее 5 секунд', async ({ page }) => {
    const start = Date.now();
    await page.goto(`/decks/${process.env.TEST_DECK_ID}`);
    await page.waitForSelector('[data-testid="deck-title"]');
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test('study режим загружается без ошибок в консоли', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`/decks/${process.env.TEST_DECK_ID}/study`);
    await page.waitForSelector('[data-testid="study-card"]', { timeout: 10_000 });
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('нет ERR_INCOMPLETE_CHUNKED_ENCODING при загрузке', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', req => {
      if (req.failure()?.errorText.includes('ERR_INCOMPLETE_CHUNKED_ENCODING')) {
        failedRequests.push(req.url());
      }
    });

    await page.goto(`/decks/${process.env.TEST_DECK_ID}`);
    await page.waitForTimeout(5000);
    expect(failedRequests).toHaveLength(0);
  });

  test('dashboard отображает мои наборы', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="my-decks"]', { timeout: 10_000 });
    const decks = await page.locator('[data-testid="deck-card"]').count();
    expect(decks).toBeGreaterThan(0);
  });

});
```

---

### Скрипт запуска тестов

**`package.json`** (добавить):

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

**Запускать перед каждым деплоем:**

```bash
npm test                    # unit + API тесты (быстро, без сети)
npm run test:integration    # integration тесты (нужен интернет, ~30-60s)
# npm run test:e2e          # e2e Playwright (если настроен)
```

---

## Итог: что даст каждая фаза

| Фаза | Что делает | Ожидаемый результат |
|------|-----------|---------------------|
| Фаза 1 | Агрегирующие API-роуты | 4-7 запросов → 1, время загрузки /2-3x |
| Фаза 2 | SWR + retry | Мгновенный рендер из кэша, retry при ошибке — нет зависаний |
| Фаза 3 | RSC | Загрузка страниц без JS fetch вообще (initial render) |
| Тесты | Регрессия | Защита от поломки при изменениях |

**Минимально необходимо для стабильности:** Фаза 1 + Фаза 2.  
Фаза 3 — desirable, но существенно больший рефактор.
