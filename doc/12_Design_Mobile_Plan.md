# KotoCard — План дизайн-системы и мобильной версии

**Дата:** 2026-05-04  
**Цель:** Единый консистентный дизайн + полноценная мобильная версия на всех страницах

---

## ⛔ Железное правило: только дизайн-система

> **Нельзя** создавать новые визуальные элементы вне `src/components/ui/` и `src/components/layout/`.  
> **Нельзя** писать кастомные Tailwind-классы для кнопок, инпутов, карточек прямо в страницах.  
> **Нельзя** использовать сторонние UI-библиотеки (shadcn/ui, MUI, Ant Design и т.д.) в новом коде.  
> **Любой** новый визуальный элемент сначала добавляется в дизайн-систему (`ui/`), потом используется.

### Что это означает на практике

| Ситуация | Запрещено | Правильно |
|----------|-----------|-----------|
| Нужна кнопка | `<button className="bg-[#057A55] text-white rounded-xl px-4 py-2.5 ...">` | `<Button variant="primary">` |
| Нужен инпут | `<input className="border rounded-xl px-3.5 py-2.5 ...">` | `<Input label="..." />` |
| Нужна карточка | `<div className="bg-white rounded-2xl shadow-sm border border-gray-100">` | `<Card>` |
| Нужен пустой экран | Своя вёрстка с emoji + текст | `<EmptyState title="..." cta={...} />` |
| Нужен badge статуса | `<span className="bg-amber-100 text-amber-700 ...">Изучение</span>` | `<SrsStatusBadge status="learning" />` |
| Нужна кнопка «Назад» + заголовок | Своя вёрстка | `<PageHeader back="/decks" title="Название" />` |

### Единственное исключение

Layout-специфичные утилитарные классы (отступы, ширины, flex/grid) внутри страниц — допустимы. Стилизация **компонентов** — нет.

```tsx
// ✅ Допустимо — layout страницы
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card>...</Card>
  <Card>...</Card>
</div>

// ❌ Запрещено — стилизация элемента вне ui/
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
  ...
</div>
```

### Линтер-правило (ESLint)

Добавить в `.eslintrc` кастомное правило через `eslint-plugin-no-restricted-syntax`:

```js
// Запрещает писать bg-[#057A55] вне папки src/components/ui/
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "JSXAttribute[name.name='className'][value.value=/bg-\\[#057A55\\]/]",
        "message": "Используй компонент из ui/ вместо прямого цвета бренда в className"
      },
      {
        "selector": "JSXAttribute[name.name='style'][value.expression.properties]",
        "message": "Inline styles запрещены вне ui/ компонентов. Используй Tailwind или ui/ компонент."
      }
    ]
  }
}
```

---

---

## Текущее состояние (аудит)

### Что работает хорошо
- `ProtectedAppShell` — sidebar + mobile header + drawer — готов, используется в `/decks`, `/groups`, `/review`, `/grammar`, `/achievements`
- Цвета и border-radius в целом консистентны: `#057A55`, `rounded-2xl`, `#F7F5F0`
- Мобильный drawer с анимацией — полноценный, хорошо сделан

### Критические проблемы

#### 1. Дублирование AppShell в Dashboard
Dashboard — единственная страница, которая **не использует** `ProtectedAppShell`, а содержит свои собственные копии `Sidebar`, `MobileHeader`, `MobileDrawer` прямо внутри `page.tsx`. Логика `reviewCount` и `signOut` дублирована.

#### 2. Шрифт Sora не глобальный
- Root `layout.tsx` — Geist Sans (не Sora)
- `ProtectedAppShell` — инжектирует Sora через `<style>` тег
- `dashboard/page.tsx` — инжектирует свою копию Sora через `<style>` тег
- Immersive страницы (study, test, dictation) — внутри AppShell, но страница сама добавляет свой background и padding поверх shell padding (двойной отступ)
- Auth страницы — Geist, нет Sora вообще

#### 3. Immersive страницы внутри Shell конфликтуют
`/decks/[id]/study`, `/test`, `/dictation`, `/review` — полноэкранные режимы. Они рендерятся внутри `ProtectedAppShell` (из `decks/layout.tsx`), который добавляет `px-4 py-5 md:px-8 md:py-7`. Страница добавляет свой `py-8 px-4` сверху. На мобильных виден mobile header shell'а + содержимое страницы — избыточно для игрового режима.

#### 4. Auth страницы вне системы
- Login/register: синий градиент фон вместо `#F7F5F0`, нет Sora, старый дизайн
- После логина резкий переход в совершенно другой визуальный стиль

#### 5. Компоненты в разных страницах — разные
- `decks/[id]/page.tsx` использует shadcn/ui `<Card>`, `<Badge>`, `<Button>`
- Большинство других страниц — raw Tailwind
- Кнопки: разные размеры, разные rounded (xl vs 2xl vs lg)
- Формы: нет единого стиля input/label/error

#### 6. Отсутствуют mobile-first адаптации внутри страниц
- Страница набора (`/decks/[id]`): сетка карточек не адаптирована — на мобилке всё в одну колонку но c избыточными отступами
- Форма создания набора (`/decks/new`): `max-w-lg` фиксирован, на мобилке хорошо, но label/input мелкие
- Страница групп (`/groups/[id]`): таблица статистики участников ломается на мобилке
- Список наборов (`/decks`): grid-cols-2 на mobile — карточки слишком узкие

---

## Дизайн-система (токены)

### Цвета

```css
/* Фон */
--bg-base: #F7F5F0;          /* страницы */
--bg-card: #FFFFFF;           /* карточки */
--bg-sidebar: #FFFFFF;        /* сайдбар */

/* Бренд */
--green-500: #057A55;         /* primary */
--green-600: #065f46;         /* hover */
--green-50:  #057A5510;       /* tinted bg */

/* Нейтральные */
--gray-50:  #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-700: #374151;
--gray-900: #111827;

/* Статусы SRS */
--amber-500: #F59E0B;         /* Изучение */
--indigo-500: #6366F1;        /* Тестирование */
--teal-500:  #14B8A6;         /* Повторение */
--green-500: #057A55;         /* Выучено */

/* Семантика */
--red-500: #EF4444;
--red-50:  #FEF2F2;
```

### Типографика

```css
/* Шрифт — единый для всего приложения */
font-family: 'Sora', 'Inter', system-ui, sans-serif;

/* Размеры */
--text-xs:   0.75rem;   /* 12px — метки, badges */
--text-sm:   0.875rem;  /* 14px — основной текст */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — заголовки секций */
--text-xl:   1.25rem;   /* 20px — заголовки страниц (mobile) */
--text-2xl:  1.5rem;    /* 24px — заголовки страниц (desktop) */
--text-5xl:  3rem;      /* 48px — карточка flashcard */

/* Веса */
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
--font-black:     900;   /* логотип, числа в виджетах */
```

### Скругления

