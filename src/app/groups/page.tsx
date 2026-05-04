'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/loading-skeleton';

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
      const { data: memberships, error: memError } = await supabase
        .from('group_members')
        .select('group_id, role, groups(id, name, description, created_by)')
        .eq('user_id', profile.id);

      if (memError) throw memError;
      if (!memberships || memberships.length === 0) { setGroups([]); setLoading(false); return; }

      const groupIds = memberships.map(m => (m.groups as any).id);
      const { data: allMembers } = await supabase
        .from('group_members').select('group_id').in('group_id', groupIds);

      const countMap: Record<string, number> = {};
      allMembers?.forEach(m => { countMap[m.group_id] = (countMap[m.group_id] || 0) + 1; });

      const result: GroupWithRole[] = memberships.map(m => {
        const g = m.groups as any;
        return { id: g.id, name: g.name, description: g.description, created_by: g.created_by, member_count: countMap[g.id] || 0, my_role: m.role };
      });

      setGroups(result);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  }

  function memberLabel(count: number) {
    if (count === 1) return '1 участник';
    if (count < 5) return `${count} участника`;
    return `${count} участников`;
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <PageSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <PageHeader
        title="Мои группы"
        actions={
          <Button as="a" href="/groups/new" size="md">
            + Создать группу
          </Button>
        }
      />

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon="👥"
            title="Нет групп"
            description="Создайте группу и пригласите участников для совместного обучения"
            cta={{ label: 'Создать первую группу', href: '/groups/new' }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block">
              <Card variant="interactive" className="p-5 h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 truncate">{group.name}</h2>
                    {group.description && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{group.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400">👥 {memberLabel(group.member_count)}</span>
                      <Badge variant={group.my_role === 'admin' ? 'green' : 'gray'}>
                        {group.my_role === 'admin' ? 'Админ' : 'Участник'}
                      </Badge>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
