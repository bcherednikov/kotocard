'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { getDecksSrsStats, getReviewCount } from '@/lib/srs/queries';
import type { DeckSrsStats } from '@/lib/srs/types';
import { getStreakData, getTodayActivity, getLast7Days } from '@/lib/analytics/queries';
import type { StreakData, TodayProgress, Last7Days } from '@/lib/analytics/types';
import { motion, useSpring, useTransform, type MotionValue, useInView } from 'motion/react';

/* ─── Types ─── */
type Deck = { id: string; name: string; description: string | null; tags: string[]; owner_id: string };
type DeckWithStats = Deck & { stats: DeckSrsStats };
type GroupWithDecks = { id: string; name: string; decks: DeckWithStats[] };

const emptySrs: DeckSrsStats = {
  total: 0, newCount: 0, learningCount: 0, testingCount: 0,
  youngCount: 0, matureCount: 0, relearningCount: 0,
  masteredCount: 0, masteryPercent: 0, readyForReview: 0, readyForTesting: 0,
};

/* ─── Animated number ─── */
function Num({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.6, stiffness: 80, damping: 16 });
  const display: MotionValue<string> = useTransform(spring, (v: number) => Math.round(v).toLocaleString('ru-RU'));
  useEffect(() => { spring.set(value); }, [spring, value]);
  return <motion.span>{display}</motion.span>;
}

/* ─── Цвет карточки по этапу ───
   Изучение     → amber  (жёлтый)
   Тестирование → indigo (синий)
   Повторение   → teal   (зелёный)
─────────────────────────────── */
const STAGE_PAL = {
  'Изучение':     { border: 'border-l-amber-400',  iconBg: 'bg-amber-50',  dot: 'bg-amber-400',  bar: 'bg-amber-400',  stage: 'text-amber-500'  },
  'Тестирование': { border: 'border-l-indigo-400', iconBg: 'bg-indigo-50', dot: 'bg-indigo-400', bar: 'bg-indigo-500', stage: 'text-indigo-500' },
  'Повторение':   { border: 'border-l-teal-500',   iconBg: 'bg-teal-50',   dot: 'bg-teal-500',   bar: 'bg-teal-500',   stage: 'text-teal-600'   },
} as const;

function getDeckStage(s: DeckSrsStats): { label: string; percent: number } {
  if (s.total === 0) return { label: 'Изучение', percent: 0 };
  if (s.masteryPercent === 100) return { label: 'Завершён', percent: 100 };
  const rv = (s.youngCount + s.matureCount) / s.total;
  const ts = (s.learningCount + s.testingCount + s.youngCount + s.matureCount) / s.total;
  if (rv > 0.3) return { label: 'Повторение', percent: Math.round(rv * 100) };
  if (ts > 0.1) return { label: 'Тестирование', percent: Math.round(ts * 100) };
  return { label: 'Изучение', percent: s.masteryPercent };
}

