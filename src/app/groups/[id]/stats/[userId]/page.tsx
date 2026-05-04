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

      const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();
      setGroupName(group?.name || '');

      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      setMemberName(memberProfile?.display_name || 'Без имени');

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

      const { data: allCards } = await supabase
        .from('cards')
        .select('id, deck_id')
        .in('deck_id', deckIds);

      const cardsByDeck: Record<string, number> = {};
      (allCards || []).forEach(c => {
        cardsByDeck[c.deck_id] = (cardsByDeck[c.deck_id] || 0) + 1;
      });

      const { data: userCards } = await supabase
        .from('user_cards')
        .select('deck_id, status')
        .eq('user_id', userId)
        .in('deck_id', deckIds);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Нет доступа</h1>
          <Link href={`/groups/${groupId}`} className="text-[#057A55] hover:text-[#065f46] font-medium text-sm">
            ← К группе
          </Link>
        </div>
      </div>
    );
  }

  const totalAll = deckStats.reduce((s, d) => s + d.stats.total, 0);
  const masteredAll = deckStats.reduce((s, d) => s + d.stats.masteredCount, 0);
  const overallPercent = totalAll > 0 ? Math.round((masteredAll / totalAll) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F0' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/groups/${groupId}/stats`} className="inline-flex items-center gap-1.5 text-[#057A55] hover:text-[#065f46] font-medium text-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            К статистике группы
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{memberName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Статистика в группе «{groupName}»</p>
        </div>

        {/* Общая */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900 text-sm">Общий прогресс</span>
            <span className="text-2xl font-bold text-[#057A55]">{overallPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%`, background: '#057A55' }}
            />
          </div>
          <p className="text-xs text-gray-400">Выучено {masteredAll} из {totalAll} карточек</p>
        </div>

        {/* По колодам */}
        {deckStats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm">Нет наборов в группе</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deckStats.map(ds => (
              <div key={ds.deck_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{ds.deck_name}</h3>
                  <span className="font-bold text-[#057A55]">{ds.stats.masteryPercent}%</span>
                </div>
                <DeckSrsProgress stats={ds.stats} />
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {ds.stats.newCount > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">Новые: {ds.stats.newCount}</span>
                  )}
                  {ds.stats.learningCount > 0 && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">Изучение: {ds.stats.learningCount}</span>
                  )}
                  {ds.stats.testingCount > 0 && (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">Тестирование: {ds.stats.testingCount}</span>
                  )}
                  {ds.stats.youngCount > 0 && (
                    <span className="px-2 py-1 bg-[#057A55]/10 text-[#057A55] rounded-lg">Молодые: {ds.stats.youngCount}</span>
                  )}
                  {ds.stats.matureCount > 0 && (
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg">Зрелые: {ds.stats.matureCount}</span>
                  )}
                  {ds.stats.relearningCount > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg">Переучивание: {ds.stats.relearningCount}</span>
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
