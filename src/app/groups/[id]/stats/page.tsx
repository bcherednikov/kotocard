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

      const { data: groupDecks } = await supabase
        .from('group_decks')
        .select('deck_id')
        .eq('group_id', groupId);

      const deckIds = (groupDecks || []).map(gd => gd.deck_id);

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

      const { count: totalCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .in('deck_id', deckIds);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка статистики...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Нет доступа</h1>
          <p className="text-gray-500 text-sm mb-4">Статистика доступна только админам группы</p>
          <Link href={`/groups/${groupId}`} className="text-[#057A55] hover:text-[#065f46] font-medium text-sm">
            ← К группе
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F0' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-1.5 text-[#057A55] hover:text-[#065f46] font-medium text-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            К группе {groupName}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Статистика группы</h1>

        {members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm">Нет участников</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(member => (
              <Link
                key={member.user_id}
                href={`/groups/${groupId}/stats/${member.user_id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#057A55]/10 rounded-xl flex items-center justify-center text-[#057A55] font-bold text-sm">
                      {member.display_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-sm">{member.display_name}</span>
                      {member.user_id === profile?.id && (
                        <span className="text-gray-400 text-xs ml-1">(вы)</span>
                      )}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-[#057A55]/10 text-[#057A55]' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {member.role === 'admin' ? 'Админ' : 'Участник'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#057A55]">{member.mastery_percent}%</div>
                    <div className="text-xs text-gray-400">{member.mastered} / {member.total_cards}</div>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${member.mastery_percent}%`, background: '#057A55' }}
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