```css
--radius-sm:  0.5rem;    /* 8px  — теги, маленькие элементы */
--radius-md:  0.75rem;   /* 12px — кнопки, inputs */
--radius-lg:  1rem;      /* 16px — rounded-xl в Tailwind */
--radius-xl:  1.5rem;    /* 24px — rounded-2xl, основные карточки */
--radius-full: 9999px;   /* badges, аватары */
```

### Тени

```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.07);
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1);   /* drawer */
```

### Spacing (отступы страниц)

```
Mobile:  px-4 py-5   (горизонт 16px, верт 20px)
Desktop: px-8 py-7   (горизонт 32px, верт 28px)
Max-width content: max-w-3xl
```

---

## Архитектура Layout

Два режима страниц:

### Режим 1: App Shell (навигация видна)
Для всех «навигационных» страниц — список наборов, детали набора, группы, дашборд, достижения.

```
ProtectedAppShell
├── Sidebar (desktop: w-52, sticky)
├── MobileHeader (mobile: sticky top-0)
├── MobileDrawer (slide-in overlay)
└── <main px-4 py-5 md:px-8 md:py-7>
    └── Page Content (max-w-3xl)
```

### Режим 2: Immersive (полный экран, без боковой панели)
Для игровых режимов: study, test, dictation, review/start.

```
ImmersiveShell
├── ImmersiveHeader (slim: кнопка назад + прогресс + счёт)
└── <main flex-1 overflow-hidden>
    └── Page Content (centred)
```

Immersive не должен использовать `ProtectedAppShell`. Ему нужен свой минималистичный header с кнопкой выхода и прогресс-баром.

---

## Общие компоненты (что создать)

### `src/components/ui/` — переиспользуемые примитивы

Заменяют raw Tailwind + shadcn/ui — единый источник правды.

```
src/components/ui/
├── Button.tsx          — primary, secondary, ghost, danger; sm/md/lg
├── Input.tsx           — text input с label, error state, optional helper
├── Textarea.tsx        — multiline input
├── TagInput.tsx        — input для тегов (уже есть в некоторых страницах)
├── Card.tsx            — white rounded-2xl shadow-sm контейнер
├── Badge.tsx           — статусные метки (new/learning/testing/young/mature)
├── PageHeader.tsx      — заголовок страницы + back button + actions
├── EmptyState.tsx      — иллюстрация + текст + CTA когда список пустой
├── ErrorRetry.tsx      — ошибка + кнопка «Попробовать снова»
├── LoadingSkeleton.tsx — skeleton placeholder для загрузки
└── SrsStatusBadge.tsx  — цветной badge статуса SRS карточки
```

### `src/components/layout/` — layout-примитивы

```
src/components/layout/
├── ProtectedAppShell.tsx   ← уже есть, но нужно рефакторить (см. ниже)
├── ImmersiveShell.tsx      ← новый, для study/test/dictation
└── PageContainer.tsx       ← обёртка max-w-3xl с правильными отступами
```

---

## Пошаговый план реализации

### Шаг 1 — Шрифт в корень (15 минут)

**Файл:** `src/app/layout.tsx`

Добавить Sora через `next/font/google`:

```tsx
import { Sora } from 'next/font/google';

const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

// В body:
<body className={`${sora.variable} antialiased`} style={{ fontFamily: 'var(--font-sora), Inter, system-ui, sans-serif' }}>
```

Удалить все `<style>{`@import url('https://fonts.googleapis.com/css2?family=Sora...')`}</style>` из:
- `ProtectedAppShell.tsx` (строка 253)
- `dashboard/page.tsx` (строка 374)

Удалить `fontFamily` inline style из `ProtectedAppShell` и `dashboard/page.tsx` — шрифт теперь глобальный.

**Проверка:** Все страницы (включая auth) должны рендерить Sora.

---

### Шаг 2 — Dashboard → ProtectedAppShell (2-3 часа)

**Проблема:** Dashboard дублирует весь AppShell.

**Создать:** `src/app/dashboard/layout.tsx`

```tsx
import { ProtectedAppShell } from '@/components/layout/ProtectedAppShell';

export default function DashboardLayout({ children }) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
```

**Рефакторить** `dashboard/page.tsx`:
- Удалить локальные `Sidebar`, `MobileHeader`, `MobileDrawer`, `ReviewWidget` — эти компоненты уже в ProtectedAppShell
- Удалить `menuOpen` state, `handleSignOut`, `displayName` — они в Shell
- Убрать внешний `<div flex flex-col md:flex-row...>` — его даёт Shell
- Страница становится просто содержимым `<main>`

**Проверка:** Dashboard визуально идентичен текущему, но код без дублирования.

---

### Шаг 3 — ImmersiveShell (1-2 часа)

**Создать:** `src/components/layout/ImmersiveShell.tsx`

```tsx
// Тонкий header без навигации — только back + title + прогресс
type Props = {
  children: ReactNode;
  backHref: string;
  title?: string;
  progress?: number;     // 0-100
  leftBadge?: ReactNode;
  rightBadge?: ReactNode;
};

export function ImmersiveShell({ children, backHref, title, progress, leftBadge, rightBadge }: Props) {
  return (
    <div className="flex flex-col h-screen" style={{ background: '#F7F5F0' }}>
      {/* Header */}
      <header className="shrink-0 px-4 py-3 flex items-center gap-3 bg-white border-b border-gray-100">
        <Link href={backHref}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition">
          ←
        </Link>
        {title && <span className="text-sm font-semibold text-gray-800 truncate flex-1">{title}</span>}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {leftBadge}{rightBadge}
        </div>
      </header>
      {/* Progress bar (optional) */}
      {progress !== undefined && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-[#057A55] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

**Создать:** `src/app/decks/[id]/immersive-layout.tsx` (отдельный layout для study/test/dictation, который НЕ использует ProtectedAppShell).

Проблема: Next.js нельзя иметь «вложенные исключения» из родительского layout. Решение — вынести study/test/dictation из `decks/[id]/` группы в роут-группу `(immersive)`:

```
src/app/
├── (app)/                          ← группа с ProtectedAppShell
│   ├── layout.tsx                  ← <ProtectedAppShell>
│   ├── dashboard/
│   ├── decks/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── edit/
│   │       └── cards/
│   ├── groups/
│   ├── review/
│   │   └── page.tsx                ← landing только, не сессия
│   ├── grammar/
│   └── achievements/
│
└── (immersive)/                    ← группа без навигации
    ├── layout.tsx                  ← минимальный layout (просто RequireAuth)
    └── decks/
        └── [id]/
            ├── study/
            ├── test/
            ├── dictation/
            ├── complete/
            └── review/             ← сессия повторения
