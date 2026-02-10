'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import type { DeckSrsStats } from '@/lib/srs/types';

type DeckStats = {
  deck_id: string;
  deck_name: string;
  stats: DeckSrsStats;
};

const emptySrsStats: DeckSrsStats = {
  total: 0, newCount: 0, learningCount: 0, testingCount: 0,
  youngCount: 0, matureCount: 0, relearningCount: 0,
  masteredCount: 0, masteryPercent: 0, readyForReview: 0, readyForTesting: 0,
};

export default function MemberStatsPage() {
  const { id: groupId, userId } = useParams<{ id: string; userId: string }>();
  const { profile } = useAuth();
  const [memberName, setMemberName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [deckStats, setDeckStats] = useState<DeckStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (profile && groupId && userId) loadStats();
  }, [profile, groupId, userId]);

  async function loadStats() {
    if (!profile) return;
    try {
      // Проверить роль
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', profile.id)
        .single();

      if (!membership || membership.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      // Группа
      const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();
      setGroupName(group?.name || '');

      // Участник
      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      setMemberName(memberProfile?.display_name || 'Без имени');

      // Колоды группы
      const { data: groupDecks } = await supabase
        .from('group_decks')
        .select('deck_id, decks(id, name)')
        .eq('group_id', groupId);

      if (!groupDecks || groupDecks.length === 0) {
        setDeckStats([]);
        setLoading(false);
        return;
      }

      const deckIds = groupDecks.map(gd => (gd.decks as any).id);

      // Все карточки по колодам
      const { data: allCards } = await supabase
        .from('cards')
        .select('id, deck_id')
        .in('deck_id', deckIds);

      const cardsByDeck: Record<string, number> = {};
      (allCards || []).forEach(c => {
        cardsByDeck[c.deck_id] = (cardsByDeck[c.deck_id] || 0) + 1;
      });

      // user_cards для участника по этим колодам
      const { data: userCards } = await supabase
        .from('user_cards')
        .select('deck_id, status')
        .eq('user_id', userId)
        .in('deck_id', deckIds);

      // Группировать по колоде
      const statusByDeck: Record<string, Record<string, number>> = {};
      (userCards || []).forEach(uc => {
        if (!statusByDeck[uc.deck_id]) statusByDeck[uc.deck_id] = {};
        statusByDeck[uc.deck_id][uc.status] = (statusByDeck[uc.deck_id][uc.status] || 0) + 1;
      });

      const results: DeckStats[] = groupDecks.map(gd => {
        const d = gd.decks as any;
        const total = cardsByDeck[d.id] || 0;
        const statuses = statusByDeck[d.id] || {};

        const newCount = total - Object.values(statuses).reduce((a, b) => a + b, 0);
        const learningCount = statuses['learning'] || 0;
        const testingCount = statuses['testing'] || 0;
        const youngCount = statuses['young'] || 0;
        const matureCount = statuses['mature'] || 0;
        const relearningCount = statuses['relearning'] || 0;
        const masteredCount = youngCount + matureCount;

        return {
          deck_id: d.id,
          deck_name: d.name,
          stats: {
            total,
            newCount: Math.max(0, newCount),
            learningCount,
            testingCount,
            youngCount,
            matureCount,
            relearningCount,
            masteredCount,
            masteryPercent: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
            readyForReview: 0,
            readyForTesting: 0,
          },
        };
      });

      setDeckStats(results);
    } catch (err) {
      console.error('Error loading member stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет доступа</h1>
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:text-blue-800 font-medium">
            ← К группе
          </Link>
        </div>
      </div>
    );
  }

  // Общая статистика
  const totalAll = deckStats.reduce((s, d) => s + d.stats.total, 0);
  const masteredAll = deckStats.reduce((s, d) => s + d.stats.masteredCount, 0);
  const overallPercent = totalAll > 0 ? Math.round((masteredAll / totalAll) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/groups/${groupId}/stats`} className="text-blue-600 hover:text-blue-800 font-medium">
            ← К статистике группы
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{memberName}</h1>
          <p className="text-gray-600">Статистика в группе "{groupName}"</p>
        </div>

        {/* Общая */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-medium">Общий прогресс</span>
            <span className="text-3xl font-bold">{overallPercent}%</span>
          </div>
          <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <div className="text-sm text-purple-200 mt-2">
            Выучено {masteredAll} из {totalAll} карточек
          </div>
        </div>

        {/* По колодам */}
        {deckStats.length === 0 ? (
          <p className="text-gray-600">Нет наборов в группе</p>
        ) : (
          <div className="space-y-4">
            {deckStats.map(ds => (
              <div key={ds.deck_id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{ds.deck_name}</h3>
                  <span className="text-lg font-bold text-purple-600">{ds.stats.masteryPercent}%</span>
                </div>
                <DeckSrsProgress stats={ds.stats} />
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {ds.stats.newCount > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Новые: {ds.stats.newCount}</span>
                  )}
                  {ds.stats.learningCount > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Изучение: {ds.stats.learningCount}</span>
                  )}
                  {ds.stats.testingCount > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Тестирование: {ds.stats.testingCount}</span>
                  )}
                  {ds.stats.youngCount > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Молодые: {ds.stats.youngCount}</span>
                  )}
                  {ds.stats.matureCount > 0 && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Зрелые: {ds.stats.matureCount}</span>
                  )}
                  {ds.stats.relearningCount > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Переучивание: {ds.stats.relearningCount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
