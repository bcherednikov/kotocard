'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

type GroupWithRole = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  member_count: number;
  my_role: string;
};

export default function GroupsPage() {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) loadGroups();
  }, [profile]);

  async function loadGroups() {
    if (!profile) return;
    try {
      // Получить группы пользователя
      const { data: memberships, error: memError } = await supabase
        .from('group_members')
        .select('group_id, role, groups(id, name, description, created_by)')
        .eq('user_id', profile.id);

      if (memError) throw memError;
      if (!memberships || memberships.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Подсчитать участников для каждой группы
      const groupIds = memberships.map(m => (m.groups as any).id);
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      const countMap: Record<string, number> = {};
      allMembers?.forEach(m => {
        countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
      });

      const result: GroupWithRole[] = memberships.map(m => {
        const g = m.groups as any;
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          created_by: g.created_by,
          member_count: countMap[g.id] || 0,
          my_role: m.role,
        };
      });

      setGroups(result);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка групп...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Мои группы</h1>
          <Link
            href="/groups/new"
            className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Создать группу
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Нет групп</h2>
            <p className="text-gray-700 mb-6">
              Создайте группу и пригласите участников для совместного обучения
            </p>
            <Link
              href="/groups/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Создать первую группу
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                    {group.description && (
                      <p className="text-gray-600 mt-1">{group.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>👥 {group.member_count} участник{group.member_count === 1 ? '' : group.member_count < 5 ? 'а' : 'ов'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        group.my_role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {group.my_role === 'admin' ? 'Админ' : 'Участник'}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 text-2xl">→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