```

Альтернатива (проще): оставить текущую структуру, но study/test/dictation убирают padding shell через `useLayoutEffect` или через CSS `min-h-screen -mx-4 -my-5 md:-mx-8 md:-my-7`. Не очень чисто, но работает без реструктуризации папок.

**Рекомендация:** Реструктуризация папок (вариант с `(app)` / `(immersive)` группами) — правильный путь. Это Next.js route groups, они не влияют на URL.

---

### Шаг 4 — Базовые UI компоненты (3-4 часа)

#### `Button.tsx`

```tsx
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:   'bg-[#057A55] text-white hover:bg-[#065f46] active:bg-[#065f46]',
  secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
  ghost:     'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
  danger:    'bg-white border border-red-200 text-red-500 hover:bg-red-50',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};
```

#### `Input.tsx`

```tsx
// Единый input с label, helper text, error state
// border-gray-200 focus:border-[#057A55] focus:ring-2 focus:ring-[#057A55]/20
// rounded-xl px-3.5 py-2.5 text-sm
```

#### `Card.tsx`

```tsx
// bg-white rounded-2xl border border-gray-100 shadow-sm
// Варианты: default, interactive (hover effect), highlighted (green border)
```

#### `PageHeader.tsx`

```tsx
// Заголовок страницы с опциональной кнопкой назад и actions справа
// Используется на /decks/[id], /decks/new, /groups/[id] и т.д.
// Mobile: back button + title в одну строку
// Desktop: title + actions в одну строку
```

#### `EmptyState.tsx`

```tsx
// Используется на /decks (нет наборов), /groups (нет групп) и т.д.
// emoji/иллюстрация + заголовок + описание + CTA кнопка
```

---

### Шаг 5 — Страница деталей набора `/decks/[id]` (2-3 часа)

**Текущие проблемы:**
- Использует shadcn/ui `<Card>`, `<Button>`, `<Badge>` — несовместимо с дизайн-системой
- SRS прогресс-бар — хорошо, но мелкий на мобилке
- Кнопки действий «Изучать», «Тест», «Диктант» — на мобилке не помещаются в ряд
- Список карточек — таблица ломается на мобилке (слишком много колонок)

**Изменения:**
- Заменить shadcn компоненты на свои из `ui/`
- Кнопки действий: на мобилке `grid-cols-1` или `grid-cols-2`, на desktop `flex-row`
- Список карточек: на мобилке — карточки-строки вместо таблицы (compact card view)
- SRS статистика: `flex-wrap` на мобилке вместо жёсткого grid

---

### Шаг 6 — Форма создания/редактирования набора `/decks/new`, `/decks/[id]/edit` (1-2 часа)

**Текущие проблемы:**
- Input label стиль отличается от других страниц
- `max-w-lg` форма — хорошо центрируется, но без `PageHeader` навигации
- Кнопка «Сохранить» + «Отмена» — нет consistent layout

**Изменения:**
- Использовать `PageHeader` (← назад + заголовок)
- Использовать `Input.tsx` / `Textarea.tsx`
- Кнопки: `flex-row-reverse gap-3` (Отмена слева, Сохранить справа) — стандарт

---

### Шаг 7 — Список наборов `/decks` (1 час)

**Текущие проблемы:**
- `grid-cols-2` на мобилке — карточки слишком узкие при длинных названиях
- Карточка набора содержит мелкий текст статистики, нечитаемо на мобилке

**Изменения:**
- `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- На мобилке карточки полной ширины
- Минимальный контент в карточке: название + badge количества карточек + SRS bar

---

### Шаг 8 — Страницы групп (2 часа)

**`/groups`:** Список групп — аналогично `/decks`, адаптировать grid
**`/groups/new`:** Форма — те же паттерны что `/decks/new`
**`/groups/[id]`:** 
- Таблица участников на мобилке → список карточек-строк
- Статистика → responsive flex-wrap

---

### Шаг 9 — Auth страницы `/login`, `/register` (1-2 часа)

**Текущие проблемы:**
- Синий градиент фон — не соответствует остальному приложению
- Нет Sora (решается Шагом 1)
- После Шага 1 шрифт подключится автоматически

**Изменения:**
- Фон: `#F7F5F0` вместо синего градиента (или оставить отдельный фон но консистентный с брендом — например лёгкий зелёный `#f0faf6`)
- Логотип: использовать тот же зелёный логотип-значок что в sidebar
- Форма: использовать `Input.tsx`, `Button.tsx` из дизайн-системы
- Карточка формы: `bg-white rounded-2xl shadow-sm` — как везде

---

### Шаг 10 — Добавить `data-testid` атрибуты (1 час, параллельно)

При рефакторинге каждой страницы добавлять `data-testid`:

```tsx
<div data-testid="deck-title">{deck.name}</div>
<div data-testid="my-decks">{...}</div>
<div data-testid="deck-card" key={deck.id}>{...}</div>
<div data-testid="study-card">{...}</div>
<div data-testid="srs-stats">{...}</div>
```

Это нужно для e2e тестов из плана производительности (doc/11).

---

## Порядок приоритетов

```
Приоритет 1 (быстро, большой эффект):
  ├── Шаг 1: Sora в root layout (15 мин)
  ├── Шаг 4: Базовые UI компоненты Button, Input, Card (3-4 ч)
  └── Шаг 7: Список наборов mobile grid (1 ч)

Приоритет 2 (основные страницы):
  ├── Шаг 2: Dashboard → ProtectedAppShell (2-3 ч)
  ├── Шаг 5: Детали набора /decks/[id] (2-3 ч)
  └── Шаг 9: Auth страницы (1-2 ч)

Приоритет 3 (формы и группы):
  ├── Шаг 6: Форма создания/редактирования набора (1-2 ч)
  └── Шаг 8: Страницы групп (2 ч)

Приоритет 4 (архитектура immersive):
  └── Шаг 3: ImmersiveShell + реструктуризация папок (3-4 ч)
```

---

## Тесты дизайна и мобильной версии

### Визуальные тесты (ручные чеклисты)

Перед каждым мержем проверить на реальном устройстве или в DevTools (375px, 390px iPhone):

```
[ ] Шрифт Sora применяется на всех страницах (включая login)
[ ] Фон #F7F5F0 на всех страницах приложения
[ ] Сайдбар скрыт на мобилке (<768px)
[ ] Mobile header виден на мобилке на всех app-страницах
[ ] Drawer открывается по тапу на бургер
[ ] Drawer закрывается при тапе на overlay
[ ] Кнопки минимум 44px в высоту (touch target)
[ ] Текст не обрезается горизонтально (no overflow)
[ ] Формы занимают полную ширину на мобилке
[ ] Grid наборов — 1 колонка на мобилке, 2+ на планшете
[ ] Immersive страницы не показывают лишний padding сверху
[ ] Auth страницы используют тот же шрифт и цвета бренда
```

### Automated — Playwright visual snapshots

