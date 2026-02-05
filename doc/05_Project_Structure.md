# Project Structure & Setup Guide

## 1. QUICK START COMMANDS

```bash
# 1. Create Next.js project
npx create-next-app@latest flashcards-app \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd flashcards-app

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install react-hook-form zod @hookform/resolvers
npm install zustand

# 3. Create .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env.local

# 4. Run dev server
npm run dev
```

---

## 2. COMPLETE PROJECT STRUCTURE

```
flashcards-app/
│
├── .env.local                       # Environment variables (NEVER commit)
├── .gitignore                       # Git ignore (include .env.local)
├── next.config.js                   # Next.js configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── README.md                        # Project documentation
│
├── public/                          # Static assets
│   ├── favicon.ico
│   └── avatars/                     # Placeholder avatars
│       ├── student-1.png
│       └── student-2.png
│
├── src/                             # Source code
│   │
│   ├── app/                         # Next.js 14 App Router
│   │   ├── layout.tsx               # Root layout (Provider wrappers)
│   │   ├── page.tsx                 # Landing page (/)
│   │   ├── globals.css              # Global styles
│   │   │
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── layout.tsx           # Auth layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   └── register/
│   │   │       └── page.tsx         # Registration page
│   │   │
│   │   ├── onboarding/              # Onboarding flow
│   │   │   └── page.tsx             # Add children profiles
│   │   │
│   │   ├── dashboard/               # Profile selector
│   │   │   └── page.tsx             # "Who's studying?" screen
│   │   │
│   │   ├── admin/                   # Admin (Parent) routes
│   │   │   ├── layout.tsx           # Admin layout with sidebar
│   │   │   ├── decks/
│   │   │   │   ├── page.tsx         # Deck list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx     # Create deck
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # Deck detail (cards list)
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx # Edit deck
│   │   │   │       └── import/
│   │   │   │           └── page.tsx # CSV import
│   │   │   ├── stats/
│   │   │   │   └── page.tsx         # Children's stats
│   │   │   └── settings/
│   │   │       └── page.tsx         # Family settings
│   │   │
│   │   ├── student/                 # Student (Child) routes
│   │   │   ├── layout.tsx           # Student layout
│   │   │   ├── decks/
│   │   │   │   └── page.tsx         # Deck list with progress
│   │   │   ├── study/
│   │   │   │   └── [deckId]/
│   │   │   │       └── page.tsx     # Flashcards mode
│   │   │   ├── review/
│   │   │   │   └── page.tsx         # Review mode
│   │   │   ├── test/
│   │   │   │   └── [deckId]/
│   │   │   │       └── page.tsx     # Test mode (Phase 5)
│   │   │   └── stats/
│   │   │       └── page.tsx         # Student stats
│   │   │
│   │   ├── api/                     # API routes (if needed)
│   │   │   └── tts/
│   │   │       └── route.ts         # TTS cache generation (future)
│   │   │
│   │   └── test/                    # Development test pages
│   │       └── page.tsx             # DB connection test
│   │
│   ├── components/                  # React components
│   │   │
│   │   ├── ui/                      # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── progress.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx           # App header
│   │   │   ├── Sidebar.tsx          # Admin sidebar
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── flashcard/               # Flashcard components
│   │   │   ├── FlashcardViewer.tsx  # Main flashcard component
│   │   │   ├── FlashcardControls.tsx # Answer buttons
│   │   │   ├── ProgressBar.tsx      # Session progress
│   │   │   └── DirectionSelector.tsx # RU→EN / EN→RU
│   │   │
│   │   ├── deck/                    # Deck components
│   │   │   ├── DeckList.tsx         # Deck grid/list
│   │   │   ├── DeckCard.tsx         # Single deck card
│   │   │   ├── DeckForm.tsx         # Create/edit deck form
│   │   │   └── DeckStats.tsx        # Deck progress widget
│   │   │
│   │   ├── card/                    # Card management components
│   │   │   ├── CardList.tsx         # List of cards in deck
│   │   │   ├── CardItem.tsx         # Single card row
│   │   │   ├── CardForm.tsx         # Add/edit card form
│   │   │   └── CardPreview.tsx      # Card preview modal
│   │   │
│   │   ├── import/                  # Import components
│   │   │   ├── CSVUploader.tsx      # CSV file input
│   │   │   ├── CSVPreview.tsx       # Preview table
│   │   │   └── ImportErrors.tsx     # Validation errors
│   │   │
│   │   └── stats/                   # Statistics components
│   │       ├── StatCard.tsx         # Stat widget
│   │       ├── ProgressChart.tsx    # Progress visualization
│   │       └── ActivityCalendar.tsx # GitHub-style calendar (future)
│   │
│   ├── contexts/                    # React Context providers
│   │   └── AuthContext.tsx          # Auth state (current user + profile)
│   │
│   ├── lib/                         # Core utilities
│   │   │
│   │   ├── supabase/                # Supabase client
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client (for SSR)
│   │   │   └── types.ts             # Generated types
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts           # Authentication hook
│   │   │   ├── useProfile.ts        # Profile management hook
│   │   │   ├── useDecks.ts          # Deck CRUD hook
│   │   │   ├── useCards.ts          # Card CRUD hook
│   │   │   ├── useStudySession.ts   # Study session hook
│   │   │   └── useProgress.ts       # Progress tracking hook
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── tts.ts               # Text-to-Speech helper
│   │   │   ├── csv-parser.ts        # CSV parsing & validation
│   │   │   ├── progress-calculator.ts # Progress calculations
│   │   │   ├── date-formatter.ts    # Date/time formatting
│   │   │   └── cn.ts                # Tailwind className merger
│   │   │
│   │   ├── types/                   # TypeScript types
│   │   │   ├── database.types.ts    # Generated from Supabase
│   │   │   ├── deck.types.ts
│   │   │   ├── card.types.ts
│   │   │   └── session.types.ts
│   │   │
│   │   └── constants/               # App constants
│   │       ├── routes.ts            # Route paths
│   │       └── config.ts            # App configuration
│   │
│   └── middleware.ts                # Next.js middleware (auth check)
│
├── supabase/                        # Supabase migrations (optional)
│   ├── migrations/
│   │   ├── 20240101000000_initial_schema.sql
│   │   └── 20240102000000_add_rls_policies.sql
│   └── seed.sql                     # Seed data for testing
│
└── docs/                            # Project documentation
    ├── 01_PRD_Requirements.md
    ├── 02_Users_JTBD.md
    ├── 03_Architecture_Database.md
    └── 04_Development_Roadmap.md
```

