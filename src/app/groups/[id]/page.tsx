'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Group = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  deck_add_permission: string;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
  joined_at: string;
};

type GroupDeck = {
  id: string;
  deck_id: string;
  title: string;
  card_count: number;
};

export default function GroupDetailPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [decks, setDecks] = useState<GroupDeck[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (profile && groupId) loadGroup();
  }, [profile, groupId]);

  async function loadGroup() {
    if (!profile) return;
    try {
      // Загрузить группу
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Загрузить участников с профилями
      const { data: membersData, error: memError } = await supabase
        .from('group_members')
        .select('id, user_id, role, joined_at, profiles(display_name)')
        .eq('group_id', groupId)
        .order('joined_at');

      if (memError) throw memError;

      const membersList: Member[] = (membersData || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        display_name: (m.profiles as any)?.display_name || 'Без имени',
        joined_at: m.joined_at,
      }));

      setMembers(membersList);
      const me = membersList.find(m => m.user_id === profile.id);
      setMyRole(me?.role || null);

      // Загрузить колоды группы
      const { data: groupDecks, error: gdError } = await supabase
        .from('group_decks')
        .select('id, deck_id, decks(id, name)')
        .eq('group_id', groupId);

      if (gdError) throw gdError;

      if (groupDecks && groupDecks.length > 0) {
        const deckIds = groupDecks.map(gd => (gd.decks as any).id);

        // Подсчитать карточки
        const { data: cards } = await supabase
          .from('cards')
          .select('deck_id')
          .in('deck_id', deckIds);

        const cardCountMap: Record<string, number> = {};
        cards?.forEach(c => {
          cardCountMap[c.deck_id] = (cardCountMap[c.deck_id] || 0) + 1;
        });

        setDecks(groupDecks.map(gd => ({
          id: gd.id,
          deck_id: (gd.decks as any).id,
          title: (gd.decks as any).name,
          card_count: cardCountMap[(gd.decks as any).id] || 0,
        })));
      } else {
        setDecks([]);
      }
    } catch (err) {
      console.error('Error loading group:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    if (!profile || !confirm('Вы уверены, что хотите выйти из группы?')) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/groups');
    } catch (err: any) {
      alert(err.message || 'Ошибка');
      setLeaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка группы...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Группа не найдена</h1>
          <Link href="/groups" className="text-blue-600 hover:text-blue-800 font-medium">
            ← К группам
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = myRole === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/groups" className="text-blue-600 hover:text-blue-800 font-medium">
            ← К группам
          </Link>
        </div>

        {/* Шапка группы */}
        <div className="bg-purple-600 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
              {group.description && <p className="text-purple-200">{group.description}</p>}
              <div className="flex gap-4 mt-4 text-sm text-purple-200">
                <span>👥 {members.length} участник{members.length === 1 ? '' : members.length < 5 ? 'а' : 'ов'}</span>
                <span>📚 {decks.length} набор{decks.length === 1 ? '' : decks.length < 5 ? 'а' : 'ов'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Link
                    href={`/groups/${groupId}/stats`}
                    className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm font-medium"
                  >
                    Статистика
                  </Link>
                  <Link
                    href={`/groups/${groupId}/settings`}
                    className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm font-medium"
                  >
                    Настройки
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Наборы группы */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Наборы</h2>
          {decks.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-600">В группе пока нет наборов</p>
              {isAdmin && (
                <p className="text-gray-500 mt-2 text-sm">
                  Добавьте наборы в настройках группы
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {decks.map(deck => (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.deck_id}`}
                  className="block bg-white rounded-xl shadow p-5 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{deck.title}</h3>
                      <p className="text-sm text-gray-500">{deck.card_count} карточек</p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Участники */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Участники</h2>
          <div className="bg-white rounded-xl shadow divide-y">
            {members.map(member => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-400 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {member.display_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{member.display_name}</span>
                    {member.user_id === profile?.id && (
                      <span className="text-gray-500 ml-1">(вы)</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {member.role === 'admin' ? 'Админ' : 'Участник'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Выход из группы */}
        <div className="text-center">
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="text-red-600 hover:text-red-800 font-medium transition disabled:opacity-50"
          >
            {leaving ? 'Выходим...' : 'Выйти из группы'}
          </button>
        </div>
      </div>
    </div>
  );
}