```ts
// src/__tests__/e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 375, height: 812, name: 'iPhone SE' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1440, height: 900, name: 'Desktop' },
];

const PAGES = [
  { path: '/dashboard', auth: true },
  { path: '/decks', auth: true },
  { path: '/decks/new', auth: true },
  { path: '/groups', auth: true },
  { path: '/login', auth: false },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Viewport: ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport });

    for (const { path, auth } of PAGES) {
      test(`${path} matches snapshot`, async ({ page }) => {
        if (auth) await loginUser(page);
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`${path.replace(/\//g, '-')}-${viewport.name}.png`);
      });
    }
  });
}
```

### Automated — Component unit tests

```ts
// src/__tests__/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('рендерит primary вариант с правильными классами', () => {
    render(<Button variant="primary">Сохранить</Button>);
    const btn = screen.getByRole('button', { name: 'Сохранить' });
    expect(btn).toHaveClass('bg-[#057A55]');
    expect(btn).toHaveClass('rounded-xl');
  });

  it('рендерит danger вариант', () => {
    render(<Button variant="danger">Удалить</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-red-500');
  });

  it('disabled state блокирует взаимодействие', () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Кнопка</Button>);
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('touch target минимум 44px', () => {
    render(<Button size="md">Кнопка</Button>);
    const btn = screen.getByRole('button');
    const styles = getComputedStyle(btn);
    // py-2.5 = 10px top+bottom + line-height ≈ 44px total
    expect(btn.className).toMatch(/py-2\.5|py-3/);
  });
});
```

```ts
// src/__tests__/ui/Input.test.tsx
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('показывает label и placeholder', () => {
    render(<Input label="Название" placeholder="Введите название" />);
    expect(screen.getByLabelText('Название')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите название')).toBeInTheDocument();
  });

  it('показывает error message', () => {
    render(<Input label="Email" error="Обязательное поле" />);
    expect(screen.getByText('Обязательное поле')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });
});
```

```ts
// src/__tests__/layout/AppShell.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProtectedAppShell } from '@/components/layout/ProtectedAppShell';

// Mock useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' }, profile: { display_name: 'Борис' }, signOut: jest.fn() }),
}));

describe('ProtectedAppShell', () => {
  it('показывает mobile header на мобильных', () => {
    // jsdom не поддерживает медиа-запросы, проверяем наличие элемента
    render(<ProtectedAppShell><div>content</div></ProtectedAppShell>);
    expect(screen.getByLabelText('Меню')).toBeInTheDocument();
  });

  it('drawer открывается при клике на бургер', async () => {
    render(<ProtectedAppShell><div>content</div></ProtectedAppShell>);
    fireEvent.click(screen.getByLabelText('Меню'));
    expect(await screen.findByText('Главная')).toBeInTheDocument();
  });

  it('drawer закрывается при клике на overlay', async () => {
    render(<ProtectedAppShell><div>content</div></ProtectedAppShell>);
    fireEvent.click(screen.getByLabelText('Меню'));
    await screen.findByText('Главная');
    // Кликаем на overlay (backdrop)
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/40');
    if (overlay) fireEvent.click(overlay);
    expect(screen.queryByText('Главная')).not.toBeInTheDocument();
  });

  it('Nav links содержат все разделы', () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    fireEvent.click(screen.getByLabelText('Меню'));
    expect(screen.getByText('Мои наборы')).toBeInTheDocument();
    expect(screen.getByText('Повторение')).toBeInTheDocument();
    expect(screen.getByText('Группы')).toBeInTheDocument();
  });
});
```

### Responsive breakpoint тест (Playwright)

```ts
// src/__tests__/e2e/responsive.spec.ts
test('мобильный header скрывает sidebar и показывает бургер', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginUser(page);
  await page.goto('/dashboard');

  // Sidebar скрыт на мобилке
  const sidebar = page.locator('aside.hidden.md\\:flex');
  await expect(sidebar).toBeHidden();

  // Бургер-кнопка видна
  const burger = page.getByRole('button', { name: 'Меню' });
  await expect(burger).toBeVisible();

  // Drawer открывается
  await burger.click();
  await expect(page.getByText('Мои наборы')).toBeVisible();
});

test('desktop показывает sidebar без бургера', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginUser(page);
  await page.goto('/dashboard');

  const sidebar = page.locator('aside');
  await expect(sidebar).toBeVisible();

  const burger = page.getByRole('button', { name: 'Меню' });
  await expect(burger).toBeHidden();
});

test('список наборов: одна колонка на мобилке', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginUser(page);
  await page.goto('/decks');
  await page.waitForSelector('[data-testid="deck-card"]');

  const cards = page.locator('[data-testid="deck-card"]');
  const count = await cards.count();
  if (count >= 2) {
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    // На мобилке карточки в одну колонку — second под first
    expect(second!.y).toBeGreaterThan(first!.y + first!.height - 10);
  }
});
```

---

---

## Полный план тестирования фронтенда

### Структура тестов

```
src/__tests__/
├── ui/                         ← Unit тесты компонентов дизайн-системы
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   ├── Card.test.tsx
│   ├── Badge.test.tsx
│   ├── SrsStatusBadge.test.tsx
│   ├── PageHeader.test.tsx
│   ├── EmptyState.test.tsx
│   └── LoadingSkeleton.test.tsx
├── layout/                     ← Unit тесты layout-компонентов
│   ├── ProtectedAppShell.test.tsx
│   └── ImmersiveShell.test.tsx
├── design-system/              ← Тесты соблюдения правил дизайн-системы
│   ├── token-compliance.test.ts
│   └── no-raw-styles.test.ts
└── e2e/                        ← Playwright end-to-end тесты
    ├── visual.spec.ts          ← Скриншот-регрессия
    ├── responsive.spec.ts      ← Проверка breakpoints
    ├── navigation.spec.ts      ← Навигация, sidebar, drawer
    ├── forms.spec.ts           ← Формы, валидация
    ├── accessibility.spec.ts   ← a11y (touch targets, ARIA)
    └── design-tokens.spec.ts   ← Соблюдение токенов на живых страницах
