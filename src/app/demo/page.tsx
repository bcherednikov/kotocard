import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const mockDecks = [
  {
    id: '1',
    name: 'The Hare and the Tortoise',
    description: 'Классическая сказка Эзопа',
    tags: ['stories', 'beginner'],
    mastered: 0,
    total: 24,
    percent: 0,
    readyForReview: 0,
  },
  {
    id: '2',
    name: 'Чувства и эмоции',
    description: 'Слова для описания эмоций',
    tags: ['emotions', 'intermediate'],
    mastered: 14,
    total: 35,
    percent: 40,
    readyForReview: 3,
  },
  {
    id: '3',
    name: 'Colours & Shapes',
    description: null,
    tags: ['beginner'],
    mastered: 20,
    total: 20,
    percent: 100,
    readyForReview: 0,
  },
];

const stats = [
  { label: 'Выучено слов', value: 34, icon: '📝', color: 'text-emerald-600' },
  { label: 'Всего слов', value: 79, icon: '📚', color: 'text-blue-600' },
  { label: 'К повторению', value: 3, icon: '🔄', color: 'text-orange-500' },
  { label: 'Освоено', value: '43%', icon: '⭐', color: 'text-purple-600' },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-semibold tracking-tight">KotoCard</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100">
              Оригинал →
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Добрый день, Борис 👋</h1>
          <p className="text-gray-500 mt-1 text-sm">Продолжай учиться — ты на правильном пути.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="shadow-none border-gray-100">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</span>
                  <span className="text-lg">{s.icon}</span>
                </div>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Review banner */}
        <Card className="border-orange-100 bg-orange-50 shadow-none">
          <CardContent className="py-5 px-6 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <span>🔄</span> 3 слова ждут повторения
              </div>
              <div className="text-sm text-gray-500 mt-0.5">Лучше повторить сейчас, пока не забыл</div>
            </div>
            <Link href="/review" className="shrink-0 inline-flex items-center px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">
              Повторить
            </Link>
          </CardContent>
        </Card>

        <Separator />

        {/* Deck list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Мои наборы</h2>
            <Link href="/decks" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
              Все наборы →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDecks.map((deck) => (
              <Card key={deck.id} className="hover:shadow-md transition-shadow shadow-none border-gray-100 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {deck.name}
                    </CardTitle>
                    {deck.readyForReview > 0 && (
                      <Badge variant="amber" className="shrink-0 text-xs">
                        🔄 {deck.readyForReview}
                      </Badge>
                    )}
                    {deck.percent === 100 && (
                      <Badge variant="green" className="shrink-0 text-xs">
                        ✓ Готово
                      </Badge>
                    )}
                  </div>
                  {deck.description && (
                    <CardDescription className="text-xs line-clamp-1">{deck.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><span className="font-semibold text-gray-900">{deck.mastered}</span> выучено</span>
                    <span><span className="font-semibold text-gray-900">{deck.total}</span> всего</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={deck.percent} className="h-1.5" />
                    <div className="text-xs text-gray-400">{deck.percent}% освоено</div>
                  </div>
                  {deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {deck.tags.map(tag => (
                        <Badge key={tag} variant="gray" className="text-[10px] px-1.5 py-0 font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Streak */}
        <Card className="shadow-none border-gray-100">
          <CardContent className="py-5 px-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl shrink-0">🔥</div>
            <div>
              <div className="font-semibold text-gray-900">Серия: 7 дней подряд</div>
              <div className="text-sm text-gray-400">Не пропусти сегодня — сохрани streak!</div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