---

## 3. KEY FILES CONTENT

### 3.1 `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Optional: Service role key (only for server-side admin operations)
# SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

### 3.2 `src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
```

---

### 3.3 `src/lib/supabase/types.ts`

```typescript
// This file should be auto-generated from Supabase
// Run: npx supabase gen types typescript --project-id xxx > src/lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // ... other tables
    };
  };
};
```

---

### 3.4 `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'FlashCards — Учи английский с семьёй',
  description: 'Персональное приложение для изучения английского языка',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

### 3.5 `src/middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to dashboard if authenticated and on auth pages
  if (session && (
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register')
  )) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/student/:path*',
    '/login',
    '/register',
  ],
};
```

---

### 3.6 `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        success: {
          DEFAULT: '#10B981', // Green
          500: '#10B981',
          600: '#059669',
        },
        danger: {
          DEFAULT: '#EF4444', // Red
          500: '#EF4444',
          600: '#DC2626',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

### 3.7 `package.json`

```json
{
  "name": "flashcards-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "supabase:types": "npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "@supabase/supabase-js": "^2.39.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.330.0",
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7.50.0",
    "tailwind-merge": "^2.2.1",
    "zod": "^3.22.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

---

## 4. FOLDER NAMING CONVENTIONS

### Route Naming
- Use kebab-case: `/admin/decks/new` ✅
- Not camelCase: `/admin/decksNew` ❌

### Component Naming
- Use PascalCase: `FlashcardViewer.tsx` ✅
- Not camelCase: `flashcardViewer.tsx` ❌

### Utility Naming
- Use kebab-case: `csv-parser.ts` ✅
- Not snake_case: `csv_parser.ts` ❌

### Hook Naming
- Use camelCase with "use" prefix: `useStudySession.ts` ✅

---

## 5. IMPORT ALIASES

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage:**
```typescript
// ✅ Good
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FlashcardViewer } from '@/components/flashcard/FlashcardViewer';

// ❌ Bad (relative imports)
import { supabase } from '../../../lib/supabase/client';
```

---

## 6. COMPONENT ORGANIZATION PATTERNS

### 6.1 Feature-Based Components

Each feature has its own folder:
```
components/
├── flashcard/       # Flashcard feature
│   ├── FlashcardViewer.tsx
│   ├── FlashcardControls.tsx
│   └── ProgressBar.tsx
├── deck/            # Deck management feature
│   ├── DeckList.tsx
│   └── DeckCard.tsx
└── ui/              # Shared UI components
    ├── button.tsx
    └── card.tsx