```

---

### 1. Unit тесты UI компонентов

#### `src/__tests__/ui/Button.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button — варианты', () => {
  it('primary: зелёный фон', () => {
    render(<Button variant="primary">Сохранить</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-[#057A55]');
  });

  it('secondary: белый фон с бордером', () => {
    render(<Button variant="secondary">Отмена</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-white');
    expect(btn).toHaveClass('border');
  });

  it('danger: красный текст', () => {
    render(<Button variant="danger">Удалить</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-red-500');
  });

  it('ghost: прозрачный', () => {
    render(<Button variant="ghost">Ещё</Button>);
    expect(screen.getByRole('button')).not.toHaveClass('bg-[#057A55]');
  });
});

describe('Button — размеры', () => {
  it('sm: маленький', () => {
    render(<Button size="sm">Кнопка</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-xs');
  });

  it('md: средний (по умолчанию)', () => {
    render(<Button>Кнопка</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-sm');
  });

  it('lg: большой', () => {
    render(<Button size="lg">Кнопка</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-base');
  });
});

describe('Button — поведение', () => {
  it('вызывает onClick при клике', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Кнопка</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled: не вызывает onClick', async () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Кнопка</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disabled: имеет opacity и cursor-not-allowed', () => {
    render(<Button disabled>Кнопка</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('opacity-50');
  });

  it('loading: показывает спиннер и не вызывает onClick', async () => {
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>Загрузка</Button>);
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('touch target минимум 44px высота (md)', () => {
    // py-2.5 (10px) * 2 + line-height (24px) = 44px
    render(<Button size="md">Кнопка</Button>);
    expect(screen.getByRole('button')).toHaveClass('py-2.5');
  });

  it('все варианты имеют rounded-xl (не меньше)', () => {
    (['primary', 'secondary', 'ghost', 'danger'] as const).forEach(variant => {
      const { unmount } = render(<Button variant={variant}>X</Button>);
      const btn = screen.getByRole('button');
      expect(btn.className).toMatch(/rounded-(xl|2xl)/);
      unmount();
    });
  });
});

describe('Button — иконки', () => {
  it('iconLeft рендерится слева от текста', () => {
    render(<Button iconLeft={<span data-testid="icon" />}>Текст</Button>);
    const children = screen.getByRole('button').children;
    expect(children[0]).toBe(screen.getByTestId('icon'));
  });

  it('icon-only не имеет лишних отступов по X', () => {
    render(<Button iconOnly icon={<span>★</span>} aria-label="Добавить" />);
    expect(screen.getByRole('button')).toHaveClass('p-2');
  });
});
```

#### `src/__tests__/ui/Input.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input — рендер', () => {
  it('показывает label', () => {
    render(<Input label="Название набора" />);
    expect(screen.getByLabelText('Название набора')).toBeInTheDocument();
  });

  it('label связан с input через htmlFor/id', () => {
    render(<Input label="Email" id="email-field" />);
    const input = screen.getByLabelText('Email');
    expect(input.id).toBe('email-field');
  });

  it('показывает placeholder', () => {
    render(<Input label="X" placeholder="Введите текст" />);
    expect(screen.getByPlaceholderText('Введите текст')).toBeInTheDocument();
  });

  it('helper text отображается под полем', () => {
    render(<Input label="X" helper="Не менее 3 символов" />);
    expect(screen.getByText('Не менее 3 символов')).toBeInTheDocument();
  });
});

describe('Input — состояния', () => {
  it('error: красный бордер и текст ошибки', () => {
    render(<Input label="X" error="Обязательное поле" />);
    expect(screen.getByText('Обязательное поле')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('error: aria-invalid="true"', () => {
    render(<Input label="X" error="Ошибка" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disabled: поле недоступно', () => {
    render(<Input label="X" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('focus: ring видим (проверяем класс)', () => {
    render(<Input label="X" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toMatch(/focus:ring/);
  });
});

describe('Input — значения', () => {
  it('controlled: value + onChange', async () => {
    const onChange = jest.fn();
    render(<Input label="X" value="начало" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'А');
    expect(onChange).toHaveBeenCalled();
  });

  it('uncontrolled: defaultValue', () => {
    render(<Input label="X" defaultValue="тест" />);
    expect(screen.getByRole('textbox')).toHaveValue('тест');
  });
});
```

#### `src/__tests__/ui/Card.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('рендерит children', () => {
    render(<Card><p>Содержимое</p></Card>);
    expect(screen.getByText('Содержимое')).toBeInTheDocument();
  });

  it('базовые классы: белый фон, rounded-2xl, shadow-sm', () => {
    const { container } = render(<Card>X</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('shadow-sm');
  });

  it('interactive вариант: hover эффект', () => {
    const { container } = render(<Card variant="interactive">X</Card>);
    expect(container.firstChild).toHaveClass('hover:shadow-md');
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('highlighted вариант: зелёный бордер', () => {
    const { container } = render(<Card variant="highlighted">X</Card>);
    expect(container.firstChild).toHaveClass('border-[#057A55]');
  });

  it('onClick вызывается при клике на interactive', async () => {
    const onClick = jest.fn();
    render(<Card variant="interactive" onClick={onClick}>X</Card>);
    await userEvent.click(screen.getByText('X'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

#### `src/__tests__/ui/SrsStatusBadge.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { SrsStatusBadge } from '@/components/ui/SrsStatusBadge';
import type { SrsStatus } from '@/lib/srs/types';

const cases: { status: SrsStatus; label: string; colorClass: string }[] = [
  { status: 'new',        label: 'Новое',      colorClass: 'text-gray-500' },
  { status: 'learning',   label: 'Изучение',   colorClass: 'text-amber-600' },
  { status: 'testing',    label: 'Тест',        colorClass: 'text-indigo-600' },
  { status: 'young',      label: 'Повторение',  colorClass: 'text-teal-600' },
  { status: 'mature',     label: 'Выучено',     colorClass: 'text-[#057A55]' },
  { status: 'relearning', label: 'Забыто',      colorClass: 'text-red-500' },
];

describe('SrsStatusBadge', () => {
  cases.forEach(({ status, label, colorClass }) => {
    it(`status="${status}": показывает "${label}" с правильным цветом`, () => {
      const { container } = render(<SrsStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(container.firstChild).toHaveClass(colorClass);
    });
  });

  it('все статусы имеют bg, rounded, text-xs', () => {
    cases.forEach(({ status }) => {
      const { container, unmount } = render(<SrsStatusBadge status={status} />);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toMatch(/rounded/);
      expect(el.className).toMatch(/text-xs/);
      unmount();
    });
  });
});
```

#### `src/__tests__/ui/PageHeader.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/ui/PageHeader';

describe('PageHeader', () => {
  it('рендерит заголовок', () => {
    render(<PageHeader title="Мои наборы" />);
    expect(screen.getByRole('heading', { name: 'Мои наборы' })).toBeInTheDocument();
  });

  it('кнопка «назад» ведёт на back href', () => {
    render(<PageHeader title="Набор" back="/decks" />);
    const link = screen.getByRole('link', { name: /назад/i });
    expect(link).toHaveAttribute('href', '/decks');
  });

  it('без back — нет кнопки назад', () => {
    render(<PageHeader title="Страница" />);
    expect(screen.queryByRole('link', { name: /назад/i })).not.toBeInTheDocument();
  });

  it('actions рендерятся справа', () => {
    render(
      <PageHeader title="X" actions={<button data-testid="action-btn">Действие</button>} />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});
```

#### `src/__tests__/ui/EmptyState.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('показывает заголовок и описание', () => {
    render(<EmptyState title="Нет наборов" description="Создайте первый набор" />);
    expect(screen.getByText('Нет наборов')).toBeInTheDocument();
    expect(screen.getByText('Создайте первый набор')).toBeInTheDocument();
  });

  it('CTA кнопка рендерится', () => {
    render(
      <EmptyState
        title="X"
        cta={{ label: 'Создать набор', href: '/decks/new' }}
      />
    );
    const link = screen.getByRole('link', { name: 'Создать набор' });
    expect(link).toHaveAttribute('href', '/decks/new');
  });

  it('без CTA — нет кнопки', () => {
    render(<EmptyState title="X" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

---

### 2. Unit тесты Layout компонентов

#### `src/__tests__/layout/ProtectedAppShell.test.tsx`

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProtectedAppShell } from '@/components/layout/ProtectedAppShell';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@test.com' },
    profile: { display_name: 'Борис' },
    signOut: jest.fn(),
  }),
}));
jest.mock('@/lib/srs/queries', () => ({
  getReviewCount: () => Promise.resolve(5),
}));
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}));

describe('ProtectedAppShell — структура', () => {
  it('рендерит children', () => {
    render(<ProtectedAppShell><div data-testid="page">контент</div></ProtectedAppShell>);
    expect(screen.getByTestId('page')).toBeInTheDocument();
  });

  it('сайдбар содержит все 6 навигационных пунктов', () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    expect(screen.getAllByText('Главная').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Мои наборы').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Повторение').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Правила').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Достижения').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Группы').length).toBeGreaterThan(0);
  });

  it('показывает имя пользователя', () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    expect(screen.getAllByText('Борис').length).toBeGreaterThan(0);
  });

  it('показывает счётчик повторений после загрузки', async () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    await waitFor(() => {
      expect(screen.getAllByText(/5/).length).toBeGreaterThan(0);
    });
  });
});

describe('ProtectedAppShell — мобильное меню', () => {
  it('кнопка бургер есть в DOM', () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    expect(screen.getByRole('button', { name: 'Меню' })).toBeInTheDocument();
  });

  it('drawer закрыт изначально', () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    // Drawer с AnimatePresence — не должен быть виден
    expect(screen.queryByRole('navigation', { name: 'Мобильное меню' }))
      .not.toBeInTheDocument();
  });

  it('drawer открывается по клику на бургер', async () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    await waitFor(() => {
      // После открытия drawer появляются ссылки навигации в drawer
      expect(screen.getAllByText('Мои наборы').length).toBeGreaterThanOrEqual(2); // sidebar + drawer
    });
  });

  it('drawer закрывается по клику на overlay', async () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    const overlay = document.querySelector('[aria-label="Закрыть меню"]') ||
                    document.querySelector('.fixed.inset-0.bg-black\\/40');
    if (overlay) fireEvent.click(overlay);
    await waitFor(() => {
      expect(screen.getAllByText('Мои наборы').length).toBe(1); // только в sidebar
    });
  });

  it('активный пункт меню подсвечен', () => {
    render(<ProtectedAppShell><div /></ProtectedAppShell>);
    // pathname = '/dashboard' → «Главная» должен быть active
    const activeLinks = document.querySelectorAll('.bg-\\[\\#057A55\\]\\/10');
    expect(activeLinks.length).toBeGreaterThan(0);
  });
});

describe('ProtectedAppShell — шрифт и фон', () => {
  it('основной контейнер имеет фон #F7F5F0', () => {
    const { container } = render(<ProtectedAppShell><div /></ProtectedAppShell>);
    const root = container.firstChild as HTMLElement;
    // background задаётся через style или через класс
    const bg = root.style.background || root.style.backgroundColor;
    expect(bg).toContain('#F7F5F0');
  });
});
```

#### `src/__tests__/layout/ImmersiveShell.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { ImmersiveShell } from '@/components/layout/ImmersiveShell';

describe('ImmersiveShell', () => {
  it('рендерит children', () => {
    render(
      <ImmersiveShell backHref="/decks/123">
        <div data-testid="content">карточка</div>
      </ImmersiveShell>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('кнопка «назад» ведёт на backHref', () => {
    render(<ImmersiveShell backHref="/decks/456"><div /></ImmersiveShell>);
    const back = screen.getByRole('link', { name: /назад/i });
    expect(back).toHaveAttribute('href', '/decks/456');
  });

  it('прогресс-бар рендерится при передаче progress', () => {
    render(<ImmersiveShell backHref="/" progress={60}><div /></ImmersiveShell>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveStyle({ width: '60%' });
  });

  it('прогресс-бар отсутствует без progress', () => {
    render(<ImmersiveShell backHref="/"><div /></ImmersiveShell>);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('title рендерится в header', () => {
    render(<ImmersiveShell backHref="/" title="Изучение"><div /></ImmersiveShell>);
    expect(screen.getByText('Изучение')).toBeInTheDocument();
  });

  it('НЕТ sidebar и бургер-кнопки (immersive mode)', () => {
    render(<ImmersiveShell backHref="/"><div /></ImmersiveShell>);
    expect(screen.queryByRole('button', { name: 'Меню' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('layout h-screen — страница не скроллится', () => {
    const { container } = render(<ImmersiveShell backHref="/"><div /></ImmersiveShell>);
    expect(container.firstChild).toHaveClass('h-screen');
  });
});
```

---

### 3. Тесты соблюдения правил дизайн-системы

#### `src/__tests__/design-system/token-compliance.test.ts`

Статические тесты, которые **анализируют исходный код** на нарушения железного правила.

```ts
import { glob } from 'glob';
import { readFileSync } from 'fs';

// Список файлов страниц (не компонентов ui/)
async function getPageFiles() {
  return glob('src/app/**/*.tsx', { ignore: ['**/node_modules/**'] });
}

// Запрещённые паттерны в страницах
const FORBIDDEN_IN_PAGES = [
  // Прямой цвет бренда вне ui/
  { pattern: /className=["'][^"']*bg-\[#057A55\]/, message: 'Прямой bg-[#057A55] в странице — используй <Button variant="primary"> или компонент из ui/' },
  { pattern: /className=["'][^"']*bg-\[#065f46\]/, message: 'Прямой bg-[#065f46] в странице — используй компонент из ui/' },
  // Прямые стили кнопок
  { pattern: /className=["'][^"']*rounded-xl[^"']*bg-\[#057/, message: 'Инлайн стиль кнопки — используй <Button>' },
  // Использование shadcn/ui в страницах (после миграции)
  { pattern: /from ['"]@\/components\/ui\/card['"]/, message: 'shadcn Card импортирован в страницу — используй @/components/ui/Card из дизайн-системы' },
  { pattern: /from ['"]@\/components\/ui\/button['"]/, message: 'shadcn Button импортирован в страницу — используй @/components/ui/Button из дизайн-системы' },
  { pattern: /from ['"]@\/components\/ui\/badge['"]/, message: 'shadcn Badge импортирован в страницу — используй @/components/ui/Badge из дизайн-системы' },
];

describe('Дизайн-система: страницы не используют raw стили', () => {
  let pageFiles: string[] = [];

  beforeAll(async () => {
    pageFiles = await getPageFiles();
  });

  FORBIDDEN_IN_PAGES.forEach(({ pattern, message }) => {
    it(`Запрещён паттерн: ${message}`, () => {
      const violations: string[] = [];

      for (const file of pageFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (pattern.test(line)) {
            violations.push(`${file}:${i + 1} → ${line.trim()}`);
          }
        });
      }

      if (violations.length > 0) {
        throw new Error(
          `Нарушение правила "${message}":\n${violations.join('\n')}`
        );
      }
    });
  });
});

describe('Дизайн-система: компоненты ui/ используются в страницах', () => {
  it('страницы с формами импортируют Input из ui/', async () => {
    const formPages = await glob('src/app/**/new/page.tsx');
    for (const file of formPages) {
      const content = readFileSync(file, 'utf-8');
      // После рефакторинга — должен быть импорт из ui/
      if (content.includes('<input ') || content.includes('<textarea ')) {
        // Если есть raw input — должен быть только временный (помечен TODO)
        expect(content).toMatch(/TODO.*migrate.*Input|components\/ui\/Input/);
      }
    }
  });

  it('страницы с кнопками используют Button из ui/', async () => {
    const pages = await glob('src/app/**/page.tsx');
    for (const file of pages) {
      const content = readFileSync(file, 'utf-8');
      // Проверяем: если есть <button с bg-[#057A55] — нарушение
      expect(content).not.toMatch(/<button[^>]*className=["'][^"']*bg-\[#057A55\]/);
    }
  });
});

describe('Дизайн-система: шрифт не инжектируется в компонентах', () => {
  it('нет @import Sora вне root layout', async () => {
    // После Шага 1 — только root layout грузит Sora
    const files = await glob('src/**/*.tsx', {
      ignore: ['src/app/layout.tsx', '**/node_modules/**'],
    });
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('@import') && content.includes('Sora')) {
        violations.push(file);
      }
    }
    expect(violations).toHaveLength(0);
  });

  it('нет inline fontFamily Sora в компонентах', async () => {
    const files = await glob('src/app/**/*.tsx', { ignore: ['src/app/layout.tsx'] });
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes("fontFamily: \"'Sora'") || content.includes("fontFamily: \"'Sora'")) {
        violations.push(file);
      }
    }
    expect(violations).toHaveLength(0);
  });
});
```

---

### 4. End-to-end тесты (Playwright)

#### `src/__tests__/e2e/responsive.spec.ts` — Breakpoints

```ts
import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[name=email]', process.env.TEST_EMAIL!);
  await page.fill('[name=password]', process.env.TEST_PASSWORD!);
  await page.click('[type=submit]');
  await page.waitForURL('/dashboard');
}

// Тестируем 3 breakpoint'а
const BREAKPOINTS = [
  { name: 'mobile',  width: 375,  height: 812  },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900  },
];

// Страницы, которые используют AppShell
const SHELL_PAGES = ['/dashboard', '/decks', '/groups', '/review'];

for (const bp of BREAKPOINTS) {
  test.describe(`${bp.name} (${bp.width}px)`, () => {
    test.use({ viewport: { width: bp.width, height: bp.height } });

    test.beforeEach(async ({ page }) => { await login(page); });

    SHELL_PAGES.forEach(path => {
      test(`${path}: правильная навигация`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        if (bp.width < 768) {
          // Mobile: sidebar скрыт, бургер виден
          await expect(page.locator('aside')).toBeHidden();
          await expect(page.getByRole('button', { name: 'Меню' })).toBeVisible();
        } else {
          // Desktop/tablet: sidebar виден, бургер скрыт
          await expect(page.locator('aside')).toBeVisible();
          await expect(page.getByRole('button', { name: 'Меню' })).toBeHidden();
        }
      });
    });

    test('/decks: правильный grid на текущем breakpoint', async ({ page }) => {
      await page.goto('/decks');
      const cards = page.locator('[data-testid="deck-card"]');
      const count = await cards.count();
      if (count < 2) test.skip();

      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();

      if (bp.width < 640) {
        // mobile: одна колонка
        expect(second!.y).toBeGreaterThan(first!.y + first!.height / 2);
      } else {
        // tablet+: больше одной колонки
        expect(Math.abs(second!.y - first!.y)).toBeLessThan(20); // в одной строке
      }
    });
  });
}
```

#### `src/__tests__/e2e/navigation.spec.ts` — Навигация и drawer

```ts
test.describe('Мобильная навигация', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('drawer открывается и закрывается', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Открываем
    await page.getByRole('button', { name: 'Меню' }).click();
    await expect(page.getByText('Мои наборы')).toBeVisible();

    // Закрываем крестиком
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await expect(page.getByText('Мои наборы')).toBeHidden();
  });

  test('drawer закрывается при клике на overlay', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Меню' }).click();
    await expect(page.getByText('Мои наборы')).toBeVisible();

    // Кликаем на тёмный overlay
    await page.locator('.fixed.inset-0').first().click();
    await expect(page.getByText('Мои наборы')).toBeHidden();
  });

  test('переход по ссылке в drawer закрывает его', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Меню' }).click();
    await page.getByRole('link', { name: 'Мои наборы' }).first().click();
    await page.waitForURL('/decks');
    // Drawer должен быть закрыт
    await expect(page.locator('.fixed.inset-0').first()).toBeHidden();
  });

  test('активный пункт меню подсвечен зелёным', async ({ page }) => {
    await login(page);
    await page.goto('/decks');
    await page.getByRole('button', { name: 'Меню' }).click();

    // Ссылка «Мои наборы» должна быть активной (зелёный фон)
    const activeLink = page.getByRole('link', { name: 'Мои наборы' }).first();
    const bg = await activeLink.evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    // Должен быть зелёный tinted bg (#057A55 с opacity)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });
});
```

#### `src/__tests__/e2e/accessibility.spec.ts` — Доступность

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Доступность', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  const PAGES = ['/dashboard', '/decks', '/decks/new', '/groups', '/login'];

  for (const path of PAGES) {
    test(`${path}: нет критических a11y нарушений`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const critical = results.violations.filter(v => v.impact === 'critical');
      expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
    });
  }

  test('touch target: все кнопки минимум 44x44px на мобилке', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');

    const buttons = await page.locator('button, a[role="button"]').all();
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (!box) continue;
      // Touch target должен быть >= 44px в обоих измерениях
      expect(box.height, `Кнопка слишком маленькая: ${await btn.textContent()}`).toBeGreaterThanOrEqual(44);
    }
  });

  test('все img имеют alt текст', async ({ page }) => {
    await page.goto('/decks');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt, 'img без alt').not.toBeNull();
    }
  });

  test('форма создания набора: labels связаны с inputs', async ({ page }) => {
    await page.goto('/decks/new');
    const inputs = await page.locator('input, textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (!id) continue;
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeAttached();
    }
  });
});
```

#### `src/__tests__/e2e/design-tokens.spec.ts` — Токены на живых страницах

```ts
test.describe('Дизайн-токены на живых страницах', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('dashboard: фон #F7F5F0', async ({ page }) => {
    await page.goto('/dashboard');
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // #F7F5F0 = rgb(247, 245, 240)
    expect(bg).toBe('rgb(247, 245, 240)');
  });

  test('все страницы приложения: шрифт содержит Sora', async ({ page }) => {
    for (const path of ['/dashboard', '/decks', '/groups', '/login']) {
      await page.goto(path);
      const font = await page.evaluate(() =>
        getComputedStyle(document.body).fontFamily
      );
      expect(font.toLowerCase(), `${path}: нет Sora`).toContain('sora');
    }
  });

  test('primary кнопки: зелёный #057A55', async ({ page }) => {
    await page.goto('/decks/new');
    // Кнопка сохранения — primary
    const saveBtn = page.getByRole('button', { name: /сохранить|создать/i });
    const bg = await saveBtn.evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    // #057A55 = rgb(5, 122, 85)
    expect(bg).toBe('rgb(5, 122, 85)');
  });

  test('карточки: белый фон, rounded-2xl (24px)', async ({ page }) => {
    await page.goto('/decks');
    await page.waitForSelector('[data-testid="deck-card"]');

    const card = page.locator('[data-testid="deck-card"]').first();
    const bg = await card.evaluate(el => getComputedStyle(el).backgroundColor);
    const radius = await card.evaluate(el => getComputedStyle(el).borderRadius);

    expect(bg).toBe('rgb(255, 255, 255)');
    expect(radius).toBe('24px'); // rounded-2xl
  });

  test('sidebar: белый фон', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');

    const sidebar = page.locator('aside');
    const bg = await sidebar.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(255, 255, 255)');
  });
});
```

#### `src/__tests__/e2e/forms.spec.ts` — Формы

```ts
test.describe('Формы', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test.describe('Создание набора', () => {
    test.beforeEach(async ({ page }) => { await page.goto('/decks/new'); });

    test('пустая форма показывает ошибки валидации', async ({ page }) => {
      await page.getByRole('button', { name: /создать|сохранить/i }).click();
      await expect(page.getByText(/обязательное|заполните/i)).toBeVisible();
    });

    test('успешное создание редиректит на страницу набора', async ({ page }) => {
      await page.fill('[name=name]', 'Тестовый набор E2E');
      await page.getByRole('button', { name: /создать|сохранить/i }).click();
      await page.waitForURL(/\/decks\/.+/);
    });

    test('поле названия: focus ring зелёный', async ({ page }) => {
      const input = page.locator('[name=name]');
      await input.focus();
      const outline = await input.evaluate(el =>
        getComputedStyle(el).outlineColor || getComputedStyle(el).boxShadow
      );
      // Должен содержать зелёный цвет в ring
      expect(outline).toMatch(/5, 122, 85|057A55/);
    });

    test('кнопки на мобилке занимают полную ширину', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/decks/new');

      const btn = page.getByRole('button', { name: /создать|сохранить/i });
      const box = await btn.boundingBox();
      const viewport = page.viewportSize()!;

      // Кнопка должна занимать хотя бы 80% ширины экрана
      expect(box!.width).toBeGreaterThan(viewport.width * 0.8);
    });
  });

  test.describe('Создание группы', () => {
    test('форма доступна и работает', async ({ page }) => {
      await page.goto('/groups/new');
      await expect(page.getByRole('heading', { name: /группа|создать/i })).toBeVisible();
    });
  });
});
```

#### `src/__tests__/e2e/visual.spec.ts` — Скриншот-регрессия

```ts
import { test, expect } from '@playwright/test';

// Запуск: npx playwright test --update-snapshots  (первый раз — создаёт эталоны)
// Далее:  npx playwright test  (сравнивает с эталонами, пиксель-диффинг)

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812  },
  { name: 'desktop', width: 1440, height: 900  },
];

const PAGES = [
  { path: '/dashboard',  auth: true,  waitFor: '[data-testid="my-decks"]' },
  { path: '/decks',      auth: true,  waitFor: '[data-testid="decks-list"]' },
  { path: '/decks/new',  auth: true,  waitFor: 'form' },
  { path: '/groups',     auth: true,  waitFor: '[data-testid="groups-list"]' },
  { path: '/login',      auth: false, waitFor: 'form' },
];

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const { path, auth, waitFor } of PAGES) {
      test(`${path}`, async ({ page }) => {
        if (auth) await login(page);
        await page.goto(path);
        if (waitFor) await page.waitForSelector(waitFor, { timeout: 10_000 });
        // Ждём пока загрузятся шрифты
        await page.waitForFunction(() => document.fonts.ready);
        // Скрываем динамичный контент (даты, счётчики) чтобы не было diff'ов
        await page.addStyleTag({
          content: '[data-testid="review-count"], [data-testid="streak"] { visibility: hidden; }',
        });
        await expect(page).toHaveScreenshot(`${path.replace(/\//g, '_')}-${viewport.name}.png`, {
          maxDiffPixelRatio: 0.02, // допускаем 2% различий (anti-aliasing)
        });
      });
    }
  });
}
```

---

### 5. Скрипты запуска

**`package.json`:**

```json
{
  "scripts": {
    "test":                  "jest",
    "test:watch":            "jest --watch",
    "test:coverage":         "jest --coverage --coverageThreshold='{\"global\":{\"lines\":70}}'",
    "test:design-system":    "jest src/__tests__/design-system/",
    "test:ui":               "jest src/__tests__/ui/",
    "test:layout":           "jest src/__tests__/layout/",
    "test:e2e":              "playwright test",
    "test:e2e:visual":       "playwright test src/__tests__/e2e/visual.spec.ts",
    "test:e2e:responsive":   "playwright test src/__tests__/e2e/responsive.spec.ts",
    "test:e2e:a11y":         "playwright test src/__tests__/e2e/accessibility.spec.ts",
    "test:e2e:update":       "playwright test --update-snapshots",
    "test:before-deploy":    "npm test && npm run test:design-system"
  }
}
```

### Правило деплоя

```bash
# ОБЯЗАТЕЛЬНО перед каждым деплоем:
npm run test:before-deploy

# Включает:
# 1. Все unit тесты компонентов ui/
# 2. Тест дизайн-системы (нет raw стилей в страницах)
# 3. Тест шрифта (нет inline Sora вне root layout)
```

---

## Итог: что получим

| Шаг | Изменение | Видимый эффект |
|-----|-----------|----------------|
| 1 | Sora глобально | Единый шрифт везде включая auth |
| 2 | Dashboard → AppShell | Нет дублирования кода, sidebar на dashboard |
| 3 | ImmersiveShell | Чистый полноэкранный режим study/test |
| 4 | UI компоненты | Единые кнопки, инпуты, карточки |
| 5 | /decks/[id] рефакторинг | Корректная мобильная верстка деталей набора |
| 6 | Формы | Консистентные формы создания/редактирования |
| 7 | /decks grid | Читаемый список на мобилке |
| 8 | Группы | Мобильная верстка таблиц/списков |
| 9 | Auth | Единый визуальный стиль от входа до работы |
| 10 | testid | Автотесты для регрессии |