/* ─── Review widget (используется в мобильном блоке) ─── */
function ReviewWidget({ count }: { count: number }) {
  return (
    <Link href="/review">
      <motion.div
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' }}
      >
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
        />
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-0.5 uppercase tracking-wide">К повторению</p>
          <p className="text-white font-black text-2xl leading-none mb-3">
            <Num value={count} />
            <span className="text-sm font-normal text-white/60 ml-1">карточек</span>
          </p>
          <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
            Начать
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── Deck card ─── */
function DeckCard({ deck, delay = 0 }: { deck: DeckWithStats; delay?: number }) {
  const stage = getDeckStage(deck.stats);
  const pal = STAGE_PAL[stage.label as keyof typeof STAGE_PAL] ?? STAGE_PAL['Изучение'];
  const { total, masteryPercent, readyForReview } = deck.stats;
  const mastered = masteryPercent === 100 && total > 0;

  if (mastered) {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}>
        <Link href={`/decks/${deck.id}`}>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl p-4 h-full cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' }}
          >
            <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
              className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
            <div className="relative">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-400/20 text-amber-300 rounded-full px-2 py-0.5 mb-2">
                ★ Завершён
              </span>
              <h3 className="font-bold text-white text-sm leading-snug mb-1">{deck.name}</h3>
              {deck.description && <p className="text-white/50 text-xs line-clamp-1 mb-2">{deck.description}</p>}
              <div className="text-white/60 text-xs">{total} / {total} слов</div>
              <div className="w-full h-1 bg-white/20 rounded-full mt-1.5">
                <div className="h-full bg-amber-400 rounded-full w-full" />
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}>
      <Link href={`/decks/${deck.id}`}>
        <motion.div whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} transition={{ duration: 0.2 }}
          className={`bg-white rounded-2xl border-l-4 ${pal.border} border-t border-r border-b border-gray-100 p-4 h-full cursor-pointer group shadow-sm`}
        >
          <div className="flex items-start justify-between mb-2.5">
            <div className={`w-7 h-7 ${pal.iconBg} rounded-lg flex items-center justify-center`}>
              <div className={`w-2 h-2 ${pal.dot} rounded-full`} />
            </div>
            {readyForReview > 0 && (
              <span className="text-xs font-semibold bg-orange-50 text-orange-500 rounded-full px-2 py-0.5 border border-orange-100">
                {readyForReview}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-0.5 group-hover:text-[#057A55] transition-colors line-clamp-2">
            {deck.name}
          </h3>
          {deck.description && <p className="text-gray-400 text-xs mb-2.5 line-clamp-1">{deck.description}</p>}
          {total > 0 && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${pal.stage}`}>{stage.label}</span>
                <span className="text-xs text-gray-400">{stage.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className={`h-full ${pal.bar} rounded-full`}
                  initial={{ width: 0 }} animate={{ width: `${stage.percent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: delay + 0.15 }} />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">{deck.stats.masteredCount} / {total}</div>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─── Analytics strip ─── */
function AnalyticsStrip({ streak, last7, today, totalMastered, wordsThisWeek }: {
  streak: StreakData; last7: Last7Days[]; today: TodayProgress;
  totalMastered: number; wordsThisWeek: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const todayPct = Math.min(100, (today.total / today.goal) * 100);

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="flex items-center gap-4 mb-6 flex-wrap"
    >
      <div className="flex items-center gap-1">
        <span className="text-sm">🔥</span>
        <span className="text-sm font-bold text-gray-800">{inView ? <Num value={streak.currentStreak} /> : 0}</span>
        <span className="text-xs text-gray-400">дн.</span>
      </div>
      <div className="w-px h-3.5 bg-gray-200" />
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-gray-800">{inView ? <Num value={totalMastered} /> : 0}</span>
        <span className="text-xs text-gray-400">выучено</span>
      </div>
      <div className="w-px h-3.5 bg-gray-200" />
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-gray-800">{inView ? <Num value={wordsThisWeek} /> : 0}</span>
        <span className="text-xs text-gray-400">за неделю</span>
      </div>
      <div className="w-px h-3.5 bg-gray-200 hidden sm:block" />
      {last7.length > 0 && (
        <div className="hidden sm:flex items-center gap-0.5">
          {last7.map((d, i) => (
            <motion.div key={d.date} initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.04 * i, duration: 0.15 }}
              className={`w-3.5 h-3.5 rounded-[3px] ${d.completed ? 'bg-[#057A55]' : 'bg-gray-200'}`}
              title={d.dayLabel} />
          ))}
        </div>
      )}
      <div className="w-px h-3.5 bg-gray-200 hidden sm:block" />
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-xs text-gray-400">Цель {today.total}/{today.goal}</span>
        <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${today.completed ? 'bg-[#057A55]' : 'bg-amber-400'}`}
            initial={{ width: 0 }} animate={inView ? { width: `${todayPct}%` } : {}}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main page ─── */
export default function DashboardV4Page() {
  const { user, profile } = useAuth();
  const [myDecks, setMyDecks] = useState<DeckWithStats[]>([]);
  const [groupSections, setGroupSections] = useState<GroupWithDecks[]>([]);
  const [reviewReady, setReviewReady] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastActiveDate: null });
  const [today, setToday] = useState<TodayProgress>({ wordsStudied: 0, reviewsCompleted: 0, total: 0, goal: 10, completed: false });
  const [last7, setLast7] = useState<Last7Days[]>([]);
  const [totalMastered, setTotalMastered] = useState(0);
  const [wordsThisWeek, setWordsThisWeek] = useState(0);

  useEffect(() => { if (user && profile) load(); }, [user, profile]);

  async function load() {
    if (!user) return;
    try {
      const { data: ownDecks } = await supabase
        .from('decks').select('id, name, description, tags, owner_id')
        .eq('owner_id', user.id).order('created_at', { ascending: false });

      const groupMap = new Map<string, { id: string; name: string; decks: Deck[] }>();
      const allGroupDecks: Deck[] = [];
      const { data: myGroups } = await supabase
        .from('group_members').select('group_id, groups(id, name)').eq('user_id', user.id);

      if (myGroups?.length) {
        for (const mg of myGroups) {
          const g = mg.groups as any;
          if (g) groupMap.set(g.id, { id: g.id, name: g.name, decks: [] });
        }
        const { data: gDecks } = await supabase
          .from('group_decks').select('group_id, deck:decks(id, name, description, tags, owner_id)')
          .in('group_id', myGroups.map(g => g.group_id));
        if (gDecks) {
          const seen = new Set<string>();
          for (const gd of gDecks) {
            const d = gd.deck as unknown as Deck;
            if (!d) continue;
            groupMap.get(gd.group_id)?.decks.push(d);
            if (!seen.has(d.id)) { seen.add(d.id); allGroupDecks.push(d); }
          }
        }
      }

      const allDecks = [...(ownDecks || []), ...allGroupDecks];
      const ids = allDecks.map(d => d.id);

      const [statsMap, rc, st, td, l7] = await Promise.all([
        ids.length ? getDecksSrsStats(supabase, user.id, ids) : Promise.resolve(new Map<string, DeckSrsStats>()),
        getReviewCount(supabase, user.id),
        getStreakData(supabase, user.id).catch(() => ({ currentStreak: 0, longestStreak: 0, lastActiveDate: null } as StreakData)),
        getTodayActivity(supabase, user.id).catch(() => ({ wordsStudied: 0, reviewsCompleted: 0, total: 0, goal: 10, completed: false } as TodayProgress)),
        getLast7Days(supabase, user.id).catch(() => [] as Last7Days[]),
      ]);

      const ws = (decks: Deck[]) => decks.map(d => ({ ...d, stats: statsMap.get(d.id) ?? emptySrs }));
      const allWS = ws(allDecks);
      let mastered = 0, week = 0;
      for (const d of allWS) mastered += d.stats.masteredCount;
      for (const d of l7) if (d.completed) week++;

      setMyDecks(ws(ownDecks || []));
      const secs: GroupWithDecks[] = [];
      for (const [, e] of groupMap) if (e.decks.length) secs.push({ id: e.id, name: e.name, decks: ws(e.decks) });
      setGroupSections(secs);
      setReviewReady(rc);
      setStreak(st); setToday(td); setLast7(l7);
      setTotalMastered(mastered); setWordsThisWeek(week);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const displayName = profile?.display_name ?? user?.email ?? '';
  const hasContent = myDecks.length > 0 || groupSections.length > 0;

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }}
        className="text-gray-400 text-sm">Загрузка...</motion.div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto md:mx-0">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">
          Привет, {displayName} 👋
        </h1>
      </motion.div>

      {/* Review block — только на мобиле */}
      {reviewReady > 0 && (
        <div className="md:hidden mb-4">
          <ReviewWidget count={reviewReady} />
        </div>
      )}

      {/* Analytics */}
      <AnalyticsStrip streak={streak} last7={last7} today={today}
        totalMastered={totalMastered} wordsThisWeek={wordsThisWeek} />

      {/* Decks */}
      {hasContent ? (
        <>
          {myDecks.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Мои наборы</h2>
                <Link href="/decks" className="text-xs text-[#057A55] font-medium hover:underline">Все →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {myDecks.slice(0, 9).map((d, i) => <DeckCard key={d.id} deck={d} delay={0.1 + i * 0.05} />)}
              </div>
              {myDecks.length > 9 && (
                <div className="mt-3 text-center">
                  <Link href="/decks" className="text-xs text-[#057A55] font-medium hover:underline">
                    Ещё {myDecks.length - 9} наборов →
                  </Link>
                </div>
              )}
            </section>
          )}

          {groupSections.map((g, gi) => (
            <section key={g.id} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {g.name}
                </h2>
                <Link href={`/groups/${g.id}`} className="text-xs text-[#057A55] font-medium hover:underline">Открыть →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {g.decks.slice(0, 9).map((d, i) => <DeckCard key={d.id} deck={d} delay={0.15 + gi * 0.05 + i * 0.05} />)}
              </div>
              {g.decks.length > 9 && (
                <div className="mt-3 text-center">
                  <Link href={`/groups/${g.id}`} className="text-xs text-[#057A55] font-medium hover:underline">
                    Ещё {g.decks.length - 9} наборов →
                  </Link>
                </div>
              )}
            </section>
          ))}
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Пока нет наборов</p>
          <p className="text-xs text-gray-400 mb-5">Создайте первый набор карточек</p>
          <Link href="/decks/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#057A55] text-white text-sm font-semibold rounded-xl hover:bg-[#046b4a] transition">
            Создать набор
          </Link>
        </motion.div>
      )}
    </div>
  );
}