```

### 6.2 Component File Structure

```typescript
// FlashcardViewer.tsx

'use client'; // If needs client-side features

import { useState } from 'react';
import { SomeOtherComponent } from './SomeOtherComponent';

// 1. Types
type FlashcardViewerProps = {
  card: Card;
  onAnswer: (correct: boolean) => void;
};

// 2. Component
export function FlashcardViewer({ card, onAnswer }: FlashcardViewerProps) {
  // State
  const [flipped, setFlipped] = useState(false);

  // Handlers
  function handleFlip() {
    setFlipped(true);
  }

  // Render
  return (
    <div onClick={handleFlip}>
      {/* ... */}
    </div>
  );
}

// 3. Subcomponents (if small and only used here)
function FlashcardBack({ text }: { text: string }) {
  return <p>{text}</p>;
}
```

---

## 7. STATE MANAGEMENT STRATEGY

### 7.1 Local State (useState)
Use for: UI state, form inputs, toggles
```typescript
const [isOpen, setIsOpen] = useState(false);
```

### 7.2 Context API
Use for: Global app state (current profile, auth)
```typescript
const { currentProfile, selectProfile } = useProfile();
```

### 7.3 Zustand (Optional)
Use for: Complex state logic
```typescript
const useStore = create((set) => ({
  cards: [],
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
}));
```

### 7.4 Server State (Supabase)
Use for: Database queries (not stored in React state)
```typescript
const { data, error } = await supabase.from('cards').select('*');
```

---

## 8. STYLING CONVENTIONS

### 8.1 Tailwind CSS Classes

```typescript
// ✅ Good — organized and readable
<button className="
  px-6 py-3 
  bg-blue-600 hover:bg-blue-700 
  text-white font-semibold 
  rounded-lg 
  transition-colors
">
  Click me
</button>

// ❌ Bad — hard to read
<button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
  Click me
</button>
```

### 8.2 cn() Helper (Tailwind Merge)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage:
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className // from props
)}>
```

---

## 9. ERROR HANDLING PATTERNS

### 9.1 Supabase Errors

```typescript
async function createDeck(title: string) {
  try {
    const { data, error } = await supabase
      .from('decks')
      .insert({ title })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create deck:', err);
    // Show toast or error message to user
    return null;
  }
}
```

### 9.2 Loading States

```typescript
function DeckList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('decks').select('*');
      if (error) throw error;
      setDecks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (decks.length === 0) return <div>Нет наборов</div>;

  return <div>{/* Render decks */}</div>;
}
```

---

## 10. TESTING STRATEGY

### 10.1 Manual Testing Checklist

After each milestone, test:
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Forms submit successfully
- [ ] Database updates reflect in UI
- [ ] Navigation works
- [ ] Browser console has no errors

### 10.2 Test Data

Create seed data for testing:
```sql
-- supabase/seed.sql
INSERT INTO families (id, name) VALUES
  ('test-family-id', 'Test Family');

INSERT INTO profiles (id, family_id, display_name, role) VALUES
  ('test-admin-id', 'test-family-id', 'Test Admin', 'admin'),
  ('test-student-id', 'test-family-id', 'Test Student', 'student');

INSERT INTO decks (id, family_id, title) VALUES
  ('test-deck-id', 'test-family-id', 'Test Deck');

INSERT INTO cards (deck_id, ru_text, en_text, position) VALUES
  ('test-deck-id', 'первый', 'first', 1),
  ('test-deck-id', 'второй', 'second', 2);
```

---

## 11. GIT WORKFLOW

### 11.1 Branch Strategy

```bash
main         # Production-ready code
└── develop  # Development branch
    ├── feature/auth
    ├── feature/flashcards
    └── feature/stats
```

### 11.2 Commit Message Format

```
type(scope): description

feat(auth): add registration flow
fix(cards): resolve TTS pronunciation issue
refactor(ui): simplify FlashcardViewer component
docs(readme): update setup instructions
```

### 11.3 When to Commit

✅ After each working milestone:
- ✅ "feat(auth): implement login page"
- ✅ "feat(decks): add deck creation form"
- ✅ "feat(flashcards): implement card flipping"

