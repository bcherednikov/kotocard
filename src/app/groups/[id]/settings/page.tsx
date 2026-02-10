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

  // Редактирование группы
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPermission, setEditPermission] = useState('admin_only');
  const [saving, setSaving] = useState(false);

  // Инвайты
  const [invites, setInvites] = useState<any[]>([]);
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Добавление колод
  const [userDecks, setUserDecks] = useState<UserDeck[]>([]);
  const [showAddDeck, setShowAddDeck] = useState(false);
  const [addingDeck, setAddingDeck] = useState<string | null>(null);

  useEffect(() => {
    if (profile && groupId) loadAll();
  }, [profile, groupId]);

  async function loadAll() {
    if (!profile) return;
    try {
      // Группа
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

      // Участники
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

      // Инвайты
      const { data: inv } = await supabase
        .from('group_invites')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      setInvites(inv || []);

      // Колоды пользователя для добавления
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  if (!group || myRole !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:text-blue-800 font-medium">
            ← К группе
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Настройки группы</h1>

        {/* Основные настройки */}
        <form onSubmit={handleSaveGroup} className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Основное</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Название</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Описание</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Добавление наборов</label>
              <select
                value={editPermission}
                onChange={e => setEditPermission(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
              >
                <option value="admin_only">Только админы</option>
                <option value="all_members">Все участники</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>

        {/* Наборы в группе */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Наборы в группе</h2>
            <button
              onClick={() => setShowAddDeck(!showAddDeck)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              {showAddDeck ? 'Скрыть' : '+ Добавить набор'}
            </button>
          </div>

          {showAddDeck && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Выберите набор для добавления в группу:</p>
              {userDecks.length === 0 ? (
                <p className="text-gray-500 text-sm">У вас нет наборов. <Link href="/decks/new" className="text-blue-600">Создать</Link></p>
              ) : (
                <div className="space-y-2">
                  {userDecks.map(deck => (
                    <div key={deck.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-gray-900 font-medium">{deck.name}</span>
                      {deck.already_in_group ? (
                        <button
                          onClick={() => handleRemoveDeck(deck.id)}
                          className="px-3 py-1 text-red-600 text-sm font-medium hover:bg-red-50 rounded transition"
                        >
                          Убрать
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddDeck(deck.id)}
                          disabled={addingDeck === deck.id}
                          className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded hover:bg-green-200 transition disabled:opacity-50"
                        >
                          {addingDeck === deck.id ? '...' : 'Добавить'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Участники */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Участники</h2>
          <div className="divide-y">
            {members.map(member => (
              <div key={member.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {member.display_name[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">
                    {member.display_name}
                    {member.user_id === profile?.id && ' (вы)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role === 'admin' ? 'Админ' : 'Участник'}
                  </span>
                  {member.user_id !== profile?.id && (
                    <>
                      <button
                        onClick={() => handleToggleRole(member.id, member.role)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {member.role === 'admin' ? 'Понизить' : 'Назначить админом'}
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.display_name)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Инвайты */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Приглашения</h2>
            <button
              onClick={handleCreateInvite}
              disabled={creatingInvite}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              {creatingInvite ? '...' : '+ Создать ссылку'}
            </button>
          </div>

          {invites.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет приглашений. Создайте ссылку для приглашения участников.</p>
          ) : (
            <div className="space-y-3">
              {invites.map(invite => (
                <div key={invite.id} className={`p-3 rounded-lg border ${invite.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded truncate block">
                          {getInviteUrl(invite.invite_code)}
                        </code>
                        {invite.is_active && (
                          <button
                            onClick={() => navigator.clipboard.writeText(getInviteUrl(invite.invite_code))}
                            className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                          >
                            Копировать
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Использований: {invite.use_count}{invite.max_uses ? `/${invite.max_uses}` : ''}
                        {!invite.is_active && <span className="text-red-500 ml-2">Деактивировано</span>}
                      </div>
                    </div>
                    {invite.is_active && (
                      <button
                        onClick={() => handleDeactivateInvite(invite.id)}
                        className="text-xs text-red-600 hover:text-red-800 ml-3"
                      >
                        Деактивировать
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
