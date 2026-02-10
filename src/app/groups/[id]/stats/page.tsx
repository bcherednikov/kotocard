'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type MemberStats = {
  user_id: string;
  display_name: string;
  role: string;
  total_cards: number;
  mastered: number;
  mastery_percent: number;
};

export default function GroupStatsPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (profile && groupId) loadStats();
  }, [profile, groupId]);

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

      // Колоды группы
      const { data: groupDecks } = await supabase
        .from('group_decks')
        .select('deck_id')
        .eq('group_id', groupId);

      const deckIds = (groupDecks || []).map(gd => gd.deck_id);

      // Участники
      const { data: membersData } = await supabase
        .from('group_members')
        .select('user_id, role, profiles(display_name)')
        .eq('group_id', groupId)
        .order('joined_at');

      if (!membersData || deckIds.length === 0) {
        setMembers((membersData || []).map(m => ({
          user_id: m.user_id,
          display_name: (m.profiles as any)?.display_name || 'Без имени',
          role: m.role,
          total_cards: 0,
          mastered: 0,
          mastery_percent: 0,
        })));
        setLoading(false);
        return;
      }

      // Подсчитать общее количество карточек в колодах группы
      const { count: totalCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .in('deck_id', deckIds);

      // Для каждого участника: подсчитать mastered (young + mature) по колодам группы
      const memberStatsList: MemberStats[] = [];
      for (const mem of membersData) {
        const { count: mastered } = await supabase
          .from('user_cards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', mem.user_id)
          .in('deck_id', deckIds)
          .in('status', ['young', 'mature']);

        const masteredCount = mastered || 0;
        const total = totalCards || 0;

        memberStatsList.push({
          user_id: mem.user_id,
          display_name: (mem.profiles as any)?.display_name || 'Без имени',
          role: mem.role,
          total_cards: total,
          mastered: masteredCount,
          mastery_percent: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
        });
      }

      setMembers(memberStatsList);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка статистики...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет доступа</h1>
          <p className="text-gray-600 mb-4">Статистика доступна только админам группы</p>
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:text-blue-800 font-medium">
            ← К группе
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:text-blue-800 font-medium">
            ← К группе {groupName}
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Статистика группы</h1>

        {members.length === 0 ? (
          <p className="text-gray-600">Нет участников</p>
        ) : (
          <div className="space-y-4">
            {members.map(member => (
              <Link
                key={member.user_id}
                href={`/groups/${groupId}/stats/${member.user_id}`}
                className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      {member.display_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900">{member.display_name}</span>
                      {member.user_id === profile?.id && (
                        <span className="text-gray-500 ml-1">(вы)</span>
                      )}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.role === 'admin' ? 'Админ' : 'Участник'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{member.mastery_percent}%</div>
                    <div className="text-xs text-gray-500">{member.mastered} / {member.total_cards}</div>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-indigo-600 transition-all duration-500"
                    style={{ width: `${member.mastery_percent}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
