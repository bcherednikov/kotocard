'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NewGroupPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deckAddPermission, setDeckAddPermission] = useState('admin_only');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          deck_add_permission: deckAddPermission,
          userId: profile.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/groups/${data.group.id}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания группы');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <PageHeader title="Создать группу" back="/groups" />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5">
            <Input
              label="Название группы *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Семья Ивановых"
              required
              disabled={loading}
            />

            <Textarea
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Необязательно"
              rows={3}
              disabled={loading}
            />

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Кто может добавлять наборы в группу?
              </p>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition ${deckAddPermission === 'admin_only' ? 'border-[#057A55]' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    name="permission"
                    value="admin_only"
                    checked={deckAddPermission === 'admin_only'}
                    onChange={(e) => setDeckAddPermission(e.target.value)}
                    className="w-4 h-4 accent-[#057A55]"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Только админы</div>
                    <div className="text-xs text-gray-500">Подходит для семей и классов</div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition ${deckAddPermission === 'all_members' ? 'border-[#057A55]' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    name="permission"
                    value="all_members"
                    checked={deckAddPermission === 'all_members'}
                    onChange={(e) => setDeckAddPermission(e.target.value)}
                    className="w-4 h-4 accent-[#057A55]"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Все участники</div>
                    <div className="text-xs text-gray-500">Для совместного обучения</div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => router.push('/groups')}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                fullWidth
                className="sm:flex-1"
              >
                Создать группу
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
