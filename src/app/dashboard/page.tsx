'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { getDecksSrsStats, getReviewCount } from '@/lib/srs/queries';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import type { DeckSrsStats } from '@/lib/srs/types';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  owner_id: string;
};

type DeckWithStats = Deck & { stats: DeckSrsStats };

type GroupWithDecks = {
  id: string;
  name: string;
  decks: DeckWithStats[];
};

const emptySrsStats: DeckSrsStats = {
  total: 0, newCount: 0, learningCount: 0, testingCount: 0,
  youngCount: 0, matureCount: 0, relearningCount: 0,
  masteredCount: 0, masteryPercent: 0, readyForReview: 0, readyForTesting: 0,
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [myDecks, setMyDecks] = useState<DeckWithStats[]>([]);
  const [groupSections, setGroupSections] = useState<GroupWithDecks[]>([]);
  const [reviewReady, setReviewReady] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) loadData();
  }, [user, profile]);

  async function loadData() {
    if (!user || !profile) return;

    try {
      // Load personal decks (owner_id = me)
      const { data: ownDecks, error: ownErr } = await supabase
        .from('decks')
        .select('id, name, description, tags, owner_id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (ownErr) throw ownErr;

      // Load group decks organized by group
      const groupMap = new Map<string, { id: string; name: string; decks: Deck[] }>();
      const allGroupDecks: Deck[] = [];
      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id, groups(id, name)')
        .eq('user_id', user.id);

      if (myGroups && myGroups.length > 0) {
        const groupIds = myGroups.map(g => g.group_id);
        // Init group map
        for (const mg of myGroups) {
          const g = mg.groups as any;
          if (g) groupMap.set(g.id, { id: g.id, name: g.name, decks: [] });
        }

        const { data: gDecks } = await supabase
          .from('group_decks')
          .select('group_id, deck:decks(id, name, description, tags, owner_id)')
          .in('group_id', groupIds);

        if (gDecks) {
          const seen = new Set<string>();
          for (const gd of gDecks) {
            const d = gd.deck as unknown as Deck;
            if (!d) continue;
            const entry = groupMap.get(gd.group_id);
            if (entry) entry.decks.push(d);
            if (!seen.has(d.id)) {
              seen.add(d.id);
              allGroupDecks.push(d);
            }
          }
        }
      }

      const allDecks = [...(ownDecks || []), ...allGroupDecks];
      const allDeckIds = allDecks.map(d => d.id);

      const [statsMap, reviewCount] = await Promise.all([
        allDeckIds.length > 0
          ? getDecksSrsStats(supabase, user.id, allDeckIds)
          : Promise.resolve(new Map<string, DeckSrsStats>()),
        getReviewCount(supabase, user.id),
      ]);

      const withStats = (decks: Deck[]): DeckWithStats[] =>
        decks.map(d => ({ ...d, stats: statsMap.get(d.id) ?? emptySrsStats }));

      setMyDecks(withStats(ownDecks || []));
      // Build group sections with stats
      const sections: GroupWithDecks[] = [];
      for (const [, entry] of groupMap) {
        if (entry.decks.length > 0) {
          sections.push({ id: entry.id, name: entry.name, decks: withStats(entry.decks) });
        }
      }
      setGroupSections(sections);
      setReviewReady(reviewCount);
      setError(null);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">&#10060;</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const hasNoDecks = myDecks.length === 0 && groupSections.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Привет, {profile?.display_name}!
          </h1>
        </div>

        {/* Review widget */}
        {reviewReady > 0 && (
          <Link
            href="/review"
            className="block mb-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition border-4 border-yellow-400"
          >
            <div className="text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔄</div>
                <div>
                  <h3 className="text-2xl font-bold">Повторение</h3>
                  <p className="text-orange-100 text-sm">
                    Карточки из всех наборов, которые пора повторить
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold">
                  {reviewReady} к повторению
                </span>
                <div className="text-2xl mt-1">→</div>
              </div>
            </div>
          </Link>
        )}

        {hasNoDecks ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Пока нет наборов
            </h2>
            <p className="text-gray-700 mb-6">
              Создайте первый набор карточек для обучения
            </p>
            <Link
              href="/decks/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Создать первый набор
            </Link>
          </div>
        ) : (
          <>
            {/* My decks */}
            {myDecks.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Мои наборы</h2>
                  <Link
                    href="/decks"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Все наборы →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myDecks.map((deck) => (
                    <DeckCard key={deck.id} deck={deck} />
                  ))}
                </div>
              </section>
            )}

            {/* Group decks by group */}
            {groupSections.map(group => (
              <section key={group.id} className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">👥</span>
                  <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                  <Link href={`/groups/${group.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-auto">
                    Открыть группу →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.decks.map((deck) => (
                    <DeckCard key={deck.id} deck={deck} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function DeckCard({ deck }: { deck: DeckWithStats }) {
  return (
    <Link
      href={`/decks/${deck.id}`}
      className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105 block"
    >
      <div className="text-white">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold flex-1">{deck.name}</h3>
          <span className="text-2xl ml-2">→</span>
        </div>
        {deck.description && (
          <p className="text-blue-100 text-sm mb-4 line-clamp-2">
            {deck.description}
          </p>
        )}
        <DeckSrsProgress stats={deck.stats} variant="onDark" />
        {deck.stats.readyForReview > 0 && (
          <div className="mt-2 inline-block px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-semibold">
            🔄 {deck.stats.readyForReview} к повторению
          </div>
        )}
      </div>
    </Link>
  );
}
