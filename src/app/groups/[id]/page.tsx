'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/loading-skeleton';

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
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

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

      const { data: groupDecks, error: gdError } = await supabase
        .from('group_decks')
        .select('id, deck_id, decks(id, name)')
        .eq('group_id', groupId);

      if (gdError) throw gdError;

      if (groupDecks && groupDecks.length > 0) {
        const deckIds = groupDecks.map(gd => (gd.decks as any).id);

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
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <PageSkeleton rows={3} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <Card>
          <EmptyState
            title="Группа не найдена"
            description="Группа могла быть удалена или у вас нет доступа"
            cta={{ label: '← К группам', href: '/groups' }}
          />
        </Card>
      </div>
    );
  }

  const isAdmin = myRole === 'admin';

  function memberLabel(count: number) {
    if (count === 1) return '1 участник';
    if (count < 5) return `${count} участника`;
    return `${count} участников`;
  }

  function deckLabel(count: number) {
    if (count === 1) return '1 набор';
    if (count < 5) return `${count} набора`;
    return `${count} наборов`;
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <PageHeader
        title={group.name}
        description={group.description ?? undefined}
        back="/groups"
        actions={
          isAdmin ? (
            <>
              <Button as="a" href={`/groups/${groupId}/stats`} variant="secondary" size="sm">
                Статистика
              </Button>
              <Button as="a" href={`/groups/${groupId}/settings`} variant="primary" size="sm">
                Настройки
              </Button>
            </>
          ) : undefined
        }
      />

      {/* Stats strip */}
      <div className="flex gap-4 mb-6 text-sm text-gray-500">
        <span>👥 {memberLabel(members.length)}</span>
        <span>📚 {deckLabel(decks.length)}</span>
      </div>

      <div className="space-y-4">
        {/* Decks card */}
        <Card>
          <CardHeader>
            <CardTitle>Наборы</CardTitle>
          </CardHeader>
          {decks.length === 0 ? (
            <EmptyState
              icon="📚"
              title="В группе пока нет наборов"
              description={isAdmin ? 'Добавьте наборы в настройках группы' : undefined}
            />
          ) : (
            <CardContent className="pt-3 space-y-2">
              {decks.map(deck => (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.deck_id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition"
                >
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{deck.title}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{deck.card_count} карточек</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Members card */}
        <Card>
          <CardHeader>
            <CardTitle>Участники</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-gray-50 -mx-0">
            {members.map(member => (
              <div key={member.id} className="py-3 flex items-center justify-between first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#057A55]/10 rounded-xl flex items-center justify-center text-[#057A55] font-bold text-sm shrink-0">
                    {member.display_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{member.display_name}</span>
                    {member.user_id === profile?.id && (
                      <span className="text-gray-400 text-xs ml-1">(вы)</span>
                    )}
                  </div>
                </div>
                <Badge variant={member.role === 'admin' ? 'green' : 'gray'}>
                  {member.role === 'admin' ? 'Админ' : 'Участник'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leave group */}
        <div className="flex justify-center pt-2">
          <Button
            variant="danger"
            size="sm"
            loading={leaving}
            onClick={handleLeave}
          >
            Выйти из группы
          </Button>
        </div>
      </div>
    </div>
  );
}
