'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/loading-skeleton';

type Group = {
  id: string;
  name: string;
  description: string | null;
  deck_add_permission: string;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
};

type UserDeck = {
  id: string;
  name: string;
  already_in_group: boolean;
};

export default function GroupSettingsPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPermission, setEditPermission] = useState('admin_only');
  const [saving, setSaving] = useState(false);

  const [invites, setInvites] = useState<any[]>([]);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [userDecks, setUserDecks] = useState<UserDeck[]>([]);
  const [showAddDeck, setShowAddDeck] = useState(false);
  const [addingDeck, setAddingDeck] = useState<string | null>(null);

  useEffect(() => {
    if (profile && groupId) loadAll();
  }, [profile, groupId]);

  async function loadAll() {
    if (!profile) return;
    try {
      const { data: g } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (!g) { router.push('/groups'); return; }
      setGroup(g);
      setEditName(g.name);
      setEditDescription(g.description || '');
      setEditPermission(g.deck_add_permission);

      const { data: mems } = await supabase
        .from('group_members')
        .select('id, user_id, role, profiles(display_name)')
        .eq('group_id', groupId)
        .order('joined_at');

      const membersList = (mems || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        display_name: (m.profiles as any)?.display_name || 'Без имени',
      }));
      setMembers(membersList);

      const me = membersList.find(m => m.user_id === profile.id);
      setMyRole(me?.role || null);

      if (me?.role !== 'admin') {
        router.push(`/groups/${groupId}`);
        return;
      }

      const { data: inv } = await supabase
        .from('group_invites')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      setInvites(inv || []);

      await loadUserDecks();
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserDecks() {
    if (!profile) return;
    const { data: myDecks } = await supabase
      .from('decks')
      .select('id, name')
      .eq('owner_id', profile.id)
      .order('name');

    const { data: groupDeckLinks } = await supabase
      .from('group_decks')
      .select('deck_id')
      .eq('group_id', groupId);

    const inGroup = new Set((groupDeckLinks || []).map(gd => gd.deck_id));

    setUserDecks((myDecks || []).map(d => ({
      id: d.id,
      name: d.name,
      already_in_group: inGroup.has(d.id),
    })));
  }

  async function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          deck_add_permission: editPermission,
        })
        .eq('id', groupId);
      if (error) throw error;
      setGroup(prev => prev ? { ...prev, name: editName.trim(), description: editDescription.trim() || null, deck_add_permission: editPermission } : null);
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInvite() {
    setCreatingInvite(true);
    try {
      const { data, error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          created_by: profile!.id,
        })
        .select()
        .single();
      if (error) throw error;
      setInvites(prev => [data, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Ошибка создания инвайта');
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleDeactivateInvite(inviteId: string) {
    try {
      await supabase
        .from('group_invites')
        .update({ is_active: false })
        .eq('id', inviteId);
      setInvites(prev => prev.map(i => i.id === inviteId ? { ...i, is_active: false } : i));
    } catch (err) {
      console.error('Error deactivating invite:', err);
    }
  }

  async function handleToggleRole(memberId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('id', memberId);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Удалить ${memberName} из группы?`)) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleAddDeck(deckId: string) {
    if (!profile) return;
    setAddingDeck(deckId);
    try {
      const { error } = await supabase
        .from('group_decks')
        .insert({ group_id: groupId, deck_id: deckId, added_by: profile.id });
      if (error) throw error;
      setUserDecks(prev => prev.map(d => d.id === deckId ? { ...d, already_in_group: true } : d));
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    } finally {
      setAddingDeck(null);
    }
  }

  async function handleRemoveDeck(deckId: string) {
    try {
      const { error } = await supabase
        .from('group_decks')
        .delete()
        .eq('group_id', groupId)
        .eq('deck_id', deckId);
      if (error) throw error;
      setUserDecks(prev => prev.map(d => d.id === deckId ? { ...d, already_in_group: false } : d));
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    }
  }

  function getInviteUrl(code: string) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/groups/join/${code}`;
    }
    return `/groups/join/${code}`;
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <PageSkeleton rows={4} />
      </div>
    );
  }

  if (!group || myRole !== 'admin') return null;

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <PageHeader title="Настройки группы" back={`/groups/${groupId}`} />

      <div className="space-y-4">
        {/* Basic settings */}
        <Card>
          <CardHeader>
            <CardTitle>Основное</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveGroup} className="space-y-4">
              <Input
                label="Название"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
              />
              <Textarea
                label="Описание"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={2}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Добавление наборов</label>
                <select
                  value={editPermission}
                  onChange={e => setEditPermission(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#057A55]/20 focus:border-[#057A55] outline-none transition hover:border-gray-300"
                >
                  <option value="admin_only">Только админы</option>
                  <option value="all_members">Все участники</option>
                </select>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={saving}
                className="w-full sm:w-auto"
              >
                Сохранить
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Decks section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Наборы в группе</CardTitle>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddDeck(!showAddDeck)}
              >
                {showAddDeck ? 'Скрыть' : '+ Добавить набор'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddDeck && (
              <div className="mb-2 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-3">Выберите набор для добавления в группу:</p>
                {userDecks.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    У вас нет наборов.{' '}
                    <Link href="/decks/new" className="text-[#057A55] hover:text-[#065f46]">Создать</Link>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userDecks.map(deck => (
                      <div key={deck.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100">
                        <span className="text-gray-900 text-sm font-medium">{deck.name}</span>
                        {deck.already_in_group ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveDeck(deck.id)}
                          >
                            Убрать
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={addingDeck === deck.id}
                            onClick={() => handleAddDeck(deck.id)}
                          >
                            Добавить
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members section */}
        <Card>
          <CardHeader>
            <CardTitle>Участники</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-50">
            {members.map(member => (
              <div key={member.id} className="py-3 flex items-center justify-between first:pt-0 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-[#057A55]/10 rounded-xl flex items-center justify-center text-[#057A55] text-sm font-bold shrink-0">
                    {member.display_name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900 text-sm truncate block">
                      {member.display_name}
                      {member.user_id === profile?.id && <span className="text-gray-400 text-xs ml-1">(вы)</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={member.role === 'admin' ? 'green' : 'gray'}>
                    {member.role === 'admin' ? 'Админ' : 'Участник'}
                  </Badge>
                  {member.user_id !== profile?.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRole(member.id, member.role)}
                      >
                        {member.role === 'admin' ? 'Понизить' : 'Сделать админом'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.display_name)}
                      >
                        Удалить
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invites section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Приглашения</CardTitle>
              <Button
                variant="primary"
                size="sm"
                loading={creatingInvite}
                onClick={handleCreateInvite}
              >
                + Создать ссылку
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-gray-400 text-sm">Нет приглашений. Создайте ссылку для приглашения участников.</p>
            ) : (
              <div className="space-y-3">
                {invites.map(invite => (
                  <div
                    key={invite.id}
                    className={`p-3 rounded-xl border ${invite.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg block truncate text-gray-700">
                          {getInviteUrl(invite.invite_code)}
                        </code>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Использований: {invite.use_count}{invite.max_uses ? `/${invite.max_uses}` : ''}</span>
                          {!invite.is_active && <Badge variant="red">Деактивировано</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {invite.is_active && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(getInviteUrl(invite.invite_code))}
                            >
                              Копировать
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivateInvite(invite.id)}
                            >
                              Деактивировать
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