❌ Don't commit:
- ❌ Broken code
- ❌ console.log() statements everywhere
- ❌ .env files

---

## 12. DEPLOYMENT CHECKLIST

### 12.1 Pre-Deploy

- [ ] All features work locally
- [ ] No console errors
- [ ] Database migrations applied
- [ ] Environment variables set in Vercel
- [ ] Build succeeds: `npm run build`
- [ ] TypeScript checks pass: `npm run type-check`

### 12.2 Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### 12.3 Environment Variables in Vercel

Add to Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## 13. TROUBLESHOOTING COMMON ISSUES

### Issue 1: "Module not found"
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### Issue 2: Supabase connection fails
- Check `.env.local` exists
- Verify SUPABASE_URL and ANON_KEY are correct
- Restart dev server after changing .env

### Issue 3: TypeScript errors
```bash
# Regenerate types from Supabase
npm run supabase:types
```

### Issue 4: Build fails on Vercel
- Check build logs
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

---

## 14. PERFORMANCE OPTIMIZATION

### 14.1 Next.js Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/avatars/student-1.png"
  alt="Student avatar"
  width={100}
  height={100}
  priority // For above-the-fold images
/>
```

### 14.2 Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/stats/Chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false // Disable SSR for client-only components
});
```

### 14.3 Supabase Query Optimization

```typescript
// ✅ Good — only fetch needed fields
const { data } = await supabase
  .from('cards')
  .select('id, ru_text, en_text')
  .eq('deck_id', deckId);

// ❌ Bad — fetches everything
const { data } = await supabase
  .from('cards')
  .select('*')
  .eq('deck_id', deckId);
```

---

## 15. SECURITY BEST PRACTICES

### 15.1 Never Expose Secrets

```typescript
// ❌ NEVER do this
const serviceRoleKey = 'eyJhbGciOiJIUzI1...'; // Hardcoded secret

// ✅ Always use environment variables
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### 15.2 Validate User Input

```typescript
import { z } from 'zod';

const deckSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// Validate before saving
const result = deckSchema.safeParse(formData);
if (!result.success) {
  // Show errors
  return;
}
```

### 15.3 Use RLS Policies

Always enable Row Level Security on all tables:
```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family decks"
  ON decks FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM profiles WHERE id = auth.uid()
  ));
```

---

## 16. ACCESSIBILITY (A11Y) GUIDELINES

### 16.1 Semantic HTML

```typescript
// ✅ Good
<button onClick={handleClick}>Click me</button>
<nav>...</nav>
<main>...</main>

// ❌ Bad
<div onClick={handleClick}>Click me</div>
<div>...</div>
```

### 16.2 ARIA Labels

```typescript
<button aria-label="Play pronunciation">
  <Volume2 />
</button>

<input
  type="text"
  aria-label="Russian text"
  aria-describedby="ru-text-help"
/>
<span id="ru-text-help">Enter the word in Russian</span>
```

### 16.3 Keyboard Navigation

```typescript
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Clickable div
</div>
```

---

## 17. DOCUMENTATION MAINTENANCE

### 17.1 Keep README Updated

```markdown
# FlashCards App

## Setup
1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env.local`
4. Update Supabase credentials
5. `npm run dev`

## Features
- ✅ Authentication
- ✅ Deck management
- ✅ Flashcards mode
- 🚧 Testing mode (in progress)

## Tech Stack
- Next.js 14
- Supabase
- TypeScript
- Tailwind CSS
```

### 17.2 Code Comments

```typescript
// ✅ Good — explains WHY
// We shuffle cards to prevent memorizing order
const shuffled = cards.sort(() => Math.random() - 0.5);

// ❌ Bad — explains WHAT (obvious from code)
// Sort cards randomly
const shuffled = cards.sort(() => Math.random() - 0.5);
```

---

## 18. FINAL CHECKLIST BEFORE CURSOR/CLAUDE CODE

Before handing off to Cursor or Claude Code:

- [ ] All documentation files are present:
  - [ ] 01_PRD_Requirements.md
  - [ ] 02_Users_JTBD.md
  - [ ] 03_Architecture_Database.md
  - [ ] 04_Development_Roadmap.md
  - [ ] 05_Project_Structure.md (this file)

- [ ] Project structure is clear and organized
- [ ] Database schema is defined in SQL
- [ ] Development phases are broken into testable milestones
- [ ] All acceptance criteria are defined
- [ ] Tech stack is decided and documented

**Ready to code!** 🚀
